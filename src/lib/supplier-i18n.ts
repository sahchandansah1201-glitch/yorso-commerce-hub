/**
 * Узколокальный i18n-helper для страницы профиля поставщика.
 *
 * Глобальный interpolation в проекте не реализован — каждое место
 * подставляет параметры через String.replace. Этот модуль централизует
 * подстановку и плюрализацию для supplier_*-ключей, чтобы JSX оставался
 * чистым и читаемым.
 */
import type { Language } from "@/i18n/translations";

/**
 * Подстановка плейсхолдеров вида "{name}" в шаблон.
 * Не выбрасывает на отсутствующих ключах — лишние плейсхолдеры остаются
 * как есть (помогает заметить пропущенный параметр в dev).
 */
export const interpolate = (
  template: string,
  params: Record<string, string | number>,
): string => {
  let out = template;
  for (const [k, v] of Object.entries(params)) {
    out = out.split(`{${k}}`).join(String(v));
  }
  return out;
};

/**
 * Локализованная плюрализация для русского языка (правила year/years).
 * Для en/es используем простую двоичную форму (one / many).
 *
 * @param n      число
 * @param forms  { one, few?, many } — для ru используются все три,
 *               для en/es — { one, many } (few игнорируется).
 */
export const pluralize = (
  lang: Language,
  n: number,
  forms: { one: string; few?: string; many: string },
): string => {
  if (lang === "ru") {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return forms.one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
      return forms.few ?? forms.many;
    }
    return forms.many;
  }
  // en, es: 1 → one, прочее → many
  return n === 1 ? forms.one : forms.many;
};

/**
 * Локализованный формат ISO-даты (YYYY-MM-DD) → читабельная строка.
 * Использует Intl с фолбеком на DD.MM.YYYY если Intl недоступен.
 */
export const formatLocalizedDate = (iso: string, lang: Language): string => {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  try {
    const locale = lang === "ru" ? "ru-RU" : lang === "es" ? "es-ES" : "en-GB";
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(Date.UTC(y, m - 1, d)));
  } catch {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(d)}.${pad(m)}.${y}`;
  }
};
