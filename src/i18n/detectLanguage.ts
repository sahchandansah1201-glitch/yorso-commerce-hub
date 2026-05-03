import type { Language } from "./translations";

/**
 * Определяет язык произвольного пользовательского ввода (поиск, заметки,
 * подсказки). Делает корректный фолбэк для смешанного/частичного ввода:
 *
 * 1. Если есть кириллица — RU (даже если латиницы больше: пользователь
 *    очевидно пишет по-русски с вкраплениями брендов/терминов).
 * 2. Если кириллицы нет, но есть испаноспецифичные символы (ñ, ¿, ¡,
 *    á/é/í/ó/ú/ü) — ES.
 * 3. Если строка пустая/из цифр/из пунктуации — fallback на RU
 *    (правило проекта: подсказки по умолчанию на русском).
 * 4. Иначе — EN.
 *
 * Параметр `preferred` позволяет «прижать» результат к выбранной локали
 * пользователя, когда сигналов недостаточно (например, ровно один
 * латинский токен «RFQ» при preferred=ru остаётся ru).
 */
export const detectLanguage = (
  input: string | null | undefined,
  preferred: Language = "ru",
): Language => {
  const text = (input ?? "").normalize("NFC");

  const hasCyrillic = /[А-Яа-яЁё]/.test(text);
  if (hasCyrillic) return "ru";

  const hasSpanishMark = /[ñÑ¿¡áéíóúüÁÉÍÓÚÜ]/.test(text);
  if (hasSpanishMark) return "es";

  // Считаем «значимые» латинские символы. Цифры, пробелы и пунктуация
  // не несут языкового сигнала — для таких случаев держим preferred.
  const latinLetters = text.match(/[A-Za-z]/g)?.length ?? 0;
  if (latinLetters === 0) return preferred;

  // Очень короткий латинский ввод (≤ 3 букв) обычно акроним/код
  // (RFQ, MOQ, EU). Не перетягиваем интерфейс на EN ради него.
  if (latinLetters <= 3 && preferred !== "en") return preferred;

  return "en";
};

/**
 * Удобная обёртка: выбирает финальный язык подсказок, отдавая приоритет
 * явному выбору пользователя (saved), затем тексту запроса, затем
 * preferred-фолбэку. Используется компонентами, которым нужно
 * локализовать подсказки под язык конкретного запроса, не ломая
 * глобальный выбор интерфейса.
 */
export const resolveHintLanguage = (opts: {
  saved?: Language | null;
  text?: string | null;
  preferred?: Language;
}): Language => {
  const preferred = opts.preferred ?? "ru";
  if (opts.saved) return opts.saved;
  return detectLanguage(opts.text, preferred);
};
