import { useMemo, useState } from "react";
import { mockOffers } from "@/data/mockOffers";
import MobileOfferCard from "@/components/catalog/MobileOfferCard";
import { cn } from "@/lib/utils";

/**
 * Dev-only visual harness for inspecting the mobile offer card with a
 * deliberately mixed photo sequence (e.g. horizontal → vertical → horizontal).
 *
 * Activated by appending `?devPhotos=1` to /offers. Mounted only in dev or
 * when the flag is present; never shipped to production catalog UX.
 *
 * Uses picsum.photos with explicit width/height so the browser receives real
 * landscape and portrait JPEGs — same code path as a real upload, so the
 * orientation-detection in MobileOfferCard runs naturally.
 */

type Sequence = {
  id: string;
  label: string;
  images: string[];
};

// Stable seeds → repeatable images across reloads.
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
    id: "v-h-v",
    label: "В → Г → В",
    images: [
      "https://picsum.photos/seed/yorso-v2/800/1200",
      "https://picsum.photos/seed/yorso-h3/1200/800",
      "https://picsum.photos/seed/yorso-v3/800/1200",
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

const PhotoOrientationDevPanel = () => {
  const [seqId, setSeqId] = useState<string>(SEQUENCES[0].id);
  const seq = SEQUENCES.find((s) => s.id === seqId) ?? SEQUENCES[0];

  // Build a synthetic offer by cloning a real one and swapping images.
  const demoOffer = useMemo(() => {
    const base = mockOffers[0];
    return {
      ...base,
      id: `dev-photos-${seq.id}`,
      image: seq.images[0],
      images: seq.images,
      productName: `[DEV] ${seq.label} — ${base.productName}`,
    };
  }, [seq]);

  return (
    <section
      aria-label="Photo orientation dev panel"
      data-testid="dev-photo-orientation-panel"
      className="mt-4 rounded-lg border-2 border-dashed border-primary/60 bg-primary/5 p-3 sm:p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
          DEV
        </span>
        <h2 className="font-heading text-sm font-bold text-foreground">
          Проверка ориентации фото в мобильной карточке
        </h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Симулирует загрузку фото разной ориентации. Карточка ниже — мобильная,
        ширина зафиксирована 390px независимо от вьюпорта.
      </p>

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

      <div className="mt-4 flex justify-center">
        {/* Force the mobile breakpoint visually by constraining width. */}
        <div className="w-[390px] max-w-full">
          <MobileOfferCard
            key={seq.id}
            offer={demoOffer}
            isSelected={false}
            onSelect={() => {}}
          />
        </div>
      </div>
    </section>
  );
};

export default PhotoOrientationDevPanel;
