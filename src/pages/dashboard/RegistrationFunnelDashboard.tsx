/**
 * Internal dashboard: Registration Funnel — failure breakdown.
 *
 * Not linked from public navigation. Designed for the growth/QA team to
 * answer two questions:
 *   1. WHY do users fail email verification? (reason split)
 *   2. WHICH user behaviours predict failure? (enteredCodeLength × isResend)
 *
 * Data source: deterministic mock generator in
 * `src/lib/registration-funnel-mock-data.ts`. Swap `useMemo` for a fetch when
 * a real warehouse export is available.
 */
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  generateMockVerifyAttempts,
  type FailureReason,
  type VerifyAttemptRecord,
} from "@/lib/registration-funnel-mock-data";

// ─── Helpers ────────────────────────────────────────────────────────────────

const REASON_COLORS: Record<FailureReason, string> = {
  INVALID_CODE: "hsl(var(--destructive))",
  CODE_EXPIRED: "hsl(var(--primary))",
  TOO_MANY_ATTEMPTS: "hsl(var(--accent))",
  VERIFICATION_FAILED: "hsl(var(--muted-foreground))",
  SERVER_ERROR: "hsl(var(--secondary-foreground))",
  NETWORK_ERROR: "hsl(var(--ring))",
};

const pct = (n: number, d: number) => (d === 0 ? "0.0%" : `${((n / d) * 100).toFixed(1)}%`);

// ─── Aggregations ───────────────────────────────────────────────────────────

function reasonBreakdown(events: VerifyAttemptRecord[]) {
  const failed = events.filter((e) => e.outcome === "failed");
  const totals = new Map<FailureReason, number>();
  for (const e of failed) {
    if (!e.reason) continue;
    totals.set(e.reason, (totals.get(e.reason) ?? 0) + 1);
  }
  const total = failed.length;
  return Array.from(totals.entries())
    .map(([reason, count]) => ({ reason, count, share: count / total }))
    .sort((a, b) => b.count - a.count);
}

function conversionByCodeLength(events: VerifyAttemptRecord[]) {
  const buckets = new Map<number, { total: number; success: number; invalid: number; expired: number }>();
  for (const e of events) {
    const b = buckets.get(e.enteredCodeLength) ?? { total: 0, success: 0, invalid: 0, expired: 0 };
    b.total += 1;
    if (e.outcome === "succeeded") b.success += 1;
    if (e.reason === "INVALID_CODE") b.invalid += 1;
    if (e.reason === "CODE_EXPIRED") b.expired += 1;
    buckets.set(e.enteredCodeLength, b);
  }
  return Array.from(buckets.entries())
    .map(([length, b]) => ({
      length,
      total: b.total,
      successRate: b.total ? (b.success / b.total) * 100 : 0,
      invalidRate: b.total ? (b.invalid / b.total) * 100 : 0,
      expiredRate: b.total ? (b.expired / b.total) * 100 : 0,
    }))
    .sort((a, b) => a.length - b.length);
}

function resendImpact(events: VerifyAttemptRecord[]) {
  const groups = [
    { key: "First try", filter: (e: VerifyAttemptRecord) => !e.isResend },
    { key: "After resend", filter: (e: VerifyAttemptRecord) => e.isResend },
  ];
  return groups.map(({ key, filter }) => {
    const slice = events.filter(filter);
    const success = slice.filter((e) => e.outcome === "succeeded").length;
    const invalid = slice.filter((e) => e.reason === "INVALID_CODE").length;
    const expired = slice.filter((e) => e.reason === "CODE_EXPIRED").length;
    return {
      cohort: key,
      attempts: slice.length,
      successRate: slice.length ? (success / slice.length) * 100 : 0,
      invalidRate: slice.length ? (invalid / slice.length) * 100 : 0,
      expiredRate: slice.length ? (expired / slice.length) * 100 : 0,
    };
  });
}

