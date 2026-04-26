/**
 * Contract: supplier-approval toast
 *  - Shown exactly once per unique `approvedAt` payload (dedup across remounts)
 *  - Falls back to a generic body when companyName is missing/blank
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { buyerSession } from "@/lib/buyer-session";
import { setQualified } from "@/lib/access-level";
import AccessLevelBanner from "@/components/catalog/AccessLevelBanner";

const successSpy = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => successSpy(...args),
  },
}));

const renderBanner = () =>
  render(
    <MemoryRouter>
      <LanguageProvider>
        <BuyerSessionProvider>
          <AccessLevelBanner />
        </BuyerSessionProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

beforeEach(() => {
  sessionStorage.clear();
  successSpy.mockClear();
  buyerSession.signIn({ identifier: "buyer@example.com", method: "email" });
});

afterEach(() => {
  cleanup();
  buyerSession.signOut();
  sessionStorage.clear();
});

describe("AccessLevelBanner — supplier-approval toast", () => {
  it("shows the toast once and dedups across remounts for the same approvedAt", () => {
    act(() => {
      setQualified(true, "Nordic Seafood AS");
    });
    const first = renderBanner();
    expect(successSpy).toHaveBeenCalledTimes(1);
    expect(successSpy.mock.calls[0]?.[1]?.description).toContain("Nordic Seafood AS");

    // Simulate navigation: same payload, fresh mount → must NOT re-fire.
    first.unmount();
    renderBanner();
    expect(successSpy).toHaveBeenCalledTimes(1);
  });

  it("uses fallback copy when companyName is empty / whitespace / missing", () => {
    for (const name of ["", "   ", undefined]) {
      successSpy.mockClear();
      act(() => {
        setQualified(false);
      });
      sessionStorage.clear();
      // signIn AFTER clearing storage — sessionStorage.clear() removed the
      // buyer-session entry too, so re-establish it before re-qualifying.
      buyerSession.signIn({ identifier: "buyer@example.com", method: "email" });
      act(() => {
        setQualified(true, name);
      });
      const { unmount } = renderBanner();
      expect(successSpy, `name=${JSON.stringify(name)}`).toHaveBeenCalledTimes(1);
      const description = String(successSpy.mock.calls[0]?.[1]?.description ?? "");
      expect(description).not.toContain("{company}");
      expect(description.toLowerCase()).not.toContain("nordic");
      unmount();
    }
  });

  it("re-announces after revoke + new approval (different approvedAt)", () => {
    act(() => {
      setQualified(true, "Supplier A");
    });
    const { unmount } = renderBanner();
    expect(successSpy).toHaveBeenCalledTimes(1);
    unmount();

    act(() => {
      setQualified(false);
      setQualified(true, "Supplier B");
    });
    renderBanner();
    expect(successSpy).toHaveBeenCalledTimes(2);
    expect(successSpy.mock.calls[1]?.[1]?.description).toContain("Supplier B");
  });
});
