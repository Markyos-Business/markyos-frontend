"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { KINDS } from "../copy";
import { useContentLang } from "./use-content-lang";
import { useContentMe } from "./use-content-me";

export const CMS_HOME = "/admin/cms";

type NavItem = { key: string; label: string; icon: string; href: string; active: boolean };
export type CmsNavSection = { key: string; label: string; items: NavItem[] };

/**
 * The CMS part of the admin sidebar, for this person.
 *
 * Sections list only what the server lets them open: the content kinds in
 * their sections, the library, and (content admins only) redirects, traffic
 * and people. `role` is null for someone with no content access.
 */
export function useCmsNav(): { loading: boolean; role: string | null; sections: CmsNavSection[] } {
  const pathname = usePathname();
  const params = useSearchParams();
  const { lang, c } = useContentLang();
  const me = useContentMe();
  const data = me.data;
  if (me.loading || !data?.role) return { loading: me.loading, role: null, sections: [] };

  const kind = params.get("kind");
  const onList = pathname === CMS_HOME;
  const page = (key: string, label: string, icon: string): NavItem => {
    const href = `${CMS_HOME}/${key}`;
    return { key, label, icon, href, active: pathname === href };
  };
  const sections: CmsNavSection[] = [
    {
      key: "cms",
      label: c.nav.cms,
      items: [
        // An open article keeps "All content" lit: that is where it lives.
        { key: "all", label: c.allContent, icon: "globe", href: CMS_HOME, active: (onList && !kind) || pathname.startsWith(`${CMS_HOME}/articles/`) },
        ...KINDS.filter((k) => data.sections.includes(k.kind)).map((k) => ({
          key: k.kind,
          label: k.label[lang],
          icon: k.icon,
          href: `${CMS_HOME}?kind=${k.kind}`,
          active: onList && kind === k.kind,
        })),
      ],
    },
    // The Help Center's own screens, for anyone with the help section (HC-EPIC-001).
    ...(data.sections.includes("help")
      ? [{ key: "cms-help", label: c.nav.helpCenter, items: [
          // An open article keeps "Help articles" lit: that is where it lives.
          { key: "help-articles", label: c.nav.helpArticles, icon: "question-circle", href: `${CMS_HOME}/help`, active: pathname === `${CMS_HOME}/help` || pathname.startsWith(`${CMS_HOME}/help/articles/`) },
          page("help/categories", c.nav.helpCategories, "layer-group"),
          page("help/feedback", c.nav.helpFeedback, "inbox"),
          page("help/analytics", c.nav.helpAnalytics, "chart-line"),
        ] }]
      : []),
    {
      key: "cms-library",
      label: c.nav.library,
      items: [page("media", c.nav.media, "image"), page("taxonomy", c.nav.taxonomy, "layer-group")],
    },
    // Content admins only; the server refuses the rest anyway.
    ...(data.canPublish
      ? [
          {
            key: "cms-manage",
            label: c.nav.cmsManage,
            items: [
              page("redirects", c.nav.redirects, "external-link-alt"),
              page("traffic", c.nav.traffic, "chart-line"),
              page("people", c.nav.people, "users"),
            ],
          },
        ]
      : []),
  ];
  return { loading: false, role: data.role, sections };
}
