# Chat

_Started 2026-09-08 02:57 UTC_

---

## User

Continuing from "Markyos MVP screen inventory".

## Assistant

We were building UI mockups for Markyos MVP and beyond — starting with the core differentiator screens (Logo System with clearspace calculator and bidirectional Typography), then the workspace shell, color palette, overview, export flow, and finally auth/gallery/settings. You've just expanded scope to include the full v1.0 phase: client viewer, access gates, custom domains, Project Pass purchase, and a new ownership-transfer flow.

Key decisions made:
- Design MVP first (priority order 1–8) before touching v1.0 (9–16), then added 17–21 for the transfer flow. This keeps the cognitive load split by phase.
- Logo System uses three upload slots (Arabic lockup / Latin lockup / shared mark) instead of one, because the product is bidirectional and needs both wordmarks.
- Upload flow is nine discrete states per slot, not a generic "upload dialog" — each slot can fail independently with its own error.
- Client Viewer (#9) and Client Access Gate (#10) default to dark canvas, with an open question about whether corporate clients want a "light sign-off document" version too.
- Share & Custom Domain (#11–#12) can collapse into one panel with expandable DNS section rather than two screens.
- Stripe Checkout (#14) and Settings (#16) intentionally lean on hosted Stripe UI to save design time for a two-person team.
- Transfer flow (17–21) splits ownership initiation (Settings tab) from acceptance (separate screen for the recipient) and introduces a paywall choice: one-off $19 Project Pass or recurring $12/mo Studio plan.

Current state: Markyos MVP Screens.dc.html contains all 21 screens across MVP, v1.0, and transfer phases, with slot states, preview variants, and transfer flow endpoints rendered. The file uses a local assets/icons.css (no CDN dependency) and the Framer-inspired dark design system throughout.

Open next: confirm the real Studio plan price (you flagged $12/mo as invented), and decide whether #9 (Client Viewer) needs a light-mode variant for corporate sign-off documents.

Files: Markyos MVP Screens.dc.html, assets/icons.css

