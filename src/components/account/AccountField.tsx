/**
 * AccountField — публичное имя примитива для read-mode поля карточки
 * аккаунта. Это alias над уже существующим `Field` из `./fields`, чтобы
 * новый код мог импортировать примитивы под именами из спецификации
 * P0A без дублирования реализации.
 *
 * Старые импорты `import { Field } from "@/components/account/fields"`
 * продолжают работать.
 */
export { Field as AccountField, FormRow as AccountFormRow, fallback, splitList } from "./fields";
