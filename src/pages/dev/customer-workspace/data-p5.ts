/**
 * P5 deterministic in-memory dataset for the data transfer interface.
 * No file is read, no request is made: these values are module constants.
 */
import type { P5Choice, P5Classification } from "./copy-p5";

export type P5SourceFile = {
  id: string;
  fileName: string;
  rows: number;
};

/** Three bundled check sources named by file name only. */
export const P5_SOURCES: P5SourceFile[] = [
  { id: "src-a", fileName: "companies-contacts-2026-09-01.csv", rows: 14 },
  { id: "src-b", fileName: "companies-only-2026-08-24.csv", rows: 8 },
  { id: "src-c", fileName: "contacts-only-2026-08-18.csv", rows: 6 },
];

export type P5Field =
  | "skip"
  | "companyName"
  | "country"
  | "contactName"
  | "email"
  | "phone"
  | "note";

export const P5_FIELDS: P5Field[] = [
  "companyName",
  "country",
  "contactName",
  "email",
  "phone",
  "note",
  "skip",
];

export type P5Column = { id: string; source: string; target: P5Field };

export const P5_COLUMNS: P5Column[] = [
  { id: "col-1", source: "company", target: "companyName" },
  { id: "col-2", source: "country_code", target: "country" },
  { id: "col-3", source: "contact_full_name", target: "contactName" },
  { id: "col-4", source: "email_primary", target: "email" },
  { id: "col-5", source: "phone_primary", target: "phone" },
  { id: "col-6", source: "internal_comment", target: "note" },
];

export type P5Row = {
  id: string;
  kind: "company" | "contact";
  value: string;
  classification: P5Classification;
  /** Deterministic starting decision; ambiguous rows start undecided. */
  defaultChoice: P5Choice | null;
};

/**
 * 14 rows: 8 companies (3 new, 2 exact, 2 ambiguous, 1 error) and
 * 6 contacts (3 new, 1 exact, 1 ambiguous, 1 error).
 */
export const P5_ROWS: P5Row[] = [
  { id: "R-01", kind: "company", value: "Nordic Bay Trading AS", classification: "new", defaultChoice: "create" },
  { id: "R-02", kind: "company", value: "Vigo Atlantic SL", classification: "new", defaultChoice: "create" },
  { id: "R-03", kind: "company", value: "Kobe Marine KK", classification: "new", defaultChoice: "skip" },
  { id: "R-04", kind: "company", value: "Bergen Cold Store AS", classification: "exact", defaultChoice: "link" },
  { id: "R-05", kind: "company", value: "Nordkapp Seafood AS", classification: "exact", defaultChoice: "link" },
  { id: "R-06", kind: "company", value: "Oslo Market Supply", classification: "ambiguous", defaultChoice: null },
  { id: "R-07", kind: "company", value: "Oslo Market Supply AS", classification: "ambiguous", defaultChoice: null },
  { id: "R-08", kind: "company", value: "", classification: "error", defaultChoice: null },
  { id: "R-09", kind: "contact", value: "Hanna Lee", classification: "new", defaultChoice: "create" },
  { id: "R-10", kind: "contact", value: "Tomas Alvarez", classification: "new", defaultChoice: "skip" },
  { id: "R-11", kind: "contact", value: "Yuki Sato", classification: "new", defaultChoice: "skip" },
  { id: "R-12", kind: "contact", value: "Sofia Marques", classification: "exact", defaultChoice: "link" },
  { id: "R-13", kind: "contact", value: "J. Berg", classification: "ambiguous", defaultChoice: null },
  { id: "R-14", kind: "contact", value: "no-name@", classification: "error", defaultChoice: null },
];

export const P5_TOTALS = {
  rows: 14,
  companies: 8,
  contacts: 6,
};

/** Fixed first outcome of the local execution transition. */
export const P5_RESULT = {
  processable: 8,
  completed: 7,
  temporaryFailure: 1,
  rejected: 2,
  skipped: 4,
};

export type P5Outcome = "completed" | "temporaryFailure" | "rejected" | "skipped";

/** Deterministic per-row outcome of the first execution. */
export const P5_ROW_OUTCOMES: Record<string, P5Outcome> = {
  "R-01": "completed",
  "R-02": "completed",
  "R-03": "skipped",
  "R-04": "completed",
  "R-05": "completed",
  "R-06": "completed",
  "R-07": "temporaryFailure",
  "R-08": "rejected",
  "R-09": "completed",
  "R-10": "skipped",
  "R-11": "skipped",
  "R-12": "completed",
  "R-13": "skipped",
  "R-14": "rejected",
};

/** Service-side run register: counts and identifiers only. */
export const P5_SERVICE_RUN = {
  runId: "run-2026-09-06-1420",
  checksumSource: "9f14c2a7",
  checksumProcessed: "9f14c2a7",
  sourceCompanies: 8,
  sourceContacts: 6,
  rowIds: "R-01 … R-14",
  failedIds: ["R-07"],
};
