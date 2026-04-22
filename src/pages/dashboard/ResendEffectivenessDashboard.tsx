/**
 * Internal dashboard: Resend Effectiveness.
 *
 * Joins `registration_resend_code` (click) with `registration_resend_outcome`
 * (next verify attempt) to answer: does resending the OTP actually unblock users?
 *
 * Cross-tabs by `attemptsBeforeResend` (did the user even try the first code?)
 * and `msSinceLastResend` (are they spamming the button?).
 *
 * Data source: deterministic mock in `src/lib/registration-resend-mock-data.ts`.
 * Swap the `useMemo(generateMockResendEvents)` for a warehouse fetch when ready.
 */
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
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
import {
  generateMockResendEvents,
  statsByAttemptsBeforeResend,
  statsByMsSinceLastResend,
  successMatrix,
} from "@/lib/registration-resend-mock-data";

const OUTCOME_COLORS = {
  succeeded: "hsl(var(--primary))",
  failed: "hsl(var(--destructive))",
  no_attempt: "hsl(var(--muted-foreground))",
} as const;

const pct = (n: number, d: number) => (d === 0 ? "0.0%" : `${((n / d) * 100).toFixed(1)}%`);

/** Map a 0..100 success rate to a background color via design tokens. */
function heatBg(rate: number | null): string {
  if (rate === null) return "hsl(var(--muted) / 0.3)";
  // Lerp from destructive (0%) → muted (50%) → primary (100%).
  if (rate < 50) {
    return `hsl(var(--destructive) / ${(0.15 + (1 - rate / 50) * 0.35).toFixed(2)})`;
  }
  return `hsl(var(--primary) / ${(0.15 + ((rate - 50) / 50) * 0.45).toFixed(2)})`;
}

