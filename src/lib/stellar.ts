/**
 * Stellar (Horizon) helpers.
 *
 * All chain interactions go through here so the React layer stays declarative.
 * Everything targets **Testnet**.
 */
import {
  Asset,
  BASE_FEE,
  Horizon,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import {
  BASE_RESERVE_MIN_ENTRIES,
  BASE_RESERVE_PER_ENTRY_XLM,
  FRIENDBOT_TESTNET_URL,
  HORIZON_TESTNET_URL,
  TESTNET_EXPLORER_TX,
} from "../config";
import type { BalanceInfo, PaymentResult } from "../types";

/** Shared Horizon client for Testnet. */
let server: Horizon.Server | null = null;
export function getServer(): Horizon.Server {
  if (!server) server = new Horizon.Server(HORIZON_TESTNET_URL);
  return server;
}

/**
 * Builds a friendly, human-readable message from a Horizon submit error.
 * Horizon returns rich `extras.result_codes` data when a tx fails.
 */
export function describeSubmitError(err: unknown): string {
  const anyErr = err as { response?: { data?: { extras?: { result_codes?: { transaction?: string; operations?: string[] } } } }; message?: string };
  const extras = anyErr?.response?.data?.extras;
  if (extras?.result_codes) {
    const rc = extras.result_codes;
    const txCode = rc.transaction ?? "";
    const opCodes = Array.isArray(rc.operations) ? rc.operations.join(", ") : "";
    if (txCode === "tx_insufficient_balance") {
      return "The source account does not have enough XLM to cover this payment plus fees and reserves.";
    }
    if (opCodes.includes("op_no_trust") || opCodes.includes("op_underfunded")) {
      return "Transaction rejected by the network: insufficient funds or trustline issue.";
    }
    if (txCode || opCodes) {
      return `Transaction rejected by the network${txCode ? ` (tx: ${txCode})` : ""}${opCodes ? ` — op: ${opCodes}` : ""}.`;
    }
  }
  if (typeof anyErr?.message === "string" && anyErr.message.length) {
    return anyErr.message;
  }
  return "Failed to submit the transaction to the network. Please try again.";
}

/**
 * Fetches the native (XLM) balance + reserve for a Testnet account.
 * Throws a normalized error if the account does not exist on Testnet.
 */
export async function fetchBalance(address: string): Promise<BalanceInfo> {
  const srv = getServer();
  let account: Horizon.AccountResponse;
  try {
    account = await srv.loadAccount(address);
  } catch (err) {
    const message = (err as { response?: { status?: number } })?.response?.status === 404
      ? "This account does not exist on Testnet yet. Fund it with Friendbot to activate it."
      : "Could not load the account from Horizon. Check your connection and try again.";
    throw new Error(message);
  }

  const native = account.balances.find((b) => b.asset_type === "native");
  // Horizon returns the native balance already in XLM (e.g. "10000.0000000"),
  // NOT in stroops — parse directly.
  const total = native ? Number(native.balance) : 0;

  // Base reserve = 0.5 XLM * (2 + number of sub-entries: trustlines, offers, signers)
  const subentries = Number(account.subentry_count ?? 0);
  const reserve = BASE_RESERVE_PER_ENTRY_XLM * (BASE_RESERVE_MIN_ENTRIES + subentries);

  return { total, reserve, spendable: Math.max(total - reserve, 0) };
}

/**
 * Builds an **unsigned** native XLM payment transaction and returns its XDR.
 * The caller (wallet layer) signs this XDR out-of-band.
 */
export async function buildNativePayment(
  source: string,
  destination: string,
  amountXlm: string,
): Promise<string> {
  const srv = getServer();
  const account = await srv.loadAccount(source);

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination,
        amount: amountXlm,
        asset: Asset.native(),
      }),
    )
    .setTimeout(60)
    .build();

  return transaction.toXDR();
}

/**
 * Reconstructs a signed transaction from its XDR and submits it to Testnet.
 * Returns the resulting hash + explorer link.
 */
export async function submitSignedTransaction(
  signedXdr: string,
): Promise<PaymentResult> {
  const srv = getServer();
  const signed = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
  const response = await srv.submitTransaction(signed);
  const hash = response.hash;
  return {
    hash,
    ledger: (response as { ledger?: number }).ledger ?? null,
    explorerUrl: TESTNET_EXPLORER_TX(hash),
  };
}

/**
 * Funds a Testnet address via Friendbot (10,000 XLM). No-op equivalent to a
 * faucet call — idempotent (re-funding returns a duplicate-funding result).
 */
export async function fundWithFriendbot(address: string): Promise<void> {
  const res = await fetch(`${FRIENDBOT_TESTNET_URL}/?addr=${encodeURIComponent(address)}`);
  if (!res.ok) {
    // 400 typically means "already funded" — that's fine.
    if (res.status !== 400) {
      throw new Error(`Friendbot funding failed (HTTP ${res.status}).`);
    }
  }
}
