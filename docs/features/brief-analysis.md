# Brief analysis

> A strategist's read of a brand's discovery material: what the client said in
> their forms and on calls, turned into a 10-part report the studio can edit,
> add to Strategy, share with the client and print. Route `/w/[slug]/analysis`,
> client link `/a/[token]`, print view `/print/analysis/[id]`. Code in
> `src/components/features/briefs/`; backend in `markyos-backend/apps/briefs/`.
> The first half of the feature (running, the report, regenerate, compare,
> credit rules) shipped on 25–26 Oct; this doc covers the whole feature.

## 1. Purpose and who it serves

A studio collects a brand's brief through discovery forms and calls. The
analysis reads all of it and writes what a strategist would:

- a snapshot of the client and project;
- goals, audience and personas, market and white space, personality;
- where the client contradicts itself, what's missing, and routes to take;
- creative starting points and constraints.

Every claim cites its source or says it was inferred, with a confidence.

Who uses it:

- **Studio owners and editors** run it, edit sections, add items to Strategy,
  share it with the client and export it.
- **Viewers** read it and can export it.
- **The client** reads only what the studio shares at a link, with no account.

The rule from the start of the Creation Layer still holds: **nothing reaches
the Strategy Hub until a person adds it.**

## 2. Screens and flows

**Analysis tab, `/w/[slug]/analysis`.**

- Before the first run, a panel shows what will be read and what it costs; the
  first run on a brand is free.
- While it runs, the stages show their progress.
- The report itself:
  - a version picker, plus Export PDF, Share with client and Run again;
  - a sticky contents list with each section's state (Ready, Edited, Added,
    Failed);
  - the 10 section cards. Each card has Edit, "Add all to Strategy",
    Regenerate and, when edited, "Back to the analysis's version". Items carry
    their own "Add to Strategy".
- Clicking a citation opens its source: the form answer or the call note.

**Flows:**

1. **Add to Strategy.**
   - "Add to Strategy" on an item adds it at once.
   - "Add all to Strategy (n)" on a section adds everything there that isn't in
     Strategy yet.
   - A toast confirms, with **Undo**. Undo removes only what that add put in,
     even if more was added since.
   - Added items show **Added**, after a reload too.
2. **Add a note.**
   - Tensions, gaps and white space aren't entries of their own, so their
     button is "Add as a note to…" with a menu of the brand's positioning
     options.
   - With no options yet, it's disabled with the reason "Add a route to
     Strategy first."
3. **Edit a section.**
   - Edit opens the section as fields: text, lists with add and remove,
     choices, and 1–5 scores. Citations and ids are kept as they were.
   - Save stores the studio's version beside the analysis's, and the card
     shows **Edited**.
   - "Back to the analysis's version" asks first, then throws the edit away.
4. **Share with client.**
   - A sheet lists the links in use, each with its section count, views,
     end date, Copy and Turn off.
   - Below the list, a new link is made by ticking sections (the read of the
     brief by default) and choosing how long it works: 7 days, 30 days, or
     until turned off.
   - Create link copies the URL.
5. **The client's view, `/a/[token]`.**
   - The shared sections as one document in the analysis's language, with a
     Print / PDF button.
   - A citation opens its quote "From your form".
   - A link that is off, expired or wrong says "This link isn't available any
     more."
6. **Export PDF.**
   - Opens `/print/analysis/[id]` in a new tab: every ready section as one
     light document.
   - The browser's print dialog opens on its own; "Save as PDF" makes the file.
   - The export is logged.

## 3. Component map

Folders follow the feature layout (`docs/components.md` lists the kit
components used):

| Folder | Parts | Kit components |
| --- | --- | --- |
| `components/AnalysisView.tsx` | The tab: header, run panel, running view or report | `PageHeader`, `SelectField`, `Badge`, `Button`, `EmptyState`, `Skeleton`, `AlertBanner` |
| `components/run/` | `RunPanel`, `RunningView` | `ContentCard`, `Button`, progress |
| `components/report/` | `ReportView` (contents and cards), `SectionCard`, `sections/SectionBody` (each section's layout), `citations`, `SectionEditor`, `StudioReport` (the report with the studio's actions) | `Badge`, `Tag`, `Table`, `Drawer`, `InputField`, `TextareaField`, `SelectField`, `IconButton`, `AlertBanner` |
| `components/to-strategy/` | `itemActionFor` (Add, Added, or the note menu), `AddAllButton` | `Button`, `Tag`, `ActionsDropdown` (item `disabled` + `reason`) |
| `components/share/` | `ShareWithClient` | `FormSheet`, `CheckboxField`, `SelectField`, `IconButton`, `Tag` |
| `components/public/` | `PublicReportView` | `Drawer`, `EmptyState`, `ErrorState`, `Skeleton` |
| `components/print/` | `PrintReportView` | `ErrorState`, `Skeleton`, `Button` |
| `components/shared/` | `ReportDocument`: the report as one document (public and print) | — |
| `components/link/` | `AnalysisLink`, used by other features | — |

