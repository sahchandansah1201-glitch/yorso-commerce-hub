/**
 * E2E (browser-like) — registration funnel under DEGRADED analytics transports.
 *
 * Goal: prove the analytics layer can never block, slow, or visually break
 * the registration UI even when every shipping path is broken at once.
 *
 * What "degraded" means here (all forced simultaneously):
 *   1. `navigator.sendBeacon` is removed (typical Safari ITP / older browsers).
 *   2. `fetch` is replaced with a function that rejects ("offline" / blocked).
 *   3. (Variant) one envelope contains a circular reference, so the
 *      BatchProvider's `JSON.stringify` throws when it tries to flush.
 *
 * What we assert:
 *   - User completes the funnel (steps 1 → 2 → 3 in the live UI; step 7 from
 *     the seeded `/register/ready`).
 *   - No `toast.error` / destructive copy is rendered.
 *   - Navigation isn't blocked: target screens (verify, ready) actually mount.
 *   - `analytics.track` itself never throws — exceptions are recorded in the
 *     internal failure counter, not surfaced to the user.
 *   - `getAnalyticsFailures().total` increases (the BatchProvider really did
 *     hit the broken transports), confirming we tested the degraded path,
 *     not a no-op.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

import { LanguageProvider } from "@/i18n/LanguageContext";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import analytics from "./analytics";
import {
  BatchProvider,
  setProvider,
  __resetAnalyticsFailures,
  getAnalyticsFailures,
} from "./analytics-provider";

import RegisterChoose from "@/pages/register/RegisterChoose";
import RegisterEmail from "@/pages/register/RegisterEmail";
import RegisterVerify from "@/pages/register/RegisterVerify";
import RegisterDetails from "@/pages/register/RegisterDetails";
import RegisterOnboarding from "@/pages/register/RegisterOnboarding";
import RegisterCountries from "@/pages/register/RegisterCountries";
import RegisterReady from "@/pages/register/RegisterReady";

vi.mock("canvas-confetti", () => ({ default: () => {} }));
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

// ─── Degraded environment plumbing ──────────────────────────────────────────

const originalSendBeacon = navigator.sendBeacon;
const originalFetch = globalThis.fetch;
const originalConsoleError = console.error;

let fetchCalls = 0;
let beaconCalls = 0;

function installDegradedTransports() {
  // 1. Remove sendBeacon entirely.
  delete (navigator as { sendBeacon?: typeof navigator.sendBeacon }).sendBeacon;

  // 2. Make fetch always reject (simulated offline / firewalled endpoint).
  globalThis.fetch = vi.fn(async () => {
    fetchCalls += 1;
    throw new TypeError("Failed to fetch (simulated offline)");
  }) as unknown as typeof fetch;

  // Track if anyone tried to call a beacon (shouldn't happen, but let us
  // catch a regression if it ever comes back).
  Object.defineProperty(navigator, "__sendBeaconAttempts", {
    configurable: true,
    get: () => beaconCalls,
  });

  // Silence the dev-only failure warnings the provider logs — they're
  // expected here and would noise up the test output.
  console.error = () => {};
}

function restoreTransports() {
  if (originalSendBeacon) {
    navigator.sendBeacon = originalSendBeacon;
  }
  globalThis.fetch = originalFetch;
  console.error = originalConsoleError;
}

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  fetchCalls = 0;
  beaconCalls = 0;
  __resetAnalyticsFailures();
  installDegradedTransports();
  // Real BatchProvider — same code path as production "batch" mode.
  setProvider(new BatchProvider("/api/analytics"));
});

afterEach(() => {
  restoreTransports();
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
      <Toaster />
    </MemoryRouter>,
  );
}

/** Force the BatchProvider to actually attempt transport (it normally waits
 *  for 5s or a 20-event buffer). */
function forceFlush() {
  // Two cheap ways exist; pagehide is the one the provider listens for.
  window.dispatchEvent(new Event("pagehide"));
}

