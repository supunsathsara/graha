/**
 * Family chart vault — client library.
 *
 * The family key is the vault's access key (a bearer secret, like a
 * password). It is generated once, stored in localStorage, and must be
 * backed up by the user — clearing browser data without the key loses
 * access forever. Entering the same key on another device restores the
 * same vault (all data lives server-side, keyed by the key itself).
 *
 * Key format: GRH-XXXX-XXXX-XXXX-XXXX (16 chars from an unambiguous
 * alphabet — no 0/O/1/I/L). Legacy UUIDs from earlier builds still work.
 */

const FAMILY_KEY = "graha:family-id";
const KEY_ACK_KEY = "graha:key-acknowledged";

// 32 unambiguous chars (Crockford-style, no I, L, O, 0, 1)
const KEY_CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const GRH_RE = /^GRH-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;

function generateKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (b) => KEY_CHARSET[b % KEY_CHARSET.length]);
  const groups = [0, 4, 8, 12].map((i) => chars.slice(i, i + 4).join(""));
  return `GRH-${groups.join("-")}`;
}

/** Accepts typed keys with or without dashes; uppercases; returns canonical form. */
export function normalizeKey(input: string): string {
  const s = input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  if (!s.startsWith("GRH")) return input.trim().toUpperCase();
  const body = s.slice(3);
  if (body.length !== 16) return input.trim().toUpperCase();
  return `GRH-${[0, 4, 8, 12].map((i) => body.slice(i, i + 4)).join("-")}`;
}

export function isValidKey(input: string): boolean {
  const normalized = normalizeKey(input);
  if (GRH_RE.test(normalized)) return true;
  // Legacy UUIDs (from before the key system) remain valid.
  return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
    input.trim(),
  );
}

export function getFamilyId(): string {
  if (typeof window === "undefined") return "";
  const stored = localStorage.getItem(FAMILY_KEY);
  if (stored && isValidKey(stored)) return stored;
  const key = generateKey();
  localStorage.setItem(FAMILY_KEY, key);
  return key;
}

/** Restore / adopt a different vault key (e.g. from another device). */
export function setFamilyId(key: string): boolean {
  const normalized = normalizeKey(key);
  if (!isValidKey(normalized)) return false;
  localStorage.setItem(FAMILY_KEY, normalized);
  localStorage.setItem(KEY_ACK_KEY, "1"); // they clearly know the key
  return true;
}

export function keyAcknowledged(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(KEY_ACK_KEY) === "1";
}

export function markKeyAcknowledged() {
  try {
    localStorage.setItem(KEY_ACK_KEY, "1");
  } catch {}
}

async function vaultFetch(path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`/api/vault${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Family-Id": getFamilyId(),
      ...(init?.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || "Vault request failed");
  return data;
}

export interface VaultEntry {
  id: string;
  label: string;
  birthDate: string;
  birthTime: string;
  createdAt?: string;
}

export interface VaultChart {
  chart: any;
  reading: any;
  birthData: any;
  label: string;
}

export function saveChart(
  label: string,
  birthData: any,
  chart: any,
  reading: any,
) {
  return vaultFetch("/charts", {
    method: "POST",
    body: JSON.stringify({ label, birthData, chart, reading }),
  });
}

export function listCharts(): Promise<{ charts: VaultEntry[] }> {
  return vaultFetch("/charts");
}

export function getChart(id: string): Promise<VaultChart> {
  return vaultFetch(`/charts/${id}`);
}

export function deleteChart(id: string) {
  return vaultFetch(`/charts/${id}`, { method: "DELETE" });
}
