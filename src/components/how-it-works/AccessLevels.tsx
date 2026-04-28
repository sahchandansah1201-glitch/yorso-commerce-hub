import {
  EyeOff,
  UserCheck,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Minus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Access Levels & Gating
 *
 * Honest, three-state access model on /how-it-works.
 * No early hard paywall — value is shown before registration.
 *
 * States (canonical, do not rename in UI copy near platform behaviour):
 *   anonymous_locked
 *   registered_locked
 *   qualified_unlocked
 */

const reasons = [
  {
    title: "Protect supplier-sensitive data",
    body: "Pricing and supplier identity are commercial assets — not free traffic.",
  },
  {
    title: "Reduce low-intent price scraping",
    body: "Gating filters out automated extraction and tyre-kicking.",
  },
  {
    title: "Improve buyer quality",
    body: "Real procurement intent is rewarded with deeper access and richer workflow.",
  },
  {
    title: "Preserve marketplace trust",
    body: "Suppliers list more openly when they know who is looking and why.",
  },
  {
    title: "Unlock more useful workflow",
    body: "Comparison, RFQ history, follow-up and decision proof grow with access level.",
  },
];

type Cell = "yes" | "no" | "request";

interface Capability {
  label: string;
  anonymous: Cell;
  registered: Cell;
  qualified: Cell;
}

const capabilities: Capability[] = [
  { label: "Active marketplace proof", anonymous: "yes", registered: "yes", qualified: "yes" },
  { label: "Product & category examples", anonymous: "yes", registered: "yes", qualified: "yes" },
  { label: "Price ranges (locked exact price)", anonymous: "yes", registered: "yes", qualified: "yes" },
  { label: "Supplier stubs (no full identity)", anonymous: "yes", registered: "yes", qualified: "yes" },
  { label: "Request entry points", anonymous: "yes", registered: "yes", qualified: "yes" },

  { label: "Save, watchlist, follow suppliers", anonymous: "no", registered: "yes", qualified: "yes" },
  { label: "Compare offers side-by-side", anonymous: "no", registered: "yes", qualified: "yes" },
  { label: "Request price / supplier details", anonymous: "no", registered: "yes", qualified: "yes" },
  { label: "Send structured RFQ", anonymous: "no", registered: "yes", qualified: "yes" },

  { label: "Exact price visible", anonymous: "no", registered: "request", qualified: "yes" },
  { label: "Full supplier identity", anonymous: "no", registered: "request", qualified: "yes" },
  { label: "Richer supplier trust data", anonymous: "no", registered: "request", qualified: "yes" },
  { label: "Deeper intelligence & communication actions", anonymous: "no", registered: "request", qualified: "yes" },
  { label: "Procurement Decision Proof export", anonymous: "no", registered: "request", qualified: "yes" },
];

const cell = (c: Cell) => {
  if (c === "yes")
    return (
      <span className="inline-flex items-center gap-1 text-[hsl(var(--success))]">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span className="sr-only">Available</span>
      </span>
    );
  if (c === "request")
    return (
      <span className="inline-flex items-center gap-1 text-primary">
        <KeyRound className="h-3.5 w-3.5" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">on request</span>
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <Minus className="h-3.5 w-3.5" />
      <span className="sr-only">Not available</span>
    </span>
  );
};

interface LevelCardProps {
  icon: LucideIcon;
  badge: string;
  code: string;
  title: string;
  body: string;
  bullets: string[];
  tone: "muted" | "primary" | "success";
}

const toneRing: Record<LevelCardProps["tone"], string> = {
  muted: "ring-border",
  primary: "ring-primary/30",
  success: "ring-[hsl(var(--success))]/30",
};
const toneBadge: Record<LevelCardProps["tone"], string> = {
  muted: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
};

const LevelCard = ({ icon: Icon, badge, code, title, body, bullets, tone }: LevelCardProps) => (
  <article
    className={`flex h-full flex-col rounded-xl border border-border bg-card p-5 ring-1 ${toneRing[tone]} md:p-6`}
  >
    <header className="flex items-center justify-between gap-2">
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${toneBadge[tone]}`}
      >
        <Icon className="h-3 w-3" />
        {badge}
      </span>
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
        {code}
      </code>
    </header>
    <h3 className="mt-3 font-heading text-base font-bold text-foreground md:text-lg">{title}</h3>
    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
    <ul className="mt-4 space-y-1.5 text-xs text-foreground/85">
      {bullets.map((b) => (
        <li key={b} className="flex gap-2">
          <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
          <span>{b}</span>
        </li>
      ))}
    </ul>
  </article>
);

const AccessLevels = () => {
  return (
    <section
      id="access-levels"
      aria-label="Access levels"
      className="border-b border-border bg-background py-16 md:py-24"
    >
      <div className="container max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Access levels
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Access is gated for a reason — and value is visible before signup.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Yorso uses three honest access states. Anyone can see active marketplace proof and
            product context. Exact price and full supplier identity unlock together — never one
            without the other.
          </p>
        </div>

        {/* Why gating exists */}
        <div className="mt-10 grid gap-2 md:grid-cols-5">
          {reasons.map((r) => (
            <div key={r.title} className="rounded-lg border border-border bg-card p-3">
              <p className="text-[11px] font-bold leading-tight text-foreground">{r.title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{r.body}</p>
            </div>
          ))}
        </div>

        {/* 3 level cards */}
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <LevelCard
            tone="muted"
            icon={EyeOff}
            badge="Anonymous"
            code="anonymous_locked"
            title="See the marketplace before committing."
            body="Browse without an account. Real proof, no hard paywall."
            bullets={[
              "Active marketplace proof",
              "Product & category examples",
              "Price ranges (exact price locked)",
              "Supplier stubs without full identity",
              "Request entry points",
            ]}
          />
          <LevelCard
            tone="primary"
            icon={UserCheck}
            badge="Registered"
            code="registered_locked"
            title="Save, compare, watch, request."
            body="Free buyer account unlocks the workspace, but exact price and supplier identity stay protected until access is requested."
            bullets={[
              "Save, watchlist, follow suppliers",
              "Compare offers side-by-side",
              "Request access to exact price / supplier details",
              "Send structured RFQs",
              "Build a shortlist with your team",
            ]}
          />
          <LevelCard
            tone="success"
            icon={Lock}
            badge="Qualified"
            code="qualified_unlocked"
            title="Full deal context, supplier identity included."
            body="Once price access is granted, supplier identity unlocks together with it — never separately."
            bullets={[
              "Exact price visible",
              "Full supplier identity",
              "Richer supplier trust data",
              "Deeper intelligence & communication actions",
              "Export Procurement Decision Proof",
            ]}
          />
        </div>

        {/* Capability matrix */}
        <div className="mt-10 overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border bg-background/60 px-5 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Capability matrix
            </p>
            <h3 className="font-heading text-sm font-bold text-foreground">
              What is available at each access level
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-background/40 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Capability</th>
                  <th className="px-4 py-3 text-center">Anonymous</th>
                  <th className="px-4 py-3 text-center">Registered</th>
                  <th className="px-4 py-3 text-center">Qualified</th>
                </tr>
              </thead>
              <tbody>
                {capabilities.map((row) => (
                  <tr
                    key={row.label}
                    className="border-b border-border/60 last:border-0 hover:bg-background/40"
                  >
                    <td className="px-4 py-2.5 text-foreground/85">{row.label}</td>
                    <td className="px-4 py-2.5 text-center">{cell(row.anonymous)}</td>
                    <td className="px-4 py-2.5 text-center">{cell(row.registered)}</td>
                    <td className="px-4 py-2.5 text-center">{cell(row.qualified)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border bg-background/60 px-5 py-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-[hsl(var(--success))]" /> available
            </span>
            <span className="inline-flex items-center gap-1">
              <KeyRound className="h-3 w-3 text-primary" /> on request — supplier identity unlocks with price
            </span>
            <span className="inline-flex items-center gap-1">
              <Minus className="h-3 w-3" /> not available
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AccessLevels;