**Hooks** mirror those folders:

- `report/useSectionEditor`
- `to-strategy/useAddToStrategy`
- `share/useShareLinks`
- `public/usePublicReport`
- `print/usePrintReport`
- At the root: `useBriefAnalysis` (polls while running) and `useBriefOverview`
- `pages/useAnalysisPage` for the route

**Pure rules** live in `utils/`, each with a test:

- `toStrategy.ts`: report item → strategy entry, already-added checks, notes.
- `editor.ts`: blank items, deep set, which keys are shown.
- `cost.ts` and `answers.ts`.

**Strategy Hub** (`features/strategy`) gained the **Objectives** and
**Positioning options** tabs, plus a "Working material" block in read mode.
The store gained `addToStrategy` and `removeFromStrategy`, plus add, update
and remove for both new lists, and `choosePositioningOption`.

## 4. Layout and RTL

| | Desktop | Tablet | Phone |
| --- | --- | --- | --- |
| Report | Contents rail beside the cards | Contents above the cards | One column; tables scroll inside their card |
| Section actions | One row in the card header | Wraps | Wraps |
| Share sheet | Slides in from the end edge | Same | Full width |
| Client page | 4xl column | Same | Full width with side padding |

Checked on 30 Oct with no sideways scroll at 1280px and 390px, in both
themes.

**RTL:**

- The studio's chrome follows the app language.
- The report's content, the client page and the PDF follow the
  **analysis's** language: an Arabic analysis is right to left with Arabic
  labels.
- The brand name keeps its own direction inside the page's alignment.
- Items added to Strategy from an Arabic analysis go into the Arabic fields
  (`nameAr`, `textAr`…).
- The PDF keeps Western digits and Gregorian dates, as everywhere.

## 5. States

| State | What it looks like |
| --- | --- |
| Not configured / nothing to read | The run panel says why (no API key; no submitted form, no call notes) and offers no Run |
| Running | Stage list with progress; the report appears when it's ready |
| Failed run or section | A danger line with the error; Regenerate on a failed section |
| Stale | "Sources changed since this analysis." with Run it again |
| Editing | The card's body becomes the editor; its other actions hide; a refused save shows the server's message above the fields |
| Nothing left to add | "Add all" disappears; every item shows Added |
| No positioning options (notes) | The note menu's only item is disabled with its reason |
| Client link off / expired / wrong | "This link isn't available any more." — Ask the studio for a new one |
| Print view loading | Skeletons until signed in and loaded, then the dialog opens |
| Viewer (read only) | No Edit, Add, Share or Run; Export PDF stays |
| Client (brand member with the client role) | The Analysis tab isn't theirs: 404 from the API |

## 6. Data model and API

Backend models (`apps/briefs/models.py`):

- **`BriefAnalysis`**: version, status, language, source snapshot, extraction,
  the source index, cost and credits.
- **`AnalysisSection`**:
  - `content`, the analysis's version, with `edited_content` for the studio's;
  - `added_to_strategy_at`.
- **`ShareLink`**: token, sections, `expires_at`, `revoked_at`, `view_count`.
- **`AnalysisEvent`**: run, section edited, regenerated or reset, added to
  Strategy, exported, shared, revoked.

| Method and path | Purpose |
| --- | --- |
| `GET/POST briefs/?brand=` | Overview (what a run reads, versions, quote); start a run |
| `GET briefs/<id>/` | One analysis with its sections and source index (poll while running) |
| `GET briefs/<id>/compare/<other>/` | What changed between versions |
| `PATCH briefs/<id>/sections/<key>/` | Save the studio's edit (validated against the section schema) |
| `POST …/sections/<key>/reset/` | Back to the analysis's version |
| `POST …/sections/<key>/regenerate/` | Rewrite one section, optionally steered |
| `POST …/sections/<key>/added/` `{items}` | **New.** Stamp the section and log which items went to Strategy |
| `GET/POST briefs/<id>/share/` | **New.** List links; create one `{sections?, expiresAt?}` |
| `DELETE briefs/<id>/share/<link>/` | **New.** Turn a link off |
| `POST briefs/<id>/exported/` | **New.** Log a PDF export |
| `GET public/briefs/<token>/` | **New, public.** The shared sections, call-note citations stripped, views counted; 404 when off, expired or unknown |

**Strategy entries** carry `source: {analysisId, sectionKey, itemKey}`, so the
report knows what's already added. The brand document's strategy gained
`objectives[]` and `positioningOptions[]`. Older brands are given empty lists
when they load.

## 7. Permissions

| Action | Owner | Editor | Viewer | Client (team role) | Anyone with a link |
| --- | --- | --- | --- | --- | --- |
| Read the analysis | Yes | Yes | Yes | No | Only the shared sections |
| Run, regenerate | Yes | Yes | No | No | No |
| Edit, reset a section | Yes | Yes | No | No | No |
| Add to Strategy | Yes | Yes | No | No | No |
| Share, turn a link off | Yes | Yes | No | No | No |
| Export PDF | Yes | Yes | Yes | No | Print / PDF of what's shared |

