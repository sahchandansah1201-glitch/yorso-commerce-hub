/**
 * Deterministic pseudo-random numbers seeded by a stable ID (offer ID, supplier
 * ID, etc.). Used to render "live activity" mock signals on cards and
 * intelligence panels without backend support. Values must be labelled as
 * estimates in the UI — never imply real backend data.
 */
const hash = (id: string): number => {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
};

export const pulseInt = (id: string, salt: string, min: number, max: number): number => {
  const h = hash(`${id}::${salt}`);
  return min + (h % (max - min + 1));
};
