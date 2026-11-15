/**
 * Browser error monitoring (Sentry), off unless NEXT_PUBLIC_SENTRY_DSN is set.
 *
 * Loaded on demand, so a build without a DSN ships none of the SDK. Errors
 * thrown before it finishes loading are missed, which is the price of costing
 * nothing when off. No personal data: no IP, cookies or form contents.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  void import("@sentry/nextjs").then((Sentry) =>
    Sentry.init({
      dsn,
      environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
      sendDefaultPii: false,
      tracesSampleRate: 0,
    }),
  );
}
