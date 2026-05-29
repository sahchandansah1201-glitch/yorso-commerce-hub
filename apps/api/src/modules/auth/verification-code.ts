import { createCipheriv, createDecipheriv, createHash, randomBytes, randomInt } from "node:crypto";

const codeEnvelopeAad = Buffer.from("yorso-registration-verification-code:v1", "utf8");

export interface RegistrationVerificationCodeIssue {
  code: string;
  expiresAt: Date;
  secret: string;
}

export interface RegistrationVerificationCodeIssuerOptions {
  codeLength?: number;
  generateCode?: () => string;
  now?: () => Date;
  randomInt?: (max: number) => number;
  ttlSeconds: number;
}

export interface RegistrationVerificationCodeCodec {
  open(envelope: string): string;
  seal(code: string): string;
}

export class RegistrationVerificationCodeIssuer {
  private readonly codeLength: number;
  private readonly generateCode?: () => string;
  private readonly now: () => Date;
  private readonly randomInt: (max: number) => number;

  constructor(private readonly options: RegistrationVerificationCodeIssuerOptions) {
    this.codeLength = options.codeLength ?? 6;
    this.generateCode = options.generateCode;
    this.now = options.now ?? (() => new Date());
    this.randomInt = options.randomInt ?? ((max) => randomInt(max));
  }

  issue(): RegistrationVerificationCodeIssue {
    const max = 10 ** this.codeLength;
    const code = this.generateCode?.() ?? String(this.randomInt(max)).padStart(this.codeLength, "0");
    if (!new RegExp(`^\\d{${this.codeLength}}$`).test(code)) {
      throw new Error("registration_verification_code_invalid");
    }
    return {
      code,
      expiresAt: new Date(this.now().getTime() + this.options.ttlSeconds * 1000),
      secret: createPasswordSecret(code),
    };
  }
}

export function createRegistrationVerificationCodeCodec(secret: string): RegistrationVerificationCodeCodec {
  const key = createHash("sha256").update(`yorso-registration-verification-code:${secret}`).digest();
  return {
    open(envelope: string) {
      const [version, ivPart, tagPart, ciphertextPart] = envelope.split(":");
      if (version !== "v1" || !ivPart || !tagPart || !ciphertextPart) {
        throw new Error("registration_verification_code_envelope_invalid");
      }
      const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivPart, "base64url"));
      decipher.setAAD(codeEnvelopeAad);
      decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
      const plain = Buffer.concat([
        decipher.update(Buffer.from(ciphertextPart, "base64url")),
        decipher.final(),
      ]).toString("utf8");
      if (!/^\d{4,8}$/.test(plain)) throw new Error("registration_verification_code_envelope_invalid");
      return plain;
    },
    seal(code: string) {
      if (!/^\d{4,8}$/.test(code)) throw new Error("registration_verification_code_invalid");
      const iv = randomBytes(12);
      const cipher = createCipheriv("aes-256-gcm", key, iv);
      cipher.setAAD(codeEnvelopeAad);
      const ciphertext = Buffer.concat([cipher.update(code, "utf8"), cipher.final()]);
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
