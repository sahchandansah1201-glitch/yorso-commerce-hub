import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { pulseInt } from "@/lib/pulse-seed";

interface Props {
  offerId: string;
  variant?: "viewing" | "requests";
  className?: string;
}

/**
 * "Живая" метка активности на карточке оффера. Стартовое число
 * детерминировано по offerId (стабильный SSR/первичный рендер), а далее
 * каждые несколько секунд слегка дрейфует ±1 и иногда «гаснет» (зрители
 * ушли) на короткое время, после чего снова появляется. Это имитация —
 * метка `title` явно сообщает, что это оценка платформы, не live-сигнал.
 */
const PulseBadge = ({ offerId, variant = "viewing", className }: Props) => {
  const { t } = useLanguage();

  const min = variant === "viewing" ? 2 : 1;
  const max = variant === "viewing" ? 9 : 5;
  const seedSalt = variant === "viewing" ? "view" : "req";

  const [count, setCount] = useState(() => pulseInt(offerId, seedSalt, min, max));
  const [visible, setVisible] = useState(true);
  const tickRef = useRef(0);

  useEffect(() => {
    // Каждой карточке — свой ритм, чтобы не «дышали» синхронно.
    const period = 3500 + pulseInt(offerId, "period", 0, 2500);

    const id = window.setInterval(() => {
      tickRef.current += 1;
      const tick = tickRef.current;

      // Псевдослучайный шаг на основе offerId + tick.
      const step = pulseInt(offerId, `tick-${tick}`, 0, 9);

      // ~12% шанс «исчезновения» (зрители ушли) на 1 цикл.
      if (visible && step === 0) {
        setVisible(false);
        return;
      }

      if (!visible) {
        // Возвращаемся с обновлённым числом.
        const fresh = pulseInt(offerId, `return-${tick}`, min, max);
        setCount(fresh);
        setVisible(true);
        return;
      }

      // Иначе — дрейф ±1 в пределах [min..max].
      setCount((prev) => {
        const delta = step < 4 ? -1 : step < 8 ? +1 : 0;
        const next = prev + delta;
        if (next < min) return min;
        if (next > max) return max;
        return next;
      });
    }, period);

    return () => window.clearInterval(id);
  }, [offerId, min, max, visible]);

  if (!visible) return null;

  const tpl = variant === "viewing" ? t.pulse_viewing : t.pulse_requests;
  const label = tpl.replace("{n}", String(count));

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success transition-opacity duration-500 ${className ?? ""}`}
      data-testid="pulse-badge"
      title={t.pulse_estimate}
    >
      <span className="relative flex h-1.5 w-1.5" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
      </span>
      <span>{label}</span>
    </span>
  );
};

export default PulseBadge;
