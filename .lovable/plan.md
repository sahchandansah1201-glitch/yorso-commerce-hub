# Строка поставщика: сначала фото (/suppliers, ProcurementSupplierRow)

Это проект, а не реализация. Правки в локальной копии вносит Codex. Готовность подтверждается только снимками экрана.

## Макет

```text
1280 (рабочая ширина ~816):
┌──────────────────────────────────────────────────────────────┐
│ 🇳🇴 Поставщик · Норвегия                  [В каталог · 10 →] [☆] │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                  │
│ │  фото  │ │  фото  │ │  фото  │ │  фото  │  ширина ячейки ≈184, 4:3 │
│ └────────┘ └────────┘ └────────┘ └────────┘                  │
└──────────────────────────────────────────────────────────────┘
390 (рабочая ширина ~358):
│ 🇳🇴 Поставщик · Норвегия          [☆] │
│ [фото][фото][фото]  ячейка ≈112, 4:3 │
│ [ В каталог · 10 →  (на всю ширину, 44) ] │
```

Почему такая раскладка:
- Сетка с колонками `repeat(N, minmax(0, 184px))` выравнивается по левому краю. При 1–2 фото пустых ячеек нет, а ячейки не растягиваются до огромных размеров.
- Пропорция 4:3 и `object-contain` на фоне `bg-muted` дают ровные ячейки без обрезки кадра. Цена этого — полосы по краям у фото с другими пропорциями.
- Шапка в одну строку экономит высоту: строка на компьютере занимает примерно 200 px вместо примерно 260 px сейчас.
- Подписей нет, это решение участников. Название товара доступно через `alt`, `aria-label` и `title`.

## Код (JSX/Tailwind)

```tsx
const MAX = { desktop: 4, mobile: 3 };
const previews = dedupeBySpeciesForm(supplier.previewOffers ?? []).slice(0, 4); // сервер отдаёт ≤5

<article data-testid="supplier-row" aria-labelledby={`sup-${id}-name`}
  className="border-b border-border/60 py-4">
  <header className="flex items-center gap-3 min-w-0">
    <span aria-hidden className="shrink-0">{flag}</span>
    <h3 id={`sup-${id}-name`} className="text-card-title truncate">
      <Link to={`/suppliers/${id}`} className="hover:text-link-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
        {displayName /* существующая политика маскировки */}
      </Link>
    </h3>
    <span className="text-muted-foreground shrink-0">· {countryLabel}</span>
    <div className="ml-auto flex items-center gap-2">
      <CatalogueLink className="hidden md:inline-flex" />
      <SaveIconButton className="min-h-11 min-w-11" aria-label={t.suppliers_save(displayName)} />
    </div>
  </header>

  {previews.length > 0 && (
    <ul className="mt-3 grid gap-2 md:gap-3 grid-cols-[repeat(var(--n),minmax(0,184px))]"
        style={{ "--n": Math.min(previews.length, isMd ? 4 : 3) } as React.CSSProperties}
        aria-label={t.suppliers_assortmentLabel}>
      {previews.map((o, i) => (
        <li key={o.id} className={i >= 3 ? "hidden md:block" : undefined}>
          <Link to={`/offers/${o.id}`} state={{ from: location.pathname + location.search }}
            aria-label={o.shortName} title={o.shortName}
            className="block aspect-[4/3] rounded-md bg-muted overflow-hidden
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <PreviewImage src={o.imageUrl} alt="" fallback={o.shortName} />
          </Link>
        </li>
      ))}
    </ul>
  )}

  <CatalogueLink className="mt-3 flex w-full md:hidden" />
</article>
```

`--n` задаётся через CSS-переменную без вычислений в JS: на мобильном `min(n,3)`, начиная с md — `min(n,4)`. Это можно сделать двумя классами с arbitrary values (`[--n:theme]`) или через `useIsMobile`. Скрытая 4-я ячейка получает `hidden`, то есть `display:none`, и не попадает в порядок Tab.

