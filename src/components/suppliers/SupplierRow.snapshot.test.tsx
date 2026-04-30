/**
 * Visual / structural regression tests for SupplierRow.
 *
 * Two complementary safety nets:
 *  1. DOM snapshots per access level — fail if class names (incl. spacing
 *     utilities like mt-2.5/md:mt-4/pt-3/md:pt-5) or markup change unexpectedly.
 *  2. Block-order assertions — guarantee the visual reading order
 *     Title → Meta → About → Certifications → Signals stays stable even if
 *     the snapshot is intentionally regenerated.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SupplierRow } from "./SupplierRow";
import { mockSuppliers } from "@/data/mockSuppliers";
import type { AccessLevel } from "@/lib/access-level";

const supplier = mockSuppliers[0];

const renderRow = (accessLevel: AccessLevel) =>
  render(
    <MemoryRouter>
      <ul>
        <SupplierRow
          supplier={supplier}
          isSelected={false}
          isShortlisted={false}
          accessLevel={accessLevel}
          onSelect={vi.fn()}
          onShortlist={vi.fn()}
          onPrimaryAction={vi.fn()}
        />
      </ul>
    </MemoryRouter>,
  );

describe("SupplierRow — visual structure snapshots", () => {
  it("matches DOM snapshot for anonymous_locked", () => {
    renderRow("anonymous_locked");
    expect(screen.getByTestId("supplier-row")).toMatchSnapshot();
  });

  it("matches DOM snapshot for registered_locked", () => {
    renderRow("registered_locked");
    expect(screen.getByTestId("supplier-row")).toMatchSnapshot();
  });

  it("matches DOM snapshot for qualified_unlocked", () => {
    renderRow("qualified_unlocked");
    expect(screen.getByTestId("supplier-row")).toMatchSnapshot();
  });
});

describe("SupplierRow — block order is stable", () => {
  it("renders blocks in order: title → meta → about → certs → signals", () => {
    renderRow("anonymous_locked");
    const row = screen.getByTestId("supplier-row");

    const titleId = `supplier-${supplier.id}-title`;
    const metaId = `supplier-${supplier.id}-meta`;
    const aboutId = `supplier-${supplier.id}-about`;
    const certsId = `supplier-${supplier.id}-certs`;

    const title = row.querySelector(`#${titleId}`);
    const meta = row.querySelector(`#${metaId}`);
    const about = row.querySelector(`#${aboutId}`);
    const certs = row.querySelector(`#${certsId}`);
    const signals = row.querySelector('[aria-label="Supplier signals"]');

    expect(title).not.toBeNull();
    expect(meta).not.toBeNull();
    expect(about).not.toBeNull();
    expect(signals).not.toBeNull();

    // DOCUMENT_POSITION_FOLLOWING === 4 → second arg comes after first.
    const FOLLOWING = Node.DOCUMENT_POSITION_FOLLOWING;
    expect(title!.compareDocumentPosition(meta!) & FOLLOWING).toBeTruthy();
    expect(meta!.compareDocumentPosition(about!) & FOLLOWING).toBeTruthy();
    if (certs) {
      expect(about!.compareDocumentPosition(certs!) & FOLLOWING).toBeTruthy();
      expect(certs!.compareDocumentPosition(signals!) & FOLLOWING).toBeTruthy();
    } else {
      expect(about!.compareDocumentPosition(signals!) & FOLLOWING).toBeTruthy();
    }
  });

  it("preserves responsive spacing utilities on key blocks", () => {
    renderRow("anonymous_locked");
    const row = screen.getByTestId("supplier-row");

    const about = row.querySelector(`#supplier-${supplier.id}-about`);
    const meta = row.querySelector(`#supplier-${supplier.id}-meta`);
    const signals = row.querySelector('[aria-label="Supplier signals"]');

    // Mobile-first compact spacing + roomier desktop spacing.
    expect(about?.className).toMatch(/\bmt-2\.5\b/);
    expect(about?.className).toMatch(/\bmd:mt-4\b/);
    expect(meta?.className).toMatch(/\bmt-1\.5\b/);
    expect(meta?.className).toMatch(/\bmd:mt-2\b/);
    expect(signals?.className).toMatch(/\bpt-3\b/);
    expect(signals?.className).toMatch(/\bmd:pt-5\b/);
  });
});
