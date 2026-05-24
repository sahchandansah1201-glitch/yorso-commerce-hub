import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouteChunkErrorBoundary } from "./RouteChunkErrorBoundary";

const BrokenRoute = () => {
  throw new Error("Failed to fetch dynamically imported module");
};

describe("RouteChunkErrorBoundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders route content when there is no error", () => {
    render(
      <RouteChunkErrorBoundary>
        <main>Loaded route</main>
      </RouteChunkErrorBoundary>,
    );

    expect(screen.getByText("Loaded route")).toBeInTheDocument();
  });

  it("shows a clear reload state when a lazy route fails", () => {
    const onReload = vi.fn();

    render(
      <RouteChunkErrorBoundary onReload={onReload}>
        <BrokenRoute />
      </RouteChunkErrorBoundary>,
    );

    expect(screen.getByTestId("route-chunk-error")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "This page did not finish loading." })).toBeInTheDocument();
    expect(screen.getByText(/Your YORSO session, access requests and workspace data are not changed/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reload page" }));

    expect(onReload).toHaveBeenCalledTimes(1);
  });
});
