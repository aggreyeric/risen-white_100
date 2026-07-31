/** Formatting helpers (addresses, XLM amounts, timestamps). */

/**
 * Truncates a Stellar public key for display, e.g.
 * `GABC...XYZ`.
 */
export function truncateAddress(address: string, head = 6, tail = 4): string {
  if (!address) return "";
  if (address.length <= head + tail) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

/**
 * Shortens a long transaction hash for compact display while keeping enough
 * characters to be recognizable.
 */
export function truncateHash(hash: string, head = 10, tail = 8): string {
  if (!hash) return "";
  if (hash.length <= head + tail) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

/** Formats an XLM amount with thousands separators and 2 decimals. */
export function formatXlm(amount: number, decimals = 2): string {
  if (!Number.isFinite(amount)) return "0.00";
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Formats a stroop (10^-7 XLM) string into a float XLM number. */
export function stroopsToXlm(stroops: string | number): number {
  const n = typeof stroops === "string" ? Number(stroops) : stroops;
  if (!Number.isFinite(n)) return 0;
  return n / 1e7;
}

/** Formats an ISO/epoch timestamp into a readable local string. */
export function formatTime(value: string | number | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
