/**
 * The badge funnel's four events, sent to Markyos's own backend: no cookie,
 * no third party, nothing personal. A visitor who has declined tracking (Do
 * Not Track, Global Privacy Control) sends nothing; the badge still shows.
 */

type BadgePageType = "form" | "moodboard" | "guide" | "other";
type BadgeEventName = "badge_viewed" | "badge_clicked" | "badge_signup_clicked" | "badge_learn_more_clicked";
type BadgeDevice = "desktop" | "tablet" | "mobile";

type BadgeEvent = {
  name: BadgeEventName;
  pageType: BadgePageType;
  pageId: string;
  workspaceId: string;
  locale: "ar" | "en";
  theme: "light" | "dark";
  device: BadgeDevice;
};

/** Whether this visitor declined analytics. */
function declinedTracking(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.doNotTrack === "1" || nav.globalPrivacyControl === true;
}

/** Fire and forget; it outlives a click that opens a new tab or leaves the page. */
function sendBadgeEvent(event: BadgeEvent) {
  if (typeof navigator === "undefined" || declinedTracking()) return;
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
  if (!base) return;
  void fetch(`${base}/public/badge/events/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
    keepalive: true,
    credentials: "omit",
  }).catch(() => undefined);
}

/** The visitor's screen as the funnel splits it. */
const deviceOf = (width: number): BadgeDevice => (width < 640 ? "mobile" : width < 1024 ? "tablet" : "desktop");

export { declinedTracking, deviceOf, sendBadgeEvent };
export type { BadgeDevice, BadgeEvent, BadgeEventName, BadgePageType };
