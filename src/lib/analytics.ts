import posthog from "posthog-js";

export function trackEvent(name: string, params?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  posthog.capture(name, params);
}