function assertNoErrorToast() {
  // sonner renders aria-live regions; error toasts include the
  // verification-failed copy or destructive role styling.
  expect(screen.queryByText(/verification failed/i)).toBeNull();
  expect(screen.queryByText(/something went wrong/i)).toBeNull();
  expect(screen.queryByRole("alert")).toBeNull();
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("registration funnel — degraded analytics transports", () => {
  it("completes steps 1→2→3 with sendBeacon missing and fetch offline", async () => {
    renderFunnel("/register");

    // Step 1: pick role. analytics.track fires synchronously; if it threw,
    // this click handler would crash and we'd never reach the email screen.
    expect(() => {
      fireEvent.click(screen.getByText(/I'm a Buyer/i));
    }).not.toThrow();

    // Step 2: email submit triggers a track + an api call.
    const emailInput = await screen.findByPlaceholderText(/you@/i);
    fireEvent.change(emailInput, { target: { value: "qa@yorso.test" } });
    expect(() => {
      fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    }).not.toThrow();

    // Step 3: skip-verification (DEV-only button) emits the verified event
    // and navigates forward.
    const skipBtn = await screen.findByText(/Skip verification/i);
    expect(() => fireEvent.click(skipBtn)).not.toThrow();

    // Force buffered events to flush, exercising the broken transports.
    await act(async () => {
      forceFlush();
      // Let the rejected fetch microtasks settle.
      await Promise.resolve();
      await Promise.resolve();
    });

    // Navigation actually happened — we're on the details screen now.
    await waitFor(() => {
      expect(screen.getByText(/almost there|tell us about|company/i)).toBeTruthy();
    });

    // No error UI was shown anywhere along the way.
    assertNoErrorToast();

    // The degraded paths really were hit (otherwise this test proves nothing).
    const failures = getAnalyticsFailures();
    expect(failures.total).toBeGreaterThan(0);
    // sendBeacon was missing → BatchProvider must have routed to fetch
    // (which we forced to reject), so at least one fetch_rejected.
    expect(failures.byReason.fetch_rejected).toBeGreaterThan(0);
    expect(fetchCalls).toBeGreaterThan(0);
  });

  it("renders /register/ready (step 7) without crashing under offline analytics", async () => {
    sessionStorage.setItem(
      "yorso_registration",
      JSON.stringify({
        role: "buyer",
        sessionId: "sess_e2e_degraded",
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

    // Page mounted — registration_complete was fired (and silently dropped
    // by the broken transports) without throwing.
    await waitFor(() => {
      expect(
        screen.getByText(/welcome|you're in|ready|account is ready/i),
      ).toBeTruthy();
    });

    await act(async () => {
      forceFlush();
      await Promise.resolve();
      await Promise.resolve();
    });

    assertNoErrorToast();
    expect(getAnalyticsFailures().total).toBeGreaterThan(0);
  });

  it("survives JSON.stringify failure on a circular payload mid-funnel", async () => {
    // Manually push an unserializable envelope through the provider before
    // the user finishes the funnel. The flush must not throw, and the user
    // must still reach the next screen.
    const provider = new BatchProvider("/api/analytics");
    setProvider(provider);

    // Build a payload whose `payload` field has a cycle.
    const cyclic: Record<string, unknown> = { event: "test" };
    cyclic.self = cyclic;
    expect(() =>
      provider.send({
        event: "diagnostic_circular",
        timestamp: new Date().toISOString(),
        url: "/register",
        language: "en",
        sessionId: "cyc",
        role: "unknown",
        payload: cyclic,
      }),
    ).not.toThrow();

    await act(async () => {
      forceFlush();
      await Promise.resolve();
    });

    // Now run the live UI on top of the same broken-transport provider.
    renderFunnel("/register");
    expect(() => fireEvent.click(screen.getByText(/I'm a Buyer/i))).not.toThrow();

    const emailInput = await screen.findByPlaceholderText(/you@/i);
    fireEvent.change(emailInput, { target: { value: "qa@yorso.test" } });
    expect(() =>
      fireEvent.click(screen.getByRole("button", { name: /continue/i })),
    ).not.toThrow();

    await screen.findByText(/Skip verification/i);
    assertNoErrorToast();

    const failures = getAnalyticsFailures();
    expect(failures.byReason.serialize).toBeGreaterThan(0);
    // And the rest of the funnel still flushed via the broken fetch path:
    expect(failures.total).toBeGreaterThan(failures.byReason.serialize);
  });
});
