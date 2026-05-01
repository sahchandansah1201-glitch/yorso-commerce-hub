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
    fireEvent.pointerDown(trig, { button: 0 });
    fireEvent.click(trig);
    const text = document.body.textContent ?? "";
    console.log("Has 'Batch volume':", text.includes("Batch volume"));
    const idx = text.indexOf("Batch volume");
    console.log("ctx:", JSON.stringify(text.slice(idx, idx + 80)));
    // Поищем все числа с " t" / NBSP+t в конце
    const re = /\d[\d,. \u00A0\u202F]*[\u0020\u00A0\u202F]t(?![a-zA-Z])/gu;
    console.log("ton-like:", JSON.stringify(text.match(re)));
  });
});
