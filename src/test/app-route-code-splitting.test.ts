import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync("src/App.tsx", "utf8");
const viteConfigSource = readFileSync("vite.config.ts", "utf8");

describe("app route code splitting", () => {
  it("keeps route pages lazy-loaded from the router shell", () => {
    const staticPageImports = appSource.match(/^import\s+\w+\s+from\s+["']\.\/pages\//gm) ?? [];

    expect(staticPageImports).toEqual([]);
    expect(appSource).toContain('import { lazy, Suspense } from "react";');
    expect(appSource).toContain('const Index = lazy(() => import("./pages/Index.tsx"));');
    expect(appSource).toContain('const Offers = lazy(() => import("./pages/Offers.tsx"));');
    expect(appSource).toContain('const Suppliers = lazy(() => import("./pages/Suppliers.tsx"));');
    expect(appSource).toContain(
      'const AdminIncidentTrendActions = lazy(() => import("./pages/admin/AdminIncidentTrendActions.tsx"));',
    );
    expect(appSource).toContain(
      'const AdminSupplierDocumentAudit = lazy(() => import("./pages/admin/AdminSupplierDocumentAudit.tsx"));',
    );
    expect(appSource).toContain("<Suspense fallback={<RouteFallback />}>");
    expect(appSource).toContain('import { RouteChunkErrorBoundary } from "./components/routing/RouteChunkErrorBoundary.tsx";');
    expect(appSource).toContain("<RouteChunkErrorBoundary>");
  });

  it("keeps the large local translation table in a named cacheable chunk", () => {
    expect(viteConfigSource).toContain("/src/i18n/translations.ts");
    expect(viteConfigSource).toContain('return "i18n-translations";');
    expect(viteConfigSource).toContain("manualChunks(id)");
  });
});
