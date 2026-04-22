/**
 * Mock dataset for the internal Registration Funnel dashboard.
 *
 * Until we wire a real analytics warehouse, this file generates a deterministic,
 * realistic event stream so the dashboard can be designed and reviewed.
 *
 * Shape mirrors `registration_email_verification_failed` and `registration_email_verified`
 * payloads in `src/lib/analytics.ts` (the contract is the source of truth).
 */

export type FailureReason =
  | "INVALID_CODE"
  | "CODE_EXPIRED"
  | "TOO_MANY_ATTEMPTS"
  | "VERIFICATION_FAILED"
  | "SERVER_ERROR"
  | "NETWORK_ERROR";

export interface VerifyAttemptRecord {
  sessionId: string;
  outcome: "succeeded" | "failed";
  reason: FailureReason | null;
  enteredCodeLength: number; // 0..6
  isResend: boolean;
  attempt: number;
  /** ms since email_submitted */
  elapsedMs: number;
}

// Deterministic PRNG so the dashboard renders the same numbers on every load.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 800 verify attempts across ~480 sessions. Encodes the realistic patterns
 * we expect in production: most users succeed on attempt 1 with full code,
 * INVALID_CODE dominates failures, CODE_EXPIRED grows with elapsed time,
 * resends slightly hurt conversion, partial code length almost always fails.
 */
export function generateMockVerifyAttempts(): VerifyAttemptRecord[] {
  const rand = mulberry32(42);
  const out: VerifyAttemptRecord[] = [];
  const SESSIONS = 480;

  for (let s = 0; s < SESSIONS; s++) {
    const sessionId = `s_${s.toString(36)}`;
    let attempt = 0;
    let elapsedMs = 8_000 + Math.floor(rand() * 60_000);
    let isResend = false;

    // Each session does 1..4 attempts.
    const maxAttempts = 1 + Math.floor(rand() * 4);
    let succeeded = false;

    while (attempt < maxAttempts && !succeeded) {
      attempt += 1;

      // Code length distribution: 70% full 6 digits, 20% 5, 7% 4, 3% <=3.
      const lenRoll = rand();
      const enteredCodeLength =
        lenRoll < 0.7 ? 6 : lenRoll < 0.9 ? 5 : lenRoll < 0.97 ? 4 : Math.max(0, Math.floor(rand() * 4));

      // Success probability:
      //   - Only realistically possible with full 6 digits.
      //   - First try succeeds ~78% of the time; resends ~62%; later attempts decay.
      //   - CODE_EXPIRED chance grows with elapsedMs.
      const expiredChance = Math.min(0.35, elapsedMs / 600_000); // up to 35%
      let success = false;
      let reason: FailureReason | null = null;

      if (enteredCodeLength === 6) {
        const base = isResend ? 0.62 : 0.78 - (attempt - 1) * 0.12;
        success = rand() < Math.max(0.3, base);
      }

      if (!success) {
        const r = rand();
        if (r < expiredChance) reason = "CODE_EXPIRED";
        else if (r < expiredChance + 0.05) reason = "TOO_MANY_ATTEMPTS";
        else if (r < expiredChance + 0.07) reason = "SERVER_ERROR";
        else if (r < expiredChance + 0.08) reason = "NETWORK_ERROR";
        else if (r < expiredChance + 0.085) reason = "VERIFICATION_FAILED";
        else reason = "INVALID_CODE";
      }

      out.push({
        sessionId,
        outcome: success ? "succeeded" : "failed",
        reason: success ? null : reason,
        enteredCodeLength,
        isResend,
        attempt,
        elapsedMs,
      });

      if (success) {
        succeeded = true;
        break;
      }

      // Hard stops.
      if (reason === "TOO_MANY_ATTEMPTS" || reason === "VERIFICATION_FAILED") break;

      // 30% chance the user resends after a failure.
      if (rand() < 0.3) isResend = true;
      elapsedMs += 15_000 + Math.floor(rand() * 90_000);
    }
  }

  return out;
}
