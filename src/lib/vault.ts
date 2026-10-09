export const VAULT_VERSION = "awv1";
export const VAULT_ITERATIONS = 210000;

export const VAULT_START = "<!--aw-vault-start-->";
export const VAULT_END = "<!--aw-vault-end-->";
export const VAULT_PAYLOAD_ATTRIBUTE = "data-afterword-vault-payload";

const SALT_BYTES = 16;
const IV_BYTES = 12;

const encoder = new TextEncoder();

export type VaultPayload = {
  v: string;
  iter: number;
  salt: string;
  iv: string;
  data: string;
};

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function fromBase64(value: string): ArrayBuffer {
  const binary = atob(value);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return buffer;
}

async function deriveKey(
  password: string,
  salt: ArrayBuffer,
  iterations: number
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptText(
  plaintext: string,
  password: string
): Promise<VaultPayload> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(password, toArrayBuffer(salt), VAULT_ITERATIONS);
  const data = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(encoder.encode(plaintext))
  );

  return {
    v: VAULT_VERSION,
    iter: VAULT_ITERATIONS,
    salt: toBase64(salt),
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(data)),
  };
}

export async function decryptText(
  payload: VaultPayload,
  password: string
): Promise<string> {
  if (payload.v !== VAULT_VERSION) {
    throw new Error(`不支持的密文版本：${payload.v}`);
  }

  const key = await deriveKey(
    password,
    fromBase64(payload.salt),
    payload.iter
  );
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(payload.iv) },
    key,
    fromBase64(payload.data)
  );

  return new TextDecoder().decode(plaintext);
}
