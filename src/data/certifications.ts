import type { Language } from "@/i18n/translations";
import mscLogo from "@/assets/certs/msc.png";
import ascLogo from "@/assets/certs/asc.png";
import brcLogo from "@/assets/certs/brc.png";

export interface CertificationInfo {
  code: string;
  name: string;
  fullName: string;
  description: string;
  issuer: string;
  website?: string;
  logo?: string;
}

interface LocalizedCertFields {
  fullName: string;
  description: string;
  issuer: string;
}

interface CertificationDef {
  code: string;
  name: string;
  website?: string;
  logo?: string;
  i18n: Record<Language, LocalizedCertFields>;
}

const CERTIFICATIONS: Record<string, CertificationDef> = {
  MSC: {
    code: "MSC",
    name: "MSC",
    website: "https://www.msc.org",
    logo: mscLogo,
    i18n: {
      en: {
        fullName: "Marine Stewardship Council",
        description:
          "International standard for sustainable wild-capture fisheries. Certifies that seafood comes from fisheries managed to maintain healthy fish populations and minimize environmental impact.",
        issuer: "Marine Stewardship Council (UK)",
      },
      ru: {
        fullName: "Морской попечительский совет",
        description:
          "Международный стандарт устойчивого промысла дикой рыбы. Подтверждает, что морепродукты получены из рыбных хозяйств, поддерживающих здоровые популяции и минимизирующих воздействие на экосистему.",
        issuer: "Marine Stewardship Council (Великобритания)",
      },
      es: {
        fullName: "Consejo de Administración Marina",
        description:
          "Estándar internacional para pesquerías silvestres sostenibles. Certifica que los productos del mar provienen de pesquerías gestionadas para mantener poblaciones saludables y minimizar el impacto ambiental.",
        issuer: "Marine Stewardship Council (Reino Unido)",
      },
    },
  },
  ASC: {
    code: "ASC",
    name: "ASC",
    website: "https://www.asc-aqua.org",
    logo: ascLogo,
    i18n: {
      en: {
        fullName: "Aquaculture Stewardship Council",
        description:
          "Leading certification for responsibly farmed seafood. Verifies environmental and social performance of aquaculture operations across the full supply chain.",
        issuer: "Aquaculture Stewardship Council (Netherlands)",
      },
      ru: {
        fullName: "Попечительский совет по аквакультуре",
        description:
          "Ведущая сертификация для ответственно выращенных морепродуктов. Подтверждает экологическую и социальную ответственность аквакультурных хозяйств по всей цепочке поставок.",
        issuer: "Aquaculture Stewardship Council (Нидерланды)",
      },
      es: {
        fullName: "Consejo de Administración de la Acuicultura",
        description:
          "Certificación líder para productos del mar de cultivo responsable. Verifica el desempeño ambiental y social de las operaciones de acuicultura en toda la cadena de suministro.",
        issuer: "Aquaculture Stewardship Council (Países Bajos)",
      },
    },
  },
  HACCP: {
    code: "HACCP",
    name: "HACCP",
    i18n: {
      en: {
        fullName: "Hazard Analysis and Critical Control Points",
        description:
          "Internationally recognized food safety management system. Identifies, evaluates, and controls hazards from raw material production through to consumption.",
        issuer: "Codex Alimentarius / FAO-WHO",
      },
      ru: {
        fullName: "Анализ рисков и критические контрольные точки",
        description:
          "Международно признанная система управления пищевой безопасностью. Выявляет, оценивает и контролирует риски от производства сырья до потребления.",
        issuer: "Codex Alimentarius / ФАО-ВОЗ",
      },
      es: {
        fullName: "Análisis de Peligros y Puntos Críticos de Control",
        description:
          "Sistema de gestión de seguridad alimentaria reconocido internacionalmente. Identifica, evalúa y controla los peligros desde la producción de materias primas hasta el consumo.",
        issuer: "Codex Alimentarius / FAO-OMS",
      },
    },
  },
  BRC: {
    code: "BRC",
    name: "BRC",
    website: "https://www.brcgs.com",
    logo: brcLogo,
    i18n: {
      en: {
        fullName: "BRCGS Global Standard for Food Safety",
        description:
          "Globally recognized food safety and quality certification scheme. Required by many major retailers and food manufacturers worldwide.",
        issuer: "BRCGS (UK)",
      },
      ru: {
        fullName: "Глобальный стандарт пищевой безопасности BRCGS",
        description:
          "Всемирно признанная система сертификации пищевой безопасности и качества. Требуется многими крупными ритейлерами и производителями продуктов питания.",
        issuer: "BRCGS (Великобритания)",
      },
      es: {
        fullName: "Estándar Global BRCGS para la Seguridad Alimentaria",
        description:
          "Esquema de certificación de seguridad y calidad alimentaria reconocido a nivel mundial. Requerido por muchos grandes minoristas y fabricantes de alimentos.",
        issuer: "BRCGS (Reino Unido)",
      },
    },
  },
  IFS: {
    code: "IFS",
    name: "IFS",
    website: "https://www.ifs-certification.com",
    i18n: {
      en: {
        fullName: "International Featured Standards",
        description:
          "Standard for auditing food safety and quality of processes and products. Widely required by European retailers.",
        issuer: "IFS Management GmbH (Germany)",
      },
      ru: {
        fullName: "International Featured Standards",
        description:
          "Стандарт аудита пищевой безопасности и качества процессов и продукции. Широко требуется европейскими ритейлерами.",
        issuer: "IFS Management GmbH (Германия)",
      },
      es: {
        fullName: "International Featured Standards",
        description:
          "Estándar para auditar la seguridad alimentaria y la calidad de procesos y productos. Ampliamente requerido por minoristas europeos.",
        issuer: "IFS Management GmbH (Alemania)",
      },
    },
  },
  GLOBALGAP: {
    code: "GLOBALGAP",
    name: "GLOBALG.A.P.",
    website: "https://www.globalgap.org",
    i18n: {
      en: {
        fullName: "Global Good Agricultural Practices",
        description:
          "Voluntary standard for the certification of agricultural and aquaculture products worldwide, focusing on food safety, sustainability, and worker welfare.",
        issuer: "GLOBALG.A.P. (Germany)",
      },
      ru: {
        fullName: "Глобальные надлежащие сельскохозяйственные практики",
        description:
          "Добровольный международный стандарт сертификации сельскохозяйственной и аквакультурной продукции, охватывающий пищевую безопасность, устойчивость и условия труда.",
        issuer: "GLOBALG.A.P. (Германия)",
      },
      es: {
        fullName: "Buenas Prácticas Agrícolas Globales",
        description:
          "Estándar voluntario para la certificación de productos agrícolas y de acuicultura en todo el mundo, centrado en la seguridad alimentaria, la sostenibilidad y el bienestar de los trabajadores.",
        issuer: "GLOBALG.A.P. (Alemania)",
      },
    },
  },
  EU: {
    code: "EU",
    name: "EU Approved",
    i18n: {
      en: {
        fullName: "European Union Approved Establishment",
        description:
          "Establishment authorized to export seafood products to the European Union, meeting all EU sanitary, hygiene, and traceability requirements.",
        issuer: "European Commission DG SANTE",
      },
      ru: {
        fullName: "Предприятие, одобренное Европейским Союзом",
        description:
          "Предприятие, имеющее разрешение на экспорт морепродуктов в ЕС и соответствующее всем санитарным, гигиеническим требованиям и требованиям к прослеживаемости.",
        issuer: "Европейская комиссия DG SANTE",
      },
      es: {
        fullName: "Establecimiento Aprobado por la Unión Europea",
        description:
          "Establecimiento autorizado para exportar productos del mar a la Unión Europea, que cumple todos los requisitos sanitarios, de higiene y trazabilidad de la UE.",
        issuer: "Comisión Europea DG SANTE",
      },
    },
  },
  FDA: {
    code: "FDA",
    name: "FDA",
    i18n: {
      en: {
        fullName: "U.S. Food and Drug Administration",
        description:
          "Compliance with FDA regulations for seafood imported into the United States, including HACCP-based controls and facility registration.",
        issuer: "U.S. Food and Drug Administration",
      },
      ru: {
        fullName: "Управление по санитарному надзору США (FDA)",
        description:
          "Соответствие требованиям FDA для морепродуктов, импортируемых в США, включая контроль на основе HACCP и регистрацию предприятия.",
        issuer: "U.S. Food and Drug Administration",
      },
      es: {
        fullName: "Administración de Alimentos y Medicamentos de EE. UU.",
        description:
          "Cumplimiento de las regulaciones de la FDA para productos del mar importados a los Estados Unidos, incluidos los controles basados en HACCP y el registro de instalaciones.",
        issuer: "U.S. Food and Drug Administration",
      },
    },
  },
  HALAL: {
    code: "HALAL",
    name: "Halal",
    i18n: {
      en: {
        fullName: "Halal Certified",
        description:
          "Certifies that products comply with Islamic dietary laws — important for export to Muslim-majority markets.",
        issuer: "Accredited Halal certification bodies",
      },
      ru: {
        fullName: "Сертификация Халяль",
        description:
          "Подтверждает соответствие продукции исламским пищевым нормам — важно для экспорта на рынки с преимущественно мусульманским населением.",
        issuer: "Аккредитованные органы сертификации Халяль",
      },
      es: {
        fullName: "Certificación Halal",
        description:
          "Certifica que los productos cumplen con las leyes dietéticas islámicas — importante para exportar a mercados de mayoría musulmana.",
        issuer: "Organismos acreditados de certificación Halal",
      },
    },
  },
  KOSHER: {
    code: "KOSHER",
    name: "Kosher",
    i18n: {
      en: {
        fullName: "Kosher Certified",
        description:
          "Certifies compliance with Jewish dietary laws (kashrut). Required for Jewish religious markets and many premium retail channels.",
        issuer: "Accredited Kosher certification bodies",
      },
      ru: {
        fullName: "Сертификация Кошер",
        description:
          "Подтверждает соответствие иудейским пищевым законам (кашрут). Требуется для еврейских религиозных рынков и многих премиальных розничных каналов.",
        issuer: "Аккредитованные органы сертификации Кошер",
      },
      es: {
        fullName: "Certificación Kosher",
        description:
          "Certifica el cumplimiento de las leyes dietéticas judías (kashrut). Requerido para mercados religiosos judíos y muchos canales minoristas premium.",
        issuer: "Organismos acreditados de certificación Kosher",
      },
    },
  },
  FOS: {
    code: "FOS",
    name: "Friend of the Sea",
    website: "https://friendofthesea.org",
    i18n: {
      en: {
        fullName: "Friend of the Sea",
        description:
          "Certification for products from sustainable fisheries and aquaculture. Audits respect for the marine ecosystem and social accountability.",
        issuer: "World Sustainability Organization",
      },
      ru: {
        fullName: "Friend of the Sea",
        description:
          "Сертификация продукции из устойчивого рыболовства и аквакультуры. Проверяет бережное отношение к морской экосистеме и социальную ответственность.",
        issuer: "World Sustainability Organization",
      },
      es: {
        fullName: "Friend of the Sea",
        description:
          "Certificación para productos de pesca y acuicultura sostenibles. Audita el respeto al ecosistema marino y la responsabilidad social.",
        issuer: "World Sustainability Organization",
      },
    },
  },
  ISO22000: {
    code: "ISO22000",
    name: "ISO 22000",
    i18n: {
      en: {
        fullName: "ISO 22000 Food Safety Management",
        description:
          "International standard combining ISO 9001 management principles with HACCP for food safety across the supply chain.",
        issuer: "International Organization for Standardization",
      },
      ru: {
        fullName: "ISO 22000 — Управление пищевой безопасностью",
        description:
          "Международный стандарт, объединяющий принципы менеджмента ISO 9001 с HACCP для обеспечения пищевой безопасности по всей цепочке поставок.",
        issuer: "Международная организация по стандартизации (ISO)",
      },
      es: {
        fullName: "ISO 22000 — Gestión de la Seguridad Alimentaria",
        description:
          "Estándar internacional que combina los principios de gestión de ISO 9001 con HACCP para la seguridad alimentaria en toda la cadena de suministro.",
        issuer: "Organización Internacional de Normalización (ISO)",
      },
    },
  },
};

