/**
 * Focused unit tests for SupplierRow:
 *  - no nested <button> inside another <button>
 *  - selection / primary CTA / shortlist invoke separate handlers
 *  - product preview images render with meaningful alt text
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SupplierRow } from "./SupplierRow";
import { mockSuppliers } from "@/data/mockSuppliers";

const supplier = mockSuppliers[0]; // Nordfjord Sjømat AS, has previews

const renderRow = (overrides: Partial<Parameters<typeof SupplierRow>[0]> = {}) => {
  const onSelect = vi.fn();
  const onShortlist = vi.fn();
  const onPrimaryAction = vi.fn();
  const utils = render(
    <MemoryRouter>
      <ul>
        <SupplierRow
          supplier={supplier}
          isSelected={false}
          isShortlisted={false}
          accessLevel="anonymous_locked"
          onSelect={onSelect}
          onShortlist={onShortlist}
          onPrimaryAction={onPrimaryAction}
          {...overrides}
        />
      </ul>
    </MemoryRouter>,
  );
  return { ...utils, onSelect, onShortlist, onPrimaryAction };
};

describe("SupplierRow", () => {
  it("renders an <article> root and never nests <button> inside <button>, and no a>button", () => {
    renderRow();
    const row = screen.getByTestId("supplier-row");
    expect(row.tagName.toLowerCase()).toBe("article");

    const buttons = row.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThanOrEqual(2); // CTA + shortlist (select is role=button on a div)
    for (const btn of Array.from(buttons)) {
      let parent = btn.parentElement;
      while (parent && parent !== row) {
        expect(parent.tagName.toLowerCase()).not.toBe("button");
        expect(parent.tagName.toLowerCase()).not.toBe("a");
        parent = parent.parentElement;
      }
    }
    expect(row.querySelectorAll("button button").length).toBe(0);
    expect(row.querySelectorAll("a button").length).toBe(0);
  });

  it("renders the supplier title as a Link to /suppliers/:id", () => {
    renderRow();
    const row = screen.getByTestId("supplier-row");
    const titleLink = within(row).getByTestId("supplier-row-title-link");
    expect(titleLink.tagName.toLowerCase()).toBe("a");
    expect(titleLink.getAttribute("href")).toBe(`/suppliers/${supplier.id}`);
  });

  it("renders an explicit Open profile link to /suppliers/:id", () => {
    renderRow();
    const row = screen.getByTestId("supplier-row");
    const openLink = within(row).getByTestId("supplier-row-open-profile");
    expect(openLink.tagName.toLowerCase()).toBe("a");
    expect(openLink.getAttribute("href")).toBe(`/suppliers/${supplier.id}`);
  });

  it("calls onSelect only when the supplier selection area is clicked", () => {
    const { onSelect, onShortlist, onPrimaryAction } = renderRow();
    const row = screen.getByTestId("supplier-row");
    const selectBtn = within(row).getByRole("button", {
      name: /select .* to review details/i,
    });
    fireEvent.click(selectBtn);

    expect(onSelect).toHaveBeenCalledWith(supplier.id);
    expect(onShortlist).not.toHaveBeenCalled();
    expect(onPrimaryAction).not.toHaveBeenCalled();
  });

  it("calls onPrimaryAction when the primary CTA is clicked, without onSelect", () => {
    const { onSelect, onPrimaryAction } = renderRow();
    const row = screen.getByTestId("supplier-row");
    const cta = within(row).getByRole("button", { name: /create account/i });
    fireEvent.click(cta);

    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
    expect(onPrimaryAction).toHaveBeenCalledWith(supplier);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("calls onShortlist when the shortlist button is clicked, without onSelect", () => {
    const { onSelect, onShortlist } = renderRow();
    const row = screen.getByTestId("supplier-row");
    const shortlist = within(row).getByRole("button", { name: /shortlist/i });
    fireEvent.click(shortlist);

    expect(onShortlist).toHaveBeenCalledWith(supplier.id);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("renders at least one product preview image with meaningful alt text", () => {
    renderRow();
    const row = screen.getByTestId("supplier-row");
    const imgs = within(row).getAllByRole("img");
    expect(imgs.length).toBeGreaterThan(0);

    const displayName = supplier.maskedName; // anonymous_locked → masked
    const firstSpecies = supplier.productFocus[0].species;
    const alt = imgs[0].getAttribute("alt") ?? "";
    expect(alt).toContain(firstSpecies);
    expect(alt).toContain(displayName);
  });

  it("renders a delivery-markets preview with country names", () => {
    renderRow();
    const row = screen.getByTestId("supplier-row");
    const list = within(row).getByLabelText(/delivery markets preview/i);
    const firstMarket = supplier.deliveryCountries[0];
    expect(within(list).getByText(firstMarket.name)).toBeInTheDocument();
  });

  it("does not leak companyName, website, or whatsapp in anonymous_locked", () => {
    renderRow({ accessLevel: "anonymous_locked" });
    const row = screen.getByTestId("supplier-row");
    expect(row.textContent ?? "").not.toContain(supplier.companyName);
    if (supplier.website) {
      expect(row.textContent ?? "").not.toContain(supplier.website);
      expect(row.querySelector(`a[href="${supplier.website}"]`)).toBeNull();
    }
    if (supplier.whatsapp) {
      expect(row.textContent ?? "").not.toContain(supplier.whatsapp);
    }
  });

  it("does not leak companyName, website, or whatsapp in registered_locked", () => {
    renderRow({ accessLevel: "registered_locked" });
    const row = screen.getByTestId("supplier-row");
    expect(row.textContent ?? "").not.toContain(supplier.companyName);
    if (supplier.website) {
      expect(row.querySelector(`a[href="${supplier.website}"]`)).toBeNull();
    }
  });

  it("renders the full companyName in qualified_unlocked", () => {
    renderRow({ accessLevel: "qualified_unlocked" });
    const row = screen.getByTestId("supplier-row");
    expect(within(row).getByText(supplier.companyName)).toBeInTheDocument();
    expect(row.textContent ?? "").not.toContain(supplier.maskedName);
  });

  it("does not render exact catalog breadth in locked states", () => {
    const hidden = supplier.totalProductsCount - 3;
    for (const level of ["anonymous_locked", "registered_locked"] as const) {
      const { unmount } = renderRow({ accessLevel: level });
      const row = screen.getByTestId("supplier-row");
      const text = row.textContent ?? "";
      expect(text).not.toContain(`+${hidden} products`);
      expect(text).not.toContain(`${supplier.totalProductsCount} products`);
      expect(text).toMatch(/More products after access/i);
      unmount();
    }
  });

  it("renders exact +N products chip in qualified_unlocked", () => {
    renderRow({ accessLevel: "qualified_unlocked" });
    const row = screen.getByTestId("supplier-row");
    const hidden = supplier.totalProductsCount - 3;
    if (hidden > 0) {
      expect(row.textContent ?? "").toContain(`+${hidden} products`);
    }
    expect(row.textContent ?? "").not.toMatch(/More products after access/i);
  });

  it("does not render exact delivery geography in locked states", () => {
    const hiddenMarkets = supplier.deliveryCountriesTotal - 3;
    for (const level of ["anonymous_locked", "registered_locked"] as const) {
      const { unmount } = renderRow({ accessLevel: level });
      const row = screen.getByTestId("supplier-row");
      const text = row.textContent ?? "";
      expect(text).not.toContain(`+${hiddenMarkets} markets`);
      expect(text).not.toContain(`${supplier.deliveryCountriesTotal} countries`);
      if (supplier.deliveryCountriesTotal > 3) {
        expect(text).toMatch(/More markets after access/i);
      }
      unmount();
    }
  });

  it("renders exact +N markets chip in qualified_unlocked", () => {
    renderRow({ accessLevel: "qualified_unlocked" });
    const row = screen.getByTestId("supplier-row");
    const hiddenMarkets = supplier.deliveryCountriesTotal - 3;
    if (hiddenMarkets > 0) {
      expect(row.textContent ?? "").toContain(`+${hiddenMarkets} markets`);
    }
    expect(row.textContent ?? "").not.toMatch(/More markets after access/i);
  });
});
