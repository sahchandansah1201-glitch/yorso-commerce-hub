import * as React from "react";
import { describe, it } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SupplierProfile from "@/pages/SupplierProfile";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { vi } from "vitest";

vi.mock("@/components/ui/tabs", () => {
  const Pass = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
  return { Tabs: Pass, TabsList: Pass, TabsTrigger: ({ children }: any) => <button>{children}</button>, TabsContent: Pass };
});

describe("debug", () => {
  it("dumps", () => {
    localStorage.setItem("yorso-lang", "en");
    render(
      <MemoryRouter initialEntries={["/suppliers/sup-no-001"]}>
        <LanguageProvider><BuyerSessionProvider>
          <Routes><Route path="/suppliers/:supplierId" element={<SupplierProfile />} /></Routes>
        </BuyerSessionProvider></LanguageProvider>
      </MemoryRouter>
    );
    const text = document.body.textContent ?? "";
    // Find lines with 't' suffix patterns near digits
    const matches = text.match(/.{0,20}\d[^a-zA-Zа-я]{0,8}t[^a-zA-Z].{0,10}/g);
    console.log("MATCHES:", matches);
    console.log("HAS_VOLUME:", text.includes("Volume"));
    console.log("HAS_DOTS:", text.includes("•"));
  });
});
