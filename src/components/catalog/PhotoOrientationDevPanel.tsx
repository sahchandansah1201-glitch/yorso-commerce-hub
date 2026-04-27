import { useEffect, useMemo, useRef, useState } from "react";
import { mockOffers } from "@/data/mockOffers";
import MobileOfferCard from "@/components/catalog/MobileOfferCard";
import { cn } from "@/lib/utils";

/**
 * Dev-only visual harness for /offers?devPhotos=1.
 *
 * Two checks in one panel:
 *  1. Photo orientation handling (H, V, mixed) on the mobile card.
 *  2. Responsive peek-of-next at fixed widths 320 / 375 / 414 / 600 / 768 px,
 *     with an in-page measurement that compares the actual rendered peek
 *     against the breakpoint table:
 *       <360 → 8 %, 360–479 → 10 %, 480–639 → 12 %, ≥640 → 14 %.
 *
 * The harness is mounted only when the URL has `?devPhotos=1`. It never
 * ships in real catalog UX.
 */

type Sequence = { id: string; label: string; images: string[] };

const SEQUENCES: Sequence[] = [
  {
    id: "h-v-h",
    label: "Г → В → Г",
    images: [
      "https://picsum.photos/seed/yorso-h1/1200/800",
      "https://picsum.photos/seed/yorso-v1/800/1200",
      "https://picsum.photos/seed/yorso-h2/1200/800",
    ],
  },
  {
    id: "all-h",
    label: "Все горизонт.",
    images: [
      "https://picsum.photos/seed/yorso-h4/1200/800",
      "https://picsum.photos/seed/yorso-h5/1200/800",
      "https://picsum.photos/seed/yorso-h6/1200/800",
    ],
  },
  {
    id: "all-v",
    label: "Все вертикал.",
    images: [
      "https://picsum.photos/seed/yorso-v4/800/1200",
      "https://picsum.photos/seed/yorso-v5/800/1200",
      "https://picsum.photos/seed/yorso-v6/800/1200",
    ],
  },
];

// Mirrors the breakpoint table in MobileOfferCard.tsx — kept here as the
// "expected" oracle for the measurement step.
const expectedPeekFraction = (w: number): number =>
  w >= 640 ? 0.14 : w >= 480 ? 0.12 : w >= 360 ? 0.1 : 0.08;

const WIDTHS = [320, 375, 414, 600, 768];

type Measurement = {
  width: number;
  expectedPct: number;
  actualPct: number | null;
  pass: boolean | null;
};

