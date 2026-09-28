const DEMO_PREFIX = "demo:v1:";

export type EncryptionAdapter = {
  encrypt(plaintext: string): string;
  decrypt(ciphertext: string): string;
  modeLabel: string;
};

export const demoEncryptionAdapter: EncryptionAdapter = {
  modeLabel: "Local demo encryption (not production E2EE)",
  encrypt(plaintext: string) {
    const salt = process.env.DEMO_ENCRYPTION_SALT || "whisper-demo-salt";
    return `${DEMO_PREFIX}${Buffer.from(`${salt}:${plaintext}`, "utf8").toString("base64")}`;
  },
  decrypt(ciphertext: string) {
    if (!ciphertext.startsWith(DEMO_PREFIX)) return ciphertext;
    const salt = process.env.DEMO_ENCRYPTION_SALT || "whisper-demo-salt";
    const decoded = Buffer.from(ciphertext.slice(DEMO_PREFIX.length), "base64").toString("utf8");
    return decoded.replace(`${salt}:`, "");
  },
};
