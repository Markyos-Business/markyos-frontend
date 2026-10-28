/**
 * Google Identity Services, loaded once on demand.
 *
 * Only the popup code flow is used: Google hands back a one-time code, and the
 * backend swaps it (with the client secret) for who the person is.
 */

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

type CodeResponse = { code?: string; error?: string };
type CodeClient = { requestCode: () => void };

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient: (config: {
            client_id: string;
            scope: string;
            ux_mode: "popup";
            callback: (response: CodeResponse) => void;
            error_callback?: (error: { type: string }) => void;
          }) => CodeClient;
        };
      };
    };
  }
}

let loading: Promise<void> | null = null;

/** Adds Google's script to the page the first time it's asked for. */
export function loadGoogleIdentity(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error("Google's sign-in script didn't load."));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export type { CodeClient, CodeResponse };
