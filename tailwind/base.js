/**
 * Element defaults and the shared classes the app's markup relies on: what
 * used to be the global stylesheet, in the same order, registered with
 * Tailwind's addBase in tailwind.config.js.
 */
export const baseStyles = [
  /* Tailwind's theme lives in tailwind.config.js; the tokens it names live below. */
  {
    "*": {
      "box-sizing": "border-box",
    },
  },
  {
    "html, body": {
      "height": "100%",
    },
  },
  {
    "body": {
      "background": "var(--canvas)",
      "color": "var(--text)",
      "font-family": "var(--font-inter), system-ui, sans-serif",
      "-webkit-font-smoothing": "antialiased",
      /* Inter's alternate glyph set — the non-default body voice the design
       * system specifies. Arabic faces simply ignore features they don't ship. */
      "font-feature-settings": "\"cv01\", \"cv05\", \"cv09\", \"cv11\", \"ss03\", \"ss07\"",
    },
  },
  /*
   * Arabic display type keeps standard tracking. The negative letter-spacing
   * that gives the Latin display face its character pulls Arabic letterforms
   * into each other and breaks the joining behavior the script depends on, so
   * it is switched off wherever text runs right-to-left.
   */
  {
    "[dir=\"rtl\"] :is(h1, h2, h3, h4, h5, h6)": {
      "letter-spacing": "normal",
    },
  },
  // The utility half has to beat `tracking-tight` itself, as it did before
  // this moved here; an inline style on the element still wins.
  {
    "[dir=\"rtl\"] .tracking-tight:not([style*=\"letter-spacing\"])": {
      "letter-spacing": "normal !important",
    },
  },
  /*
   * Latin text inside an Arabic page has to be bidi-isolated or the algorithm
   * reorders its trailing punctuation to the wrong edge ("translated." renders
   * as ".translated"). `dir="auto"` picks the base direction from the first
   * strong character, so an untranslated Latin string keeps Latin layout while
   * Arabic content stays RTL.
   */
  {
    "[dir=\"rtl\"] .bidi-auto": {
      "unicode-bidi": "isolate",
    },
  },
  /*
   * Rich-text bodies mix scripts paragraph by paragraph, so each block picks its
   * own base direction from its first strong character instead of inheriting one
   * direction for the whole document. Without this, an English paragraph inside
   * an Arabic brand book renders its full stop on the wrong edge.
   */
  {
    ".overview-editor :is(p, h1, h2, h3, h4, blockquote, li), .vault-overview :is(p, h1, h2, h3, h4, blockquote, li), .docs-overview :is(p, h1, h2, h3, h4, blockquote, li), .studio-overview :is(p, h1, h2, h3, h4, blockquote, li), .signal-overview :is(p, h1, h2, h3, h4, blockquote, li), .atlas-overview :is(p, h1, h2, h3, h4, blockquote, li), .rich-text :is(p, h1, h2, h3, h4, blockquote, li, td, th)": {
      "unicode-bidi": "plaintext",
    },
  },
  /*
   * Rich strategy copy — one stylesheet for the editor, the studio's read view,
   * and the published guideline site, so what a studio proofreads is exactly
   * what a client gets. Colors come from custom properties that each surface
   * already defines (--text-* in the app, --g-text-* on the guideline site),
   * with the guideline overrides applied further down.
   */
  {
    ".rich-text > :first-child": {
      "margin-top": "0",
    },
  },
  {
    ".rich-text > :last-child": {
      "margin-bottom": "0",
    },
  },
  {
    ".rich-text p": {
      "margin": "0 0 12px",
      "line-height": "1.75",
    },
  },
  {
    ".rich-text :is(h1, h2, h3, h4)": {
      "margin": "20px 0 10px",
      "font-family": "var(--font-display)",
      "font-weight": "600",
      "line-height": "1.3",
      "letter-spacing": "-0.01em",
    },
  },
  {
    ".rich-text h1": {
      "font-size": "22px",
    },
  },
  {
    ".rich-text h2": {
      "font-size": "19px",
    },
  },
  {
    ".rich-text :is(h3, h4)": {
      "font-size": "16px",
    },
  },
  {
    ".rich-text :is(ul, ol)": {
      "margin": "0 0 12px",
      "padding-inline-start": "22px",
      "line-height": "1.7",
    },
  },
  {
    ".rich-text li": {
      "margin-bottom": "4px",
    },
  },
  {
    ".rich-text blockquote": {
      "margin": "0 0 12px",
      "padding": "12px 16px",
      "border-inline-start": "2px solid var(--accent)",
      "background": "var(--surface-2)",
      "border-radius": "0 10px 10px 0",
      "line-height": "1.7",
    },
  },
  {
    ".rich-text a": {
      "color": "var(--accent)",
      "text-decoration": "underline",
    },
  },
  {
    ".rich-text strong": {
      "font-weight": "600",
    },
  },
  /* Tables scroll rather than forcing the page to, so a wide comparison never
  breaks the column it sits in. */
  {
    ".rich-text table": {
      "width": "100%",
      "margin": "0 0 14px",
      "border-collapse": "collapse",
      "font-size": "13.5px",
      "display": "block",
      "overflow-x": "auto",
    },
  },
  {
    ".rich-text :is(th, td)": {
      "padding": "9px 12px",
      "text-align": "start",
      "vertical-align": "top",
      "line-height": "1.6",
      "box-shadow": "inset 0 0 0 1px var(--hairline)",
      "min-width": "110px",
    },
  },
  {
    ".rich-text th": {
      "font-weight": "600",
      "background": "var(--surface-2)",
    },
  },
  /*
   * The guideline page is the thing its own breakpoints measure.
   *
   * Every responsive override a studio sets is emitted as
   * `@container g-page (max-width: …)` — see `lib/doc/css/emit.ts` for why it is a
   * container query and not a media query. This is the one declaration that makes
   * those rules resolve, and it has to live on the element both surfaces have: the
   * template root, which is the editor's framed page and the published page alike.
   *
   * `inline-size` and not `size`: the page's height follows its content, and
   * containing that would collapse every section to nothing.
   */
  {
    "[data-guideline-surface]": {
      "container-type": "inline-size",
      "container-name": "g-page",
    },
  },
  /*
   * A studio's own column count, on any section grid that offers one.
   *
   * The element sets three custom properties (`lib/sectionOptions.ts`,
   * `columnVars`) and these three rules spend them. It has to be a stylesheet
   * rather than an inline style because the narrower steps are conditional, and a
   * container query rather than a media query for the reason the whole breakpoint
   * cascade is: the editor frames the page at 390px inside a wide window, so a
   * viewport query would never fire on the canvas.
   *
   * `[data-cols]` is set only when the studio chose a number. Without it the
   * layout's own responsive classes are untouched, which is what "unset means
   * whatever the layout does" means in practice. The attribute alone is the
   * selector — not `[data-layout][data-cols]` — because a layout can have a second
   * grid inside it that takes the same count, as the logo showcase does for its
   * secondary lockups.
   */
  // Kept above utility classes, as this rule was before it moved here: an
  // inline style on the element still wins (the :not guard).
  {
    "[data-cols]:not([style*=\"grid-template-columns\"])": {
      "grid-template-columns": "repeat(var(--cols), minmax(0, 1fr)) !important",
    },
  },
  // Kept above utility classes, as this rule was before it moved here: an
  // inline style on the element still wins (the :not guard).
  {
    "@container g-page (max-width: 1199px)": {
      "[data-cols]:not([style*=\"grid-template-columns\"])": {
        "grid-template-columns": "repeat(var(--cols-tablet), minmax(0, 1fr)) !important",
      },
    },
  },
  // Kept above utility classes, as this rule was before it moved here: an
  // inline style on the element still wins (the :not guard).
  {
    "@container g-page (max-width: 809px)": {
      "[data-cols]:not([style*=\"grid-template-columns\"])": {
        "grid-template-columns": "repeat(var(--cols-phone), minmax(0, 1fr)) !important",
      },
    },
  },
  /* The guideline site paints its own palette, so the same markup re-points at
  the brand's tokens instead of the app's. */
  {
    "[data-guideline-surface] .rich-text blockquote": {
      "border-inline-start-color": "var(--g-accent)",
      "background": "var(--g-surface-2)",
    },
  },
  {
    "[data-guideline-surface] .rich-text a": {
      "color": "var(--g-accent)",
    },
  },
  {
    "[data-guideline-surface] .rich-text :is(th, td)": {
      "box-shadow": "inset 0 0 0 1px var(--g-hairline)",
    },
  },
  {
    "[data-guideline-surface] .rich-text th": {
      "background": "var(--g-surface-2)",
    },
  },
  {
    "::selection": {
      "background": "var(--accent)",
      "color": "#fff",
    },
  },
  /*
   * Links default to inheriting their surrounding text color rather than the
   * accent blue: several links in this app are structural wrappers (a whole
   * card, a sidebar row) where blue text would read as a broken color, not a
   * link. Genuine inline text links opt into --accent explicitly instead.
   */
  /* Element defaults sit in Tailwind's base layer, so a class on the element
  (a link's `text-accent-text`, an input's `font-mono`) wins over them. */
  {
    "a": {
      "color": "inherit",
      "text-decoration": "none",
    },
  },
  {
    "input, textarea, button": {
      "font-family": "inherit",
    },
  },
  {
    "input::placeholder, textarea::placeholder": {
      "color": "var(--text-faint)",
    },
  },
  /*
   * Live guideline editing. These only ever apply inside the editor canvas —
   * the client-facing site renders the same components with no editing provider,
   * so none of these classes are emitted there.
   */
  {
    ".live-editable": {
      "outline": "none",
      "border-radius": "4px",
      "cursor": "text",
      "transition": "box-shadow 0.12s ease, background 0.12s ease",
    },
  },
  {
    ".live-editable:hover": {
      "box-shadow": "0 0 0 1px var(--accent-ring)",
    },
  },
  {
    ".live-editable:focus": {
      "box-shadow": "0 0 0 2px var(--accent)",
      /* Mixed from the accent rather than written as a literal. The literal was
      the dark theme's #0099ff, so on the light theme the field being typed into
      glowed in a blue the interface no longer uses. */
      "background": "color-mix(in srgb, var(--accent) 7%, transparent)",
    },
  },
  {
    ".live-editable:empty::before": {
      "content": "attr(data-placeholder)",
      "opacity": "0.4",
    },
  },
  {
    ".live-block": {
      "position": "relative",
      "border-radius": "8px",
      "transition": "box-shadow 0.12s ease",
    },
  },
  {
    ".live-block:hover": {
      "box-shadow": "0 0 0 1px var(--accent-ring)",
    },
  },
  {
    ".live-block[data-active]": {
      "box-shadow": "0 0 0 2px var(--accent)",
    },
  },
  {
    ".live-block[data-dragging]": {
      "opacity": "0.4",
    },
  },
  /* Where the dragged block will land. */
  {
    ".live-block[data-drop]": {
      "box-shadow": "0 -3px 0 0 var(--accent)",
    },
  },
  {
    ".live-block-toolbar": {
      "position": "absolute",
      "top": "-14px",
      "inset-inline-end": "8px",
      "z-index": "20",
      "display": "flex",
      "align-items": "center",
      "gap": "2px",
      "padding": "2px",
      "border-radius": "999px",
      "background": "#1c1c1c",
      "box-shadow": "0 0 0 1px rgba(255, 255, 255, 0.14), 0 6px 18px rgba(0, 0, 0, 0.5)",
    },
  },
  /*
   * A whole section of the page — derived or authored — under the same selection
   * and drag affordances as a block. The outline is the only thing that says a
   * derived section can be acted on at all, so it reads the same as a block's:
   * one set of manners for everything on the canvas.
   */
  {
    ".live-flow": {
      "position": "relative",
      "transition": "box-shadow 0.12s ease, opacity 0.12s ease",
    },
  },
  {
    ".live-flow:hover": {
      "box-shadow": "0 0 0 1px var(--accent-ring)",
    },
  },
  {
    ".live-flow[data-active]": {
      "box-shadow": "0 0 0 2px var(--accent)",
    },
  },
  {
    ".live-flow[data-dragging]": {
      "opacity": "0.4",
    },
  },
  /* Where the dragged section will land. */
  {
    ".live-flow[data-drop]": {
      "box-shadow": "0 -3px 0 0 var(--accent)",
    },
  },
  /* Parked sections stay visible to the studio and vanish from the client site. */
  {
    ".live-flow[data-parked]": {
      "opacity": "0.42",
    },
  },
  {
    ".live-flow-toolbar": {
      "position": "absolute",
      "top": "-14px",
      /*
       * At the section's *start* edge, not its end.
       *
       * A section is the full width of the page being previewed, and that page can
       * now be wider than the canvas it sits in — so a toolbar pinned to the end
       * edge was a toolbar 150px past the right edge of the screen, on the one
       * section the person had just selected in order to act on it. The start edge
       * is the one the eye is already at and the one that is always in view. It
       * cannot collide with the drag grip: the grip is drawn only while the section
       * is *not* selected, and this only while it is.
       */
      "inset-inline-start": "8px",
      "z-index": "25",
      "display": "flex",
      "align-items": "center",
      "gap": "2px",
      "padding": "2px",
      "border-radius": "999px",
      "background": "#1c1c1c",
      "box-shadow": "0 0 0 1px rgba(255, 255, 255, 0.14), 0 6px 18px rgba(0, 0, 0, 0.5)",
      /* Undoes the canvas frame's scale. See `--canvas-scale` in CanvasFrame: the
      page being previewed scales, the controls for editing it do not, or a 26px
      button is drawn at 13px on a half-scale canvas. `top right` so the toolbar
      grows away from the section's corner rather than over it. */
      "transform": "scale(calc(1 / var(--canvas-scale, 1)))",
      "transform-origin": "top left",
    },
  },
  /*
   * The handle that says a section can be moved.
   *
   * Quiet until the section is pointed at, and then unmistakable. It exists
   * because the only drag handle used to live inside the toolbar of an
   * already-selected section: reordering meant clicking the section, waiting for
   * a toolbar, then finding a grip — and nothing on the page said any of that was
   * possible. A handle that appears under the pointer is the whole affordance.
   */
  {
    ".live-flow-grip": {
      "position": "absolute",
      "top": "8px",
      "inset-inline-start": "-13px",
      "z-index": "24",
      "display": "grid",
      "place-items": "center",
      "width": "26px",
      "height": "26px",
      "border-radius": "8px",
      "cursor": "grab",
      "opacity": "0",
      "color": "var(--accent-ink)",
      "background": "var(--accent)",
      "box-shadow": "var(--shadow-pop)",
      /* Same reason as the toolbar: this is a 26px target and has to stay one. */
      "transform": "scale(calc(1 / var(--canvas-scale, 1)))",
      "transform-origin": "top left",
    },
  },
  // Kept above utility classes, as this rule was before it moved here: an
  // inline style on the element still wins (the :not guard).
  {
    // Not under reduced motion, where the rule at the end of this file
    // brings every transition down to nothing.
    "@media (prefers-reduced-motion: no-preference)": {
      ".live-flow-grip:not([style*=\"transition\"])": {
        "transition": "opacity 120ms ease !important",
      },
    },
  },
  {
    ".live-flow:hover > .live-flow-grip, .live-flow-grip:focus-visible": {
      "opacity": "1",
    },
  },
  // Kept above utility classes, as this rule was before it moved here: an
  // inline style on the element still wins (the :not guard).
  {
    ".live-flow-grip:active:not([style*=\"cursor\"])": {
      "cursor": "grabbing !important",
    },
  },
  {
    ".live-flow-parked": {
      "position": "absolute",
      "top": "8px",
      "inset-inline-start": "8px",
      "z-index": "24",
      "display": "flex",
      "align-items": "center",
      "gap": "5px",
      "padding": "3px 9px",
      "border-radius": "999px",
      "font-size": "10.5px",
      "font-weight": "600",
      "background": "#1c1c1c",
      "color": "#fff",
      "box-shadow": "0 0 0 1px rgba(255, 255, 255, 0.14)",
      /* A label rather than a target, but it has to stay readable. */
      "transform": "scale(calc(1 / var(--canvas-scale, 1)))",
      "transform-origin": "top left",
    },
  },
  /*
   * The gap between two sections, as a place to put something. Collapsed to a
   * thin strip until pointed at, so a page of them doesn't read as a page of
   * buttons — the content stays the thing being looked at.
   *
   * The strip's height never changes. It used to grow from 14px to 38px on
   * `:hover`, in the page's own flow — so pointing at a gap pushed every section
   * below it down 24px, and a page with fourteen gaps jolted fourteen times on
   * the way down it. Worse, it oscillated: the growth moved the strip out from
   * under a pointer that was standing still, which closed it, which moved it
   * back. Measured at ten scroll positions on the Vault canvas, the frame's
   * content height flipped between two values 24px apart with nothing touching
   * it.
   *
   * So the chrome inside the gap is drawn *over* the page instead of wedged into
   * it — the same rule `--canvas-scale` already applies to the section toolbar
   * and the drag grip. The page being previewed owns the layout; the tools for
   * editing it are not part of the page and may not move it.
   */
  {
    ".live-insert": {
      "position": "relative",
      "z-index": "22",
      "height": "14px",
      "opacity": "0",
      "transition": "opacity 0.12s ease",
    },
  },
  {
    ".live-insert:hover, .live-insert[data-open], .live-insert[data-armed]": {
      "opacity": "1",
    },
  },
  /*
   * Centred on the gap and taken out of flow, so opening one costs no height.
   *
   * `translate` rather than a translate inside `transform`: the trigger already
   * carries a `transform: scale(...)` to undo the canvas scale, and the two
   * properties compose — the element scales about its own centre and is then
   * moved by half its unscaled size, which lands its centre on the gap's centre
   * at any scale.
   */
  {
    ".live-insert > *": {
      "position": "absolute",
      "top": "50%",
      "inset-inline-start": "50%",
      "translate": "-50% -50%",
    },
  },
  /* Where the dragged element will land. Dashed until the pointer is actually
  over it, solid the moment it is — so one of a page full of gaps is clearly
  the one that will take the drop. */
  {
    ".live-insert-landing": {
      "display": "flex",
      "align-items": "center",
      "justify-content": "center",
      "gap": "6px",
      "width": "100%",
      /* Taller than the 14px strip it is centred on, and now the thing the pointer
      actually hits. The strip no longer grows to make room for a drop (see
      `.live-insert`), so without this the target would be a 14px band. Drag
      events bubble by DOM tree, not geometry, so the strip's own handlers still
      receive them from out here. */
      "min-height": "34px",
      "border-radius": "8px",
      "font-size": "11.5px",
      "font-weight": "600",
      "color": "var(--accent-text)",
      "box-shadow": "inset 0 0 0 1px var(--accent-ring)",
    },
  },
  {
    ".live-insert[data-over] .live-insert-landing": {
      "color": "var(--accent-ink)",
      "background": "var(--accent)",
      "box-shadow": "none",
    },
  },
  {
    ".live-insert-trigger": {
      "display": "flex",
      "align-items": "center",
      "gap": "6px",
      "height": "26px",
      "padding": "0 12px",
      "border-radius": "999px",
      "font-size": "11.5px",
      "font-weight": "600",
      "cursor": "pointer",
      /* Held at its real size against the canvas scale — see `--canvas-scale`.
      Centred in its strip, so growing it back out grows it evenly. */
      "transform": "scale(calc(1 / var(--canvas-scale, 1)))",
      "background": "var(--accent)",
      /*
       * Inked from the accent it sits on, not from a fixed white. This button
       * renders inside the guideline canvas, where `--accent` is the *brand's*
       * accent — so a brand with a bright accent got white-on-bright at 3:1. The
       * whole reason `--accent-ink` exists is that the right ink depends on which
       * accent is underneath.
       */
      "color": "var(--accent-ink)",
      "white-space": "nowrap",
    },
  },
  {
    ".live-insert-menu": {
      "display": "flex",
      "flex-wrap": "wrap",
      "justify-content": "center",
      "gap": "4px",
      "padding": "6px",
      "border-radius": "12px",
      "background": "#1c1c1c",
      "box-shadow": "0 0 0 1px rgba(255, 255, 255, 0.14), 0 8px 24px rgba(0, 0, 0, 0.5)",
    },
  },
  {
    ".live-insert-item": {
      "display": "flex",
      "align-items": "center",
      "gap": "6px",
      "height": "28px",
      "padding": "0 10px",
      "border-radius": "8px",
      "font-size": "11.5px",
      "font-weight": "500",
      "cursor": "pointer",
      "color": "#fff",
      "white-space": "nowrap",
    },
  },
  {
    ".live-insert-item:hover": {
      "background": "rgba(255, 255, 255, 0.12)",
    },
  },
  /*
   * Motion.
   *
   * Every animation here is short (120–260ms) and serves one of three jobs:
   * telling you something new arrived, telling you something is still happening,
   * or telling you that the thing you clicked is the thing that changed. Nothing
   * animates purely for decoration — on a tool people use all day, motion that
   * doesn't carry meaning becomes latency.
   *
   * The keyframes and `animate-*` classes are in tailwind.config.js; what is
   * left here is transitions and hover. All of it is disabled wholesale under
   * `prefers-reduced-motion` at the bottom of this file: for a viewer with
   * vestibular sensitivity, the movement is not a flourish, it's a symptom
   * trigger.
   */
  /*
   * The strip a hidden panel leaves on the edge.
   *
   * Dim until pointed at, so it stays out of the way of the canvas it just made
   * room for, and unmistakable the moment someone goes looking for it.
   */
  /*
   * A navigation row you are pointing at.
   *
   * The sidebar rows had a colour transition declared and nothing to transition
   * to, so the pointer crossed them with no response at all. The hover tint is
   * one step below the active row's, so "where I am" still outranks "where I
   * might go".
   */
  {
    ".mk-nav-item:hover": {
      "background": "var(--surface-1) !important",
      "color": "var(--text) !important",
    },
  },
  /*
   * A disclosure triangle that turns as it opens.
   *
   * `list-none` on the summary removes the browser's own marker, which is drawn
   * on the wrong side in Arabic and can't be restyled consistently; this is the
   * replacement, and it rotates the direction the writing runs.
   */
  {
    ".mk-disclosure": {
      "transition": "transform 160ms cubic-bezier(0.2, 0.7, 0.3, 1)",
    },
  },
  {
    "[dir=\"rtl\"] .mk-disclosure": {
      "transform": "rotate(180deg)",
    },
  },
  {
    "details[open] > summary .mk-disclosure": {
      "transform": "rotate(90deg)",
    },
  },
  {
    "summary::-webkit-details-marker": {
      "display": "none",
    },
  },
  {
    ".mk-reveal": {
      "opacity": "0.55",
    },
  },
  {
    ".mk-reveal:hover, .mk-reveal:focus-visible": {
      "opacity": "1",
      "background": "var(--surface-1)",
      "color": "var(--text)",
    },
  },
  /* ------------------------------------------------------------------------
   * The client-facing guideline site.
   *
   * A different surface with a different argument. Everything above is chrome for
   * a tool somebody has open all day, where motion that carries no meaning is
   * just latency. Below is the document a studio hands to its client: read once,
   * top to bottom, to decide whether the thing they need is in it. There, pacing
   * *is* meaning — it says a section has arrived and gives the eye somewhere to
   * land on a page ten thousand pixels long.
   *
   * Applied only under the `/v/<slug>` routes, through GuidelineMotion. The same
   * templates render inside the builder, which mounts none of this.
   * ------------------------------------------------------------------------ */
  /*
   * A section, arriving.
   *
   * Only an element the script has claimed is ever hidden — see SectionReveal.
   * Without JavaScript, without IntersectionObserver, or under reduced motion,
   * no element carries `data-reveal` at all and the page renders as it always
   * did. A decoration must not be able to fail into invisible content.
   */
  {
    "[data-reveal=\"pending\"]": {
      "opacity": "0",
      /* Vertical only, so there is nothing to mirror: the page reads downward in
      both directions. */
      "transform": "translateY(20px)",
    },
  },
  {
    "[data-reveal=\"in\"]": {
      "opacity": "1",
      "transform": "none",
      "transition": "opacity 620ms cubic-bezier(0.22, 0.7, 0.3, 1),\n    transform 620ms cubic-bezier(0.22, 0.7, 0.3, 1)",
    },
  },
  /*
   * A section whose cards do the moving only fades.
   *
   * Otherwise the section rises and its contents rise inside it, which reads as
   * two things happening to the same content — the sort of motion that makes a
   * page feel busy rather than composed. Here the section arrives and its cards
   * settle into it.
   */
  {
    "[data-reveal=\"pending\"][data-reveal-items]": {
      "transform": "none",
    },
  },
  /* The cards, arriving one after another. `--reveal-delay` is set per card by
  claimCards; the fallback keeps this meaningful if it is ever absent. */
  {
    "[data-reveal=\"pending\"] [data-reveal-item]": {
      "opacity": "0",
      "transform": "translateY(16px)",
    },
  },
  {
    "[data-reveal=\"in\"] [data-reveal-item]": {
      "opacity": "1",
      "transform": "none",
      "transition": "opacity 540ms cubic-bezier(0.22, 0.7, 0.3, 1) var(--reveal-delay, 0ms),\n    transform 540ms cubic-bezier(0.22, 0.7, 0.3, 1) var(--reveal-delay, 0ms)",
    },
  },
  /*
   * How far through the document you are.
   *
   * `scaleX` from the leading edge, so it fills the way the language reads.
   * `transform-origin` has no logical keyword, so the direction is switched
   * rather than computed.
   */
  {
    ".g-progress-track": {
      "position": "fixed",
      "top": "0",
      "inset-inline": "0",
      "height": "2px",
      "z-index": "60",
      "pointer-events": "none",
      "background": "transparent",
    },
  },
  {
    ".g-progress-bar": {
      "height": "100%",
      "background": "var(--g-accent, var(--accent))",
      "transform": "scaleX(0)",
      "transform-origin": "left center",
      "will-change": "transform",
    },
  },
  {
    "[dir=\"rtl\"] .g-progress-bar": {
      "transform-origin": "right center",
    },
  },
  /*
   * A control that has been pressed.
   *
   * Every button squeezes to 97% on pointer-down. It exists because on a canvas
   * where most clicks change something off to the side, the button itself
   * should still confirm it received the click; the same squeeze everywhere so
   * no button presses differently from another.
   */
  {
    "button:not(:disabled):active, [role=\"button\"]:active": {
      "transform": "scale(0.97)",
    },
  },
  /*
   * A card, as an object on the page rather than a slightly different grey.
   *
   * Almost every surface in this app is drawn as a fill with no border, and a
   * fill is not enough to say where one surface stops. `--surface-1` on
   * `--canvas` measured **1.06:1 on the dark theme** and 1.18:1 on the light one,
   * and near black the fill cannot be pushed further without lightening the
   * deepest card the whole text ramp is solved against. So the boundary is a
   * line, and this is it.
   *
   * `inset` rather than a border, because a border changes layout: every one of
   * these call sites sizes itself with padding and a fixed height, and adding 2px
   * of box to a few hundred of them is a different change entirely.
   *
   * Any inline `boxShadow` at a call site outranks this, which is the behaviour
   * wanted: a card that draws its own selection ring keeps drawing it.
   */
  // Kept above utility classes, as this rule was before it moved here: an
  // inline style on the element still wins (the :not guard).
  {
    ".mk-surface:not([style*=\"box-shadow\"]), .mk-card:not([style*=\"box-shadow\"])": {
      "box-shadow": "inset 0 0 0 1px var(--hairline-strong) !important",
    },
  },
  /*
   * A card that responds to being pointed at.
   *
   * The lift is 2px. It is enough to say "this is one object and it is
   * interactive" and small enough that a grid of them doesn't ripple as the
   * pointer crosses it. The edge switches to the accent rather than being joined
   * by a second ring outside it — two concentric rings on hover read as the card
   * having grown, which is a different message from "this one".
   */
  // Kept above utility classes, as this rule was before it moved here: an
  // inline style on the element still wins (the :not guard).
  {
    // Not under reduced motion, where the rule at the end of this file
    // brings every transition down to nothing.
    "@media (prefers-reduced-motion: no-preference)": {
      ".mk-card:not([style*=\"transition\"])": {
        "transition": "box-shadow var(--duration-fast) var(--ease-out), transform var(--duration-fast) var(--ease-out) !important",
      },
    },
  },
  {
    "@media (hover: hover) and (pointer: fine)": {
      ".mk-card:hover, .mk-card:focus-visible": {
        "transform": "translateY(-2px)",
      },
    },
  },
  // Kept above utility classes, as this rule was before it moved here: an
  // inline style on the element still wins (the :not guard).
  {
    ".mk-card:hover:not([style*=\"box-shadow\"]), .mk-card:focus-visible:not([style*=\"box-shadow\"])": {
      "box-shadow": "inset 0 0 0 1px var(--accent-edge), var(--shadow-pop) !important",
    },
  },
  /* Interactive surfaces settle rather than snap. */
  // Kept above utility classes, as this rule was before it moved here: an
  // inline style on the element still wins (the :not guard).
  {
    // Not under reduced motion, where the rule at the end of this file
    // brings every transition down to nothing.
    "@media (prefers-reduced-motion: no-preference)": {
      "button:not([style*=\"transition\"]), [role=\"button\"]:not([style*=\"transition\"]), a:not([style*=\"transition\"]), summary:not([style*=\"transition\"])": {
        "transition-property": "color, background-color, border-color, box-shadow, opacity, transform, translate, scale !important",
        "transition-duration": "var(--duration-fast) !important",
        "transition-timing-function": "var(--ease-out) !important",
      },
    },
  },
  /*
   * A control answers the pointer. All of them, without being asked to.
   *
   * An interaction sweep across fifteen screens in both themes found 145 distinct
   * controls where hovering changed nothing measurable at all — the sidebar's
   * brand link, the theme switcher, the language toggle, Accept and Reject on the
   * drafts queue. Not a handful of oversights: a systemic gap, and it has one
   * cause.
   *
   * Almost everything in this app is coloured with an inline `style={{ background
   * }}`, because the colours are tokens resolved in TypeScript. **An inline style
   * cannot express `:hover`.** And a stylesheet rule that sets `background-color`
   * on hover loses to the inline declaration, whatever its specificity — that is
   * the cascade working correctly. So the usual fix is to add a hover class at
   * every call site, which is several hundred edits and one forgotten call site
   * away from being back where it started.
   *
   * `background-image` is a *different property*. Nothing in the app sets it on a
   * control, so a veil painted there composites straight over whatever colour the
   * inline style chose, with no call site to remember.
   *
   * It does need `!important`, and this is the case that word exists for. Most of
   * these call sites write the `background` **shorthand**, and a shorthand sets
   * every longhand it covers — including `background-image: none`, inline. So the
   * first version of this rule applied to exactly the controls that happened to
   * use `backgroundColor` and silently skipped every one that used `background`.
   * The probe caught it: `hovered=true` and `background-image: none` on the same
   * element. `!important` on a stylesheet declaration outranks a normal inline
   * one, which is the only mechanism CSS offers here short of editing several
   * hundred call sites and hoping nobody adds a new one.
   *
   * The veil is a tint of `currentColor` rather than a fixed black or white. That
   * is what makes one rule correct everywhere: in this design system the ink is
   * always the opposite of the fill, by construction, so a tint of the ink always
   * moves the surface *away* from where it was. A white button with dark ink
   * darkens; a dark button with light ink lightens; a transparent button tints
   * toward its own label. Neither theme is special-cased, and neither is the one
   * white primary button that a fixed white veil would have left inert.
   *
   * It appears instantly rather than fading. Two reasons: `background-image` does
   * not interpolate between `none` and a gradient, so a transition here would be
   * a declaration that does nothing — the precise bug this whole rule exists to
   * fix — and at 400ms the Doherty threshold says immediate is the better answer
   * anyway.
   *
   * `@media (hover: hover)` keeps it off touch screens, where there is no pointer
   * to answer and a sticky hover state after a tap reads as a stuck button.
   */
  {
    ":root": {
      "--hover-veil": "color-mix(in srgb, currentColor 10%, transparent)",
      /* Deeper, because a pressed state has to be distinguishable from a hovered
      one — otherwise the press is the only action in the interface with no
      acknowledgement of its own. */
      "--press-veil": "color-mix(in srgb, currentColor 16%, transparent)",
    },
  },
  {
    // A real pointer only: a touch screen has no hover, and a hover state left
    // behind after a tap reads as a stuck button.
    "@media (hover: hover) and (pointer: fine)": {
      "button:not(:disabled):hover, [role=\"button\"]:not([aria-disabled=\"true\"]):hover, summary:hover, a[href]:hover, label:has(> input[type=\"checkbox\"]):hover, label:has(> input[type=\"radio\"]):hover": {
        "background-image": "linear-gradient(var(--hover-veil), var(--hover-veil)) !important",
      },
    },
  },
  // Keyboard focus gets the same veil as hover, so nothing a mouse user is
  // shown is withheld from someone tabbing (the focus ring comes on top).
  {
    "button:not(:disabled):focus-visible, [role=\"button\"]:not([aria-disabled=\"true\"]):focus-visible, summary:focus-visible, a[href]:focus-visible": {
      "background-image": "linear-gradient(var(--hover-veil), var(--hover-veil)) !important",
    },
  },
  {
    "button:not(:disabled):active, [role=\"button\"]:not([aria-disabled=\"true\"]):active, a[href]:active": {
      "background-image": "linear-gradient(var(--press-veil), var(--press-veil)) !important",
    },
  },
  /*
   * A link inside a sentence is not a button, and veiling one looks like the
   * browser's own text selection. The conventional answer is the one people
   * already know, which is the whole of Jakob's Law: underline it.
   */
  {
    ":is(p, li, figcaption, td, blockquote) a[href]:hover, :is(p, li, figcaption, td, blockquote) a[href]:active": {
      /* `!important` again, and only to outrank the veil's own — two important
      declarations are settled by specificity, and this one is more specific. */
      "background-image": "none !important",
      "text-decoration": "underline",
      "text-underline-offset": "2px",
    },
  },
  /*
   * Text being edited in place is not a control. The canvas already has its own
   * treatment for these (`.live-editable`), and a veil on a paragraph somebody is
   * typing into reads as a rendering fault.
   */
  {
    "[contenteditable]:hover, [contenteditable]:active, .live-editable:hover, .live-editable:active, [contenteditable] a[href]:hover": {
      "background-image": "none !important",
    },
  },
  /*
   * The cursor tells the truth about what a thing is.
   *
   * `<button>` defaults to `cursor: default` in every browser, which is why this
   * codebase writes `cursor-pointer` at each call site — and why the sweep found
   * eighteen places where somebody forgot. One rule is more reliable than a
   * convention nobody can enforce, and it means a new button is right by default
   * instead of right if remembered.
   *
   * A disabled control gets `not-allowed` rather than `pointer`: a pointer on
   * something that will not respond is an invitation to a click that does
   * nothing, which is the one thing a cursor exists to prevent.
   */
  // Kept above utility classes, as this rule was before it moved here: an
  // inline style on the element still wins (the :not guard).
  {
    "button:not(:disabled):not([style*=\"cursor\"]), [role=\"button\"]:not([aria-disabled=\"true\"]):not([style*=\"cursor\"]), summary:not([style*=\"cursor\"]), label:has(> input[type=\"checkbox\"]):not([style*=\"cursor\"]), label:has(> input[type=\"radio\"]):not([style*=\"cursor\"])": {
      "cursor": "pointer !important",
    },
  },
  // Kept above utility classes, as this rule was before it moved here: an
  // inline style on the element still wins (the :not guard).
  {
    "button:disabled:not([style*=\"cursor\"]), [role=\"button\"][aria-disabled=\"true\"]:not([style*=\"cursor\"]), input:disabled:not([style*=\"cursor\"]), select:disabled:not([style*=\"cursor\"])": {
      "cursor": "not-allowed !important",
    },
  },
  /*
   * A `<select>` answers the pointer too, by a different route.
   *
   * The veil cannot be used here: a native select paints its own dropdown arrow,
   * and setting `background-image` on one disturbs it in some engines. `filter`
   * has no such interaction, so the whole control — text, arrow and ground —
   * shifts together.
   *
   * The direction has to flip per theme, which is the one thing `currentColor`
   * solved for the veil and cannot solve here — see `--hover-shift` in the two
   * theme blocks at the top of this file.
   */
  {
    "@media (hover: hover) and (pointer: fine)": {
      "select:not(:disabled):hover, input[type=\"range\"]:not(:disabled):hover, input[type=\"color\"]:not(:disabled):hover": {
        "filter": "var(--hover-shift)",
        "cursor": "pointer",
      },
    },
  },
  /*
   * Disabled controls, raised from 40% to 58%.
   *
   * WCAG exempts inactive controls from its contrast floor, and at 40% the
   * label on a disabled button measured 2.6:1 — which is the letter of the rule
   * and a button whose text you cannot read. Reading a disabled control is how
   * you find out what it would do and therefore what you are missing; "Claim"
   * greyed out has to still say "Claim". 58% is unambiguously dimmer than an
   * enabled control, so the state still reads at a glance, and it clears 4.5:1
   * on every surface in the app.
   *
   * Here rather than at the seventeen call sites that write
   * `disabled:opacity-40`, so there is one number to change. The element
   * selector is what lifts this above Tailwind's own utility, which is a class
   * plus a pseudo-class; without it the utility wins and this does nothing.
   */
  // Kept above utility classes, as this rule was before it moved here: an
  // inline style on the element still wins (the :not guard).
  {
    "button.disabled\\:opacity-40:disabled, a.disabled\\:opacity-40[aria-disabled=\"true\"], input.disabled\\:opacity-40:disabled": {
      "opacity": "0.58 !important",
    },
  },
  /* Keyboard users get a visible, consistent focus ring everywhere. */
  // Kept above utility classes, as this rule was before it moved here: an
  // inline style on the element still wins (the :not guard).
  {
    ":focus-visible:not([style*=\"outline\"])": {
      "outline": "2px solid var(--accent) !important",
      "outline-offset": "2px !important",
    },
  },
  // Kept above utility classes, as this rule was before it moved here: an
  // inline style on the element still wins (the :not guard).
  {
    ":focus-visible:not([style*=\"border-radius\"])": {
      "border-radius": "6px !important",
    },
  },
  /*
   * Hit areas.
   *
   * A row of quiet icon buttons was being drawn at its glyph size — a 14px ✕ was
   * a 14px target. That is fine with a mouse on a desktop and unusable with a
   * thumb, a trackpad at speed, or a tremor. Both classes grow the *target*, not
   * the glyph: the icon stays the same size and the extra area is transparent
   * padding, so nothing looks heavier than it did.
   *
   * 26px rather than the 24px floor, so a stray sub-pixel from a border or a
   * line-height rounding can't drop one back under it.
   *
   * Padding rather than the usual trick of an oversized ::after pseudo-element:
   * these buttons sit in flex rows 6–8px apart, and overlapping invisible
   * rectangles would mean clicks near a boundary silently landing on the
   * neighbour — a worse bug than the one being fixed, and a much harder one to
   * see.
   */
  // Kept above utility classes, as this rule was before it moved here: an
  // inline style on the element still wins (the :not guard).
  {
    ".mk-icon-btn:not([style*=\"display\"])": {
      "display": "inline-flex !important",
    },
  },
  // Kept above utility classes, as this rule was before it moved here: an
  // inline style on the element still wins (the :not guard).
  {
    ".mk-icon-btn:not([style*=\"align-items\"])": {
      "align-items": "center !important",
    },
  },
  // Kept above utility classes, as this rule was before it moved here: an
  // inline style on the element still wins (the :not guard).
  {
    ".mk-icon-btn:not([style*=\"justify-content\"])": {
      "justify-content": "center !important",
    },
  },
  // Kept above utility classes, as this rule was before it moved here: an
  // inline style on the element still wins (the :not guard).
  {
    ".mk-icon-btn:not([style*=\"min-width\"])": {
      "min-width": "26px !important",
    },
  },
  // Kept above utility classes, as this rule was before it moved here: an
  // inline style on the element still wins (the :not guard).
  {
    ".mk-icon-btn:not([style*=\"min-height\"])": {
      "min-height": "26px !important",
    },
  },
  // Kept above utility classes, as this rule was before it moved here: an
  // inline style on the element still wins (the :not guard).
  {
    ".mk-icon-btn:not([style*=\"border-radius\"])": {
      "border-radius": "8px !important",
    },
  },
  /*
  A control that destroys something says so before it is pressed.
  
  Icon-only deletes elsewhere in the app are drawn in the same faint grey as
  the rename beside them, so the only warning arrives in the confirm dialog —
  after the click, when the person has already decided. Colouring the glyph on
  hover and focus moves that warning to where the pointer is. The `svg` rule is
  what reaches the icon: these buttons set their colour inline per call site,
  so a `color` on the button would lose to it. */
  {
    ".mk-danger-hover:hover svg, .mk-danger-hover:focus-visible svg": {
      "color": "var(--danger) !important",
    },
  },
  /* The same idea for a text-only destructive control — "Delete board",
  "Delete" — which is otherwise the quietest thing in its row. */
  {
    ".mk-danger-text:hover, .mk-danger-text:focus-visible": {
      "color": "var(--danger) !important",
    },
  },
  /* The same floor for small text-only controls — "Copy", "+ Add", "Forgot?" —
  which were being drawn at their 18px line box. */
  // Kept above utility classes, as this rule was before it moved here: an
  // inline style on the element still wins (the :not guard).
  {
    ".mk-tap:not([style*=\"display\"])": {
      "display": "inline-flex !important",
    },
  },
  // Kept above utility classes, as this rule was before it moved here: an
  // inline style on the element still wins (the :not guard).
  {
    ".mk-tap:not([style*=\"align-items\"])": {
      "align-items": "center !important",
    },
  },
  // Kept above utility classes, as this rule was before it moved here: an
  // inline style on the element still wins (the :not guard).
  {
    ".mk-tap:not([style*=\"min-height\"])": {
      "min-height": "26px !important",
    },
  },
  /*
   * Fields settle into focus and error rather than snapping: the ring and
   * fill ease in on the fast token.
   */
  {
    "input, textarea, select, [contenteditable]": {
      "transition-property": "color, background-color, border-color, box-shadow",
      "transition-duration": "var(--duration-fast)",
      "transition-timing-function": "var(--ease-out)",
    },
  },
  /*
   * Accordions open and close at their real height instead of jumping. A
   * native <details> animates its content box where the browser can
   * (`::details-content`); elsewhere it opens instantly, as it always did.
   */
  {
    "details": {
      "interpolate-size": "allow-keywords",
    },
  },
  {
    "details::details-content": {
      "block-size": "0",
      "overflow-y": "clip",
      "transition-property": "block-size, content-visibility",
      "transition-duration": "var(--duration-base)",
      "transition-timing-function": "var(--ease-in-out)",
      "transition-behavior": "allow-discrete",
    },
  },
  {
    "details[open]::details-content": {
      "block-size": "auto",
    },
  },
  /*
   * Route changes, through the View Transitions API (React's
   * <ViewTransition> in the route templates). The old page leaves quickly,
   * the new one rises 8px into place. The rest of the document is not
   * animated: the shell around the page is the same on both sides, and
   * cross-fading it would only blur it.
   */
  {
    "@keyframes vt-page-out": {
      "to": { "opacity": "0" },
    },
  },
  {
    "@keyframes vt-page-in": {
      "from": { "opacity": "0", "transform": "translateY(8px)" },
    },
  },
  {
    "::view-transition-old(root), ::view-transition-new(root)": {
      "animation": "none",
    },
  },
  {
    "::view-transition-old(.page)": {
      "animation": "vt-page-out var(--duration-fast) var(--ease-in) both",
    },
  },
  {
    "::view-transition-new(.page)": {
      "animation": "vt-page-in var(--duration-slow) var(--ease-out) both",
    },
  },
  /* A tab row's active pill sliding to the tab just chosen (TabIndicator). */
  {
    "::view-transition-group(.tab-slide)": {
      "animation-duration": "var(--duration-base)",
      "animation-timing-function": "var(--ease-in-out)",
    },
  },
  /* In-page anchors glide; route changes still jump to the top at once
     (`data-scroll-behavior` on <html> tells Next to switch this off while it
     navigates). Only while something has focus, which a followed anchor link
     does: a scripted scroll (a reveal, a "scroll into view") stays instant
     instead of every one of them turning into a glide nobody asked for. */
  {
    "html:focus-within": {
      "scroll-behavior": "smooth",
    },
  },
  {
    "@media (prefers-reduced-motion: reduce)": {
      "*, *::before, *::after": {
        "animation-duration": "0.01ms !important",
        "animation-delay": "0ms !important",
        "animation-iteration-count": "1 !important",
        "transition-duration": "0.01ms !important",
        "scroll-behavior": "auto !important",
      },
      "::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*)": {
        "animation": "none !important",
      },
      ".mk-card:hover, .mk-card:focus-visible": {
        "transform": "none",
      },
      "button:not(:disabled):active, [role=\"button\"]:active": {
        "transform": "none",
      },
      /*
       * Guideline sections stay put and stay visible.
       *
       * SectionReveal already declines to claim anything when this preference is
       * set, so normally no element here carries `data-reveal` at all. This is for
       * the case it is turned on *during* a visit, when sections may already be
       * mid-reveal: without it, a page could be left holding an element at zero
       * opacity with its transition cancelled.
       */
      "[data-reveal], [data-reveal-item]": {
        "opacity": "1 !important",
        "transform": "none !important",
      },
      /* The hover veil stays. Reduced motion means no *movement*, not no feedback
      — removing the one signal that says "this is interactive" would be reading
      the preference as "make this harder to use". */
    },
  },
  /*
   * Scrollbars, thin and visible.
   *
   * These were drawn in `--surface-3`, which is a *surface* token — the greyest
   * card in the theme. On the light theme that is #e4e4ea on a #eeeef2 canvas:
   * a thumb at **1.1:1**, which is not a subtle scrollbar, it is an absent one.
   * A scrollbar has two jobs, saying that there is more to see and being
   * grabbable, and it can do neither if nobody can find it.
   *
   * So it gets its own token, solved against the *worst* ground it is drawn on
   * rather than the page — 3:1, the WCAG 1.4.11 floor for a control that carries
   * meaning — and it darkens on the light theme where it lightens on the dark
   * one. The hover step exists because a thumb you are about to grab should say
   * so, the same as every other control in the app.
   */
  {
    "*": {
      "scrollbar-width": "thin",
      "scrollbar-color": "var(--scrollbar-thumb) transparent",
    },
  },
  {
    "*::-webkit-scrollbar": {
      "width": "8px",
      "height": "8px",
    },
  },
  {
    "*::-webkit-scrollbar-thumb": {
      "background": "var(--scrollbar-thumb)",
      "border-radius": "999px",
    },
  },
  {
    "*::-webkit-scrollbar-thumb:hover": {
      "background": "var(--scrollbar-thumb-hover)",
    },
  },
];
