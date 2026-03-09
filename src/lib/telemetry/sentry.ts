/**
 * Sentry telemetry stub.
 * No DSN required; capture calls are no-ops when env is missing.
 */

const hasDsn =
  typeof process !== "undefined" &&
  typeof process.env !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SENTRY_DSN;

export function captureException(error: unknown): void {
  if (hasDsn) {
    // Dynamic import to avoid bundling when DSN not set
    import("@sentry/nextjs").then((Sentry) => {
      Sentry.captureException(error);
    }).catch(() => {});
  }
}

export function captureMessage(message: string, level?: "info" | "warning" | "error"): void {
  if (hasDsn) {
    import("@sentry/nextjs").then((Sentry) => {
      Sentry.captureMessage(message, level);
    }).catch(() => {});
  }
}

export function setUser(user: { id?: string; email?: string } | null): void {
  if (hasDsn) {
    import("@sentry/nextjs")
      .then((Sentry) => {
        Sentry.setUser(user);
      })
      .catch(() => {});
  }
}

// Example usage (no-op when DSN missing):
// import { captureException, captureMessage } from "@/lib/telemetry/sentry";
// try { ... } catch (e) { captureException(e); }
// captureMessage("User action", "info");
