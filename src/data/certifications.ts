export interface CertificationInfo {
  code: string;
  name: string;
  fullName: string;
  description: string;
  issuer: string;
  website?: string;
}

export const CERTIFICATIONS: Record<string, CertificationInfo> = {
  MSC: {
    code: "MSC",
    name: "MSC",
    fullName: "Marine Stewardship Council",
    description:
      "International standard for sustainable wild-capture fisheries. Certifies that seafood comes from fisheries managed to maintain healthy fish populations and minimize environmental impact.",
    issuer: "Marine Stewardship Council (UK)",
    website: "https://www.msc.org",
  },
  ASC: {
    code: "ASC",
    name: "ASC",
    fullName: "Aquaculture Stewardship Council",
    description:
      "Leading certification for responsibly farmed seafood. Verifies environmental and social performance of aquaculture operations across the full supply chain.",
    issuer: "Aquaculture Stewardship Council (Netherlands)",
    website: "https://www.asc-aqua.org",
  },
  HACCP: {
    code: "HACCP",
    name: "HACCP",
    fullName: "Hazard Analysis and Critical Control Points",
    description:
      "Internationally recognized food safety management system. Identifies, evaluates, and controls hazards from raw material production through to consumption.",
    issuer: "Codex Alimentarius / FAO-WHO",
  },
  BRC: {
    code: "BRC",
    name: "BRC",
    fullName: "BRCGS Global Standard for Food Safety",
    description:
      "Globally recognized food safety and quality certification scheme. Required by many major retailers and food manufacturers worldwide.",
    issuer: "BRCGS (UK)",
    website: "https://www.brcgs.com",
  },
  IFS: {
    code: "IFS",
    name: "IFS",
    fullName: "International Featured Standards",
    description:
      "Standard for auditing food safety and quality of processes and products. Widely required by European retailers.",
    issuer: "IFS Management GmbH (Germany)",
    website: "https://www.ifs-certification.com",
  },
  GLOBALGAP: {
    code: "GLOBALGAP",
    name: "GLOBALG.A.P.",
    fullName: "Global Good Agricultural Practices",
    description:
      "Voluntary standard for the certification of agricultural and aquaculture products worldwide, focusing on food safety, sustainability, and worker welfare.",
    issuer: "GLOBALG.A.P. (Germany)",
    website: "https://www.globalgap.org",
  },
  EU: {
    code: "EU",
    name: "EU Approved",
    fullName: "European Union Approved Establishment",
    description:
      "Establishment authorized to export seafood products to the European Union, meeting all EU sanitary, hygiene, and traceability requirements.",
    issuer: "European Commission DG SANTE",
  },
  FDA: {
    code: "FDA",
    name: "FDA",
    fullName: "U.S. Food and Drug Administration",
    description:
      "Compliance with FDA regulations for seafood imported into the United States, including HACCP-based controls and facility registration.",
    issuer: "U.S. Food and Drug Administration",
  },
  HALAL: {
    code: "HALAL",
    name: "Halal",
    fullName: "Halal Certified",
    description:
      "Certifies that products comply with Islamic dietary laws — important for export to Muslim-majority markets.",
    issuer: "Accredited Halal certification bodies",
  },
  KOSHER: {
    code: "KOSHER",
    name: "Kosher",
    fullName: "Kosher Certified",
    description:
      "Certifies compliance with Jewish dietary laws (kashrut). Required for Jewish religious markets and many premium retail channels.",
    issuer: "Accredited Kosher certification bodies",
  },
  FOS: {
    code: "FOS",
    name: "Friend of the Sea",
    fullName: "Friend of the Sea",
    description:
      "Certification for products from sustainable fisheries and aquaculture. Audits respect for the marine ecosystem and social accountability.",
    issuer: "World Sustainability Organization",
    website: "https://friendofthesea.org",
  },
  ISO22000: {
    code: "ISO22000",
    name: "ISO 22000",
    fullName: "ISO 22000 Food Safety Management",
    description:
      "International standard combining ISO 9001 management principles with HACCP for food safety across the supply chain.",
    issuer: "International Organization for Standardization",
  },
};

export function getCertificationInfo(code: string): CertificationInfo {
  const key = code.toUpperCase().replace(/[\s.\-]/g, "");
  return (
    CERTIFICATIONS[key] ?? {
      code,
      name: code,
      fullName: code,
      description:
        "Industry certification verifying compliance with quality, safety, or sustainability standards. Contact the supplier for the issuing body and certificate number.",
      issuer: "Verified by supplier",
    }
  );
}
