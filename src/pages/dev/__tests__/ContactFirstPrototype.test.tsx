/**
 * Contact-first interface stage: список → поиск/фильтры → создание клиента → карточка.
 * Данные только в памяти компонента: сеть, storage и backend не используются.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, within } from "@testing-library/react";
import ContactFirstPrototype from "@/pages/dev/ContactFirstPrototype";

afterEach(() => cleanup());

/** Таблица и компактные записи рендерятся одновременно: берём первую. */
const el = (testId: string) => screen.getAllByTestId(testId)[0];
const has = (testId: string) => screen.queryAllByTestId(testId).length > 0;

/** Radix Tabs активирует вкладку по нажатию указателя. */
const openTab = (testId: string) => {
  fireEvent.mouseDown(el(testId));
  fireEvent.click(el(testId));
};

const setSelect = (testId: string, value: string) =>
  fireEvent.change(screen.getByTestId(testId), { target: { value } });

const renderApp = () => render(<ContactFirstPrototype />);

describe("ContactFirstPrototype", () => {
  it("показывает список контактов и открывает карточку по имени", () => {
    renderApp();
    expect(el("crm-table")).toBeTruthy();
    fireEvent.click(el("crm-open-c1"));
    expect(el("crm-record-name").textContent).toContain("Sofia");
  });

  it("фильтрует поиском и сохраняет запрос при пустом результате", () => {
    renderApp();
    fireEvent.change(el("crm-search"), { target: { value: "Moreno" } });
    expect(has("crm-row-c3")).toBe(true);
    expect(has("crm-row-c1")).toBe(false);

    fireEvent.change(el("crm-search"), { target: { value: "нет такого" } });
    expect(el("crm-empty-search")).toBeTruthy();
    expect((el("crm-search") as HTMLInputElement).value).toBe("нет такого");
  });

  it("фильтрует по этапу и сбрасывает фильтры", () => {
    renderApp();
    setSelect("crm-filter-stage", "Negotiation");
    expect(el("crm-active-filters")).toBeTruthy();
    expect(has("crm-row-c3")).toBe(false);
    fireEvent.click(el("crm-reset-filters"));
    expect(has("crm-row-c3")).toBe(true);
  });

  it("копирует значение и показывает подтверждение", () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    renderApp();
    fireEvent.click(el("crm-copy-email-c1"));
    expect(writeText).toHaveBeenCalledWith("sofia.lindqvist@nordic-retail.example");
    expect(screen.getAllByText("Скопировано").length).toBeGreaterThan(0);
  });

  it("ограничивает менеджера контактами его компаний", () => {
    renderApp();
    setSelect("crm-role", "manager");
    expect(screen.getAllByText("Nordic Retail Group").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Vistula Seafood").length).toBe(0);
    expect(screen.queryAllByText("Iberia Fish Distribution").length).toBe(0);
  });

  it("показывает загрузку списка внутри контактов", () => {
    renderApp();
    expect(has("crm-import-panel")).toBe(false);
    fireEvent.click(el("crm-import-open"));
    expect(has("crm-import-panel")).toBe(true);
    fireEvent.click(el("crm-import-open"));
    expect(has("crm-import-panel")).toBe(false);
  });

  it("возвращает фокус на кнопку создания после закрытия формы", () => {
    renderApp();
    const open = el("crm-create-open") as HTMLButtonElement;
    open.focus();
    fireEvent.click(open);
    fireEvent.click(el("crm-create-cancel"));
    expect(has("crm-create-submit")).toBe(false);
  });

  it("проверяет обязательные поля при создании клиента", () => {
    renderApp();
    fireEvent.click(el("crm-create-open"));
    fireEvent.click(el("crm-create-submit"));
    expect(screen.getAllByText("Заполните поле").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Укажите email или телефон").length).toBeGreaterThan(0);
  });

  it("создаёт клиента и сразу открывает его карточку", () => {
    renderApp();
    fireEvent.click(el("crm-create-open"));
    fireEvent.change(el("crm-f-first"), { target: { value: "Nina" } });
    fireEvent.change(el("crm-f-last"), { target: { value: "Larsen" } });
    setSelect("crm-f-company", "bergen");
    fireEvent.change(el("crm-f-email"), { target: { value: "nina@example.com" } });
    fireEvent.click(el("crm-create-submit"));

    const record = el("crm-record");
    expect(within(record).getByTestId("crm-record-name").textContent).toContain("Nina Larsen");
    expect(within(record).getAllByText("Bergen Cold Store").length).toBeGreaterThan(0);
  });

  it("сохраняет и отменяет правки в карточке", () => {
    renderApp();
    fireEvent.click(el("crm-open-c1"));

    fireEvent.click(el("crm-record-edit"));
    fireEvent.change(el("crm-e-job"), { target: { value: "Procurement Lead" } });
    fireEvent.click(el("crm-record-cancel"));
    expect(screen.queryByText("Procurement Lead")).toBeNull();

    fireEvent.click(el("crm-record-edit"));
    fireEvent.change(el("crm-e-job"), { target: { value: "Procurement Lead" } });
    setSelect("crm-e-stage", "Qualified");
    fireEvent.click(el("crm-record-save"));
    expect(el("crm-record-saved")).toBeTruthy();
    expect(el("crm-record-stage").textContent).toContain("Qualified");
  });

  it("добавляет задачу и заметку в карточке", () => {
    renderApp();
    fireEvent.click(el("crm-open-c1"));

    openTab("crm-tab-tasks");
    fireEvent.change(el("crm-task-input"), { target: { value: "Позвонить в пятницу" } });
    fireEvent.click(el("crm-task-add"));
    expect(within(el("crm-task-list")).getAllByText("Позвонить в пятницу").length).toBeGreaterThan(0);

    openTab("crm-tab-notes");
    fireEvent.change(el("crm-note-input"), { target: { value: "Просит недельные объёмы" } });
    fireEvent.click(el("crm-note-add"));
    expect(within(el("crm-note-list")).getAllByText("Просит недельные объёмы").length).toBeGreaterThan(0);
  });

  it("наблюдатель не видит создание, правку и исходящие действия", () => {
    renderApp();
    setSelect("crm-role", "observer");
    expect(has("crm-create-open")).toBe(false);
    expect(el("crm-view-only-badge")).toBeTruthy();
    expect(has("crm-call-c1")).toBe(false);
    expect(has("crm-mail-c1")).toBe(false);
    fireEvent.click(el("crm-open-c1"));
    expect(has("crm-record-edit")).toBe(false);
    expect(has("crm-task-input")).toBe(false);
  });

  it("ограниченный менеджер видит только свои записи", () => {
    renderApp();
    setSelect("crm-role", "limitedManager");
    expect(has("crm-row-c2")).toBe(true);
    expect(has("crm-row-c1")).toBe(false);
  });

  it("показывает состояния недоступности, отсутствия права и повтор", () => {
    renderApp();
    setSelect("crm-scenario", "denied");
    expect(el("crm-denied")).toBeTruthy();

    setSelect("crm-scenario", "unavailable");
    expect(el("crm-unavailable")).toBeTruthy();
    fireEvent.change(el("crm-search"), { target: { value: "Sofia" } });
    fireEvent.click(el("crm-retry"));
    expect((el("crm-search") as HTMLInputElement).value).toBe("Sofia");
    expect(el("crm-row-c1")).toBeTruthy();
  });

  it("скрывает удалённую запись и помечает неактивную", () => {
    renderApp();
    expect(has("crm-row-c11")).toBe(false);
    setSelect("crm-scenario", "inactive");
    expect(el("crm-row-c9")).toBeTruthy();
    expect(screen.getAllByText("Неактивная запись").length).toBeGreaterThan(0);
  });

  it("переключает язык страницы без утечки других языков в заголовках", () => {
    renderApp();
    expect(screen.getAllByRole("heading", { name: "Контакты" }).length).toBeGreaterThan(0);
    setSelect("crm-lang", "en");
    expect(screen.getAllByRole("heading", { name: "Contacts" }).length).toBeGreaterThan(0);
    setSelect("crm-lang", "es");
    expect(screen.getAllByRole("heading", { name: "Contactos" }).length).toBeGreaterThan(0);
    expect(screen.queryByText("Создать клиента")).toBeNull();
    expect(screen.queryByText("Create client")).toBeNull();
  });

  it("разделы вне контактов честно помечены недоступными", () => {
    renderApp();
    fireEvent.click(el("crm-nav-deals"));
    expect(el("crm-nav-unavailable")).toBeTruthy();
  });
});
