import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const tokenEnvelopeAad = Buffer.from("yorso-password-recovery-token:v1", "utf8");

export interface PasswordRecoveryTokenIssue {
  expiresAt: Date;
  secret: string;
  token: string;
  tokenLookupHash: string;
}

export interface PasswordRecoveryTokenIssuerOptions {
  generateToken?: () => string;
  now?: () => Date;
  ttlSeconds: number;
}

export interface PasswordRecoveryTokenCodec {
  open(envelope: string): string;
  seal(token: string): string;
}

export class PasswordRecoveryTokenIssuer {
  private readonly now: () => Date;

  constructor(private readonly options: PasswordRecoveryTokenIssuerOptions) {
    this.now = options.now ?? (() => new Date());
  }

  issue(): PasswordRecoveryTokenIssue {
    const token = this.options.generateToken?.() ?? randomBytes(32).toString("base64url");
    if (!/^[A-Za-z0-9._~:-]{32,512}$/.test(token)) {
      throw new Error("password_recovery_token_invalid");
    }
    return {
      expiresAt: new Date(this.now().getTime() + this.options.ttlSeconds * 1000),
      secret: createPasswordSecret(token),
      token,
      tokenLookupHash: hashPasswordRecoveryToken(token),
    };
  }
}

export function hashPasswordRecoveryToken(token: string): string {
  return `sha256:${createHash("sha256").update(token).digest("hex")}`;
}

export function createPasswordRecoveryTokenCodec(secret: string): PasswordRecoveryTokenCodec {
  const key = createHash("sha256").update(`yorso-password-recovery-token:${secret}`).digest();
  return {
    open(envelope: string) {
      const [version, ivPart, tagPart, ciphertextPart] = envelope.split(":");
      if (version !== "v1" || !ivPart || !tagPart || !ciphertextPart) {
        throw new Error("password_recovery_token_envelope_invalid");
      }
      const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivPart, "base64url"));
      decipher.setAAD(tokenEnvelopeAad);
      decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
      const plain = Buffer.concat([
        decipher.update(Buffer.from(ciphertextPart, "base64url")),
        decipher.final(),
      ]).toString("utf8");
      if (!/^[A-Za-z0-9._~:-]{32,512}$/.test(plain)) {
        throw new Error("password_recovery_token_envelope_invalid");
      }
      return plain;
    },
    seal(token: string) {
      if (!/^[A-Za-z0-9._~:-]{32,512}$/.test(token)) {
        throw new Error("password_recovery_token_invalid");
      }
      const iv = randomBytes(12);
      const cipher = createCipheriv("aes-256-gcm", key, iv);
      cipher.setAAD(tokenEnvelopeAad);
      const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
      const tag = cipher.getAuthTag();
      return [
        "v1",
        iv.toString("base64url"),
        tag.toString("base64url"),
        ciphertext.toString("base64url"),
      ].join(":");
    },
  };
}

function createPasswordSecret(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256").update(`${salt}:${password}`).digest("hex");
  return `sha256:${salt}:${hash}`;
}
