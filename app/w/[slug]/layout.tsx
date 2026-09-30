"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { Sidebar } from "@/components/workspace/Sidebar";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ slug: string }>();
  const { state, hydrated, getWorkspace } = useApp();
  const router = useRouter();
  const found = getWorkspace(params.slug);
  /*
   * The one place brand ownership is enforced.
   *
   * `getWorkspace` is deliberately unfiltered, because the client link at
   * /v/<slug> and a share link at /s/<token> both resolve through it with
   * nobody signed in. This is the studio-admin shell, where the opposite is
   * true: everything under it can edit, publish, invite and delete, so a brand
   * belonging to another account in this browser must not open here.
   *
   * Treated as "not found" rather than "not allowed", and bounced to the
   * gallery the same way a made-up slug is. Saying "that brand exists but
   * isn't yours" would confirm the slug to someone guessing at them.
   */
  const ws = found && found.ownerAccountId === state.session?.accountId ? found : undefined;

  useEffect(() => {
    if (!hydrated) return;
    if (!state.session) {
      // Come back here after signing in, rather than dumping them on the
      // gallery having forgotten what they clicked.
      router.replace(`/login?next=${encodeURIComponent(`/w/${params.slug}/overview`)}`);
      return;
    }
    if (!ws) router.replace("/brands");
  }, [hydrated, state.session, ws, router, params.slug]);

  const isAr = ws?.lang === "ar";

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
      <Sidebar workspace={ws} />
      <div className="flex-1 min-w-0 min-h-0 flex flex-col">{children}</div>
    </div>
  );
}
