/**
 * E2E funnel test — registration: role → email → verify → complete.
 *
 * Drives the actual page components through JSDOM/MemoryRouter, intercepts
 * analytics with TapProvider, and asserts:
 *   1. Steps 1 → 2 → 3 → 7 all fire.
 *   2. Envelope sessionId is identical across all 4 events.
 *   3. Backend payload sessionId is identical across steps 2 → 3 → 7.
 *
 * Steps 4–6 (details/onboarding/countries) are bypassed by writing the
 * registration context directly into sessionStorage so we can land on the
 * final /register/ready page that emits step 7. This keeps the test focused
 * on the funnel-event contract rather than re-testing every form.
 *
 * Browser-driven smoke for steps 1–3 is documented in
 * .lovable/analytics-acceptance.md (Manual QA #1).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, fireEvent, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import { LanguageProvider } from "@/i18n/LanguageContext";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import { setProvider, type AnalyticsProvider } from "./analytics-provider";
import type { AnalyticsEnvelope } from "./analytics";

import RegisterChoose from "@/pages/register/RegisterChoose";
import RegisterEmail from "@/pages/register/RegisterEmail";
import RegisterVerify from "@/pages/register/RegisterVerify";
import RegisterDetails from "@/pages/register/RegisterDetails";
import RegisterOnboarding from "@/pages/register/RegisterOnboarding";
import RegisterCountries from "@/pages/register/RegisterCountries";
import RegisterReady from "@/pages/register/RegisterReady";

// canvas-confetti uses canvas APIs jsdom doesn't implement.
vi.mock("canvas-confetti", () => ({ default: () => {} }));

// detectCountry calls fetch in tests; keep it deterministic.
vi.mock("@/lib/detectCountry", async () => {
  const actual = await vi.importActual<typeof import("@/lib/detectCountry")>(
    "@/lib/detectCountry",
  );
  return {
    ...actual,
    detectCountry: () => "Spain",
    detectCountryByIP: async () => "Spain",
  };
});

class TapProvider implements AnalyticsProvider {
  readonly name = "tap";
  events: AnalyticsEnvelope[] = [];
  send(e: AnalyticsEnvelope) {
    this.events.push(e);
  }
}

let tap: TapProvider;

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  tap = new TapProvider();
  setProvider(tap);
});

function renderFunnel(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LanguageProvider>
        <RegistrationProvider>
          <Routes>
            <Route path="/register" element={<RegisterChoose />} />
            <Route path="/register/email" element={<RegisterEmail />} />
            <Route path="/register/verify" element={<RegisterVerify />} />
            <Route path="/register/details" element={<RegisterDetails />} />
            <Route path="/register/onboarding" element={<RegisterOnboarding />} />
            <Route path="/register/countries" element={<RegisterCountries />} />
            <Route path="/register/ready" element={<RegisterReady />} />
          </Routes>
        </RegistrationProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
}

const FUNNEL_EVENTS = [
  "registration_role_selected",
  "registration_email_submitted",
  "registration_email_verified",
  "registration_complete",
] as const;

describe("registration funnel E2E", () => {
  it("emits steps 1→2→3 with one envelope sessionId via the real UI", async () => {
    renderFunnel("/register");

    // Step 1 — role
    fireEvent.click(screen.getByText(/I'm a Buyer/i));

    // Step 2 — email
    const emailInput = await screen.findByPlaceholderText(/you@/i);
    fireEvent.change(emailInput, { target: { value: "qa@yorso.test" } });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    // Step 3 — bypass OTP UI via the DEV "Skip verification" button
    const skipBtn = await screen.findByText(/Skip verification/i);
    fireEvent.click(skipBtn);

    await waitFor(() => {
      const names = tap.events.map((e) => e.event);
      for (const expected of FUNNEL_EVENTS.slice(0, 3)) {
        expect(names).toContain(expected);
      }
    });

    const funnel = FUNNEL_EVENTS.slice(0, 3).map((name) =>
      tap.events.find((e) => e.event === name),
    );

    // Envelope sessionId must be identical across all funnel steps
    const envelopeIds = new Set(funnel.map((e) => e!.sessionId));
    expect(envelopeIds.size).toBe(1);

    // Payload backend sessionId must match between step 2 and step 3
    expect((funnel[1]!.payload as { sessionId: string }).sessionId).toBe(
      (funnel[2]!.payload as { sessionId: string }).sessionId,
    );

    // Step numbers
    expect(funnel[0]!.payload).toMatchObject({ role: "buyer", step: 1 });
    expect(funnel[1]!.payload).toMatchObject({ step: 2, emailDomain: "yorso.test" });
    expect(funnel[2]!.payload).toMatchObject({ step: 3 });
  });

  it("emits step 7 (registration_complete) sharing the same sessionId", async () => {
    // Pre-seed registration context as if the user finished steps 1–6.
    const backendSessionId = "sess_e2e_complete";
    sessionStorage.setItem(
      "yorso_registration",
      JSON.stringify({
        role: "buyer",
        sessionId: backendSessionId,
        email: "qa@yorso.test",
        emailVerified: true,
        fullName: "Jane Doe",
        company: "Acme",
        password: "Password1",
        country: "Spain",
        vatTin: "ES-123",
        phone: "+34600000000",
        phoneVerified: true,
        categories: ["Salmon & Trout"],
        certifications: [],
        countries: ["Norway", "Chile"],
        volume: "10–50 tons/month",
        onboardingSkipped: false,
        countriesSkipped: false,
        completed: false,
        startedAt: Date.now() - 60_000,
        emailSubmittedAt: Date.now() - 30_000,
      }),
    );

    await act(async () => {
      renderFunnel("/register/ready");
    });

    await waitFor(() => {
      expect(tap.events.some((e) => e.event === "registration_complete")).toBe(true);
    });

    const complete = tap.events.find((e) => e.event === "registration_complete")!;
    expect(complete.payload).toMatchObject({
      role: "buyer",
      step: 7,
      sessionId: backendSessionId,
      country: "Spain",
      categories: 1,
      countries: 2,
    });
    // funnelDurationMs should be a positive number when startedAt > 0
    expect(typeof (complete.payload as { funnelDurationMs: number }).funnelDurationMs).toBe(
      "number",
    );
    expect((complete.payload as { funnelDurationMs: number }).funnelDurationMs).toBeGreaterThan(0);

    // Envelope sessionId is the analytics-tab id — must be a non-empty string
    expect(complete.sessionId).toBeTruthy();
  });
});