const PhotoOrientationDevPanel = () => {
  const [seqId, setSeqId] = useState(SEQUENCES[0].id);
  const [width, setWidth] = useState<number>(375);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const cardWrapRef = useRef<HTMLDivElement>(null);

  const seq = SEQUENCES.find((s) => s.id === seqId) ?? SEQUENCES[0];

  const demoOffer = useMemo(() => {
    const base = mockOffers[0];
    return {
      ...base,
      id: `dev-photos-${seq.id}-${width}`,
      image: seq.images[0],
      images: seq.images,
      productName: `[DEV ${width}px] ${seq.label} — ${base.productName}`,
    };
  }, [seq, width]);

  // Find the gallery scroller inside the rendered card and measure the
  // first slide's width relative to the scroller. peek = 1 - slideWidth/scrollerWidth.
  const measureCurrent = (): Measurement => {
    const wrap = cardWrapRef.current;
    const expected = expectedPeekFraction(width);
    const fallback: Measurement = {
      width,
      expectedPct: +(expected * 100).toFixed(2),
      actualPct: null,
      pass: null,
    };
    if (!wrap) return fallback;
    // Scroller = first horizontally-scrollable flex container inside the card.
    const scroller = wrap.querySelector<HTMLElement>(
      ".overflow-x-auto.snap-x",
    );
    const firstSlide = scroller?.firstElementChild as HTMLElement | null;
    if (!scroller || !firstSlide) return fallback;
    const sw = scroller.clientWidth;
    const slideW = firstSlide.getBoundingClientRect().width;
    if (sw <= 0) return fallback;
    const actual = 1 - slideW / sw;
    const pass = Math.abs(actual - expected) < 0.005; // <0.5 pp tolerance
    return {
      width,
      expectedPct: +(expected * 100).toFixed(2),
      actualPct: +(actual * 100).toFixed(2),
      pass,
    };
  };

  const handleMeasure = () => {
    const m = measureCurrent();
    setMeasurements((prev) => {
      const filtered = prev.filter((p) => p.width !== m.width);
      return [...filtered, m].sort((a, b) => a.width - b.width);
    });
  };

  const handleMeasureAll = async () => {
    const results: Measurement[] = [];
    for (const w of WIDTHS) {
      setWidth(w);
      // Two animation frames: one for React commit, one for ResizeObserver
      // + the 120ms width transition + settle. 200ms is comfortable.
      await new Promise((r) => setTimeout(r, 220));
      results.push(measureCurrent());
    }
    setMeasurements(results);
  };

  // Re-measure on width change so the live card always shows a current value.
  useEffect(() => {
    const t = setTimeout(handleMeasure, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, seqId]);

  return (
    <section
      aria-label="Photo orientation + peek dev panel"
      data-testid="dev-photo-orientation-panel"
      className="mt-4 rounded-lg border-2 border-dashed border-primary/60 bg-primary/5 p-3 sm:p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
          DEV
        </span>
        <h2 className="font-heading text-sm font-bold text-foreground">
          Карточка: ориентация фото + responsive peek
        </h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Эталон peek по ширине контейнера: &lt;360→8%, 360–479→10%,
        480–639→12%, ≥640→14%.
      </p>

      {/* Sequence picker */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {SEQUENCES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSeqId(s.id)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
              s.id === seqId
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary/60",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Width picker */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">
          Ширина:
        </span>
        {WIDTHS.map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => setWidth(w)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-mono transition-colors",
              w === width
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary/60",
            )}
          >
            {w}px
          </button>
        ))}
        <button
          type="button"
          onClick={handleMeasureAll}
          className="ml-2 rounded-md border border-primary bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Замерить все
        </button>
      </div>

      {/* Live card preview at fixed width */}
      <div className="mt-4 flex justify-center overflow-x-auto">
        <div
          ref={cardWrapRef}
          style={{ width: `${width}px` }}
          className="shrink-0 transition-[width] duration-150"
        >
          <MobileOfferCard
            key={`${seq.id}-${width}`}
            offer={demoOffer}
            isSelected={false}
            onSelect={() => {}}
          />
        </div>
      </div>

      {/* Measurement table */}
      {measurements.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-md border border-border bg-card">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                <th className="px-3 py-1.5 font-semibold">Ширина</th>
                <th className="px-3 py-1.5 font-semibold">Эталон peek</th>
                <th className="px-3 py-1.5 font-semibold">Замер peek</th>
                <th className="px-3 py-1.5 font-semibold">Δ</th>
                <th className="px-3 py-1.5 font-semibold">Статус</th>
              </tr>
            </thead>
            <tbody>
              {measurements.map((m) => {
                const delta =
                  m.actualPct !== null
                    ? +(m.actualPct - m.expectedPct).toFixed(2)
                    : null;
                return (
                  <tr key={m.width} className="border-t border-border/60">
                    <td className="px-3 py-1.5 font-mono">{m.width}px</td>
                    <td className="px-3 py-1.5 font-mono">{m.expectedPct}%</td>
                    <td className="px-3 py-1.5 font-mono">
                      {m.actualPct !== null ? `${m.actualPct}%` : "—"}
                    </td>
                    <td className="px-3 py-1.5 font-mono">
                      {delta !== null
                        ? `${delta > 0 ? "+" : ""}${delta} pp`
                        : "—"}
                    </td>
                    <td className="px-3 py-1.5">
                      {m.pass === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : m.pass ? (
                        <span className="font-semibold text-primary">
                          ✅ OK
                        </span>
                      ) : (
                        <span className="font-semibold text-destructive">
                          ❌ FAIL
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default PhotoOrientationDevPanel;
