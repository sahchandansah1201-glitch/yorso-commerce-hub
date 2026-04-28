import { Skeleton } from "@/components/ui/skeleton";

/**
 * MobileOfferCardSkeleton — placeholder с тем же вертикальным ритмом и
 * межстрочными интервалами, что и MobileOfferCard. Используется во время
 * загрузки данных каталога, чтобы при подмене реальной карточки на её
 * место не было сдвига layout (CLS): высота фото, gap между блоками,
 * line-height строк и внутренние отступы — идентичны живому компоненту.
 *
 * Зеркало стилей MobileOfferCard:
 *  - article: rounded-lg, border, gap-3 между фото и контентом
 *  - фото: aspect-[4/5] (как у нелоадед-состояния реальной карточки)
 *  - контент: gap-3 / px-4 pb-4 pt-2
 *  - цена: leading-6, шрифт text-lg
 *  - название: 2 строки leading-6, латин: leading-5 + mt-1
 *  - базис: leading-5
 *  - поставщик: border-t, pt-3
 */
const Line = ({
  className,
  height = "h-4",
}: {
  className?: string;
  height?: string;
}) => (
  <Skeleton
    className={`${height} rounded-md bg-muted/70 ${className ?? ""}`}
  />
);

export const MobileOfferCardSkeleton = () => {
  return (
    <article
      data-testid="catalog-offer-row-skeleton"
      aria-busy="true"
      aria-label="Загрузка карточки товара"
      className="group relative flex w-full min-w-0 max-w-full flex-col gap-3 overflow-hidden rounded-lg border border-border bg-card shadow-sm"
    >
      {/* 1. Photo placeholder — повторяет дефолтное соотношение, чтобы
            при загрузке не менялась высота. */}
      <div className="relative w-full overflow-hidden rounded-md bg-muted aspect-[4/5]">
        <Skeleton className="absolute inset-0 rounded-none bg-gradient-to-br from-muted via-muted/70 to-muted" />
        {/* origin badge placeholder */}
        <div className="absolute left-5 top-5 h-5 w-20 rounded-full bg-background/90 backdrop-blur-sm" />
      </div>

      {/* 2-5. Текстовый блок — точная копия ритма реальной карточки. */}
      <div className="flex min-w-0 flex-col gap-3 px-4 pb-4 pt-2">
        {/* Цена + тренд */}
        <div className="flex items-baseline gap-2 leading-6">
          {/* Сама цена: ширина ≈ "8,50 $ – 9,20 $" */}
          <Line height="h-5" className="w-32" />
          {/* "за кг" */}
          <Line height="h-3" className="w-10" />
          {/* trend chip */}
          <Line height="h-5" className="ml-auto w-14" />
        </div>

        {/* Название (2 строки) + латин */}
        <div className="min-w-0">
          {/* Заголовок: фиксируем 2 строки по leading-6 = 24px каждая,
              чтобы реальный текст после загрузки не сдвинул блок ниже. */}
          <div className="space-y-1.5">
            <Line height="h-4" className="w-[92%]" />
            <Line height="h-4" className="w-[64%]" />
          </div>
          {/* Латинское имя: mt-1 + leading-5 */}
          <div className="mt-1">
            <Line height="h-3" className="w-1/3" />
          </div>
        </div>

        {/* Базис поставки — одна строка leading-5 */}
        <div className="flex items-center gap-1.5 leading-5">
          <Skeleton className="h-3.5 w-3.5 rounded-sm bg-muted/70" />
          <Line height="h-3" className="w-10" />
          <Line height="h-3" className="w-40" />
        </div>

        {/* Поставщик — border-t pt-3, gap как в реальной карточке */}
        <div className="flex items-center gap-2 border-t border-border/60 pt-3">
          <Skeleton className="h-4 w-4 rounded-sm bg-muted/70" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Line height="h-3.5" className="w-2/3" />
            <Line height="h-3" className="w-1/4" />
          </div>
          <Skeleton className="h-3.5 w-3.5 rounded-sm bg-muted/70" />
        </div>
      </div>
    </article>
  );
};

export default MobileOfferCardSkeleton;
