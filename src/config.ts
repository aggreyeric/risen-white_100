/**
 * Central network + app configuration.
 *
 * risen targets the Stellar **Testnet** for the Level-1 challenge. Every network
 * dependent constant lives here so switching environments is a one-line change.
 */

/** Horizon server for Stellar Testnet (read-only account/tx data). */
export const HORIZON_TESTNET_URL = "https://horizon-testnet.stellar.org";

/** Friendbot funds Testnet accounts with 10,000 XLM for free. */
export const FRIENDBOT_TESTNET_URL = "https://friendbot.stellar.org";

/** stellar.expert explorer — used to deep-link transaction hashes. */
export const TESTNET_EXPLORER_TX = (hash: string) =>
  `https://stellar.expert/explorer/testnet/tx/${hash}`;

/** stellar.expert explorer — deep-link to an account. */
export const TESTNET_EXPLORER_ACCOUNT = (address: string) =>
  `https://stellar.expert/explorer/testnet/account/${address}`;

/** Official Freighter extension install link. */
export const FREIGHTER_INSTALL_URL =
  "https://www.freighter.app/" as const;

/** Official Freighter docs link. */
export const FREIGHTER_DOCS_URL =
  "https://developers.stellar.org/docs/build/apps/wallets/freighter" as const;

/** Network identifier returned by `freighter-api`'s `getNetwork()` for Testnet. */
export const FREIGHTER_TESTNET_NETWORK = "TESTNET" as const;

/** Human-friendly label for Testnet. */
export const NETWORK_LABEL = "Stellar Testnet" as const;

/**
 * Minimum account reserve consideration. A Testnet account must keep a small
 * base reserve (0.5 XLM × (2 + #entries)) to remain active. We keep the spendable
 * guard simple here; full reserve math is surfaced as a helper elsewhere.
 */
export const BASE_RESERVE_PER_ENTRY_XLM = 0.5;
export const BASE_RESERVE_MIN_ENTRIES = 2;

/** Decimal precision used when rendering XLM balances. */
export const XLM_DECIMALS = 2;
