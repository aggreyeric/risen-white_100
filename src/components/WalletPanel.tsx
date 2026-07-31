import { FREIGHTER_DOCS_URL, FREIGHTER_INSTALL_URL, NETWORK_LABEL } from "../config";
import type { WalletStatus } from "../types";
import { DownloadIcon, ExternalIcon, Spinner, WalletIcon } from "./ui";

export function WalletPanel({
  status,
  onConnect,
  mockMode,
}: {
  status: WalletStatus;
  onConnect: () => void;
  mockMode: boolean;
}) {
  const notInstalled = status === "not-installed";
  const connecting = status === "connecting";

  return (
    <div className="card animate-fade-in p-7 sm:p-9">
      <div className="flex flex-col items-center text-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-stellar/20 to-transparent">
          <WalletIcon className="h-8 w-8 text-stellar-light" />
        </span>
        <h2 className="mt-5 text-2xl font-bold text-white">Connect your Freighter wallet</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">
          Connect with Freighter to view your {NETWORK_LABEL} XLM balance and send native
          payments. This dApp runs entirely on Testnet — no real funds are involved.
        </p>

        <button onClick={onConnect} disabled={connecting} className="btn-primary mt-6 w-full max-w-sm py-3 text-base">
          {connecting ? (
            <>
              <Spinner className="h-5 w-5" /> Connecting…
            </>
          ) : (
            <>
              <WalletIcon className="h-5 w-5" /> Connect Wallet
            </>
          )}
        </button>

        {notInstalled ? (
          <div className="mt-5 w-full max-w-sm rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-left">
            <p className="text-sm font-semibold text-amber-200">Freighter extension not detected</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-200/70">
              Install the Freighter browser extension to continue, then switch it to{" "}
              <span className="font-semibold">Test Net</span> and reload.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={FREIGHTER_INSTALL_URL} target="_blank" rel="noreferrer" className="btn-secondary px-3 py-2 text-xs">
                <DownloadIcon className="h-4 w-4" /> Install Freighter
              </a>
              <a href={FREIGHTER_DOCS_URL} target="_blank" rel="noreferrer" className="btn-ghost px-3 py-2 text-xs">
                Docs <ExternalIcon className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-xs text-slate-500">
            New to Testnet? Fund your account for free with{" "}
            <a
              className="font-medium text-stellar-light underline-offset-2 hover:underline"
              href="https://friendbot.stellar.org"
              target="_blank"
              rel="noreferrer"
            >
              Friendbot
            </a>{" "}
            after connecting.
          </p>
        )}

        {mockMode && (
          <p className="mt-3 rounded-lg border border-sky-400/20 bg-sky-400/5 px-3 py-1.5 text-[11px] text-sky-300/80">
            Development mock wallet is active — backed by a real Testnet account.
          </p>
        )}
      </div>
    </div>
  );
}
