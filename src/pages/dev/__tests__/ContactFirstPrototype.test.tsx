/**
 * Contact-first interface stage: список → поиск/фильтры → создание клиента → карточка.
 * Данные только в памяти компонента: сеть, storage и backend не используются.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, within } from "@testing-library/react";
import ContactFirstPrototype from "@/pages/dev/ContactFirstPrototype";

afterEach(() => cleanup());

const setSelect = (testId: string, value: string) =>
  fireEvent.change(screen.getByTestId(testId), { target: { value } });

const renderApp = () => render(<ContactFirstPrototype />);

describe("ContactFirstPrototype", () => {
  it("показывает список контактов и открывает карточку по имени", () => {
    renderApp();
    expect(screen.getByTestId("crm-table")).toBeTruthy();
    fireEvent.click(screen.getByTestId("crm-open-c1"));
    expect(screen.getByTestId("crm-record-name").textContent).toContain("Sofia");
  });

  it("фильтрует поиском и сохраняет запрос при пустом результате", () => {
    renderApp();
    fireEvent.change(screen.getByTestId("crm-search"), { target: { value: "Moreno" } });
    expect(screen.queryByTestId("crm-row-c3")).toBeTruthy();
    expect(screen.queryByTestId("crm-row-c1")).toBeNull();

    fireEvent.change(screen.getByTestId("crm-search"), { target: { value: "нет такого" } });
    expect(screen.getByTestId("crm-empty-search")).toBeTruthy();
    expect((screen.getByTestId("crm-search") as HTMLInputElement).value).toBe("нет такого");
  });

  it("фильтрует по этапу и сбрасывает фильтры", () => {
    renderApp();
    setSelect("crm-filter-stage", "Negotiation");
    expect(screen.getByTestId("crm-active-filters")).toBeTruthy();
    expect(screen.queryByTestId("crm-row-c3")).toBeNull();
    fireEvent.click(screen.getByTestId("crm-reset-filters"));
    expect(screen.queryByTestId("crm-row-c3")).toBeTruthy();
  });

  it("копирует значение и показывает подтверждение", () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    renderApp();
    fireEvent.click(screen.getByTestId("crm-copy-email-c1"));
    expect(writeText).toHaveBeenCalledWith("sofia.lindqvist@nordic-retail.example");
    expect(screen.getAllByText("Скопировано").length).toBeGreaterThan(0);
  });

  it("проверяет обязательные поля при создании клиента", () => {
    renderApp();
    fireEvent.click(screen.getByTestId("crm-create-open"));
    fireEvent.click(screen.getByTestId("crm-create-submit"));
    expect(screen.getAllByText("Заполните поле").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Укажите email или телефон").length).toBeGreaterThan(0);
  });

  it("создаёт клиента и сразу открывает его карточку", () => {
    renderApp();
    fireEvent.click(screen.getByTestId("crm-create-open"));
    fireEvent.change(screen.getByTestId("crm-f-first"), { target: { value: "Nina" } });
    fireEvent.change(screen.getByTestId("crm-f-last"), { target: { value: "Larsen" } });
    setSelect("crm-f-company", "bergen");
    fireEvent.change(screen.getByTestId("crm-f-email"), { target: { value: "nina@example.com" } });
    fireEvent.click(screen.getByTestId("crm-create-submit"));

    const record = screen.getByTestId("crm-record");
    expect(within(record).getByTestId("crm-record-name").textContent).toContain("Nina Larsen");
    expect(within(record).getByText("Bergen Cold Store")).toBeTruthy();
  });

  it("сохраняет и отменяет правки в карточке", () => {
    renderApp();
    fireEvent.click(screen.getByTestId("crm-open-c1"));

    fireEvent.click(screen.getByTestId("crm-record-edit"));
    fireEvent.change(screen.getByTestId("crm-e-job"), { target: { value: "Procurement Lead" } });
    fireEvent.click(screen.getByTestId("crm-record-cancel"));
    expect(screen.queryByText("Procurement Lead")).toBeNull();

    fireEvent.click(screen.getByTestId("crm-record-edit"));
    fireEvent.change(screen.getByTestId("crm-e-job"), { target: { value: "Procurement Lead" } });
    setSelect("crm-e-stage", "Qualified");
    fireEvent.click(screen.getByTestId("crm-record-save"));
    expect(screen.getByTestId("crm-record-saved")).toBeTruthy();
    expect(screen.getByTestId("crm-record-stage").textContent).toContain("Qualified");
  });

  it("добавляет задачу и заметку в карточке", () => {
    renderApp();
    fireEvent.click(screen.getByTestId("crm-open-c1"));

    fireEvent.click(screen.getByTestId("crm-tab-tasks"));
    fireEvent.change(screen.getByTestId("crm-task-input"), { target: { value: "Позвонить в пятницу" } });
    fireEvent.click(screen.getByTestId("crm-task-add"));
    expect(within(screen.getByTestId("crm-task-list")).getByText("Позвонить в пятницу")).toBeTruthy();

    fireEvent.click(screen.getByTestId("crm-tab-notes"));
    fireEvent.change(screen.getByTestId("crm-note-input"), { target: { value: "Просит недельные объёмы" } });
    fireEvent.click(screen.getByTestId("crm-note-add"));
    expect(within(screen.getByTestId("crm-note-list")).getByText("Просит недельные объёмы")).toBeTruthy();
  });

  it("наблюдатель не видит создание, правку и исходящие действия", () => {
    renderApp();
    setSelect("crm-role", "observer");
    expect(screen.queryByTestId("crm-create-open")).toBeNull();
    expect(screen.getByTestId("crm-view-only-badge")).toBeTruthy();
    expect(screen.queryByTestId("crm-call-c1")).toBeNull();
    expect(screen.queryByTestId("crm-mail-c1")).toBeNull();
    fireEvent.click(screen.getByTestId("crm-open-c1"));
    expect(screen.queryByTestId("crm-record-edit")).toBeNull();
    expect(screen.queryByTestId("crm-task-input")).toBeNull();
  });

  it("ограниченный менеджер видит только свои записи", () => {
    renderApp();
    setSelect("crm-role", "limitedManager");
    expect(screen.queryByTestId("crm-row-c2")).toBeTruthy();
    expect(screen.queryByTestId("crm-row-c1")).toBeNull();
  });

  it("показывает состояния недоступности, отсутствия права и повтор", () => {
    renderApp();
    setSelect("crm-scenario", "denied");
    expect(screen.getByTestId("crm-denied")).toBeTruthy();

    setSelect("crm-scenario", "unavailable");
    expect(screen.getByTestId("crm-unavailable")).toBeTruthy();
    fireEvent.change(screen.getByTestId("crm-search"), { target: { value: "Sofia" } });
    fireEvent.click(screen.getByTestId("crm-retry"));
    expect((screen.getByTestId("crm-search") as HTMLInputElement).value).toBe("Sofia");
    expect(screen.getByTestId("crm-row-c1")).toBeTruthy();
  });

  it("скрывает удалённую запись и помечает неактивную", () => {
    renderApp();
    expect(screen.queryByTestId("crm-row-c11")).toBeNull();
    setSelect("crm-scenario", "inactive");
    expect(screen.getByTestId("crm-row-c9")).toBeTruthy();
    expect(screen.getAllByText("Неактивная запись").length).toBeGreaterThan(0);
  });

  it("переключает язык страницы без утечки других языков в заголовках", () => {
    renderApp();
    expect(screen.getByRole("heading", { name: "Контакты" })).toBeTruthy();
    setSelect("crm-lang", "en");
    expect(screen.getByRole("heading", { name: "Contacts" })).toBeTruthy();
    setSelect("crm-lang", "es");
    expect(screen.getByRole("heading", { name: "Contactos" })).toBeTruthy();
    expect(screen.queryByText("Создать клиента")).toBeNull();
  });

  it("разделы вне контактов честно помечены недоступными", () => {
    renderApp();
    fireEvent.click(screen.getByTestId("crm-nav-deals"));
    expect(screen.getByTestId("crm-nav-unavailable")).toBeTruthy();
  });
});
