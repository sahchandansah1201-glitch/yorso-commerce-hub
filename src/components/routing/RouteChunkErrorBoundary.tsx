import { Component, type ErrorInfo, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RouteChunkErrorBoundaryProps {
  children: ReactNode;
  onReload?: () => void;
}

interface RouteChunkErrorBoundaryState {
  error: Error | null;
}

const reloadPage = () => {
  window.location.reload();
};

export class RouteChunkErrorBoundary extends Component<
  RouteChunkErrorBoundaryProps,
  RouteChunkErrorBoundaryState
> {
  state: RouteChunkErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): RouteChunkErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Route failed to render", error, errorInfo);
  }

  render() {
    if (!this.state.error) return this.props.children;

    const onReload = this.props.onReload ?? reloadPage;

    return (
      <main className="min-h-screen bg-background" role="alert" aria-live="assertive">
        <section className="container flex min-h-[70vh] items-center justify-center py-16">
          <div
            className="w-full max-w-xl rounded-lg border bg-card p-6 text-card-foreground shadow-sm sm:p-8"
            data-testid="route-chunk-error"
          >
            <p className="text-sm font-medium text-muted-foreground">YORSO route loading</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              This page did not finish loading.
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Reload the page to continue. Your YORSO session, access requests and workspace data are not changed by
              this screen.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button type="button" onClick={onReload} className="w-full sm:w-auto">
                <RefreshCw aria-hidden="true" />
                Reload page
              </Button>
              <Button type="button" variant="outline" onClick={() => window.history.back()} className="w-full sm:w-auto">
                Go back
              </Button>
            </div>
          </div>
        </section>
      </main>
    );
  }
}
