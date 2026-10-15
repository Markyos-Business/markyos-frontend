# Specs

The documents this work is built against are **not in this repository**.
They are supplied by Abdullah and live wherever he keeps them — today that is
`Markyos/System/System Architecture/`:

| Document | Revision | Governs |
| :--- | :--- | :--- |
| `markyos_system_architecture_and_roadmap_rev3_2.md` | **3.2 · 15 Oct 2026** | **Plan of record.** Scope, sequencing, principles, pricing, data model |
| `markyos_builder_moodboard_spec.md` | 1.0 · 29 Sep 2026 | Implementation detail for the builder, moodboard and sync layer |
| `markyos_system_architecture_and_roadmap_rev2.md` | 2.1 · 28 Sep 2026 | Superseded. Kept because older audits and changelog entries cite it |

Where they disagree, the roadmap wins on scope and timing and the build spec
wins on implementation detail — the build spec says so itself.

**Anyone picking up a workstream needs both current documents in hand.** The
audits in `docs/audits/` and the entries in `docs/CHANGELOG.md` cite them by
section number, and a section number is not much use without the section.

They are referenced rather than copied here on purpose: a spec that exists in
two places drifts, and the copy that drifts is always the one somebody reads.
If they should be checked in so the citations resolve offline, that is a
decision for Abdullah — ask before committing a copy.

## Reading order for a new workstream

1. **`docs/STATUS.md`** — what is actually built, measured from the codebase.
   Revision 3.2 §3 is a summary of it, so start here if the two disagree.
2. **Revision 3.2 §3.4 and §3.5** — the invariants that bind every phase, and
   the ideas already refused on purpose. Both exist so neither gets
   re-litigated or broken by accident.
3. **Revision 3.2 §10** — the MVP Foundation task list, which is the current
   phase. §9 has the phase map around it.
4. **`docs/audits/builder-audit.md`** — if the work touches the builder.

## What citations mean

A citation like "teardown §3.1" or "build spec §7" points into one of the
documents above, not into this repository. Revision numbers matter: §7 in
Revision 2.1 is the old one-sided pricing model, while §7 in Revision 3.2 is
the two-sided one. Cite the revision when it could be ambiguous.
