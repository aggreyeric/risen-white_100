import { FREIGHTER_DOCS_URL } from "../config";
import { AlertIcon, NetworkIcon, RefreshIcon, Spinner } from "./ui";

export function NetworkBanner({
  networkLabel,
  checking,
  onRefresh,
}: {
  networkLabel: string | null;
  checking: boolean;
  onRefresh: () => void;
}) {
  const display = networkLabel ? humanizeNetwork(networkLabel) : "Unknown";
  return (
    <div className="card animate-fade-in border-amber-400/25 bg-amber-400/[0.06] p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-amber-300">
            <AlertIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-amber-100">
              Wrong network — switch to Testnet
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-amber-200/70">
              Freighter is set to <span className="font-semibold">{display}</span>. This dApp only
              supports <span className="font-semibold">Test Net</span>. Open the Freighter extension,
              switch the network, then re-check below.
            </p>
          </div>
        </div>
        <button onClick={onRefresh} disabled={checking} className="btn-secondary shrink-0 px-3 py-2 text-xs">
          {checking ? <Spinner className="h-4 w-4" /> : <RefreshIcon className="h-4 w-4" />}
          Re-check network
        </button>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-amber-200/60">
        <NetworkIcon className="h-3.5 w-3.5" />
        <a href={FREIGHTER_DOCS_URL} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
          How to switch networks in Freighter
        </a>
      </div>
    </div>
  );
}

function humanizeNetwork(n: string): string {
  switch (n) {
    case "TESTNET":
      return "Test Net";
    case "PUBLIC":
      return "Main Net (Public)";
    case "FUTURENET":
      return "Future Net";
    default:
      return n;
  }
}
