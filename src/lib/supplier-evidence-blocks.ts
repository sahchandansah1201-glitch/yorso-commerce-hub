import { translations } from "@/i18n/translations";

export type SupplierEvidenceI18nKey = keyof (typeof translations)["en"];

export interface SupplierShipmentCase {
  id: string;
  titleKey: SupplierEvidenceI18nKey;
  dateISO: string;
  destinationKey: SupplierEvidenceI18nKey;
  product: string;
  volumeTons: number;
  incoterm: string;
  buyerTypeKey: SupplierEvidenceI18nKey;
  notesKey: SupplierEvidenceI18nKey;
  photoCaptionKeys: SupplierEvidenceI18nKey[];
}

export interface SupplierFaqItem {
  qKey: SupplierEvidenceI18nKey;
  aKey: SupplierEvidenceI18nKey;
  params?: Record<string, string | number>;
}

const hashSeed = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export const localPreviewSupplierShipmentCases = (
  supplierId: string,
  productLabel: string,
): SupplierShipmentCase[] => {
  const seed = hashSeed(supplierId);
  return [
    {
      id: "case-de-2024",
      titleKey: "supplier_cases_caseTitle_de",
      dateISO: "2024-10-15",
      destinationKey: "supplier_cases_destination_de",
      product: productLabel,
      volumeTons: 20 + (seed % 8),
      incoterm: "CFR Hamburg",
      buyerTypeKey: "supplier_cases_buyerType_retail",
      notesKey: "supplier_cases_notes_de",
      photoCaptionKeys: [
        "supplier_cases_photoCaption_loading",
        "supplier_cases_photoCaption_logger",
        "supplier_cases_photoCaption_seal",
        "supplier_cases_photoCaption_docs",
      ],
    },
    {
      id: "case-fr-2024",
      titleKey: "supplier_cases_caseTitle_fr",
      dateISO: "2024-07-20",
      destinationKey: "supplier_cases_destination_fr",
      product: productLabel,
      volumeTons: 10 + (seed % 6),
      incoterm: "DAP Marseille",
      buyerTypeKey: "supplier_cases_buyerType_horeca",
      notesKey: "supplier_cases_notes_fr",
      photoCaptionKeys: [
        "supplier_cases_photoCaption_pallets",
        "supplier_cases_photoCaption_label",
        "supplier_cases_photoCaption_tempLog",
      ],
    },
    {
      id: "case-ae-2023",
      titleKey: "supplier_cases_caseTitle_ae",
      dateISO: "2023-12-10",
      destinationKey: "supplier_cases_destination_ae",
      product: productLabel,
      volumeTons: 24 + (seed % 5),
      incoterm: "CIF Jebel Ali",
      buyerTypeKey: "supplier_cases_buyerType_wholesale",
      notesKey: "supplier_cases_notes_ae",
      photoCaptionKeys: [
        "supplier_cases_photoCaption_survey",
        "supplier_cases_photoCaption_loadingHC",
      ],
    },
  ];
};

export const localPreviewSupplierFaqItems = (supplierId: string): SupplierFaqItem[] => {
  const minBatch = 1 + (hashSeed(supplierId) % 4);
  return [
    { qKey: "supplier_faq_q1", aKey: "supplier_faq_a1", params: { n: minBatch } },
    { qKey: "supplier_faq_q2", aKey: "supplier_faq_a2" },
    { qKey: "supplier_faq_q3", aKey: "supplier_faq_a3" },
    { qKey: "supplier_faq_q4", aKey: "supplier_faq_a4" },
    { qKey: "supplier_faq_q5", aKey: "supplier_faq_a5" },
    { qKey: "supplier_faq_q6", aKey: "supplier_faq_a6" },
  ];
};