function reasonByResend(events: VerifyAttemptRecord[]) {
  const reasons: FailureReason[] = ["INVALID_CODE", "CODE_EXPIRED"];
  return reasons.map((reason) => {
    const firstTry = events.filter((e) => !e.isResend && e.reason === reason).length;
    const afterResend = events.filter((e) => e.isResend && e.reason === reason).length;
    return { reason, firstTry, afterResend };
  });
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function RegistrationFunnelDashboard() {
  const events = useMemo(() => generateMockVerifyAttempts(), []);

  const sessions = useMemo(() => new Set(events.map((e) => e.sessionId)).size, [events]);
  const successes = events.filter((e) => e.outcome === "succeeded").length;
  const failures = events.length - successes;
  const successfulSessions = useMemo(
    () => new Set(events.filter((e) => e.outcome === "succeeded").map((e) => e.sessionId)).size,
    [events],
  );

  const reasons = useMemo(() => reasonBreakdown(events), [events]);
  const byLength = useMemo(() => conversionByCodeLength(events), [events]);
  const byResend = useMemo(() => resendImpact(events), [events]);
  const reasonResend = useMemo(() => reasonByResend(events), [events]);

  return (
    <main className="min-h-screen bg-background px-6 py-10 md:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* ─── Header ─── */}
        <header className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Internal · Analytics
          </p>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Registration funnel — verification failures
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            Breakdown of <code className="rounded bg-muted px-1.5 py-0.5 text-sm">registration_email_verification_failed</code>{" "}
            by reason, cross-referenced with <code className="rounded bg-muted px-1.5 py-0.5 text-sm">enteredCodeLength</code>{" "}
            and <code className="rounded bg-muted px-1.5 py-0.5 text-sm">isResend</code>. Mock dataset.
          </p>
        </header>

        {/* ─── KPI tiles ─── */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Sessions observed", value: sessions.toLocaleString() },
            { label: "Verify attempts", value: events.length.toLocaleString() },
            {
              label: "Session success rate",
              value: pct(successfulSessions, sessions),
            },
            {
              label: "Attempt failure rate",
              value: pct(failures, events.length),
            },
          ].map((tile) => (
            <Card key={tile.label}>
              <CardHeader className="pb-2">
                <CardDescription>{tile.label}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-heading text-3xl font-bold text-foreground">{tile.value}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* ─── Reason split ─── */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Failure reason mix</CardTitle>
              <CardDescription>Share of {failures} failed attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reasons}
                      dataKey="count"
                      nameKey="reason"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {reasons.map((r) => (
                        <Cell key={r.reason} fill={REASON_COLORS[r.reason]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, _name, item) => [
                        `${value} (${pct(value, failures)})`,
                        item?.payload?.reason,
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>INVALID_CODE vs CODE_EXPIRED</CardTitle>
              <CardDescription>Counts split by first-try / after-resend</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reasonResend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="reason" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="firstTry" name="First try" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="afterResend" name="After resend" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ─── Code length conversion ─── */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Conversion by entered code length</CardTitle>
              <CardDescription>
                Success vs INVALID_CODE vs CODE_EXPIRED rates per code length (0..6).
                Below 6 digits is almost always a UX-driven failure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byLength}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="length"
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      label={{
                        value: "Entered code length",
                        position: "insideBottom",
                        offset: -4,
                        style: { fill: "hsl(var(--muted-foreground))", fontSize: 12 },
                      }}
                    />
                    <YAxis
                      unit="%"
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                      labelFormatter={(l) => `Length: ${l}`}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="successRate" name="Success" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="invalidRate" name="INVALID_CODE" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expiredRate" name="CODE_EXPIRED" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ─── Resend cohort table ─── */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Resend cohort comparison</CardTitle>
              <CardDescription>
                Does requesting a resend actually improve verification?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cohort</TableHead>
                    <TableHead className="text-right">Attempts</TableHead>
                    <TableHead className="text-right">Success</TableHead>
                    <TableHead className="text-right">INVALID_CODE</TableHead>
                    <TableHead className="text-right">CODE_EXPIRED</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byResend.map((row) => (
                    <TableRow key={row.cohort}>
                      <TableCell className="font-medium">{row.cohort}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.attempts}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.successRate.toFixed(1)}%</TableCell>
                      <TableCell className="text-right tabular-nums">{row.invalidRate.toFixed(1)}%</TableCell>
                      <TableCell className="text-right tabular-nums">{row.expiredRate.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        {/* ─── Reason details ─── */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>All failure reasons</CardTitle>
              <CardDescription>Raw counts and shares</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Share of failures</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reasons.map((r) => (
                    <TableRow key={r.reason}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="font-mono"
                          style={{ borderColor: REASON_COLORS[r.reason], color: REASON_COLORS[r.reason] }}
                        >
                          {r.reason}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{r.count}</TableCell>
                      <TableCell className="text-right tabular-nums">{(r.share * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        <footer className="pt-4 text-xs text-muted-foreground">
          Mock dataset generated deterministically (seed 42). Replace
          {" "}
          <code>generateMockVerifyAttempts()</code> with a warehouse fetch when ready.
        </footer>
      </div>
    </main>
  );
}
