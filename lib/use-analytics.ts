"use client";

interface ClientEvent {
  event_type: "copy" | "regenerate" | "add_more" | "refine" | "export";
  channel?: string;
  product?: string;
}

/** Fire-and-forget analytics event from the browser. Never throws. */
export function trackEvent(data: ClientEvent): void {
  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).catch(() => {/* non-fatal */});
}
