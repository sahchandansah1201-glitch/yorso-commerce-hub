/**
 * Лёгкий модульный кэш статусов загрузки логотипов поставщиков.
 *
 * Цели:
 * 1. Не блокировать рендер карточки логотипа — пока изображение грузится,
 *    компонент показывает скелет; после loaded — настоящий <img>; при ошибке —
 *    fallback-монограмма.
 * 2. Префетчить логотипы соседних профилей (prev/next) пока пользователь
 *    смотрит текущий — переход между поставщиками в каталоге будет визуально
 *    мгновенным (логотип уже в HTTP/memory cache).
 * 3. Не повторять запрос: если URL уже loaded/loading — переиспользуем Promise.
 *
 * Без зависимостей, безопасен в SSR (no-op если нет window).
 */

export type LogoStatus = "idle" | "loading" | "loaded" | "error";

type Entry = {
  status: LogoStatus;
  promise?: Promise<LogoStatus>;
  subscribers: Set<(s: LogoStatus) => void>;
};

const cache = new Map<string, Entry>();

const ensureEntry = (url: string): Entry => {
  let e = cache.get(url);
  if (!e) {
    e = { status: "idle", subscribers: new Set() };
    cache.set(url, e);
  }
  return e;
};

const notify = (entry: Entry) => {
  entry.subscribers.forEach((cb) => {
    try {
      cb(entry.status);
    } catch {
      /* swallow subscriber errors */
    }
  });
};

/**
 * Запускает (или переиспользует) загрузку URL. Возвращает Promise со статусом.
 * Безопасно вызывать многократно — реальная сетевая загрузка будет одна.
 */
export const prefetchLogo = (url: string | undefined | null): Promise<LogoStatus> => {
  if (!url) return Promise.resolve("error");
  if (typeof window === "undefined") return Promise.resolve("idle");

  const entry = ensureEntry(url);
  if (entry.status === "loaded" || entry.status === "error") {
    return Promise.resolve(entry.status);
  }
  if (entry.promise) return entry.promise;

  entry.status = "loading";
  entry.promise = new Promise<LogoStatus>((resolve) => {
    const img = new Image();
    img.decoding = "async";
    // hint браузеру: префетч-загрузки имеют низкий приоритет
    // (для hero мы используем loading="eager" в самом <img>).
    try {
      // @ts-expect-error — нестандартный, но широко поддержан
      img.fetchPriority = "low";
    } catch {
      /* ignore */
    }
    img.onload = () => {
      entry.status = "loaded";
      notify(entry);
      resolve("loaded");
    };
    img.onerror = () => {
      entry.status = "error";
      notify(entry);
      resolve("error");
    };
    img.src = url;
  });

  return entry.promise;
};

/** Префетч пачки URL — для соседних профилей. */
export const prefetchLogos = (urls: Array<string | undefined | null>): void => {
  urls.forEach((u) => {
    if (u) void prefetchLogo(u);
  });
};

export const getLogoStatus = (url: string | undefined | null): LogoStatus => {
  if (!url) return "idle";
  return cache.get(url)?.status ?? "idle";
};

/**
 * Подписка на изменения статуса URL. Возвращает unsubscribe.
 * Если URL ещё не запускался — стартует загрузку (lazy bootstrap).
 */
export const subscribeLogoStatus = (
  url: string,
  cb: (s: LogoStatus) => void,
): (() => void) => {
  const entry = ensureEntry(url);
  entry.subscribers.add(cb);
  if (entry.status === "idle") {
    void prefetchLogo(url);
  }
  return () => {
    entry.subscribers.delete(cb);
  };
};