## 8. Copy deck

The briefs feature writes its strings inline as `t(en, ar)`. The ones this
phase added:

| Where | English | Arabic |
| --- | --- | --- |
| Item action | Add to Strategy | إضافة إلى الاستراتيجية |
| Item state | Added | أُضيف |
| Note menu | Add as a note to… | إضافة كملاحظة إلى… |
| Note menu, empty | No positioning options yet — Add a route to Strategy first. | لا توجد خيارات تموضع بعد — أضف مسارًا إلى الاستراتيجية أولًا. |
| Section action | Add all to Strategy (n) | إضافة الكل إلى الاستراتيجية (n) |
| Toasts | Added to Strategy. · n added to Strategy. · Added as a note. · Undo | أُضيف إلى الاستراتيجية. · أُضيف n إلى الاستراتيجية. · أُضيفت كملاحظة. · تراجع |
| Note prefixes | White space: · Tension: · Open question: · Pro: · Risk: | فرصة غير مشغولة: · توتر: · سؤال مفتوح: · ميزة: · مخاطرة: |
| Editor | Edit · Save section · Saving… · Cancel · Section saved. · Add to … | تعديل · حفظ القسم · جارٍ الحفظ… · إلغاء · حُفظ القسم. · إضافة إلى … |
| Reset | Back to the analysis's version · Go back to the analysis's version? · Your edits to this section are thrown away. · Go back | العودة إلى نسخة التحليل · العودة إلى نسخة التحليل؟ · تُحذف تعديلاتك على هذا القسم. · العودة |
| Share | Share with client · Share with your client · Create link · Links in use · Sections in a new link · Link works for: 7 days / 30 days / Until turned off · Link copied. | مشاركة مع العميل · المشاركة مع عميلك · إنشاء رابط · روابط مستخدمة · أقسام الرابط الجديد · صلاحية الرابط: 7 أيام / 30 يومًا / حتى يُوقف · نُسخ الرابط. |
| Turn off | Turn this link off? · Anyone with it sees nothing from now on. Make a new link to share again. · Turn off · Link turned off. | إيقاف هذا الرابط؟ · لن يرى أي شخص لديه الرابط شيئًا بعد الآن. أنشئ رابطًا جديدًا للمشاركة مجددًا. · إيقاف · أُوقف الرابط. |
| Client page | Brief analysis · From your form · Print / PDF · Made with Markyos · This link isn't available any more. | تحليل الموجز · من نموذجك · طباعة / PDF · صُنع باستخدام ماركيوس |
| Evidence | From our conversations (a claim cited only from call notes, on a client link) | من محادثاتنا |
| Export | Export PDF · Print / save as PDF | تصدير PDF · طباعة / حفظ PDF |
| Strategy tabs | Objectives · Positioning options · Business goals / Brand goals · High / Medium / Low priority · Use as the brand's positioning · In use · Working material | الأهداف · خيارات التموضع · أهداف العمل / أهداف العلامة · أولوية عالية / متوسطة / منخفضة · استخدام كتموضع للعلامة · مستخدم · مواد العمل |

Field labels for the editor are in `FIELD_LABELS` in `constants.ts`, about 60
of them, in both languages.

## 9. Accessibility

- **Item actions** sit beside their item, and their names say what they do.
- **The note menu** is an `ActionsDropdown`; its disabled item keeps its
  reason as a tooltip.
- **The editor** is a real form:
  - every field has a label (list items are numbered: "Pros 2");
  - remove buttons are named for the item ("Remove Pros 2");
  - Save submits with Enter;
  - a refused save is announced with `role="alert"`.
- **Toasts** are a polite live region, so "Added to Strategy" and Undo are
  announced, and Undo is a real button.
- **The share sheet** traps focus and returns it to "Share with client".
  Copy and Turn off are named icon buttons.
- **The client page** has one `h1` (the brand) and an `h2` per section.
  Citations are buttons that open a labelled drawer.
- **The print view** is plain document order, so a screen reader reads it
  top to bottom.

## 10. Open questions and next steps

- **Real credits:** the rules run against a stub that allows everything (the
  first run is free). They wait for the billing feature; the three hooks to
  replace are in `apps/briefs/credits.py`.
- **A server-made PDF:** it was not built, because Render's free plan has
  512 MB. Once there's a paid plan, server-side Chromium could attach the PDF
  to an email.
- **Sharing:**
  - Links have no password. Add one if a client asks; the brand site's unlock
    pattern can be reused.
  - The view count includes the studio opening its own link.
- **Undo** lasts as long as its toast. After that, a mistaken add is removed in
  Strategy itself, item by item.
- **The editor can't add the first item** to an empty list of objects, because
  it copies the shape of an existing one. It's rare, since the analysis fills
  every list, but worth a per-field template if it comes up.
- **Arabic analyses:** the built-in sample report is English, so local tests
  of an Arabic analysis show English content in Arabic chrome. A real run
  writes Arabic.
