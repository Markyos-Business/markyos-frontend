"use client";

import { marketingHref } from "@/lib/marketing";

const COPY = {
  en: { label: "Markyos", help: "Help centre", privacy: "Privacy", terms: "Terms", contact: "Contact" },
  ar: { label: "ماركيوس", help: "مركز المساعدة", privacy: "الخصوصية", terms: "الشروط", contact: "تواصل معنا" },
} as const;

const LINKS = [
  ["help", "/help"],
  ["privacy", "/privacy"],
  ["terms", "/terms"],
  ["contact", "/contact"],
] as const;

/**
 * The quiet line at the end of every signed-in page: the year and name, and
 * the website's help and legal pages in the reader's language. Sits at the
 * bottom of the page's own column (give it `mt-auto` in a flex column), never
 * fixed to the window.
 */
export function AppFooter({ lang, className = "" }: { lang: "en" | "ar"; className?: string }) {
  const c = COPY[lang];
  return (
    // Spacing passed in (`className`) stays outside the divider.
    <footer className={className}>
      <div className="flex flex-col gap-space-3 border-t border-hairline pt-space-6 text-caption text-text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>
          © {new Date().getFullYear()} {c.label}
        </span>
        <nav aria-label={c.label}>
          <ul className="flex flex-wrap gap-x-space-6 gap-y-space-3 [@media(pointer:coarse)]:gap-y-0">
            {LINKS.map(([key, path]) => (
              <li key={key}>
                {/* About 44px tall on touch screens (WCAG 2.5.8 asks 24); unchanged under a mouse. */}
                <a href={marketingHref(path, lang)} target="_blank" rel="noopener noreferrer" className="inline-block text-text-muted hover:text-text [@media(pointer:coarse)]:py-space-5">
                  {c[key]}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
