"use client";

import { useEffect, useRef } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useApp } from "@/core/store/store";
import { canEdit, roleOn } from "@/core/data/access";
import { Sidebar } from "@/features/workspace";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ slug: string }>();
  const { state, hydrated, getWorkspace, uiLang, slugMoves } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const found = getWorkspace(params.slug);

  /**
   * The guidelines editor runs without the studio's own navigation.
   *
   * Every other page here is a form or a list, and the sidebar costs it nothing.
   * The editor is a canvas, and the sidebar was the fourth column of chrome
   * around it — studio nav, tools, top bar, inspector — leaving the page being
   * designed about half the window on a 1600px screen. A design tool earns its
   * keep by how much of the screen is the thing you are designing, so this one
   * takes the whole window and carries its own way back out.
   */
  const focused = !!pathname && /\/builder(\/|$)/.test(pathname);
  /*
   * The one place brand access is enforced in the app.
   *
   * `getWorkspace` is deliberately unfiltered, because the client link at
   * /v/<slug> and a share link at /s/<token> both resolve through it with
   * nobody signed in. This is the studio-admin shell, where the opposite is
   * true: only the brand's owner and the people on its team may open it. The
   * server enforces the same rule on every request; this decides what shows.
   *
   * Treated as "not found" rather than "not allowed", and bounced to the
   * gallery the same way a made-up slug is. Saying "that brand exists but
   * isn't yours" would confirm the slug to someone guessing at them.
   */
  const role = found ? roleOn(found, state.session) : null;
  const ws = role ? found : undefined;
  const readOnly = !!ws && !canEdit(role);

  /*
   * View only, at the source of input.
   *
   * The store already refuses a viewer's edits, but many fields keep a draft
   * of their own and would go on showing what was typed, some with a "saved"
   * toast after it. Stopping typing, pasting and dropping here, before any
   * page sees them, keeps every field showing the stored value. Clicks still
   * go through: tabs, links and anything else that only shows things.
   */
  const pane = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = pane.current;
    if (!el || !readOnly) return;
    const stop = (e: Event) => e.preventDefault();
    const events = ["beforeinput", "paste", "drop"] as const;
    events.forEach((type) => el.addEventListener(type, stop, true));
    return () => events.forEach((type) => el.removeEventListener(type, stop, true));
  }, [readOnly, ws]);

  useEffect(() => {
    if (!hydrated) return;
    if (!state.session) {
      // Come back here after signing in, rather than dumping them on the
      // gallery having forgotten what they clicked.
      router.replace(`/login?next=${encodeURIComponent(`/w/${params.slug}/overview`)}`);
      return;
    }
    if (ws) return;
    // The server moved this brand to a free address after it was created
    // here; follow it, keeping whichever page of the brand was open.
    const moved = slugMoves[params.slug];
    if (moved) router.replace(pathname.replace(`/w/${params.slug}`, `/w/${moved}`));
    else router.replace("/brands");
  }, [hydrated, state.session, ws, router, params.slug, slugMoves, pathname]);

  const isAr = uiLang(ws) === "ar";

  /*
   * The document's own direction follows the brand being worked on.
   *
   * The shell below already sets `dir` on its wrapper, which mirrors everything
   * *inside* it. What it cannot reach is anything rendered at the document root
   * — the toast stack and the dialog layer — so a confirmation in an Arabic
   * workspace appeared on the side the eye had just left, and the logical
   * properties those components use resolved against an LTR document and
   * quietly did nothing.
   *
   * Reset on the way out, because the gallery, the login page and a client's
   * guideline are not this brand and do not inherit its language.
   */
  useEffect(() => {
    if (!ws) return;
    const root = document.documentElement;
    const before = root.getAttribute("dir");
    root.setAttribute("dir", isAr ? "rtl" : "ltr");
    return () => {
      if (before) root.setAttribute("dir", before);
      else root.removeAttribute("dir");
    };
  }, [ws, isAr]);

  if (!hydrated || !state.session || !ws) return null;

  return (
    // Exactly one viewport tall, with the document itself locked: the studio
    // chrome (workspace sidebar, top bar) has to stay put while only the pane
    // a page designates scrolls. With `min-h-screen` the shell grew to content
    // height instead, so the whole document scrolled and took the chrome with
    // it — and any inner `flex-1 min-h-0 overflow-y-auto` never bounded, so it
    // never actually scrolled either.
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="h-screen flex overflow-hidden"
      style={{ fontFamily: isAr ? "var(--font-arabic)" : "var(--font-sans)" }}
    >
      {!focused && <Sidebar workspace={ws} />}
      <div ref={pane} className="flex-1 min-w-0 min-h-0 flex flex-col">
        {/* Typing does nothing for viewers and clients (above), and this is
            what tells them why. */}
        {readOnly && (
          <div
            role="status"
            className="px-7 py-2 text-[12.5px]"
            style={{ background: "var(--surface-1)", boxShadow: "inset 0 -1px 0 var(--hairline)", color: "var(--text-muted)" }}
          >
            {isAr
              ? "يمكنك عرض هذه العلامة فقط، دون تعديلها."
              : `You're a ${role} on this brand, so it's view only. Ask the owner if you need to make changes.`}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