export default function ResendEffectivenessDashboard() {
  const records = useMemo(() => generateMockResendEvents(), []);

  const totalResends = records.length;
  const totalSessions = useMemo(() => new Set(records.map((r) => r.sessionId)).size, [records]);
  const succeeded = records.filter((r) => r.outcome === "succeeded").length;
  const failed = records.filter((r) => r.outcome === "failed").length;
  const noAttempt = records.filter((r) => r.outcome === "no_attempt").length;

  const outcomeMix = [
    { name: "Succeeded", value: succeeded, color: OUTCOME_COLORS.succeeded },
    { name: "Failed", value: failed, color: OUTCOME_COLORS.failed },
    { name: "No attempt", value: noAttempt, color: OUTCOME_COLORS.no_attempt },
  ];

  const byAttempts = useMemo(() => statsByAttemptsBeforeResend(records), [records]);
  const byTime = useMemo(() => statsByMsSinceLastResend(records), [records]);
  const matrix = useMemo(() => successMatrix(records), [records]);

  // resendIndex decay
  const decay = useMemo(() => {
    const buckets = new Map<number, { total: number; success: number }>();
    for (const r of records) {
      const key = r.resendIndex >= 4 ? 4 : r.resendIndex;
      const b = buckets.get(key) ?? { total: 0, success: 0 };
      b.total += 1;
      if (r.outcome === "succeeded") b.success += 1;
      buckets.set(key, b);
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a - b)
      .map(([idx, b]) => ({
        resendIndex: idx === 4 ? "4+" : String(idx),
        successRate: b.total ? (b.success / b.total) * 100 : 0,
        n: b.total,
      }));
  }, [records]);

  return (
    <main className="min-h-screen bg-background px-6 py-10 md:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* ─── Header ─── */}
        <header className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Internal · Analytics
          </p>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Resend effectiveness
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            Joins{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-sm">registration_resend_code</code>{" "}
            with{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-sm">registration_resend_outcome</code>{" "}
            and splits by{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-sm">attemptsBeforeResend</code> ×{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-sm">msSinceLastResend</code>{" "}
            to measure whether resending the OTP actually unblocks users. Mock dataset.
          </p>
        </header>

        {/* ─── KPI tiles ─── */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Sessions with ≥1 resend", value: totalSessions.toLocaleString() },
            { label: "Resend events", value: totalResends.toLocaleString() },
            { label: "Resend → success", value: pct(succeeded, totalResends) },
            { label: "Resend with no follow-up attempt", value: pct(noAttempt, totalResends) },
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

        {/* ─── Outcome donut + decay ─── */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Outcome of the next verify attempt</CardTitle>
              <CardDescription>One slice per resend ({totalResends} total)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={outcomeMix}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {outcomeMix.map((slice) => (
                        <Cell key={slice.name} fill={slice.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name) => [`${value} (${pct(value, totalResends)})`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Success rate by resendIndex</CardTitle>
              <CardDescription>How quickly does repeated resending decay?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={decay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="resendIndex" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis
                      unit="%"
                      domain={[0, 100]}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip
                      formatter={(value: number, _name, item) => [
                        `${value.toFixed(1)}% (n=${item?.payload?.n})`,
                        "Success rate",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="successRate"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ r: 5, fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ─── attemptsBeforeResend split ─── */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Split by attemptsBeforeResend</CardTitle>
              <CardDescription>
                Did the user actually try the original code first? Resends fired with 0 prior attempts
                often mean "never opened the email".
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byAttempts}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      unit="%"
                      domain={[0, 100]}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip
                      formatter={(value: number, name, item) => [
                        `${value.toFixed(1)}% (n=${item?.payload?.attempts})`,
                        name,
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="successRate" name="Success rate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="attemptRate" name="Any attempt rate" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>attemptsBeforeResend</TableHead>
                      <TableHead className="text-right">Resends</TableHead>
                      <TableHead className="text-right">Succeeded</TableHead>
                      <TableHead className="text-right">Failed</TableHead>
                      <TableHead className="text-right">No attempt</TableHead>
                      <TableHead className="text-right">Success rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byAttempts.map((row) => (
                      <TableRow key={row.label}>
                        <TableCell className="font-medium">{row.label}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.attempts}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.succeeded}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.failed}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.noAttempt}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">
                          {row.successRate.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ─── msSinceLastResend split ─── */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Split by msSinceLastResend</CardTitle>
              <CardDescription>
                Repeat resends only — measures whether spamming the button helps.
                Excludes the first resend in each session (no prior resend to compare).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis
                      unit="%"
                      domain={[0, 100]}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip
                      formatter={(value: number, name, item) => [
                        `${value.toFixed(1)}% (n=${item?.payload?.attempts})`,
                        name,
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="successRate" name="Success rate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ─── Heatmap matrix ─── */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Success rate matrix</CardTitle>
              <CardDescription>
                Rows: <code>attemptsBeforeResend</code>. Columns: time since last resend.
                Cells show success % and resend count.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Attempts \ Time</th>
                      {matrix[0]?.cells.map((c) => (
                        <th key={c.col} className="px-3 py-2 text-center font-medium text-muted-foreground">
                          {c.col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map((row) => (
                      <tr key={row.row}>
                        <td className="border-t border-border px-3 py-2 font-medium">{row.row}</td>
                        {row.cells.map((c) => (
                          <td
                            key={c.col}
                            className="border-t border-border px-3 py-2 text-center"
                            style={{ backgroundColor: heatBg(c.successRate) }}
                          >
                            {c.successRate === null ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              <div>
                                <div className="font-semibold tabular-nums text-foreground">
                                  {c.successRate.toFixed(0)}%
                                </div>
                                <div className="text-xs text-muted-foreground">n={c.n}</div>
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        <footer className="pt-4 text-xs text-muted-foreground">
          Mock dataset (seed 7). Replace <code>generateMockResendEvents()</code> with a warehouse
          fetch when the analytics export is wired.
        </footer>
      </div>
    </main>
  );
}