const FALLBACK_DESCRIPTION: Record<Language, string> = {
  en: "Industry certification verifying compliance with quality, safety, or sustainability standards. Contact the supplier for the issuing body and certificate number.",
  ru: "Отраслевая сертификация, подтверждающая соответствие стандартам качества, безопасности или устойчивости. Запросите у поставщика орган сертификации и номер сертификата.",
  es: "Certificación de la industria que verifica el cumplimiento de los estándares de calidad, seguridad o sostenibilidad. Contacte al proveedor para conocer el organismo emisor y el número de certificado.",
};

const FALLBACK_ISSUER: Record<Language, string> = {
  en: "Verified by supplier",
  ru: "Подтверждено поставщиком",
  es: "Verificado por el proveedor",
};

export function getCertificationInfo(code: string, lang: Language): CertificationInfo {
  const key = code.toUpperCase().replace(/[\s.\-]/g, "");
  const def = CERTIFICATIONS[key];
  if (!def) {
    return {
      code,
      name: code,
      fullName: code,
      description: FALLBACK_DESCRIPTION[lang],
      issuer: FALLBACK_ISSUER[lang],
    };
  }
  const localized = def.i18n[lang] ?? def.i18n.en;
  return {
    code: def.code,
    name: def.name,
    fullName: localized.fullName,
    description: localized.description,
    issuer: localized.issuer,
    website: def.website,
    logo: def.logo,
  };
}
