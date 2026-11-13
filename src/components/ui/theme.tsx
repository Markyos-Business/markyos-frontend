"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { Icon } from "./icon";
import { THEME_STORAGE_KEY, type ThemeChoice } from "@/lib/interfaceTheme";

/**
 * The app's own light/dark theme.
 *
 * Only the internal Markyos UI is themed here. The client-facing guideline
 * site sets its own palette from the brand's colours (see lib/theme.ts), so a
 * studio switching itself to light mode never changes what its client sees —
 * those are two different products with two different owners.
 */

export type { ThemeChoice } from "@/lib/interfaceTheme";

function resolve(choice: ThemeChoice): "light" | "dark" {
  if (choice !== "system") return choice;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyTheme(choice: ThemeChoice) {
  document.documentElement.setAttribute("data-theme", resolve(choice));
}

/**
 * Switches the theme with every transition paused, so the swap is instant:
 * otherwise each button and card would crossfade its colours on its own clock
 * and the page would flash. Released two frames later, once the new colours
 * have painted.
 */
function switchTheme(choice: ThemeChoice) {
  const root = document.documentElement;
  root.setAttribute("data-theme-switching", "");
  applyTheme(choice);
  requestAnimationFrame(() => requestAnimationFrame(() => root.removeAttribute("data-theme-switching")));
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
      switchTheme("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [choice]);

  const setChoice = useCallback((next: ThemeChoice) => {
    setChoiceState(next);
    setResolved(resolve(next));
    switchTheme(next);
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
];

/**
 * A light / dark switch for the app chrome. Until someone picks, the theme
 * follows the device ("system"), and the switch shows whichever that is.
 */
export function ThemeToggle({ isAr = false }: { isAr?: boolean }) {
  const { resolved, setChoice } = useTheme();
  return (
    <div className="flex rounded-full p-0.5 shrink-0" style={{ background: "var(--surface-2)" }} role="group" aria-label={isAr ? "سمة الواجهة" : "Interface theme"}>
      {OPTIONS.map((o) => {
        const active = resolved === o.key;
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
            {/* The chosen one turns into place; the other turns away and settles smaller. */}
            <Icon
              name={o.icon}
              size={12}
              className={`mk-keep-motion transition-[rotate,scale] duration-base ease-out ${active ? "rotate-0 scale-100" : "-rotate-45 scale-90"}`}
            />
          </button>
        );
      })}
    </div>
  );
}
