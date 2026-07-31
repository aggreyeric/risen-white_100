import { useState } from "react";
import {
  FRIENDBOT_TESTNET_URL,
  NETWORK_LABEL,
  TESTNET_EXPLORER_ACCOUNT,
} from "../config";
import type { BalanceInfo } from "../types";
import { formatXlm, truncateAddress } from "../lib/format";
import {
  AlertIcon,
  CheckIcon,
  CopyIcon,
  ExternalIcon,
  LogoutIcon,
  RefreshIcon,
  Spinner,
} from "./ui";

export function BalanceCard({
  address,
  balance,
  loading,
  error,
  onRefresh,
  onDisconnect,
  onFund,
}: {
  address: string;
  balance: BalanceInfo | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onDisconnect: () => void;
  onFund: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="card animate-fade-in overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-white/5 px-5 py-4">
        <div className="min-w-0">
          <p className="label mb-0.5">Connected account</p>
          <div className="flex items-center gap-2">
            <code className="truncate font-mono text-sm text-slate-200">{truncateAddress(address, 10, 6)}</code>
            <button onClick={copy} className="text-slate-500 transition hover:text-slate-200" aria-label="Copy address">
              {copied ? <CheckIcon className="h-4 w-4 text-emerald-400" /> : <CopyIcon className="h-4 w-4" />}
            </button>
            <a
              href={TESTNET_EXPLORER_ACCOUNT(address)}
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 transition hover:text-slate-200"
              aria-label="View account on explorer"
            >
              <ExternalIcon className="h-4 w-4" />
            </a>
          </div>
        </div>
        <button onClick={onDisconnect} className="btn-ghost px-2.5 py-2 text-xs">
          <LogoutIcon className="h-4 w-4" /> Disconnect
        </button>
      </div>

      <div className="px-5 py-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="label">XLM Balance · {NETWORK_LABEL}</p>
            {loading ? (
              <div className="mt-1 flex items-center gap-2 text-slate-400">
                <Spinner className="h-5 w-5 text-stellar-light" /> Loading balance…
              </div>
            ) : error ? (
              <p className="mt-1 text-lg font-bold text-rose-300">—</p>
            ) : (
              <p className="mt-0.5 font-mono text-4xl font-extrabold tracking-tight text-white">
                {formatXlm(balance?.total ?? 0)}
                <span className="ml-2 text-xl font-semibold text-slate-400">XLM</span>
              </p>
            )}
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="btn-secondary px-3 py-2 text-xs"
            aria-label="Refresh balance"
          >
            {loading ? <Spinner className="h-4 w-4" /> : <RefreshIcon className="h-4 w-4" />}
          </button>
        </div>

        {balance && !loading && !error && (
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Stat label="Spendable" value={`${formatXlm(balance.spendable)} XLM`} hint="after reserves" />
            <Stat label="Base reserve" value={`${formatXlm(balance.reserve)} XLM`} hint="held on-chain" />
          </div>
        )}

        {error && !loading && (
          <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/5 p-4">
            <div className="flex items-start gap-2.5">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
              <div className="flex-1">
                <p className="text-sm font-medium text-rose-200">{error}</p>
                {/does not exist|not.*funded|activate/i.test(error) && (
                  <button onClick={onFund} className="btn-secondary mt-3 px-3 py-2 text-xs">
                    Fund with Friendbot (10,000 XLM)
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/5 px-5 py-2.5">
        <a
          href={FRIENDBOT_TESTNET_URL}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline"
        >
          Top up this Testnet account via Friendbot →
        </a>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 px-3.5 py-3">
      <p className="label">{label}</p>
      <p className="font-mono text-base font-semibold text-slate-100">{value}</p>
      <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>
    </div>
  );
}
