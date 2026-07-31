/**
 * Wallet abstraction.
 *
 * Routes between the production Freighter integration and the development mock
 * wallet. The rest of the app only depends on this module, so the mock can be
 * removed later without touching the React layer.
 */
import {
  getActiveAddress,
  getIsConnected,
  getNetworkInfo,
  probeFreighterInstalled,
  requestConnection,
  signTransactionXdr as realSign,
  type NetworkInfo,
} from "./freighter";
import {
  mockGetActiveAddress,
  mockGetNetworkInfo,
  mockRequestConnection,
  mockSignTransactionXdr,
  probeMockInstalled,
} from "./mockWallet";

/** True only when the dev mock wallet is explicitly enabled. */
export const usingMockWallet = (): boolean =>
  import.meta.env.VITE_MOCK_WALLET === "true";

/** Detects whether a wallet is available (extension or mock). */
export async function probeInstalled(): Promise<boolean> {
  return usingMockWallet() ? probeMockInstalled() : probeFreighterInstalled();
}

/** Requests access and returns the shared public key. */
export async function connectWallet(): Promise<string> {
  return usingMockWallet() ? mockRequestConnection() : requestConnection();
}

/** Returns the active public key (without prompting), if any. */
export async function getActivePublicKey(): Promise<string | null> {
  if (usingMockWallet()) return mockGetActiveAddress();
  const connected = await getIsConnected().catch(() => false);
  if (!connected) return null;
  return getActiveAddress();
}

/** Returns the selected network info. */
export async function getNetwork(): Promise<NetworkInfo> {
  return usingMockWallet() ? mockGetNetworkInfo() : getNetworkInfo();
}

/** Signs an unsigned transaction XDR. */
export async function signTransaction(
  unsignedXdr: string,
  networkPassphrase: string,
): Promise<string> {
  if (usingMockWallet()) return mockSignTransactionXdr(unsignedXdr);
  return realSign(unsignedXdr, networkPassphrase);
}
