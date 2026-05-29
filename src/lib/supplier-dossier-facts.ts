export interface SupplierProductionFacts {
  dailyTons: number;
  lines: number;
  coldStorageT: number;
  blastFreezerT: number;
  staff: number;
}

export interface SupplierLogisticsFacts {
  incoterms: string[];
  transitDaysMin: number;
  transitDaysMax: number;
  minBatchTons: number;
  containers: string[];
  tempRange: string;
}

const hashSeed = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
};

export const localPreviewSupplierProductionFacts = (supplierId: string): SupplierProductionFacts => {
  const seed = hashSeed(supplierId);
  return {
    dailyTons: 8 + (seed % 35),
    lines: 2 + (seed % 4),
    coldStorageT: 200 + (seed % 9) * 100,
    blastFreezerT: 20 + (seed % 8) * 5,
    staff: 40 + (seed % 12) * 10,
  };
};

export const localPreviewSupplierLogisticsFacts = (supplierId: string): SupplierLogisticsFacts => {
  const seed = hashSeed(supplierId);
  const incoterms = ["FCA", "CFR", "CIF", "FOB", "DAP"];
  const chosen = [
    incoterms[seed % 5],
    incoterms[(seed + 2) % 5],
    incoterms[(seed + 4) % 5],
  ];
  const transit = 5 + (seed % 14);

  return {
    incoterms: Array.from(new Set(chosen)),
    transitDaysMin: transit,
    transitDaysMax: transit + 7,
    minBatchTons: 1 + (seed % 4),
    containers: ["20' Reefer", "40' Reefer HC"],
    tempRange: "-18 C ... -22 C",
  };
};
