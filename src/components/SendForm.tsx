import { useState } from "react";
import type { PaymentResult } from "../types";
import { formatXlm, formatTime, truncateHash } from "../lib/format";
import type { SendError } from "../hooks/useStellarWallet";
import {
  AlertIcon,
  CheckIcon,
  CopyIcon,
  ExternalIcon,
  SendIcon,
  Spinner,
} from "./ui";

export function SendForm({
  spendable,
  sending,
  validate,
  sendPayment,
  lastResult,
  onResultChange,
  onToast,
}: {
  spendable: number;
  sending: boolean;
  validate: (destination: string, amount: string) => SendError | null;
  sendPayment: (
    destination: string,
    amount: string,
  ) => Promise<{ ok: true; result: PaymentResult } | { ok: false; error: string }>;
  lastResult: PaymentResult | null;
  onResultChange: (result: PaymentResult | null) => void;
  onToast: (variant: "success" | "error", title: string, description?: string) => void;
}) {
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [fieldError, setFieldError] = useState<SendError | null>(null);

  const edit = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setFieldError(null);
    if (lastResult) onResultChange(null);
  };

  const setMax = () => {
    setAmount(spendable > 0 ? spendable.toFixed(7) : "");
    setFieldError(null);
    if (lastResult) onResultChange(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate(destination, amount);
    if (err) {
      setFieldError(err);
      return;
    }
    onResultChange(null);
    const res = await sendPayment(destination, amount);
    if (res.ok) {
      setDestination("");
      setAmount("");
      // sendPayment already sets lastResult inside the hook — do NOT call
      // onResultChange here, as it is wired to clearResult() and would wipe it.
      onToast("success", "Payment sent", `Transaction broadcast to Testnet.`);
    } else {
      onToast("error", "Transaction failed", res.error);
    }
  };

  return (
    <div className="card animate-fade-in p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-stellar-light">
          <SendIcon className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-base font-bold text-white">Send XLM</h3>
          <p className="text-xs text-slate-500">Native payment on {`Testnet`}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="recipient" className="label">
            Recipient address
          </label>
          <input
            id="recipient"
            className={`input font-mono text-[13px] ${
              fieldError?.field === "destination" ? "border-rose-400/50 focus:border-rose-400/60 focus:ring-rose-400/20" : ""
            }`}
            placeholder="G…"
            value={destination}
            onChange={edit(setDestination)}
            spellCheck={false}
            autoComplete="off"
          />
          <FieldError error={fieldError} field="destination" />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="amount" className="label mb-0">
              Amount
            </label>
            <button
              type="button"
              onClick={setMax}
              className="text-[11px] font-semibold text-stellar-light transition hover:text-white"
            >
              MAX
            </button>
          </div>
          <div className="relative">
            <input
              id="amount"
              inputMode="decimal"
              className={`input pr-14 font-mono ${
                fieldError?.field === "amount" ? "border-rose-400/50 focus:border-rose-400/60 focus:ring-rose-400/20" : ""
              }`}
              placeholder="0.00"
              value={amount}
              onChange={edit(setAmount)}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
              XLM
            </span>
          </div>
          <FieldError error={fieldError} field="amount" />
          <p className="mt-1.5 text-[11px] text-slate-500">
            Spendable: {formatXlm(spendable)} XLM
          </p>
        </div>

        <button type="submit" disabled={sending} className="btn-primary w-full py-3 text-base">
          {sending ? (
            <>
              <Spinner className="h-5 w-5" /> Signing &amp; sending…
            </>
          ) : (
            <>
              <SendIcon className="h-5 w-5" /> Send XLM
            </>
          )}
        </button>
      </form>

      {lastResult && <TransactionResult result={lastResult} />}
    </div>
  );
}

function FieldError({ error, field }: { error: SendError | null; field: "destination" | "amount" }) {
  if (!error || error.field !== field) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-300">
      <AlertIcon className="h-3.5 w-3.5" /> {error.message}
    </p>
  );
}

function TransactionResult({ result }: { result: PaymentResult }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.hash);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="mt-5 animate-fade-in rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
      <div className="flex items-center gap-2.5">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-400/15 text-emerald-300">
          <CheckIcon className="h-4 w-4" />
        </span>
        <p className="text-sm font-semibold text-emerald-100">Transaction successful</p>
        {result.ledger != null && (
          <span className="ml-auto chip border-emerald-400/20 text-emerald-300/80">Ledger #{result.ledger}</span>
        )}
      </div>

      <div className="mt-3 rounded-lg border border-white/5 bg-black/25 p-3">
        <p className="text-[11px] uppercase tracking-wider text-slate-500">Transaction hash</p>
        <div className="mt-1 flex items-center gap-2">
          <code className="truncate font-mono text-xs text-slate-200">{truncateHash(result.hash, 14, 10)}</code>
          <button onClick={copy} className="shrink-0 text-slate-500 transition hover:text-slate-200" aria-label="Copy hash">
            {copied ? <CheckIcon className="h-3.5 w-3.5 text-emerald-400" /> : <CopyIcon className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      <a
        href={result.explorerUrl}
        target="_blank"
        rel="noreferrer"
        className="btn-secondary mt-3 w-full py-2.5 text-sm"
      >
        <ExternalIcon className="h-4 w-4" /> View on stellar.expert
      </a>
      <p className="mt-2 text-center text-[11px] text-slate-500">
        Broadcast at {formatTime(Date.now())} · confirmed on Testnet
      </p>
    </div>
  );
}
