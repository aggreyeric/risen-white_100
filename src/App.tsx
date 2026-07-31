import { useCallback, useState } from "react";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { NetworkBanner } from "./components/NetworkBanner";
import { SendForm } from "./components/SendForm";
import { BalanceCard } from "./components/BalanceCard";
import { ToastStack } from "./components/Toast";
import { WalletPanel } from "./components/WalletPanel";
import { NetworkIcon, SendIcon, Spinner, WalletIcon } from "./components/ui";
import { fundWithFriendbot } from "./lib/stellar";
import { usingMockWallet } from "./lib/wallet";
import { useStellarWallet } from "./hooks/useStellarWallet";
import type { ToastMessage } from "./types";

const FEATURES = [
  { icon: WalletIcon, label: "Freighter wallet" },
  { icon: NetworkIcon, label: "Live Testnet balance" },
  { icon: SendIcon, label: "Real native payments" },
];

export default function App() {
  const wallet = useStellarWallet();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [checking, setChecking] = useState(false);
  const [funding, setFunding] = useState(false);
  const mockMode = usingMockWallet();

  const pushToast = useCallback(
    (variant: ToastMessage["variant"], title: string, description?: string) => {
      setToasts((prev) => [...prev, { id: Date.now() + Math.random(), variant, title, description }]);
    },
    [],
  );
  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleConnect = async () => {
    const err = await wallet.connect();
    if (err) pushToast("error", "Connection failed", err);
  };

  const handleRefreshNetwork = async () => {
    setChecking(true);
    await wallet.refreshNetwork();
    setChecking(false);
    if (wallet.status !== "wrong-network") {
      pushToast("success", "Back on Testnet", "Network is correct — balance refreshed.");
    }
  };

  const handleFund = async () => {
    if (!wallet.address) return;
    setFunding(true);
    try {
      await fundWithFriendbot(wallet.address);
      pushToast("success", "Account funded", "10,000 XLM added via Friendbot.");
      await wallet.refreshBalance();
    } catch {
      pushToast("error", "Funding failed", "Friendbot could not fund this account.");
    } finally {
      setFunding(false);
    }
  };

  const { status } = wallet;
  const showDisconnected = status === "disconnected" || status === "not-installed" || status === "connecting";
  const headerTestnet = status !== "wrong-network" && status !== "unknown";

  return (
    <div className="risen-backdrop risen-grid relative min-h-screen overflow-hidden">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Header testnet={headerTestnet} />

        <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-8">
          {showDisconnected && (
            <section className="mb-8 text-center">
              <span className="chip mx-auto mb-5 border-stellar/30 bg-stellar/10 text-stellar-light">
                <span className="h-1.5 w-1.5 rounded-full bg-stellar-light" /> Stellar Frontend Challenge · Level 1
              </span>
              <h1 className="mx-auto max-w-2xl text-balance text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
                Send XLM on Stellar, the{" "}
                <span className="bg-gradient-to-r from-stellar-light to-sky-400 bg-clip-text text-transparent">
                  modern
                </span>{" "}
                way
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-slate-400">
                Connect Freighter, check your Testnet balance, and broadcast real native
                payments in seconds. Clean, fast, and fully on-chain.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                {FEATURES.map(({ icon: Icon, label }) => (
                  <span key={label} className="chip">
                    <Icon className="h-3.5 w-3.5 text-stellar-light" /> {label}
                  </span>
                ))}
              </div>
            </section>
          )}

          {status === "unknown" && <LoadingSplash />}

          {showDisconnected && (
            <div className="mx-auto max-w-md">
              <WalletPanel status={status} onConnect={handleConnect} mockMode={mockMode} />
            </div>
          )}

          {status === "wrong-network" && (
            <div className="mx-auto max-w-2xl">
              <NetworkBanner networkLabel={wallet.networkLabel} checking={checking} onRefresh={handleRefreshNetwork} />
            </div>
          )}

          {status === "connected" && (
            <div className="grid items-start gap-5 lg:grid-cols-2">
              <BalanceCard
                address={wallet.address ?? ""}
                balance={wallet.balance}
                loading={wallet.balanceLoading || funding}
                error={wallet.balanceError}
                onRefresh={wallet.refreshBalance}
                onDisconnect={wallet.disconnect}
                onFund={handleFund}
              />
              <SendForm
                spendable={wallet.balance?.spendable ?? 0}
                sending={wallet.sending}
                validate={wallet.validate}
                sendPayment={wallet.sendPayment}
                lastResult={wallet.lastResult}
                onResultChange={wallet.clearResult}
                onToast={(variant, title, description) => pushToast(variant, title, description)}
              />
            </div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}

function LoadingSplash() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <Spinner className="h-8 w-8 text-stellar-light" />
        <p className="text-sm">Checking your wallet…</p>
      </div>
    </div>
  );
}
