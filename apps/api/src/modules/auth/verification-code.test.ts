import { describe, expect, it } from "vitest";
import {
  createRegistrationVerificationCodeCodec,
  RegistrationVerificationCodeIssuer,
} from "./verification-code.js";

describe("registration verification code policy", () => {
  it("issues per-request numeric codes with hashed storage secret and expiry", () => {
    let next = 42;
    const issuer = new RegistrationVerificationCodeIssuer({
      now: () => new Date("2026-05-29T12:00:00.000Z"),
      randomInt: () => next++,
      ttlSeconds: 300,
    });

    const first = issuer.issue();
    const second = issuer.issue();

    expect(first.code).toBe("000042");
    expect(second.code).toBe("000043");
    expect(first.secret).toMatch(/^sha256:[a-f0-9]{32}:[a-f0-9]{64}$/);
    expect(first.secret).not.toContain(first.code);
    expect(first.expiresAt.toISOString()).toBe("2026-05-29T12:05:00.000Z");
  });

  it("seals code material for backend-only delivery handoff", () => {
    const codec = createRegistrationVerificationCodeCodec("phase-2e-secret-key-32-bytes-minimum");

    const envelope = codec.seal("418293");

    expect(envelope).toMatch(/^v1:/);
    expect(envelope).not.toContain("418293");
    expect(codec.open(envelope)).toBe("418293");
    expect(() => createRegistrationVerificationCodeCodec("other-phase-2e-secret").open(envelope)).toThrow();
  });
});
