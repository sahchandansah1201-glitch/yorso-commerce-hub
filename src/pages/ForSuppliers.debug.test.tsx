import { describe, it } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ForSuppliers from "./ForSuppliers";
import { LanguageProvider } from "@/i18n/LanguageContext";

describe("debug", () => {
  it("dump headings", () => {
    const { container } = render(
      <MemoryRouter>
        <LanguageProvider>
          <ForSuppliers />
        </LanguageProvider>
      </MemoryRouter>
    );
    const hs = Array.from(container.querySelectorAll("h1,h2,h3,h4,h5,h6")) as HTMLElement[];
    for (const h of hs) {
      // eslint-disable-next-line no-console
      console.log(h.tagName, "::", (h.textContent || "").trim().slice(0, 60));
    }
  });
});
