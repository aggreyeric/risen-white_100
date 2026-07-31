import { NETWORK_LABEL } from "../config";
import { NetworkIcon, StellarMark } from "./ui";

export function Header({ testnet }: { testnet: boolean }) {
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5">
          <StellarMark className="h-6 w-6" />
        </span>
        <div className="leading-tight">
          <p className="text-lg font-extrabold tracking-tight text-white">
            risen
          </p>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
            Stellar Wallet
          </p>
        </div>
      </div>

      <div
        className={`chip ${testnet ? "border-emerald-400/30 text-emerald-300" : "border-amber-400/30 text-amber-300"}`}
      >
        <NetworkIcon className="h-3.5 w-3.5" />
        <span>{testnet ? NETWORK_LABEL : "Wrong Network"}</span>
        <span className={`h-1.5 w-1.5 rounded-full ${testnet ? "bg-emerald-400" : "bg-amber-400"} animate-pulse-soft`} />
      </div>
    </header>
  );
}
