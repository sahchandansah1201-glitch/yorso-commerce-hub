/**
 * Mock dataset for the Resend Effectiveness dashboard.
 *
 * Shape mirrors `registration_resend_code` (the click) and
 * `registration_resend_outcome` (the verify attempt that follows it) in
 * `src/lib/analytics.ts`. One record = one resend click joined to its outcome
 * (or null outcome if the user never tried again).
 */

export type ResendOutcome = "succeeded" | "failed" | "no_attempt";

export type FailureReason =
  | "INVALID_CODE"
  | "CODE_EXPIRED"
  | "TOO_MANY_ATTEMPTS"
  | "VERIFICATION_FAILED"
  | "SERVER_ERROR"
  | "NETWORK_ERROR";

export interface ResendRecord {
  sessionId: string;
  /** 1-based index of the resend within the session. */
  resendIndex: number;
  /** Failed verify attempts before this resend (0 = user resent before trying). */
  attemptsBeforeResend: number;
  /** ms since email_submitted at the moment of the resend click. */
  msSinceEmailSubmitted: number;
  /** ms since the previous resend (null on the first resend). */
  msSinceLastResend: number | null;
  /** Outcome of the first verify attempt after this resend. */
  outcome: ResendOutcome;
  /** Failure reason when outcome === "failed". */
  reason: FailureReason | null;
  /** ms between the resend click and the verify attempt that followed. */
  msFromResendToAttempt: number | null;
}

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
 * Generates ~520 resend events across ~360 sessions. Encoded patterns:
 *   - Most resends happen after 1–2 failed attempts.
 *   - Resends fired BEFORE any attempt (attemptsBeforeResend=0) are common
 *     for users who never opened the email — outcome often "no_attempt".
 *   - Resending too quickly (<5s) doesn't help; resending after >120s helps
 *     most because the new code arrives fresh.
 *   - Repeated resends (resendIndex>=3) decay sharply.
 */
export function generateMockResendEvents(): ResendRecord[] {
  const rand = mulberry32(7);
  const out: ResendRecord[] = [];
  const SESSIONS = 360;

  for (let s = 0; s < SESSIONS; s++) {
    const sessionId = `s_${s.toString(36)}`;
    // 60% sessions resend 1x, 25% 2x, 12% 3x, 3% 4x.
    const r = rand();
    const resends = r < 0.6 ? 1 : r < 0.85 ? 2 : r < 0.97 ? 3 : 4;

    let attemptsBeforeResend = 0;
    let msSinceEmailSubmitted = 10_000 + Math.floor(rand() * 90_000);
    let msSinceLastResend: number | null = null;

    for (let i = 1; i <= resends; i++) {
      // attemptsBeforeResend distribution: 0 (35%), 1 (35%), 2 (20%), 3+ (10%)
      const aRoll = rand();
      const attemptsAdd = aRoll < 0.35 ? 0 : aRoll < 0.7 ? 1 : aRoll < 0.9 ? 2 : 3;
      attemptsBeforeResend += attemptsAdd;

      // msFromResendToAttempt — most users try within 5–60s of the resend.
      const f = rand();
      const msFromResendToAttempt =
        f < 0.15 ? null : // user gave up
        f < 0.4 ? 2_000 + Math.floor(rand() * 4_000) : // <5s — impatient
        f < 0.85 ? 5_000 + Math.floor(rand() * 55_000) : // 5–60s — typical
        60_000 + Math.floor(rand() * 240_000); // >60s — slow

      // Success probability:
      //   - null msFromResendToAttempt → "no_attempt"
      //   - resending too fast (<5s) hurts (new code may not have arrived) ~40%
      //   - typical window (5–60s) helps ~70%
      //   - long wait (>60s) ~78% (fresh code, fresh focus)
      //   - decays with resendIndex: -10% per resend after the first
      let outcome: ResendOutcome;
      let reason: FailureReason | null = null;

      if (msFromResendToAttempt === null) {
        outcome = "no_attempt";
      } else {
        const indexPenalty = (i - 1) * 0.1;
        const base =
          msFromResendToAttempt < 5_000 ? 0.4 :
          msFromResendToAttempt < 60_000 ? 0.7 :
          0.78;
        const successProb = Math.max(0.2, base - indexPenalty);
        if (rand() < successProb) {
          outcome = "succeeded";
        } else {
          outcome = "failed";
          const rr = rand();
          reason =
            rr < 0.55 ? "INVALID_CODE" :
            rr < 0.85 ? "CODE_EXPIRED" :
            rr < 0.93 ? "TOO_MANY_ATTEMPTS" :
            rr < 0.97 ? "SERVER_ERROR" :
            "NETWORK_ERROR";
        }
      }

      out.push({
        sessionId,
        resendIndex: i,
        attemptsBeforeResend,
        msSinceEmailSubmitted,
        msSinceLastResend,
        outcome,
        reason,
        msFromResendToAttempt,
      });

      // Advance time for next resend in the same session.
      const gap = 20_000 + Math.floor(rand() * 180_000);
      msSinceLastResend = gap;
      msSinceEmailSubmitted += gap;
      if (outcome === "succeeded") break; // session done
    }
  }

  return out;
}

