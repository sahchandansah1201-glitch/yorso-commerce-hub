import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { translations } from "@/i18n/translations";
import CertificationBadges from "@/components/CertificationBadges";
import Header from "@/components/landing/Header";

const renderWithRu = (ui: React.ReactElement) => {
  localStorage.setItem("yorso-lang", "ru");
  return render(
    <MemoryRouter>
      <LanguageProvider>{ui}</LanguageProvider>
    </MemoryRouter>,
  );
};

describe("Russian locale renders system hints and modal copy in Russian", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("Header navigation hints are translated to Russian (ru locale)", () => {
    renderWithRu(<Header />);
    const ru = translations.ru;

    // Системные подсказки в шапке
    expect(screen.getByText(ru.nav_liveOffers)).toBeInTheDocument();
    expect(screen.getByText(ru.nav_categories)).toBeInTheDocument();
    expect(screen.getByText(ru.nav_howItWorks)).toBeInTheDocument();
    expect(screen.getByText(ru.nav_signIn)).toBeInTheDocument();
    expect(screen.getByText(ru.nav_registerFree)).toBeInTheDocument();

    // Не должно быть параллельных английских подсказок
    expect(screen.queryByText(translations.en.nav_signIn)).not.toBeInTheDocument();
    expect(screen.queryByText(translations.en.nav_howItWorks)).not.toBeInTheDocument();
  });

  it("Certification modal shows Russian labels (Кем выдан / Официальный сайт)", () => {
    const { container } = renderWithRu(
      <CertificationBadges certifications={["MSC"]} />,
    );
    const ru = translations.ru;

    // Открываем модалку через клик на бейдж
    const badge = container.querySelector("button");
    expect(badge).not.toBeNull();
    fireEvent.click(badge!);

    // shadcn Dialog рендерится в портале — ищем глобально
    const dialog = screen.getByRole("dialog");
    const u = within(dialog);

    // Подписи внутри модалки на русском
    expect(u.getByText(new RegExp(ru.cert_issuer, "i"))).toBeInTheDocument();
    expect(u.getByText(ru.cert_officialWebsite)).toBeInTheDocument();

    // И не показывается английская версия этих же подсказок
    expect(u.queryByText(translations.en.cert_issuer)).not.toBeInTheDocument();
    expect(u.queryByText(translations.en.cert_officialWebsite)).not.toBeInTheDocument();
  });

  it("Switching language updates UI hints reactively (en -> ru)", () => {
    // Стартуем с en и проверяем, что переключение на ru локализует подсказки
    localStorage.setItem("yorso-lang", "en");
    const { rerender } = render(
      <MemoryRouter>
        <LanguageProvider>
          <Header />
        </LanguageProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText(translations.en.nav_signIn)).toBeInTheDocument();

    // Переключаемся через клик: открыть выпадающий список языков и выбрать ru
    const langToggle = screen.getByText(/EN/i).closest("button");
    fireEvent.click(langToggle!);
    const ruOption = screen.getByText("Русский");
    fireEvent.click(ruOption);

    // После переключения должны появиться русские подсказки
    expect(screen.getByText(translations.ru.nav_signIn)).toBeInTheDocument();
    expect(screen.queryByText(translations.en.nav_signIn)).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <LanguageProvider>
          <Header />
        </LanguageProvider>
      </MemoryRouter>,
    );
  });
});
