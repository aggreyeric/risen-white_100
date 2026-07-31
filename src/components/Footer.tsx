import { FREIGHTER_DOCS_URL, FREIGHTER_INSTALL_URL, NETWORK_LABEL } from "../config";
import { ExternalIcon } from "./ui";

export function Footer({ repoUrl }: { repoUrl?: string }) {
  const links = [
    { label: "Freighter", href: FREIGHTER_INSTALL_URL },
    { label: "Stellar Testnet Explorer", href: "https://stellar.expert/explorer/testnet" },
    { label: "Friendbot Faucet", href: "https://friendbot.stellar.org" },
    { label: "Freighter Docs", href: FREIGHTER_DOCS_URL },
  ];
  return (
    <footer className="relative z-10 mx-auto mt-10 w-full max-w-5xl px-5 pb-10">
      <div className="flex flex-col items-center gap-4 border-t border-white/5 pt-6 sm:flex-row sm:justify-between">
        <p className="order-2 text-center text-xs text-slate-500 sm:order-1 sm:text-left">
          risen · built for the Stellar Frontend Challenge · runs on{" "}
          <span className="text-slate-400">{NETWORK_LABEL}</span> only.
        </p>
        <nav className="order-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:order-2">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-slate-400 transition hover:text-white"
            >
              {l.label} <ExternalIcon className="h-3 w-3" />
            </a>
          ))}
          {repoUrl && (
            <a
              href={repoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-slate-400 transition hover:text-white"
            >
              GitHub <ExternalIcon className="h-3 w-3" />
            </a>
          )}
        </nav>
      </div>
    </footer>
  );
}
