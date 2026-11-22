"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark, CopyButton, DashboardCard, Tag, useTheme } from "@/components/ui";
import type { OverviewCopy } from "../copy";
import { glanceSlots, pick } from "../logic";
import type { Glance } from "../types";

type Slot = keyof ReturnType<typeof glanceSlots>;

/**
 * The brand as it stands: positioning, voice, audience, colours, logos and
 * typefaces, all from stored data.
 *
 * `project` (studio, freelancer: "The brand so far") shows every slot; an
 * empty one says where it comes from and links there. `home` (company:
 * "Brand at a glance") is read-only and shows only what exists, with each
 * colour's HEX one click from the clipboard.
 */
export function BrandGlanceCard({
  glance,
  mode,
  slug,
  copy,
  isAr,
  links = true,
}: {
  glance: Glance | null;
  mode: "project" | "home";
  slug: string;
  copy: OverviewCopy;
  isAr: boolean;
  /** Whether the reader can open the brand's pages (not a client). */
  links?: boolean;
}) {
  const { resolved } = useTheme();
  const has = glanceSlots(glance);
  const shown = (s: Slot) => mode === "project" || has[s];
  if (!Object.values(has).some(Boolean) && mode === "home") return null;
  const c = copy.soFar;
  const strategy = `/w/${slug}/strategy/positioning`;
  const identity = `/w/${slug}/visual-identity`;

  const empty = (text: string, href: string, go: string) => (
    <p className="text-body text-text-muted">
      {text}{" "}
      {links && (
        <Link href={href} className="mk-linkbtn text-accent-text">
          {go}
        </Link>
      )}
    </p>
  );

  const block = (title: string, body: ReactNode) => (
    <div className="flex min-w-0 flex-col gap-space-2">
      <h3 className="text-caption text-text-muted">{title}</h3>
      {body}
    </div>
  );

  return (
    <DashboardCard title={mode === "project" ? c.title : c.glanceTitle}>
      <div className="grid grid-cols-1 gap-space-8 md:grid-cols-2">
        {shown("positioning") &&
          block(
            c.positioning,
            has.positioning && glance ? (
              <div className="flex flex-col gap-space-2">
                {glance.positioning.en && <p dir="ltr" lang="en" className="text-body text-text">{glance.positioning.en}</p>}
                {glance.positioning.ar && <p dir="rtl" lang="ar" className="text-body text-text">{glance.positioning.ar}</p>}
              </div>
            ) : (
              empty(c.empty.positioning, strategy, c.goTo.strategy)
            ),
          )}
        {shown("voice") &&
          block(
            c.voice,
            has.voice && glance ? (
              <ul className="flex flex-wrap gap-space-2">
                {glance.voice.map((v, i) => (
                  <li key={i}>
                    <Tag tone="primary">{pick(v, isAr)}</Tag>
                  </li>
                ))}
              </ul>
            ) : (
              empty(c.empty.voice, `/w/${slug}/strategy/tone`, c.goTo.strategy)
            ),
          )}
        {shown("audience") &&
          block(
            c.audience,
            has.audience && glance ? (
              <div className="flex flex-col gap-space-1">
                {pick(glance.audience, isAr) && <p dir="auto" className="bidi-auto text-body text-text">{pick(glance.audience, isAr)}</p>}
                {glance.audience.personas > 0 && <p className="text-caption text-text-muted">{c.personas(glance.audience.personas)}</p>}
              </div>
            ) : (
              empty(c.empty.audience, `/w/${slug}/strategy/audience`, c.goTo.strategy)
            ),
          )}
        {shown("colors") &&
          block(
            c.colors,
            has.colors && glance ? (
              <ul className="flex flex-wrap gap-space-4">
                {glance.colors.map((color) => (
                  <li key={`${color.hex}-${color.name}`} className="flex items-center gap-space-3">
                    <span
                      aria-hidden
                      // The brand's own colour is data, so it stays inline.
                      className="size-8 shrink-0 rounded-lg shadow-[inset_0_0_0_1px_var(--chip-edge)]"
                      style={{ background: color.hex }}
                    />
                    <span className="flex flex-col">
                      <span dir="auto" className="bidi-auto text-caption text-text">{color.name}</span>
                      <bdi dir="ltr" className="text-caption tabular-nums text-text-muted">{color.hex.toUpperCase()}</bdi>
                    </span>
                    {mode === "home" && (
                      <CopyButton
                        variant="ghost"
                        size="xs"
                        text={color.hex.toUpperCase()}
                        aria-label={c.copyHex(color.hex.toUpperCase())}
                        copiedMessage={c.copiedHex(color.hex.toUpperCase())}
                      />
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              empty(c.empty.colors, `${identity}?tab=color`, c.goTo.identity)
            ),
          )}
        {shown("logos") &&
          block(
            c.logos,
            has.logos && glance ? (
              <ul className="flex flex-wrap gap-space-4">
                {glance.logos.map((logo) => (
                  <li key={logo.slot} className="grid h-14 min-w-14 place-items-center rounded-lg bg-surface-2 px-space-4">
                    <BrandMark src={logo.url} alt={logo.slot} onDark={resolved === "dark"} plate className="h-8 w-auto max-w-32" fallbackSize={16} />
                  </li>
                ))}
              </ul>
            ) : (
              empty(c.empty.logos, `${identity}?tab=logo`, c.goTo.identity)
            ),
          )}
        {shown("typefaces") &&
          block(
            c.typefaces,
            has.typefaces && glance ? (
              <dl className="grid grid-cols-[auto_1fr] gap-x-space-5 gap-y-space-1 text-body">
                {glance.typefaces.latin && (
                  <>
                    <dt className="text-text-muted">{c.latin}</dt>
                    <dd dir="ltr" className="text-text">{glance.typefaces.latin}</dd>
                  </>
                )}
                {glance.typefaces.arabic && (
                  <>
                    <dt className="text-text-muted">{c.arabic}</dt>
                    <dd dir="ltr" className="text-text">{glance.typefaces.arabic}</dd>
                  </>
                )}
              </dl>
            ) : (
              empty(c.empty.typefaces, `${identity}?tab=typography`, c.goTo.identity)
            ),
          )}
      </div>
    </DashboardCard>
  );
}