// ─── Aggregations shared with the dashboard ─────────────────────────────────

export interface CohortStats {
  label: string;
  attempts: number;
  succeeded: number;
  failed: number;
  noAttempt: number;
  successRate: number; // % of resends that led to a success
  attemptRate: number; // % of resends that led to ANY verify attempt
}

function summarise(label: string, slice: ResendRecord[]): CohortStats {
  const succeeded = slice.filter((r) => r.outcome === "succeeded").length;
  const failed = slice.filter((r) => r.outcome === "failed").length;
  const noAttempt = slice.filter((r) => r.outcome === "no_attempt").length;
  const attempts = slice.length;
  return {
    label,
    attempts,
    succeeded,
    failed,
    noAttempt,
    successRate: attempts ? (succeeded / attempts) * 100 : 0,
    attemptRate: attempts ? ((succeeded + failed) / attempts) * 100 : 0,
  };
}

/** Bucket by `attemptsBeforeResend`: 0, 1, 2, 3+. */
export function statsByAttemptsBeforeResend(records: ResendRecord[]): CohortStats[] {
  const buckets: Array<{ label: string; pred: (r: ResendRecord) => boolean }> = [
    { label: "0 (resend before trying)", pred: (r) => r.attemptsBeforeResend === 0 },
    { label: "1", pred: (r) => r.attemptsBeforeResend === 1 },
    { label: "2", pred: (r) => r.attemptsBeforeResend === 2 },
    { label: "3+", pred: (r) => r.attemptsBeforeResend >= 3 },
  ];
  return buckets.map(({ label, pred }) => summarise(label, records.filter(pred)));
}

/** Bucket by `msSinceLastResend` for resendIndex >= 2 (where it's defined). */
export function statsByMsSinceLastResend(records: ResendRecord[]): CohortStats[] {
  const repeats = records.filter((r) => r.msSinceLastResend !== null);
  const buckets: Array<{ label: string; pred: (r: ResendRecord) => boolean }> = [
    { label: "<30s", pred: (r) => (r.msSinceLastResend ?? 0) < 30_000 },
    { label: "30–60s", pred: (r) => (r.msSinceLastResend ?? 0) >= 30_000 && (r.msSinceLastResend ?? 0) < 60_000 },
    { label: "1–2m", pred: (r) => (r.msSinceLastResend ?? 0) >= 60_000 && (r.msSinceLastResend ?? 0) < 120_000 },
    { label: "2–5m", pred: (r) => (r.msSinceLastResend ?? 0) >= 120_000 && (r.msSinceLastResend ?? 0) < 300_000 },
    { label: ">5m", pred: (r) => (r.msSinceLastResend ?? 0) >= 300_000 },
  ];
  return buckets.map(({ label, pred }) => summarise(label, repeats.filter(pred)));
}

/** Combined matrix: rows = attemptsBeforeResend bucket, cols = msSinceLastResend bucket. */
export function successMatrix(records: ResendRecord[]) {
  const attemptBuckets = [
    { key: "0", pred: (r: ResendRecord) => r.attemptsBeforeResend === 0 },
    { key: "1", pred: (r: ResendRecord) => r.attemptsBeforeResend === 1 },
    { key: "2", pred: (r: ResendRecord) => r.attemptsBeforeResend === 2 },
    { key: "3+", pred: (r: ResendRecord) => r.attemptsBeforeResend >= 3 },
  ];
  const timeBuckets = [
    { key: "first", pred: (r: ResendRecord) => r.msSinceLastResend === null },
    { key: "<30s", pred: (r: ResendRecord) => (r.msSinceLastResend ?? -1) >= 0 && (r.msSinceLastResend ?? 0) < 30_000 },
    { key: "30s–2m", pred: (r: ResendRecord) => (r.msSinceLastResend ?? 0) >= 30_000 && (r.msSinceLastResend ?? 0) < 120_000 },
    { key: ">2m", pred: (r: ResendRecord) => (r.msSinceLastResend ?? 0) >= 120_000 },
  ];
  return attemptBuckets.map(({ key: row, pred: rowPred }) => ({
    row,
    cells: timeBuckets.map(({ key: col, pred: colPred }) => {
      const slice = records.filter((r) => rowPred(r) && colPred(r));
      const succeeded = slice.filter((r) => r.outcome === "succeeded").length;
      return {
        col,
        n: slice.length,
        successRate: slice.length ? (succeeded / slice.length) * 100 : null,
      };
    }),
  }));
}
