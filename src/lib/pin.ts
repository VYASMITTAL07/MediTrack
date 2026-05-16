import crypto from "node:crypto";

type PinEntry = {
  code: string;
  expiresAt: number;
};

const globalForPins = globalThis as unknown as {
  meditrackPins?: Map<string, PinEntry>;
};

const pinStore = globalForPins.meditrackPins ?? new Map<string, PinEntry>();

if (process.env.NODE_ENV !== "production") {
  globalForPins.meditrackPins = pinStore;
}

function key(identifier: string, purpose: string) {
  return `${identifier.toLowerCase()}:${purpose}`;
}

export function generatePin() {
  return crypto.randomInt(100000, 1000000).toString();
}

export function rememberPin(identifier: string, purpose: string, code: string) {
  pinStore.set(key(identifier, purpose), {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000
  });
}

export function verifyRememberedPin(identifier: string, purpose: string, code: string) {
  if (process.env.NODE_ENV === "production") return false;

  const entry = pinStore.get(key(identifier, purpose));
  if (!entry || entry.expiresAt < Date.now() || entry.code !== code) return false;

  pinStore.delete(key(identifier, purpose));
  return true;
}
