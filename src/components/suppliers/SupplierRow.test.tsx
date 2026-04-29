/**
 * Focused unit tests for SupplierRow:
 *  - no nested <button> inside another <button>
 *  - selection / primary CTA / shortlist invoke separate handlers
 *  - product preview images render with meaningful alt text
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { SupplierRow } from "./SupplierRow";
import { mockSuppliers } from "@/data/mockSuppliers";

const supplier = mockSuppliers[0]; // Nordfjord Sjømat AS, has previews

const renderRow = (overrides: Partial<Parameters<typeof SupplierRow>[0]> = {}) => {
  const onSelect = vi.fn();
  const onShortlist = vi.fn();
  const onPrimaryAction = vi.fn();
  const utils = render(
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
    </ul>,
  );
  return { ...utils, onSelect, onShortlist, onPrimaryAction };
};

describe("SupplierRow", () => {
  it("renders an <article> root and never nests <button> inside <button>", () => {
    renderRow();
    const row = screen.getByTestId("supplier-row");
    expect(row.tagName.toLowerCase()).toBe("article");

    const buttons = row.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThanOrEqual(3); // select + CTA + shortlist
    for (const btn of Array.from(buttons)) {
      let parent = btn.parentElement;
      while (parent && parent !== row) {
        expect(parent.tagName.toLowerCase()).not.toBe("button");
        parent = parent.parentElement;
      }
    }
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
    const cta = within(row).getByRole("button", { name: /create buyer account/i });
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
});
