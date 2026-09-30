"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { Icon } from "@/components/Icon";

/**
 * The app's own light/dark theme.
 *
 * Only the internal Markyos UI is themed here. The client-facing guideline
 * site sets its own palette from the brand's colours (see lib/theme.ts), so a
 * studio switching itself to light mode never changes what its client sees —
 * those are two different products with two different owners.
 */

export type ThemeChoice = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "markyos:theme";

/**
 * Runs before first paint, so the page never renders dark and then flips.
 * Kept in sync with `applyTheme` below — both read the same key and stamp the
 * same attribute.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var c=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})||"system";var d=c==="dark"||(c==="system"&&!window.matchMedia("(prefers-color-scheme: light)").matches);document.documentElement.setAttribute("data-theme",d?"dark":"light");}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;

function resolve(choice: ThemeChoice): "light" | "dark" {
  if (choice !== "system") return choice;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyTheme(choice: ThemeChoice) {
  document.documentElement.setAttribute("data-theme", resolve(choice));
}

interface ThemeValue {
  choice: ThemeChoice;
  resolved: "light" | "dark";
  setChoice: (c: ThemeChoice) => void;
}

const ThemeContext = createContext<ThemeValue>({ choice: "system", resolved: "dark", setChoice: () => {} });

export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoiceState] = useState<ThemeChoice>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("dark");

  useEffect(() => {
    // localStorage is external state with no render-time equivalent, so this
    // one-time read is the case the rule exists to allow.
    let stored: ThemeChoice = "system";
    try {
      const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (raw === "light" || raw === "dark" || raw === "system") stored = raw;
    } catch {
      // storage unavailable — fall through to "system"
    }
    // A one-time read out of localStorage, which has no render-time
    // equivalent: the pre-paint script already stamped the document, and this
    // only brings the React tree into agreement with it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChoiceState(stored);
    setResolved(resolve(stored));
    applyTheme(stored);
  }, []);

  // Following the OS means following it as it changes, not only at load.
  useEffect(() => {
    if (choice !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      setResolved(resolve("system"));
      applyTheme("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [choice]);

  const setChoice = useCallback((next: ThemeChoice) => {
    setChoiceState(next);
    setResolved(resolve(next));
    applyTheme(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // storage unavailable — the choice holds for this session only
    }
  }, []);

  return <ThemeContext.Provider value={{ choice, resolved, setChoice }}>{children}</ThemeContext.Provider>;
}

const OPTIONS: { key: ThemeChoice; icon: string; label: string; arLabel: string }[] = [
  { key: "light", icon: "sun", label: "Light", arLabel: "فاتح" },
  { key: "dark", icon: "moon", label: "Dark", arLabel: "داكن" },
  { key: "system", icon: "desktop", label: "System", arLabel: "النظام" },
];

/** A three-way light / dark / system switch for the app chrome. */
export function ThemeToggle({ isAr = false }: { isAr?: boolean }) {
  const { choice, setChoice } = useTheme();
  return (
    <div className="flex rounded-full p-0.5 shrink-0" style={{ background: "var(--surface-2)" }} role="group" aria-label={isAr ? "سمة الواجهة" : "Interface theme"}>
      {OPTIONS.map((o) => {
        const active = choice === o.key;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => setChoice(o.key)}
            aria-pressed={active}
            title={isAr ? o.arLabel : o.label}
            aria-label={isAr ? o.arLabel : o.label}
            className="h-7 w-7 grid place-items-center rounded-full cursor-pointer"
            style={{ background: active ? "var(--surface-0)" : "transparent", color: active ? "var(--accent)" : "var(--text-faint)" }}
          >
            <Icon name={o.icon} size={12} />
          </button>
        );
      })}
    </div>
  );
}