```tsx
function PreviewImage({ src, fallback }) {
  const [broken, setBroken] = useState(!src);
  return broken
    ? <span className="flex h-full items-center justify-center p-2 text-center text-xs text-muted-foreground line-clamp-3">{fallback}</span>
    : <img src={src} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)}
        className="h-full w-full object-contain" />;
}

function CatalogueLink({ className }) {
  const showCount = !hasActiveNarrowing && publicCatalogueCount != null && publicCatalogueCount >= 2;
  return (
    <Link to={`/suppliers/${id}?tab=catalogue`} state={{ from: location.pathname + location.search }}
      aria-label={`${showCount ? t.suppliers_catalogueN(publicCatalogueCount) : t.suppliers_catalogue} — ${displayName}`}
      className={cn("min-h-11 items-center justify-center gap-1 rounded-md border border-border px-3 text-sm font-medium hover:text-link-hover focus-visible:ring-2 focus-visible:ring-ring", className)}>
      {showCount ? t.suppliers_catalogueN(publicCatalogueCount) : t.suppliers_catalogue} <ArrowRight aria-hidden className="h-4 w-4" />
    </Link>
  );
}
```

Тексты (существующие ключи переиспользовать, если они есть):
- RU: «В каталог» / «В каталог · {n} товаров» (склонение через существующий хелпер plural)
- EN: «View catalogue» / «View catalogue · {n} products»
- ES: «Ver catálogo» / «Ver catálogo · {n} productos»

## Состояния

- 0 фото: только шапка и ссылка на каталог; на мобильном ссылка идёт отдельной строкой. Поставщик остаётся в списке.
- 1–2 фото: столько же ячеек, пустых слотов нет.
- Фото не загрузилось: в ячейке короткое название товара из источника, фон приглушённый.
- Поиск: сервер отдаёт только подходящие товары. Число в ссылке не показывается, потому что включено сужение.
- Без фильтров, число неизвестно (`null`): ссылка без числа.
- Без фильтров, 0 или 1 товар: ссылка без числа.

Из строки убираются цена, MOQ, спецификация, латинское название, количество на складе, значки сертификатов, «+N» и три кнопки действий. Сравнение, запрос и цена остаются в карточке товара и в каталоге и там не меняются.

## Технические условия

- Нужна выдача пачкой: `previewOffers` не больше 5 товаров на поставщика в том же ответе списка. Отдельный запрос на каждую строку (N+1) недопустим. Поля: `id`, `shortName`, `imageUrl`, `species`, `form`. Цен и количеств нет.
- Разнообразие фото: сначала совпадения с поиском, затем разные species/form/cut, дубликаты убираются.
- Скрытое имя и скрытые итоги не попадают ни в DOM, ни в `aria-label`.

## Проверки приёмки

1. Снимки RU/EN/ES на 1280 и 390: 4 и 3 фото, нет горизонтальной прокрутки, нет пустых ячеек.
2. Наборы с 0, 1, 2, 10 и 100 товарами, плюс сломанное фото: строка не разваливается.
3. Порядок Tab: имя → (на компьютере: каталог → сохранить) → фото 1..k → (на мобильном: каталог). Невидимых фокусируемых элементов нет, кольцо фокуса видно.
4. Зоны нажатия не меньше 44×44, вложенных `a`/`button` нет.
5. На трёх уровнях доступа скрытые имя, цена и количество не видны в DOM.
6. Переход: фото ведёт на `/offers/:id`, кнопка «Назад» восстанавливает `q`; ссылка ведёт в каталог профиля.
7. Число в ссылке есть только без фильтров, при известном числе не меньше 2, и совпадает с каталогом.
8. Сеть: один запрос на страницу.
9. Тесты `SupplierRow.mobile390`, `snapshot`, `searchAccess`, `no-horizontal-overflow` обновляются только там, где контракт меняется намеренно.

## Компромиссы

- `object-contain` честнее передаёт кадр, но даёт полосы у фото с другими пропорциями. Кадрирование отложено, пока нет фокусной точки от поставщика.
- Без подписей строка быстро просматривается, но похожие виды неотличимы без наведения. Это гипотеза для проверки с покупателями.
- Ячейка до 184 px на компьютере — компромисс между узнаваемостью и высотой строки. Около 200 px потребовало бы 3 фото.
