/**
 * P7 deterministic in-memory pilot data. Anonymized on the service side:
 * participants are identifiers only, never company or user content.
 */

export const P7_SUMMARY = {
  companies: 3,
  users: 12,
  feedbackEntries: 8,
  incidents: 2,
  openIncidents: 1,
  limitations: 3,
  participants: ["P-01", "P-02", "P-03"],
};

/** Customer-facing help panel: responsible team and working hours only. */
export const P7_HELP = {
  contact: {
    ru: "Служба поддержки YORSO",
    en: "YORSO support team",
    es: "Equipo de soporte de YORSO",
  },
  hours: {
    ru: "Пн–Пт, 09:00–18:00",
    en: "Mon–Fri, 09:00–18:00",
    es: "Lu–Vi, 09:00–18:00",
  },
};
