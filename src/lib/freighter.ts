/**
 * Real Freighter wallet integration (production path).
 *
 * NOTE on the v6 SDK: `@stellar/freighter-api` v6 renamed the classic methods:
 *   - `requestConnection()` -> `requestAccess()`
 *   - `getPublicKey()`      -> `getAddress()`
 *   - `getNetwork()` now returns `{ network, networkPassphrase }` (no `result`)
 * risen uses the current v6 names. (See README "Notes on the Freighter API".)
 *
 * Installation detection: the Freighter extension does not expose a stable
 * global, and only `isConnected()`/`getAddress()` have a built-in timeout in the
 * SDK (other calls hang forever when the extension is absent). We therefore run
 * a small message ping with our own timeout to reliably detect the extension.
 */
import {
  getAddress as freighterGetAddress,
  getNetwork as freighterGetNetwork,
  isConnected as freighterIsConnected,
  requestAccess as freighterRequestAccess,
  signTransaction as freighterSignTransaction,
} from "@stellar/freighter-api";
import { FREIGHTER_TESTNET_NETWORK } from "../config";

const MSG_REQ = "FREIGHTER_EXTERNAL_MSG_REQUEST";
const MSG_RES = "FREIGHTER_EXTERNAL_MSG_RESPONSE";

/**
 * Reliably detects whether the Freighter extension is installed by sending a
 * harmless ping over Freighter's message protocol and waiting for any response.
 */
export function probeFreighterInstalled(timeoutMs = 1500): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    let settled = false;
    const messageId = `risen-probe-${Date.now()}-${Math.random()}`;

    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", onMessage);
      window.clearTimeout(timer);
      resolve(value);
    };

    const onMessage = (event: MessageEvent) => {
      const data = event.data as { source?: string; messageId?: string } | null;
      if (
        event.source === window &&
        data?.source === MSG_RES &&
        data?.messageId === messageId
      ) {
        finish(true);
      }
    };

    const timer = window.setTimeout(() => finish(false), timeoutMs);
    window.addEventListener("message", onMessage);
    window.postMessage(
      { source: MSG_REQ, messageId, type: "REQUEST_USER_INFO" },
      window.location.origin,
    );
  });
}

/** True when Freighter reports an active connection (account shared). */
export async function getIsConnected(): Promise<boolean> {
  const res = await freighterIsConnected();
  return Boolean(res.isConnected);
}

/**
 * Requests wallet access. Prompts the user in Freighter.
 * Returns the shared public key (address).
 */
export async function requestConnection(): Promise<string> {
  const res = await freighterRequestAccess();
  if (res.error) throw new Error(res.error.message || "Connection request failed.");
  if (!res.address) throw new Error("No public key was returned by Freighter.");
  return res.address;
}

/** Returns the currently active public key without prompting (may be empty). */
export async function getActiveAddress(): Promise<string | null> {
  const res = await freighterGetAddress();
  if (res.error) throw new Error(res.error.message || "Could not read the public key.");
  return res.address || null;
}

export interface NetworkInfo {
  network: string;
  networkPassphrase: string;
  isTestnet: boolean;
}

/** Returns Freighter's currently selected network. */
export async function getNetworkInfo(): Promise<NetworkInfo> {
  const res = await freighterGetNetwork();
  if (res.error) throw new Error(res.error.message || "Could not read the network.");
  return {
    network: res.network,
    networkPassphrase: res.networkPassphrase,
    isTestnet: res.network === FREIGHTER_TESTNET_NETWORK,
  };
}

/**
 * Signs an unsigned transaction XDR with Freighter.
 * Returns the signed transaction XDR.
 */
export async function signTransactionXdr(
  unsignedXdr: string,
  networkPassphrase: string,
): Promise<string> {
  const res = await freighterSignTransaction(unsignedXdr, { networkPassphrase });
  if (res.error) throw new Error(res.error.message || "The transaction was not signed.");
  if (!res.signedTxXdr) throw new Error("Freighter did not return a signed transaction.");
  return res.signedTxXdr;
}
