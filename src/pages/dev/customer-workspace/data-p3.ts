/**
 * Deterministic in-memory product items for the P3 prototype.
 * No storage, no network, no shared application data model.
 */
import type { ProtoLang } from "./copy";
import type {
  ProductConditionKey,
  ProductDirectionKey,
  ProductUnitKey,
} from "./copy-p3";

export interface ProtoProduct {
  id: string;
  product: Record<ProtoLang, string>;
  latin: string;
  condition: ProductConditionKey;
  direction: ProductDirectionKey;
  monthlyVolume: string;
  unit: ProductUnitKey;
  format: Record<ProtoLang, string>;
  active: boolean;
}

export const PROTO_PRODUCTS: ProtoProduct[] = [
  {
    id: "salmon",
    product: { ru: "Атлантический лосось", en: "Atlantic salmon", es: "Salmón atlántico" },
    latin: "Salmo salar",
    condition: "chilled",
    direction: "sale",
    monthlyVolume: "40",
    unit: "t",
    format: { ru: "Филе без кожи", en: "Skinless fillet", es: "Filete sin piel" },
    active: true,
  },
  {
    id: "shrimp",
    product: { ru: "Креветка ваннамей", en: "Vannamei shrimp", es: "Camarón vannamei" },
    latin: "Penaeus vannamei",
    condition: "cooked",
    direction: "purchase",
    monthlyVolume: "15 000",
    unit: "kg",
    format: { ru: "Очищенная, без головы", en: "Peeled, headless", es: "Pelado, sin cabeza" },
    active: true,
  },
  {
    id: "cod",
    product: { ru: "Атлантическая треска", en: "Atlantic cod", es: "Bacalao atlántico" },
    latin: "Gadus morhua",
    condition: "frozen",
    direction: "both",
    monthlyVolume: "12 000",
    unit: "kg",
    format: { ru: "Тушка потрошёная", en: "Gutted whole", es: "Eviscerado entero" },
    active: true,
  },
  {
    id: "mackerel",
    product: { ru: "Скумбрия", en: "Mackerel", es: "Caballa" },
    latin: "Scomber scombrus",
    condition: "frozen",
    direction: "sale",
    monthlyVolume: "800",
    unit: "oz",
    format: { ru: "Порционные куски", en: "Portion cuts", es: "Porciones" },
    active: true,
  },
  {
    id: "oyster",
    product: { ru: "Тихоокеанская устрица", en: "Pacific oyster", es: "Ostra del Pacífico" },
    latin: "Magallana gigas",
    condition: "live",
    direction: "purchase",
    monthlyVolume: "9 000",
    unit: "pcs",
    format: { ru: "В створке", en: "In shell", es: "En concha" },
    active: false,
  },
  {
    id: "trout",
    product: { ru: "Радужная форель", en: "Rainbow trout", es: "Trucha arcoíris" },
    latin: "Oncorhynchus mykiss",
    condition: "fresh",
    direction: "sale",
    monthlyVolume: "2 500",
    unit: "g",
    format: { ru: "Стейк", en: "Steak", es: "Filete grueso" },
    active: true,
  },
];
