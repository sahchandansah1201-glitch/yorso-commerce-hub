/**
 * Deterministic local data for the P0 prototype. No network, no storage,
 * no product data is touched. Values are stable across renders so screenshots
 * and acceptance runs stay comparable.
 */
import type { ProtoLang, ProtoSectionKey } from "./copy";

export interface ProtoCompany {
  id: string;
  name: string;
  countryLabel: Record<ProtoLang, string>;
}

export const PROTO_COMPANIES: ProtoCompany[] = [
  {
    id: "nordkapp",
    name: "Nordkapp Seafood AS",
    countryLabel: { ru: "Норвегия", en: "Norway", es: "Noruega" },
  },
  {
    id: "atlantica",
    name: "Atlántica Pesca SL",
    countryLabel: { ru: "Испания", en: "España", es: "España" },
  },
];

export interface ProtoRow {
  id: string;
  name: Record<ProtoLang, string>;
  secondary?: string;
  kind: Record<ProtoLang, string>;
  responsible: string;
  volume: string;
  active: boolean;
  updated: string;
}

const row = (
  id: string,
  name: [string, string, string],
  kind: [string, string, string],
  responsible: string,
  volume: string,
  active: boolean,
  updated: string,
  secondary?: string,
): ProtoRow => ({
  id,
  name: { ru: name[0], en: name[1], es: name[2] },
  kind: { ru: kind[0], en: kind[1], es: kind[2] },
  responsible,
  volume,
  active,
  updated,
  secondary,
});

const productRows: ProtoRow[] = [
  row(
    "salmon",
    ["Атлантический лосось", "Atlantic salmon", "Salmón atlántico"],
    ["Продажа", "Selling", "Venta"],
    "Ingrid Halvorsen",
    "40 т",
    true,
    "06.09.2026 14:20",
    "Salmo salar",
  ),
  row(
    "shrimp",
    ["Креветка ваннамей", "Vannamei shrimp", "Camarón vannamei"],
    ["Закупка", "Buying", "Compra"],
    "Pablo Ortega",
    "15 т",
    false,
    "04.09.2026 09:05",
    "Penaeus vannamei",
  ),
  row(
    "cod",
    ["Атлантическая треска", "Atlantic cod", "Bacalao atlántico"],
    ["Закупка и продажа", "Buying and selling", "Compra y venta"],
    "Ingrid Halvorsen",
    "12 000 кг",
    true,
    "02.09.2026 17:40",
    "Gadus morhua",
  ),
  row(
    "mackerel",
    ["Скумбрия", "Mackerel", "Caballa"],
    ["Продажа", "Selling", "Venta"],
    "Marta Sun",
    "800 OZ",
    true,
    "01.09.2026 11:12",
    "Scomber scombrus",
  ),
];

const companyRows: ProtoRow[] = [
  row("bergen", ["Bergen Cold Store", "Bergen Cold Store", "Bergen Cold Store"], ["Склад", "Warehouse", "Almacén"], "Ingrid Halvorsen", "—", true, "05.09.2026 10:30"),
  row("vigo", ["Vigo Fish Trading", "Vigo Fish Trading", "Vigo Fish Trading"], ["Покупатель", "Buyer", "Comprador"], "Pablo Ortega", "—", true, "03.09.2026 16:00"),
  row("lisbon", ["Lisbon Retail Group", "Lisbon Retail Group", "Lisbon Retail Group"], ["Сеть", "Retail chain", "Cadena minorista"], "Marta Sun", "—", false, "28.08.2026 08:45"),
];

const contactRows: ProtoRow[] = [
  row("ingrid", ["Ингрид Хальворсен", "Ingrid Halvorsen", "Ingrid Halvorsen"], ["Закупки", "Procurement", "Compras"], "Nordkapp Seafood AS", "—", true, "05.09.2026 12:10"),
  row("pablo", ["Пабло Ортега", "Pablo Ortega", "Pablo Ortega"], ["Продажи", "Sales", "Ventas"], "Atlántica Pesca SL", "—", true, "04.09.2026 15:25"),
  row("marta", ["Марта Сун", "Marta Sun", "Marta Sun"], ["Логистика", "Logistics", "Logística"], "Vigo Fish Trading", "—", true, "01.09.2026 09:00"),
];

const taskRows: ProtoRow[] = [
  row("t1", ["Подтвердить объём на октябрь", "Confirm the October volume", "Confirmar el volumen de octubre"], ["Срок 09.09", "Due 09 Sep", "Vence 09 sep"], "Ingrid Halvorsen", "—", true, "06.09.2026 08:15"),
  row("t2", ["Уточнить условия оплаты", "Clarify the payment terms", "Aclarar las condiciones de pago"], ["Срок 11.09", "Due 11 Sep", "Vence 11 sep"], "Pablo Ortega", "—", true, "05.09.2026 18:40"),
];

const noteRows: ProtoRow[] = [
  row("n1", ["Готовы к отгрузке из Бергена", "Ready to ship from Bergen", "Listos para enviar desde Bergen"], ["Заметка", "Note", "Nota"], "Marta Sun", "—", true, "05.09.2026 13:55"),
  row("n2", ["Просят пробную партию", "They ask for a trial lot", "Piden un lote de prueba"], ["Заметка", "Note", "Nota"], "Pablo Ortega", "—", true, "02.09.2026 10:20"),
];

const searchRows: ProtoRow[] = [productRows[0], companyRows[1], contactRows[2]];

export const PROTO_ROWS: Record<ProtoSectionKey, ProtoRow[]> = {
  overview: [],
  companies: companyRows,
  contacts: contactRows,
  products: productRows,
  tasks: taskRows,
  notes: noteRows,
  search: searchRows,
};

export const PROTO_UPDATED_AT: Record<ProtoLang, string> = {
  ru: "6 сентября 2026, 14:20",
  en: "6 September 2026, 14:20",
  es: "6 de septiembre de 2026, 14:20",
};
