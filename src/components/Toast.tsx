import { useEffect } from "react";
import type { ToastMessage } from "../types";
import { AlertIcon, CheckIcon, InfoIcon } from "./ui";

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), 6000);
    return () => window.clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const palette = {
    success: { ring: "border-emerald-400/30", icon: "text-emerald-400", bar: "bg-emerald-400" },
    error: { ring: "border-rose-400/30", icon: "text-rose-400", bar: "bg-rose-400" },
    info: { ring: "border-sky-400/30", icon: "text-sky-400", bar: "bg-sky-400" },
  }[toast.variant];

  const Icon = toast.variant === "success" ? CheckIcon : toast.variant === "error" ? AlertIcon : InfoIcon;

  return (
    <div
      className={`pointer-events-auto flex w-full max-w-md animate-fade-in items-start gap-3 overflow-hidden rounded-xl border ${palette.ring} bg-[#0f0e1a]/95 p-3.5 pr-4 shadow-2xl shadow-black/50 backdrop-blur-xl`}
      role="status"
    >
      <span className={`mt-0.5 h-5 w-5 ${palette.icon}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{toast.title}</p>
        {toast.description ? (
          <p className="mt-0.5 break-words text-xs leading-relaxed text-slate-400">{toast.description}</p>
        ) : null}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-md px-1.5 text-slate-500 transition hover:text-slate-200"
        aria-label="Dismiss"
      >
        ✕
      </button>
      <span className={`absolute bottom-0 left-0 h-0.5 ${palette.bar} animate-pulse-soft`} style={{ width: "100%" }} />
    </div>
  );
}
