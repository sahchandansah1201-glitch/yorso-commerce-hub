export const fallback = (value: string | undefined, notSpecified: string) =>
  value && value.trim() ? value : notSpecified;

export const splitList = (value: string): string[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
