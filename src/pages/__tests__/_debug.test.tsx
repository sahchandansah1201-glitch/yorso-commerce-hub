import { describe, it } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SupplierProfile from "@/pages/SupplierProfile";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";

describe("debug", () => {
  it("прогон", () => {
    cleanup();
    localStorage.setItem("yorso-lang", "en");
    render(
      <MemoryRouter initialEntries={["/suppliers/sup-no-001"]}>
        <LanguageProvider>
          <BuyerSessionProvider>
            <Routes>
              <Route path="/suppliers/:supplierId" element={<SupplierProfile />} />
            </Routes>
          </BuyerSessionProvider>
        </LanguageProvider>
      </MemoryRouter>,
    );
    const trig = screen.getByRole("tab", { name: /Shipment reports/i });
    fireEvent.click(trig);
    const text = document.body.textContent ?? "";
    // ищем «X t» через любые пробелы
    const matches = text.match(/\d+[\s\u00A0\u202F][a-zA-Zа-яА-Я]+/g) ?? [];
    console.log("MATCHES:", JSON.stringify(matches.slice(0, 30)));
    // и подстроки с " t" / " т"
    const tMatch = text.match(/\d[^\s]{0,8}[\s\u00A0\u202F]t\b/gu);
    console.log("T-MATCH:", JSON.stringify(tMatch));
    // surrounding "ton" word
    const idx = text.indexOf("Volume");
    console.log("Volume context:", JSON.stringify(text.slice(idx, idx + 200)));
  });
});
