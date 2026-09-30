# Markyos MVP screen inventory

_Started 2026-09-07 15:41 UTC_

---

## User

Make UI mockups for # Markyos MVP — Screen Inventory for UI Design

Scoped exactly to the MVP phase defined in the system roadmap (Weeks 1–3, single-user, no client access yet — that's v1.0). Ordering reflects what to design first: the RTL/logo differentiator before the boilerplate chrome around it.

## Screen Inventory

| # | Screen | Purpose | Key UI Elements | Design Priority |
|:-:|:---|:---|:---|:-:|
| 1 | **Logo System Section** | The core differentiator screen — logo upload + the interactive clearspace calculator | Logo dropzone/preview on dark canvas; auto-drawn 0.5× clearspace guide overlay; min-size guidance; `button-primary` pill for "Download assets" | **Design first** |
| 2 | **Typography Section** | Proves the bidirectional engine works — this is the whole company's bet | Side-by-side AR/Latin type specimens; live-swaps when AR/EN toggle flips; type-scale list (display/body/caption) rendered in the actual `.woff2` fonts | **Design first** |
| 3 | **Workspace Shell (persistent chrome)** | The frame every section lives inside — nav, AR/EN toggle, workspace identity | Left or top section-nav (Overview/Logo/Color/Typography); the AR/EN toggle as a prominent pill-switch (this control is used constantly, deserves real design attention); workspace name top-left | Second |
| 4 | **Color Palette Section** | Swatch documentation | Swatch grid on `surface-1` cards; hex/RGB/CMYK values per swatch; "add color" pill button | Third |
| 5 | **Overview Section** | Brand intro/mission text | Simple rich-text block on canvas; reuses the same section-template chrome as Color/Typography | Third |
| 6 | **Download / Export Flow** | Get assets out of Markyos | Modal or slide-over panel triggered from Logo section; format options (SVG/PNG/WebP); direct R2 link | Fourth |
| 7 | **Create Workspace (empty state)** | First thing after signup | Single "Name your brand" input; one primary pill CTA; otherwise mostly empty dark canvas — this is intentionally the least designed screen | Fifth |
| 8 | **Sign Up / Log In** | Entry point | Standard auth form on the dark canvas; deliberately boilerplate — don't over-invest here, Auth.js/Clerk likely supplies most of this | Last |

## Design Notes

- **Why this order:** #1 and #2 are where the AR/EN engine and the clearspace calculator actually have to *work visually* — if those don't feel right, nothing else matters. #3 (the shell) is worth doing right after, since the AR/EN toggle lives there and gets touched on every screen. #4–#6 mostly reuse the same "section" template pattern once it exists. #7–#8 are close to commodity screens — spend the least design time here.
- **Overview, Color, and Typography can likely share one section-template component** — same header/nav chrome, different content area — worth designing that template once rather than three separate screens.
- **Nothing here has a client-facing view yet** — that's v1.0's password-protected viewer, a separate screen to design next phase.

## Visual Design Reference

All screens should follow the Framer-inspired dark design direction:
- Near-black canvas (`#090909`) as the default surface
- Surface-lift hierarchy (`#141414` → `#1c1c1c`) for cards and elevated elements, not drop shadows
- Single chromatic accent (`#0099ff`) reserved for links, focus rings, and selection only
- Pill-shaped CTAs only — white primary pills, charcoal secondary pills
- GT Walsheim/Mona Sans for display type, Inter Variable for body/UI — paired with a matched-weight Arabic typeface for the AR/EN toggle

## Assistant

_[tool: list_files]_

_[tool: list_files]_

_[tool: list_files]_

_[tool: copy_files]_

_[tool: read_file]_

_[tool: dc_write]_

_[tool: ready_for_verification]_

## User

Check didn’t complete

## Assistant

## User

Continue designing

## Assistant

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Added turn 2 on top: v1.0 screens 9–16. Two calls worth your input — the client viewer exists in both dark (9a) and light "sign-off document" (9b) form, and #11/#12 are one Share panel with the DNS walk-through as an expanded step (11a → 12a) rather than two screens.

## User

Found issues — fixing…

## Assistant

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Loaded Line Awesome directly instead of via the design system's `@import` chain, so all icons render; fixed the malformed style declaration in 16a.

## User

Found issues — fixing…

## Assistant

_[tool: write_file]_

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

The CDN is unreachable from the preview, so icons now come from a local `assets/icons.css` — same `.las la-*` class vocabulary, drawn as currentColor masks, so nothing depends on the network. Swap the file for the real Line Awesome webfont whenever the binaries get vendored; no markup changes needed.

## User

Found issues — fixing…

## Assistant

_[tool: dc_html_str_replace]_

Root cause: that sample needed 450px in a 361px flex track with `nowrap` — shortened the string to "Brand, both ways" and removed the nowrap clip.

## User

Update the screens

## Assistant

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Turn 3 added on top: 7b is the populated project gallery (7a stays as its empty state), and #16 is now Settings with Profile (16b) and Billing (16c) tabs, superseding the billing-only 16a.

## User

Found issues — fixing…

## Assistant

_[tool: str_replace_edit]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Added a proper `la-search` glyph and swapped the help icon out; lifted those two captions to `#8a8a94` for contrast.

## User

<pasted_text name="Pasted text (74 lines)">
# Markyos Screens — MVP Through v1.0

Full screen inventory for UI design, covering both phases from the roadmap: **MVP** (Weeks 1–3, single-user core viewer) and **v1.0** (Weeks 4–6, commerce &amp; client delivery). Design priority restarts within each phase — finish MVP's priority order before starting v1.0's.

---

## Phase: MVP (Weeks 1–3)

| # | Screen | Purpose | Key UI Elements | Design Priority |
|:-:|:---|:---|:---|:-:|
| 1 | **Logo System Section** | The core differentiator screen — logo upload + the interactive clearspace calculator | Logo dropzone/preview on dark canvas; auto-drawn 0.5× clearspace guide overlay; min-size guidance; `button-primary` pill for "Download assets" | **Design first** |
| 2 | **Typography Section** | Proves the bidirectional engine works — this is the whole company's bet | Side-by-side AR/Latin type specimens; live-swaps when AR/EN toggle flips; type-scale list (display/body/caption) rendered in the actual `.woff2` fonts | **Design first** |
| 3 | **Workspace Shell (persistent chrome)** | The frame every section lives inside — nav, AR/EN toggle, workspace identity | Left or top section-nav (Overview/Logo/Color/Typography); the AR/EN toggle as a prominent pill-switch; workspace name top-left | Second |
| 4 | **Color Palette Section** | Swatch documentation | Swatch grid on `surface-1` cards; hex/RGB/CMYK values per swatch; "add color" pill button | Third |
| 5 | **Overview Section** | Brand intro/mission text | Simple rich-text block on canvas; reuses the same section-template chrome as Color/Typography | Third |
| 6 | **Download / Export Flow** | Get assets out of Markyos | Modal or slide-over panel triggered from Logo section; format options (SVG/PNG/WebP); direct R2 link | Fourth |
| 7 | **Project Gallery / Dashboard** | Landing screen after login — lists existing workspaces, entry point to create a new one | Empty state: single "Name your brand" input + one primary pill CTA on empty dark canvas. Populated state: grid of workspace cards (name, thumbnail/logo, last edited) + "New workspace" pill | Fifth |
| 8 | **Sign Up / Log In** | Entry point | Standard auth form on the dark canvas; deliberately boilerplate — Auth.js/Clerk likely supplies most of this | Last |

---

## Phase: v1.0 (Weeks 4–6)

| # | Screen | Purpose | Key UI Elements | Design Priority |
|:-:|:---|:---|:---|:-:|
| 9 | **Client Viewer (client-facing guideline)** | What the client actually sees — the payoff of the whole hand-off motion | Same section content as the workspace, but read-only; no Markyos nav or chrome; agency's custom domain/branding if mapped; minimal "Powered by Markyos" mark only if not white-labeled | **Design first** |
| 10 | **Client Access Gate (password entry)** | Gatekeeper screen the client sees before the guideline loads | Minimal centered password field; brand/workspace name; single pill submit button; error state for wrong password | **Design first** — pairs directly with #9 |
| 11 | **Share &amp; Access Management (designer-side)** | Where the designer generates and controls client access | "Generate client link" pill button; set/reset password; copy-link action; custom-domain input with a verification status badge (pending/verified) | Second |
| 12 | **Custom Domain Setup (DNS detail)** | Walks the designer through mapping `brand.client.com` | Step-by-step CNAME instructions; DNS record to copy; live verification status | Third — can be a sub-panel inside #11 rather than a separate screen |
| 13 | **Project Pass Purchase Screen** | Where a client or designer initiates the $19 one-off purchase | Price card ($19, one-time); "Buy Project Pass" pill CTA; short feature list of what's included | Fourth |
| 14 | **Stripe Checkout** | Payment collection | Mostly Stripe-hosted UI (Stripe Checkout or Payment Element); Markyos side only needs a clean trigger button and success/cancel return handling | Low custom-design effort — Stripe supplies most of this |
| 15 | **Purchase Confirmation** | Confirms payment succeeded and the Project Pass is active | Success state; pill CTA "Go to your guideline" | Fifth |
| 16 | **Settings** | Account and billing management, in one place | Tabbed or sectioned layout — **Profile** (name, email, password, delete account) and **Billing** (active pass/subscription status, payment history, "Manage billing" deep-link to Stripe's Customer Portal) | Last — least differentiated, mostly a settings/forms screen |

---

## Brand Asset Upload Flow (Logo System — MVP)

The Logo System screen's "dropzone" is a multi-step interaction, not a single control — and because Markyos is bidirectional, it needs to handle two logo lockups (Arabic + Latin), not one.

| Step | What Happens | Design Consideration |
|:-:|:---|:---|
| 1. Initiate | User clicks an "Upload" pill or drags a file onto a dropzone | Standard, low-risk pattern |
| 2. Validate (client-side, before any network call) | Check file type (SVG preferred, PNG accepted) and size (~10MB cap) | Reject bad formats instantly with an inline error; **warn, don't block**, on PNG uploads — vector is needed for the clearspace calculator and v2.0's WASM converter to work well later |
| 3. Variant slots | The dropzone is at minimum three slots: **Arabic lockup**, **Latin lockup**, and a shared **symbol/icon-only mark** | The part a generic upload pattern misses — a bilingual product needs two wordmarks, not one. Skipping this now means retrofitting it later |
| 4. Instant preview | Show the uploaded file at true size on both a light and dark swatch immediately, before saving | Catches "wrong file" mistakes before any round trip; also the first real test of whether the mark works on the dark canvas |
| 5. Upload to storage | File sent to Cloudflare R2 via a presigned URL (issued by Workers) | Progress shown inline on the dropzone card itself — not a separate modal, so context isn't lost |
| 6. Auto-clearspace | Bounding box measured client-side, 0.5× guide auto-drawn as an overlay | Instant — pure client-side canvas math, no server round trip |
| 7. Attach &amp; confirm | File is now live in that slot, visible in the section immediately | — |
| 8. Replace / remove | Hovering an already-filled slot surfaces "Replace" / "Remove" | Inline state on the same card, not a separate screen |
| 9. Error recovery | Failed upload shows an inline error **on that specific slot** with "Retry" | Never a generic toast — the user needs to know *which* file failed when there are three slots |

**Scope note:** there is no font-upload step in MVP. Typography uses self-hosted `.woff2` Arabic/Latin pairs built into the product — the Typography section is about *choosing/previewing* a pairing, not uploading one. Custom font upload isn't in the roadmap currently; flag it if that's actually expected later.

---

## Design Notes

**MVP priorities carry over unchanged** — see the reasoning in the MVP-only inventory if you have it. For v1.0:

- **#9 and #10 are the new "wow" moment**, equivalent to what the Logo/Typography screens were for MVP — this is the first thing a client (not just the designer) ever sees of Markyos, so it needs to feel polished and trustworthy, not like an internal tool.
- **#11 and #12 could realistically collapse into one screen** — a "Share" panel with an expandable custom-domain section — rather than two separate designs. Worth prototyping as one first and splitting only if it gets crowded.
- **#14 (Stripe Checkout) and #16 (Settings)** are good candidates to lean partly on Stripe's hosted Checkout and Customer Portal rather than custom-building either — saves real design and engineering time for a two-person team, at the cost of a brief visual handoff to Stripe's own UI for the payment-method/receipt details specifically.
- Everything client-facing (#9, #10) should **default to the same dark Framer-inspired canvas** as the rest of the product (per the design-direction doc), with the open question of whether corporate clients expect a lighter "official document" feel for sign-off — worth deciding before designing #9.
- **#7 (Project Gallery)** is worth designing even though the MVP flowchart in the roadmap shows a single linear "create workspace" path — in practice this is the screen every returning user hits first, so it's more load-bearing than its "Fifth" priority ranking suggests. Treat the priority ranking as "how novel/differentiating," not "how important to have at all."

## Visual Design Reference

All screens should follow the Framer-inspired dark design direction:
- Near-black canvas (`#090909`) as the default surface
- Surface-lift hierarchy (`#141414` → `#1c1c1c`) for cards and elevated elements, not drop shadows
- Single chromatic accent (`#0099ff`) reserved for links, focus rings, and selection only
- Pill-shaped CTAs only — white primary pills, charcoal secondary pills
- GT Walsheim/Mona Sans for display type, Inter Variable for body/UI — paired with a matched-weight Arabic typeface for the AR/EN toggle
</pasted_text>

## Assistant

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Turn 4 covers the upload flow: 1b rebuilds the Logo section around three slots (Arabic lockup / Latin lockup / shared mark), 1c is all nine slot states on one board, 1d is the pre-save preview on dark and light with the values read from the file. Flagging one thing from your scope note — nothing here supports custom font upload, so if studios will bring their own Arabic pairs, that's a new slot pattern to design.

## User

Update screens

## Assistant

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Turn 5 adds the transfer flow: 19a (recipient's accept screen, built with client-viewer weight), 17a (initiate, as a new Ownership tab in Settings), 18a (type-to-confirm, disabled and armed side by side), 20a (claim paywall — $19 pass vs a $12/mo Studio plan, since a client keeps editing), 21a (completion for both parties). The Studio price is invented — tell me the real plan and I'll swap it.

