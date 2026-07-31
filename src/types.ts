/** Shared domain types for risen. */

/** High-level wallet status driving the UI. */
export type WalletStatus =
  | "unknown" // initial mount / probing
  | "not-installed" // Freighter extension not detected
  | "disconnected" // installed, but no account shared with the app
  | "connecting" // a connection request is in flight
  | "connected" // an account address is available
  | "wrong-network"; // connected but not on Testnet

/** Result of a Stellar payment submission. */
export interface PaymentResult {
  hash: string;
  ledger: number | null;
  explorerUrl: string;
}

/** Normalized XLM balance info. */
export interface BalanceInfo {
  /** Spendable XLM, accounting for the base reserve. */
  spendable: number;
  /** Total native XLM balance reported by Horizon. */
  total: number;
  /** Base reserve currently withheld for this account. */
  reserve: number;
}

/** A user-facing notification (toast). */
export interface ToastMessage {
  id: number;
  variant: "success" | "error" | "info";
  title: string;
  description?: string;
}
