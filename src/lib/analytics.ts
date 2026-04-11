type EventPayload = Record<string, string | number | boolean | undefined>;

const analytics = {
  track(event: string, payload?: EventPayload) {
    const base = {
      timestamp: new Date().toISOString(),
      language: localStorage.getItem("yorso-lang") || "en",
      url: window.location.pathname,
    };
    const data = { event, ...base, ...payload };

    // Console log for development — replace with real provider
    if (import.meta.env.DEV) {
      console.log(`[YORSO Analytics]`, data);
    }

    // Future: send to analytics endpoint
    // fetch('/api/analytics', { method: 'POST', body: JSON.stringify(data) });
  },
};

// Scroll depth tracking — fires once per threshold per page load
let firedDepths = new Set<number>();

export function initScrollDepthTracking() {
  firedDepths = new Set();
  const handler = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    const pct = Math.round((scrollTop / docHeight) * 100);

    [25, 50, 75].forEach((threshold) => {
      if (pct >= threshold && !firedDepths.has(threshold)) {
        firedDepths.add(threshold);
        analytics.track(`scroll_depth_${threshold}`, { depth: threshold });
      }
    });
  };

  window.addEventListener("scroll", handler, { passive: true });
  return () => window.removeEventListener("scroll", handler);
}

// Section impression observer — fires once when section enters viewport
export function trackSectionImpression(
  element: HTMLElement | null,
  sectionName: string
) {
  if (!element) return () => {};
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        analytics.track("section_view", { section: sectionName });
        observer.disconnect();
      }
    },
    { threshold: 0.3 }
  );
  observer.observe(element);
  return () => observer.disconnect();
}

export default analytics;
