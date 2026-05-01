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
    // Radix Tabs activates on pointerdown by default in @radix-ui
    fireEvent.pointerDown(trig, { button: 0, ctrlKey: false });
    fireEvent.mouseDown(trig, { button: 0 });
    fireEvent.click(trig);
    fireEvent.keyDown(trig, { key: "Enter" });
    fireEvent.keyDown(trig, { key: " " });
    const text = document.body.textContent ?? "";
    const idx = text.indexOf("Volume");
    console.log("Volume idx:", idx, "context:", JSON.stringify(text.slice(Math.max(0,idx-20), idx + 200)));
    console.log("Cases title present?", text.includes("Shipment reports"));
    console.log("aria-selected:", trig.getAttribute("aria-selected"));
    console.log("data-state:", trig.getAttribute("data-state"));
  });
});
