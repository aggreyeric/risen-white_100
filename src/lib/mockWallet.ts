/**
 * DEVELOPMENT-ONLY mock wallet.
 *
 * The Freighter browser extension cannot run inside a headless Chromium instance,
 * so it is impossible to automate a real "Connect Freighter → sign in extension"
 * flow in automated screenshots/CI. This mock stands in for the extension ONLY
 * when `VITE_MOCK_WALLET=true`, and it is backed by a REAL Testnet keypair funded
 * by Friendbot. That means:
 *   - the displayed balance is a live read from Horizon (real), and
 *   - the signed payment is a REAL on-chain Testnet transaction with a real hash.
 *
 * In a normal `npm run dev` (without the flag) this module is never selected —
 * the app talks to the real Freighter extension. The flag also has zero effect on
 * production builds unless explicitly set in the deploy environment.
 *
 * NOTE: The secret key lives only in the browser's localStorage for convenience
 * across reloads. It is a throwaway Testnet account — never reuse on Mainnet.
 */
import { Keypair, Networks, TransactionBuilder } from "@stellar/stellar-sdk";
import { FREIGHTER_TESTNET_NETWORK } from "../config";
import { fundWithFriendbot } from "./stellar";
import type { NetworkInfo } from "./freighter";

const STORAGE_KEY = "risen:mock-wallet:v1";
const NETWORK_PASSPHRASE = Networks.TESTNET;

interface MockKeypair {
  publicKey: string;
  secret: string;
}

function isMockEnabled(): boolean {
  return import.meta.env.VITE_MOCK_WALLET === "true";
}

function loadStored(): MockKeypair | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MockKeypair;
    if (parsed?.publicKey && parsed?.secret) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

function store(pair: MockKeypair): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pair));
  } catch {
    /* ignore */
  }
}

let cached: MockKeypair | null = null;

/** Returns (creating + funding if needed) the mock Testnet keypair. */
export async function ensureMockWallet(): Promise<MockKeypair> {
  if (cached) return cached;
  cached = loadStored();
  if (!cached) {
    const kp = Keypair.random();
    cached = { publicKey: kp.publicKey(), secret: kp.secret() };
    store(cached);
  }
  // Best-effort funding; Friendbot is idempotent (400 if already funded).
  try {
    await fundWithFriendbot(cached.publicKey);
  } catch {
    /* surfaced via balance refresh if needed */
  }
  return cached;
}

/** Detectable as "installed" when the mock is enabled. */
export async function probeMockInstalled(): Promise<boolean> {
  return isMockEnabled();
}

export async function mockRequestConnection(): Promise<string> {
  const wallet = await ensureMockWallet();
  return wallet.publicKey;
}

export async function mockGetActiveAddress(): Promise<string | null> {
  if (!isMockEnabled()) return null;
  const wallet = await ensureMockWallet();
  return wallet.publicKey;
}

export async function mockGetNetworkInfo(): Promise<NetworkInfo> {
  return {
    network: FREIGHTER_TESTNET_NETWORK,
    networkPassphrase: NETWORK_PASSPHRASE,
    isTestnet: true,
  };
}

/** Signs the unsigned XDR with the mock keypair (real Ed25519 signature). */
export async function mockSignTransactionXdr(unsignedXdr: string): Promise<string> {
  const wallet = await ensureMockWallet();
  const tx = TransactionBuilder.fromXDR(unsignedXdr, NETWORK_PASSPHRASE);
  const keypair = Keypair.fromSecret(wallet.secret);
  tx.sign(keypair);
  return tx.toXDR();
}
