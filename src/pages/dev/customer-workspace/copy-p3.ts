/**
 * P3 dictionary — company products (RU / EN / ES).
 * Local to the prototype route. No service names, no words about transition
 * or data exchange between systems: YORSO is one system for the user.
 */
import type { ProtoLang } from "./copy";

export type ProductUnitKey = "kg" | "g" | "t" | "pcs" | "oz";
export type ProductDirectionKey = "purchase" | "sale" | "both";
export type ProductConditionKey = "frozen" | "fresh" | "chilled" | "live" | "cooked";

export type ProductsDict = {
  pageTitle: string;
  hint: string;
  fields: {
    product: string;
    condition: string;
    direction: string;
    monthlyVolume: string;
    unit: string;
    format: string;
    status: string;
  };
  units: Record<ProductUnitKey, string>;
  directions: Record<ProductDirectionKey, string>;
  conditions: Record<ProductConditionKey, string>;
  statusActive: string;
  statusInactive: string;
  ozNote: string;
  editAction: string;
  readOnlyLabel: string;
  editPreviewTitle: string;
  editPreviewHint: string;
  positionSelectorLabel: string;
  newPositionOption: string;
  newPositionTitle: string;
  savedNotice: string;
  save: string;
  cancel: string;
  makeInactive: string;
  makeInactiveTitle: string;
  makeInactiveBody: string;
  makeInactiveConfirm: string;
  inactiveDone: string;
  emptyTitle: string;
  emptyBody: string;
  noCompanyTitle: string;
  noCompanyBody: string;
  listCount: string;
};

const ru: ProductsDict = {
  pageTitle: "Продукция компании",
  hint: "Позиции текущей компании: состояние, направление и объём в месяц.",
  fields: {
    product: "Продукт",
    condition: "Состояние",
    direction: "Закупка/Продажа",
    monthlyVolume: "Объём в месяц",
    unit: "Единица",
    format: "Разделка",
    status: "Статус",
  },
  units: { kg: "кг", g: "г", t: "т", pcs: "шт.", oz: "OZ" },
  directions: { purchase: "Закупка", sale: "Продажа", both: "Закупка и продажа" },
  conditions: {
    frozen: "Замороженный",
    fresh: "Свежий",
    chilled: "Охлаждённый",
    live: "Живой",
    cooked: "Варёный",
  },
  statusActive: "Активен",
  statusInactive: "Неактивен",
  ozNote: "1 OZ = 28,35 г",
  editAction: "Редактировать",
  readOnlyLabel: "Только просмотр",
  editPreviewTitle: "Изменение продукции компании",
  editPreviewHint: "Выберите позицию и измените её данные.",
  positionSelectorLabel: "Позиция продукции",
  newPositionOption: "Новая позиция",
  newPositionTitle: "Новая позиция",
  savedNotice: "Изменения сохранены.",
  save: "Сохранить",
  cancel: "Отмена",
  makeInactive: "Сделать неактивным",
  makeInactiveTitle: "Сделать позицию неактивной",
  makeInactiveBody:
    "Позиция останется в списке со статусом «Неактивен». Позиции не удаляются.",
  makeInactiveConfirm: "Сделать неактивным",
  inactiveDone: "Позиция показана как неактивная.",
  emptyTitle: "Пока нет позиций",
  emptyBody: "Добавленные позиции появятся в этом списке.",
  noCompanyTitle: "Нет доступной компании",
  noCompanyBody: "Продукция показывается после получения доступа к компании.",
  listCount: "Позиций",
};

const en: ProductsDict = {
  pageTitle: "Company products",
  hint: "Items of the current company: condition, direction and monthly volume.",
  fields: {
    product: "Product",
    condition: "Condition",
    direction: "Purchase/Sale",
    monthlyVolume: "Monthly volume",
    unit: "Unit",
    format: "Format / cut",
    status: "Status",
  },
  units: { kg: "kg", g: "g", t: "t", pcs: "pcs", oz: "OZ" },
  directions: { purchase: "Purchase", sale: "Sale", both: "Purchase and sale" },
  conditions: {
    frozen: "Frozen",
    fresh: "Fresh",
    chilled: "Chilled",
    live: "Live",
    cooked: "Cooked",
  },
  statusActive: "Active",
  statusInactive: "Inactive",
  ozNote: "1 OZ = 28.35 g",
  editAction: "Edit",
  readOnlyLabel: "Read only",
  editPreviewTitle: "Editing company products",
  editPreviewHint: "Select a position and change its data.",
  positionSelectorLabel: "Product position",
  newPositionOption: "New position",
  newPositionTitle: "New position",
  savedNotice: "Changes saved.",
  save: "Save",
  cancel: "Cancel",
  makeInactive: "Make inactive",
  makeInactiveTitle: "Make the item inactive",
  makeInactiveBody: "The item stays in the list with the Inactive status. Items are not deleted.",
  makeInactiveConfirm: "Make inactive",
  inactiveDone: "The item is shown as inactive.",
  emptyTitle: "No items yet",
  emptyBody: "Added items will appear in this list.",
  noCompanyTitle: "No available company",
  noCompanyBody: "Products are shown after access to a company is granted.",
  listCount: "Items",
};

const es: ProductsDict = {
  pageTitle: "Productos de la empresa",
  hint: "Artículos de la empresa actual: estado, dirección y volumen mensual.",
  fields: {
    product: "Producto",
    condition: "Estado",
    direction: "Compra/Venta",
    monthlyVolume: "Volumen mensual",
    unit: "Unidad",
    format: "Corte",
    status: "Estado del artículo",
  },
  units: { kg: "kg", g: "g", t: "t", pcs: "uds.", oz: "OZ" },
  directions: { purchase: "Compra", sale: "Venta", both: "Compra y venta" },
  conditions: {
    frozen: "Congelado",
    fresh: "Fresco",
    chilled: "Refrigerado",
    live: "Vivo",
    cooked: "Cocido",
  },
  statusActive: "Activo",
  statusInactive: "Inactivo",
  ozNote: "1 OZ = 28,35 g",
  editAction: "Editar",
  readOnlyLabel: "Solo lectura",
  editPreviewTitle: "Edición de los productos de la empresa",
  editPreviewHint: "Seleccione un artículo y cambie sus datos.",
  positionSelectorLabel: "Artículo de producto",
  newPositionOption: "Nuevo artículo",
  newPositionTitle: "Nuevo artículo",
  savedNotice: "Cambios guardados.",
  save: "Guardar",
  cancel: "Cancelar",
  makeInactive: "Desactivar",
  makeInactiveTitle: "Desactivar el artículo",
  makeInactiveBody:
    "El artículo permanece en la lista con el estado Inactivo. Los artículos no se eliminan.",
  makeInactiveConfirm: "Desactivar",
  inactiveDone: "El artículo se muestra como inactivo.",
  emptyTitle: "Todavía no hay artículos",
  emptyBody: "Los artículos añadidos aparecerán en esta lista.",
  noCompanyTitle: "Sin empresa disponible",
  noCompanyBody: "Los productos se muestran después de recibir acceso a una empresa.",
  listCount: "Artículos",
};

export const protoProductsCopy: Record<ProtoLang, ProductsDict> = { ru, en, es };

export const PRODUCT_UNITS: ProductUnitKey[] = ["kg", "g", "t", "pcs", "oz"];
export const PRODUCT_DIRECTIONS: ProductDirectionKey[] = ["purchase", "sale", "both"];
export const PRODUCT_CONDITIONS: ProductConditionKey[] = [
  "frozen",
  "fresh",
  "chilled",
  "live",
  "cooked",
];
