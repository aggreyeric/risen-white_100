import { useCallback, useEffect, useRef, useState } from "react";
import { StrKey } from "@stellar/stellar-sdk";
import {
  buildNativePayment,
  describeSubmitError,
  fetchBalance,
  submitSignedTransaction,
} from "../lib/stellar";
import {
  connectWallet,
  getActivePublicKey,
  getNetwork,
  probeInstalled,
  signTransaction,
} from "../lib/wallet";
import type { BalanceInfo, PaymentResult, WalletStatus } from "../types";

export interface SendError {
  field?: "destination" | "amount";
  message: string;
}

export function useStellarWallet() {
  const [status, setStatus] = useState<WalletStatus>("unknown");
  const [address, setAddress] = useState<string | null>(null);
  const [networkLabel, setNetworkLabel] = useState<string | null>(null);
  const [networkPassphrase, setNetworkPassphrase] = useState<string | null>(null);
  const [isTestnet, setIsTestnet] = useState(true);

  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<PaymentResult | null>(null);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadBalance = useCallback(async (addr: string) => {
    setBalanceLoading(true);
    setBalanceError(null);
    try {
      const info = await fetchBalance(addr);
      if (mounted.current) setBalance(info);
    } catch (err) {
      if (mounted.current) {
        setBalance(null);
        setBalanceError(err instanceof Error ? err.message : "Failed to load balance.");
      }
    } finally {
      if (mounted.current) setBalanceLoading(false);
    }
  }, []);

  const readNetwork = useCallback(async (): Promise<boolean | null> => {
    try {
      const info = await getNetwork();
      if (!mounted.current) return null;
      setNetworkLabel(info.network);
      setNetworkPassphrase(info.networkPassphrase);
      setIsTestnet(info.isTestnet);
      return info.isTestnet;
    } catch {
      return null;
    }
  }, []);

  const restoreSession = useCallback(async () => {
    const installed = await probeInstalled();
    if (!mounted.current) return;
    if (!installed) {
      setStatus("not-installed");
      return;
    }
    try {
      const active = await getActivePublicKey();
      if (!mounted.current) return;
      if (!active) {
        setStatus("disconnected");
        return;
      }
      setAddress(active);
      const testnet = await readNetwork();
      if (!mounted.current) return;
      setStatus(testnet === false ? "wrong-network" : "connected");
      if (testnet !== false) void loadBalance(active);
    } catch {
      if (mounted.current) setStatus("disconnected");
    }
  }, [loadBalance, readNetwork]);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const connect = useCallback(async () => {
    setStatus("connecting");
    try {
      const addr = await connectWallet();
      if (!mounted.current) return;
      setAddress(addr);
      setLastResult(null);
      setBalance(null);
      const testnet = await readNetwork();
      if (!mounted.current) return;
      if (testnet === false) {
        setStatus("wrong-network");
        return;
      }
      setStatus("connected");
      void loadBalance(addr);
      return null;
    } catch (err) {
      if (mounted.current) setStatus("disconnected");
      return err instanceof Error ? err.message : "Could not connect to the wallet.";
    }
  }, [loadBalance, readNetwork]);

  const clearResult = useCallback(() => setLastResult(null), []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setBalance(null);
    setBalanceError(null);
    setLastResult(null);
    setNetworkLabel(null);
    setNetworkPassphrase(null);
    setIsTestnet(true);
    setStatus("disconnected");
  }, []);

  const refreshBalance = useCallback(() => {
    if (address) void loadBalance(address);
  }, [address, loadBalance]);

  const refreshNetwork = useCallback(async () => {
    const testnet = await readNetwork();
    if (!mounted.current || !address) return;
    if (testnet === false) {
      setStatus("wrong-network");
    } else {
      setStatus("connected");
      void loadBalance(address);
    }
  }, [address, loadBalance, readNetwork]);

  /** Validates inputs; returns null when valid, otherwise a field error. */
  const validate = useCallback(
    (destination: string, amount: string): SendError | null => {
      const trimmedDest = destination.trim();
      if (!trimmedDest) return { field: "destination", message: "Enter a recipient address." };
      if (!StrKey.isValidEd25519PublicKey(trimmedDest)) {
        return { field: "destination", message: "Recipient must be a valid Stellar public key (starts with G)." };
      }
      if (trimmedDest === address) {
        return { field: "destination", message: "You cannot send XLM to your own address." };
      }
      const amt = Number(amount);
      if (!Number.isFinite(amt) || amt <= 0) {
        return { field: "amount", message: "Amount must be greater than 0." };
      }
      const max = balance ? balance.spendable : 0;
      // Leave room for the network fee (0.00001 XLM per operation).
      if (amt > Math.max(max - 0.00001, 0)) {
        return {
          field: "amount",
          message: `Amount exceeds your spendable balance (${max.toFixed(2)} XLM after reserves).`,
        };
      }
      return null;
    },
    [address, balance],
  );

  const sendPayment = useCallback(
    async (
      destination: string,
      amount: string,
    ): Promise<{ ok: true; result: PaymentResult } | { ok: false; error: string }> => {
      if (!address || !networkPassphrase) {
        return { ok: false, error: "Wallet is not connected." };
      }
      setSending(true);
      try {
        const unsigned = await buildNativePayment(address, destination.trim(), amount);
        const signed = await signTransaction(unsigned, networkPassphrase);
        const result = await submitSignedTransaction(signed);
        if (mounted.current) {
          setLastResult(result);
          void loadBalance(address);
        }
        return { ok: true, result };
      } catch (err) {
        const raw = err instanceof Error ? err.message : "Transaction failed.";
        const msg =
          /sign|declin|reject/i.test(raw) ? "Transaction was not signed." : describeSubmitError(err);
        return { ok: false, error: msg };
      } finally {
        if (mounted.current) setSending(false);
      }
    },
    [address, networkPassphrase, loadBalance],
  );

  return {
    status,
    address,
    networkLabel,
    isTestnet,
    balance,
    balanceLoading,
    balanceError,
    sending,
    lastResult,
    connect,
    disconnect,
    refreshBalance,
    refreshNetwork,
    clearResult,
    validate,
    sendPayment,
  };
}

export type StellarWallet = ReturnType<typeof useStellarWallet>;
