import { EyeOff, UserCheck, KeyRound, ShieldCheck, CheckCircle2, Lock, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useHowItWorks } from "@/i18n/how-it-works";

type Cell = "yes" | "no" | "request";
const CAPS: { anonymous: Cell; registered: Cell; qualified: Cell }[] = [
  { anonymous: "yes", registered: "yes", qualified: "yes" },
  { anonymous: "yes", registered: "yes", qualified: "yes" },
  { anonymous: "yes", registered: "yes", qualified: "yes" },
  { anonymous: "yes", registered: "yes", qualified: "yes" },
  { anonymous: "yes", registered: "yes", qualified: "yes" },
  { anonymous: "no", registered: "yes", qualified: "yes" },
  { anonymous: "no", registered: "yes", qualified: "yes" },
  { anonymous: "no", registered: "yes", qualified: "yes" },
  { anonymous: "no", registered: "yes", qualified: "yes" },
  { anonymous: "no", registered: "request", qualified: "yes" },
  { anonymous: "no", registered: "request", qualified: "yes" },
  { anonymous: "no", registered: "request", qualified: "yes" },
  { anonymous: "no", registered: "request", qualified: "yes" },
  { anonymous: "no", registered: "request", qualified: "yes" },
];

const AccessLevels = () => {
  const t = useHowItWorks();

  const cell = (c: Cell) => {
    if (c === "yes") return <span className="inline-flex items-center gap-1 text-[hsl(var(--success))]"><CheckCircle2 className="h-3.5 w-3.5" /><span className="sr-only">{t.al_legend_available}</span></span>;
    if (c === "request") return <span className="inline-flex items-center gap-1 text-primary"><KeyRound className="h-3.5 w-3.5" /><span className="text-[10px] font-semibold uppercase tracking-wider">{t.al_cell_onRequest}</span></span>;
    return <span className="inline-flex items-center gap-1 text-muted-foreground"><Minus className="h-3.5 w-3.5" /><span className="sr-only">{t.al_legend_unavailable}</span></span>;
  };

  const LevelCard = ({ icon: Icon, badge, code, title, body, bullets, tone }: { icon: LucideIcon; badge: string; code: string; title: string; body: string; bullets: string[]; tone: "muted" | "primary" | "success" }) => {
    const ring = { muted: "ring-border", primary: "ring-primary/30", success: "ring-[hsl(var(--success))]/30" }[tone];
    const badgeCls = { muted: "bg-muted text-muted-foreground", primary: "bg-primary/10 text-primary", success: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" }[tone];
    return (
      <article className={`flex h-full flex-col rounded-xl border border-border bg-card p-5 ring-1 ${ring} md:p-6`}>
        <header className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeCls}`}>
            <Icon className="h-3 w-3" />{badge}
          </span>
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{code}</code>
        </header>
        <h3 className="mt-3 font-heading text-base font-bold text-foreground md:text-lg">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
        <ul className="mt-4 space-y-1.5 text-xs text-foreground/85">
          {bullets.map((b) => <li key={b} className="flex gap-2"><span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-foreground/40" /><span>{b}</span></li>)}
        </ul>
      </article>
    );
  };

  return (
    <section id="access-levels" aria-label={t.al_eyebrow} className="border-b border-border bg-background py-16 md:py-24">
      <div className="container max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t.al_eyebrow}
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">{t.al_title}</h2>
          <p className="mt-3 text-muted-foreground">{t.al_subtitle}</p>
        </div>

        <div className="mt-10 grid gap-2 md:grid-cols-5">
          {t.al_reasons.map((r) => (
            <div key={r.title} className="rounded-lg border border-border bg-card p-3">
              <p className="text-[11px] font-bold leading-tight text-foreground">{r.title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{r.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <LevelCard tone="muted" icon={EyeOff} badge={t.al_card_anonymous.badge} code="anonymous_locked" title={t.al_card_anonymous.title} body={t.al_card_anonymous.body} bullets={t.al_card_anonymous.bullets} />
          <LevelCard tone="primary" icon={UserCheck} badge={t.al_card_registered.badge} code="registered_locked" title={t.al_card_registered.title} body={t.al_card_registered.body} bullets={t.al_card_registered.bullets} />
          <LevelCard tone="success" icon={Lock} badge={t.al_card_qualified.badge} code="qualified_unlocked" title={t.al_card_qualified.title} body={t.al_card_qualified.body} bullets={t.al_card_qualified.bullets} />
        </div>

        <div className="mt-10 overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border bg-background/60 px-5 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t.al_matrix_eyebrow}</p>
            <h3 className="font-heading text-sm font-bold text-foreground">{t.al_matrix_title}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-background/40 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">{t.al_th_capability}</th>
                  <th className="px-4 py-3 text-center">{t.al_th_anonymous}</th>
                  <th className="px-4 py-3 text-center">{t.al_th_registered}</th>
                  <th className="px-4 py-3 text-center">{t.al_th_qualified}</th>
                </tr>
              </thead>
              <tbody>
                {t.al_capabilities.map((row, i) => {
                  const c = CAPS[i] ?? CAPS[0];
                  return (
                    <tr key={row.label} className="border-b border-border/60 last:border-0 hover:bg-background/40">
                      <td className="px-4 py-2.5 text-foreground/85">{row.label}</td>
                      <td className="px-4 py-2.5 text-center">{cell(c.anonymous)}</td>
                      <td className="px-4 py-2.5 text-center">{cell(c.registered)}</td>
                      <td className="px-4 py-2.5 text-center">{cell(c.qualified)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border bg-background/60 px-5 py-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-[hsl(var(--success))]" /> {t.al_legend_available}</span>
            <span className="inline-flex items-center gap-1"><KeyRound className="h-3 w-3 text-primary" /> {t.al_legend_request}</span>
            <span className="inline-flex items-center gap-1"><Minus className="h-3 w-3" /> {t.al_legend_unavailable}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AccessLevels;
