# Markyos platform

The bilingual Markyos application for managing brand strategy, visual identity,
discovery, guideline sites, and client review. This is the Next.js frontend;
`../markyos-backend` provides the Django API and `../landing-frontend` is the
separately deployed marketing website and Payload CMS.

## Development documentation

Start with these guides before adding or changing a feature. They describe the
current implementation, distinguish browser-only behavior from API-backed
behavior, and identify incomplete integrations and inconsistent older guidance.

| Guide | Use it for |
| --- | --- |
| [UI documentation](docs/development/UI.md) | Colors, typography, spacing, components, forms, tables, navigation, responsive behavior and accessibility. |
| [UX documentation](docs/development/UX.md) | Roles, journeys, route flows, recipient experiences, loading/empty/error/success states and save feedback. |
| [Functional documentation](docs/development/FUNCTIONAL.md) | Modules, permissions, business rules, persistence, concurrency, workflows, integrations and implementation limits. |
| [November audit follow-up](docs/development/NOVEMBER_AUDIT_FOLLOWUP.md) | Finding-by-finding validation, fixes, preserved pricing decisions and verification limits. |

Last reviewed: 12 November 2026. Update the relevant guide in the same change as
its behavior. Runtime code takes precedence when older docs or design exports
disagree; record the discrepancy rather than silently treating a prototype as
a completed feature.

## Run locally

Use a Node version supported by the installed Next.js and Prisma packages.

```sh
npm ci
npm run dev
```

Without `NEXT_PUBLIC_API_URL`, the app uses browser-local demo accounts/data.
This mode is useful for UI work but does not provide shared accounts, portable
client links, real payment, or server authorization.

For the integrated application, configure the frontend's API base and start the
Django service from its own repository:

```sh
# Example frontend .env.local value; restart/rebuild after changing it.
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Follow the [backend setup](../markyos-backend/README.md) for its environment,
database, migrations and provider configuration. CORS must allow the frontend
origin and session-cookie settings must match the deployment. Do not place
Stripe, mail, Google client secrets or LLM keys in public frontend variables.

`NEXT_PUBLIC_UI_GALLERY=1` enables `/dev/components`, `/dev/motion` and the
`/design-system` reference route. They return 404 without the flag.

## Folder structure

```
src/
├─ app/                        routes only: thin pages that compose features
├─ components/
│  └─ ui/                      shared, reusable, no business logic
│     ├─ index.ts              exports every component ("@/components/ui")
│     ├─ registry.ts           build status of every component (npm run status)
│     ├─ <name>.tsx            a simple component is one file
│     └─ <name>/               a complex one is a folder
│        ├─ index.ts           public exports only
│        ├─ <name>.tsx
│        ├─ <name>-<part>.tsx
│        ├─ use-<name>.ts      its own hook, if any
│        └─ types.ts
├─ features/<domain>/          one folder per business area
│  ├─ index.ts                 the only file other code may import
│  ├─ components/              domain UI built from "@/components/ui"
│  ├─ hooks/                   use-*.ts
│  ├─ api/                     *.api.ts
│  ├─ schemas/                 *.schema.ts (zod)
│  ├─ types.ts
│  ├─ constants.ts
│  └─ i18n/en.json, ar.json
└─ lib/                        helpers and the API client
```

The rest of `src/` supports these: `contexts/` (the app store and its
providers), `hooks/` (generic hooks), `types/` and `constants/`. `features/shell`
is the app frame (studio sidebar, top bar, account header), which knows about
brands and accounts, so it is a feature rather than UI. [features/assets](src/features/assets)
is the reference feature for the pattern, at `/assets` with `NEXT_PUBLIC_UI_GALLERY=1`.

Rules:

1. `components/ui` never imports from `features/`.
2. Features import shared UI only from `"@/components/ui"`, never a file inside it.
3. A feature never imports another feature's internal files, only its `index.ts`.
   If two features need the same piece, move it into `components/ui` with a generic API.
4. Placement: if it knows about brands, assets, discovery or another domain, it goes
   in `features/<domain>/components`. If it would work in any product, it goes in `components/ui`.
5. One file or a folder: a component with sub-parts, its own hook or its own types
   gets a folder with `index.ts`. Otherwise it is one file.
6. Naming: kebab-case files, PascalCase components. Feature components start with
   the domain name (`AssetTable`, `BrandCard`). Hooks `use-*.ts`, schemas `*.schema.ts`,
   API `*.api.ts`.
7. Every new component in `components/ui` goes in `registry.ts` with a status
   (planned, in-progress, in-review, ready, deprecated), then `npm run status`.
   Feature components don't go in the registry.
8. Pages in `app/` contain no business logic or data fetching. They compose features.

Rules 1–3 are enforced by `npm run lint` ([eslint.config.mjs](eslint.config.mjs)).
Existing exceptions, to be removed as those areas are reworked: `src/contexts`
and `src/lib/data` still import a few feature internals (auth's API, moodboard
templates); older features keep their `copy.ts` and `utils/` rather than
`i18n/*.json`; and a few older feature components don't yet start with the
domain name.

## Validation

```sh
npm run test             # Vitest unit tests
npm run check            # types, lint, Prisma schema, tests and UI audits
npm run e2e              # integrated Playwright scenarios; see setup below
```

`check` loads `prisma.config.ts`, which requires `DATABASE_URL` and
`SHADOW_DATABASE_URL`. Prisma is currently a scaffold, not the platform's live
persistence layer; Django stores API-backed application data. Do not run Prisma
migrations against an unrelated database just to satisfy a validation command.

[E2E setup and scenarios](e2e/README.md) describe the backend Python environment,
ports, test analysis fake and provider mocks. Browser sweeps are separate
`sweep:*` scripts in [package.json](package.json); use the relevant sweep when
changing layout or interaction behavior.

## Form fields

Every field is built on one wrapper, `Field` ([src/components/ui/field/field.tsx](src/components/ui/field/field.tsx)),
so they share the label, the note under the field, the states and the look
(the underline field in [tailwind/base.js](tailwind/base.js), `.mk-field`). Import
everything from `@/components/ui`. Status and notes per component are in
[STATUS.md](STATUS.md) (`npm run status`); the gallery is `/design-system/forms`
with `NEXT_PUBLIC_UI_GALLERY=1`.

**Shared props.** `label`, `info` (an ⓘ tooltip), `hint`, `required` or
`optional`, and the states `error`, `warning`, `success`, `validating`,
`locked` + `lockedReason`, `readOnly`, `disabled` and `loading` (a skeleton).
`error` wins over `warning`, which wins over `success`. Text fields also take
`prefix`, `suffix`, `action` (a Copy or Generate button), `showCount` with
`maxLength`, `layout="horizontal"` and `size="sm"`. Every built-in word comes
from the kit's strings in English or Arabic, and each can be overridden by a prop.

| Field | Library name | Value |
| --- | --- | --- |
| `InputField` | TextInput | text, `register` |
| `TextareaField` | Textarea | text, `register`; `autoGrow`, `maxRows` |
| `EmailField`, `PasswordField` (`strength`), `SearchField` | EmailInput, PasswordInput, SearchInput | text, `register` |
| `NumberField`, `CurrencyField` (`currency="SAR"`), `PercentageField` | NumberInput, CurrencyInput, PercentageInput | `number \| null`, `Controller` |
| `UrlField` | UrlInput | full URL string, `Controller` |
| `PhoneInput` (or `PhoneField` with code and number apart) | PhoneInput | E.164 string, `Controller` |
| `SlugField` (`base`, `from`, `checkAvailability`) | SlugInput | slug string, `Controller` |
| `HexColorField` | HexColorInput | `#RRGGBB`, `Controller` |
| `BilingualField` (`layout="side" \| "tabs"`, `multiline`) | BilingualInput | `{ en, ar }`, `Controller` |
| `RichTextField` | RichTextEditor | HTML string, `Controller` |
| `OtpField` (`length` 4–6) | OtpInput | digits, `Controller` |
| `CheckboxField` (`indeterminate`, `error`, `success`) | Checkbox | `checked`, `register` |
| `CheckboxGroup` (`min`, `max`, `selectAll`) | CheckboxGroup | `string[]`, `Controller` |
| `RadioField` (`orientation`) | RadioGroup | string, `Controller` |
| `RadioCardGroup` | RadioCards | string, `Controller` |
| `ToggleField` (card, `loading`), `Switch` (compact, `loading`) | Switch | boolean, `Controller` |
| `SegmentedControl`, `SegmentedToggle` (two sides) | SegmentedControl | string, `Controller` |
| `TagInput` (`max`) | TagInput | `string[]`, `Controller` |
| `ChipSelector` (`multiple`) | ChipSelector | string or `string[]`, `Controller` |
| `DatePicker` (`weekStart`, `min`, `max`, `isDisabled`, `hijri`, `digits`) | DatePicker | `"YYYY-MM-DD"`, `Controller` |
| `DateRangePicker` (`presets`) | DateRangePicker | `{ from, to }`, `Controller` |
| `TimePicker` (`hour12`, `minuteStep`) | TimePicker | `"HH:mm"`, `Controller` |
| `DateTimePicker` | DateTimePicker | `"YYYY-MM-DDTHH:mm"`, `Controller` |
| `DurationInput` (`maxHours`) | DurationInput | minutes, `Controller` |
| `FileDropzone` (`accept`, `maxBytes`, `maxFiles`, `multiple`) | FileDropzone | `onFiles(File[])` |
| `UploadList` | UploadList | `UploadItem[]` with `onCancel`, `onRetry`, `onRemove` |
| `ImageUpload` (`aspect`, `outputWidth`), `AvatarUpload` | ImageUpload / AvatarUpload | data URL, `Controller` |
| `SliderField` (`marks`), `RangeSlider` (`format`, `minGap`) | Slider / RangeSlider | number or `[low, high]`, `Controller` |
| `ColorPicker` / `ColorField` (`recent` via `useRecentColours`) | ColorPicker | `#RRGGBB`, `Controller` |
| `Rating` (`max`, `readOnly`, `clearable`) | Rating | number, `Controller` |
| `LocalePicker`, `CountryPicker`, `MarketPicker`, `TimezonePicker` | LocalePicker / CountryPicker / MarketPicker / TimezonePicker | code(s), `Controller` |
| `PeoplePicker`, `MentionTextarea` | PeoplePicker | ids, or text with `onMentionsChange` |
| `AddressFields` | AddressFields | `Address`, `Controller` |
| `ConfirmByTyping` (`name`, `actionLabel`) | ConfirmByTyping | `onConfirm` |
| `Fieldset` (`legend`, `columns`), `FieldGroup` | FieldGroup / Fieldset | — |

Text fields take react-hook-form's `register` directly; its `ref` lands on the
real input. Fields that store a number or a structured value are controlled,
so use `Controller`:

```tsx
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BilingualField, CurrencyField, EmailField, Fieldset, InputField } from "@/components/ui";

const schema = z.object({
  name: z.string().min(1, "Enter a campaign name."),
  email: z.email("Enter an email like nour@studio.sa."),
  budget: z.number({ error: "Enter a budget." }).min(1000, "The minimum is SAR 1,000."),
  title: z.object({ en: z.string().min(1, "Enter an English title."), ar: z.string() }),
});

function CampaignForm() {
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", budget: null as unknown as number, title: { en: "", ar: "" } },
  });
  return (
    <form onSubmit={handleSubmit(save)} noValidate>
      <Fieldset legend="Campaign">
        <InputField label="Name" required maxLength={60} showCount {...register("name")} error={errors.name?.message} />
        <EmailField label="Contact email" {...register("email")} error={errors.email?.message} />
        <Controller name="budget" control={control} render={({ field, fieldState }) => (
          <CurrencyField label="Budget" currency="SAR" value={field.value} onChange={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
        )} />
        <Controller name="title" control={control} render={({ field }) => (
          <BilingualField label="Title" value={field.value} onChange={field.onChange} errors={{ en: errors.title?.en?.message }} />
        )} />
      </Fieldset>
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save"}</Button>
    </form>
  );
}
```

An async check (is this name or slug free?) is `validating` while it runs,
then `success` or `error` with the answer. The note is a live region, so the
result is announced; `SlugField` does this for you given `checkAvailability`.

## Code and supporting references

- [Routes](src/app) compose [features](src/features) built from the shared
  [UI kit](src/components/ui); see "Folder structure" above.
- [AppContext](src/contexts/AppContext.tsx) coordinates the client state and
  [data adapters](src/lib/data/adapters); [API client](src/lib/api/client.ts)
  centralizes authenticated requests and refresh.
- [UI implementation reference](docs/ui/README.md),
  [template token contract](docs/token-contract.md), and
  [integration status](docs/INTEGRATION-STATUS.md) provide narrower background.
- [Billing](../markyos-backend/docs/billing.md),
  [approvals](../markyos-backend/docs/approvals.md), and
  [sign-offs](../markyos-backend/docs/signoffs.md) document dedicated API rules.

`project/` and `chats/` contain the original design-handoff material. They are
historical design context, not the runtime application or an instruction to
rebuild already implemented screens. The sibling `markyos-brand` folder contains
the supplied originals; runtime assets are in [public/brand](public/brand).

### Button family (wave 2, in review)

All controls are exported from `@/components/ui`. The gallery at
`/design-system#buttons` is enabled with `NEXT_PUBLIC_UI_GALLERY=1`.

```tsx
import { Button, ConfirmButton, SplitButton, ToggleGroup, useAsyncButton } from "@/components/ui";

// Inside a client component. Repeated clicks are blocked while saving;
// success/error is announced for two seconds. `error` retains the failure.
const save = useAsyncButton(async () => { await saveDocument(); });
<Button variant="primary" status={save.status} onClick={() => void save.run()}>
  Save changes
</Button>

<SplitButton onClick={saveDraft} items={[
  { label: "Publish changes", icon: "upload", onSelect: publish },
  { separator: true },
  { label: "Delete draft", destructive: true, onSelect: deleteDraft },
]}>Save draft</SplitButton>

<ToggleGroup label="Choose view" type="single" value={view} onValueChange={setView}
  options={[{ value: "list", label: "List view" }, { value: "grid", label: "Grid view" }]} />

<ConfirmButton mode="dialog" dialogTitle="Delete asset?" onConfirm={deleteAsset}>
  Delete asset
</ConfirmButton>
```

`status` accepts `idle`, `loading`, `success`, or `error`; controlled status remains
until the caller updates it. `useAsyncButton` resets feedback after two seconds.
`loadingText`, `successText`, `errorText`, labels and confirmation copy are props.
`disabledReason` and `lockedReason` keep controls focusable and explain why they
cannot run. Use `asChild` with a Next `Link` or `LinkButton` for navigation.
Menus use Radix DropdownMenu; toggle groups use one Tab stop and arrow keys.
Hold-to-confirm supports pointer, Space and Enter; release, blur or Escape cancels.
Provider buttons use the bundled Line Awesome brand font, without remote assets.

Assumptions: the current app is Next 16 and uses `app/tailwind.css`, rather than
the older paths in the request. The existing design-system route hosts the gallery;
the root login redirect is retained. Existing variant names remain aliases.
Requested 28/32/36/40px size classes have a 36px minimum hit area (40px for coarse
pointers). Button colour fades use the requested 120ms override; other motion
keeps the existing tokens. No new colour tokens were introduced.

For an isolated gallery beside an existing dev server, run
`NEXT_BUILD_DIR=.next-buttons NEXT_PUBLIC_UI_GALLERY=1 npm run dev -- --webpack --hostname 127.0.0.1 -p 3105`,
then `npm run test:buttons`. The browser check uses a fresh headless Chrome profile;
set `BUTTON_CHROME` to a different executable or `BUTTON_GALLERY_URL` to another
running gallery. Evidence is written to `audit/buttons-2026-11-14/`.

### Tabs family (wave 2, in review)

Import the whole family from `@/components/ui`. Existing
`<Tabs tabs={...} active={...} onChange={...} {...useTabIds()} />` and external
`TabPanel` usage remain supported. New panels can live beside their triggers:

```tsx
<Tabs defaultValue="details" variant="underline" activationMode="automatic">
  <TabsList label="Asset sections">
    <TabsTrigger value="details" icon="info-circle">Details</TabsTrigger>
    <TabsTrigger value="rights" count={2} status="warning">Rights</TabsTrigger>
  </TabsList>
  <TabsContent value="details">Asset details</TabsContent>
  <TabsContent value="rights">Review licences</TabsContent>
</Tabs>
```

Use `items={[{ id: "details", label: "Details", content: ... }]}` for the shortcut.
Variants are `underline`, `segmented`, `boxed` and `vertical`; the old `text`,
`icon` and `pill` aliases remain. Sizes are `sm`, `md`, `lg`. `fill` shares available
space. `mobileAs="select"` replaces the list below 640px; `mobileAs="scroll"`
keeps a scrollable list and adapts vertical settings to horizontal mobile use.

```tsx
// Router tabs render links in a nav, with one most-specific current page.
<RouterTabs label="Asset pages" items={[
  { href: `/assets/${id}`, label: "Details" },
  { href: `/assets/${id}/rights`, label: "Rights" },
]} />

// Fetch only after selection. keepMounted preserves child form state after
// first opening. The loader receives an AbortSignal; failures offer a retry.
<TabsContent value="versions" keepMounted load={async (signal) => {
  const response = await fetch(`/api/assets/${id}/versions`, { signal });
  if (!response.ok) throw new Error("Could not load versions");
  const versions = await response.json();
  return <VersionList versions={versions} />;
}} />

// A refused or failed guard preserves the selected tab. Competing requests
// cannot commit stale results, and repeated requests share the pending guard.
<Tabs value={section} onValueChange={setSection}
  onBeforeChange={async () => !dirty || await confirm({
    title: "Leave unsaved edits?", confirmLabel: "Leave tab",
  })}>
  {/* TabsList, TabsTrigger and TabsContent */}
</Tabs>

<StepperTabs linear value={step} onValueChange={setStep} steps={[
  { id: "brief", label: "Brief", completed: briefComplete, content: <BriefForm /> },
  { id: "assets", label: "Assets", error: assetsHaveErrors, content: <AssetPicker /> },
  { id: "review", label: "Review", content: <CampaignReview /> },
]} />
```

`ScrollableTabs` and `OverflowTabs` live inside a `Tabs` root. The latter takes
`items` and puts hidden sections in a More menu while retaining an active tab
trigger. `EditableTabs` takes `items`, `onItemsChange` and optional `onAdd`; its
handles support pointer dragging, and Alt + arrows reorder the focused tab.
Delete closes a closable tab. `LanguageTabs` takes `english`, `arabic`, and
`arabicValue` to show the missing-translation warning. Labels, status descriptions,
position formatting, confirmation copy and loading/error/empty messages are props.

The full gallery is `/design-system/tabs`, also embedded in `/design-system`.
Enable it with `NEXT_PUBLIC_UI_GALLERY=1`. For an isolated preview, run
`NEXT_BUILD_DIR=.next-tabs NEXT_PUBLIC_UI_GALLERY=1 npm run dev -- --webpack --hostname 127.0.0.1 -p 3106`,
then `npm run test:tabs`. Evidence is in `audit/tabs-2026-11-14/`.

Assumptions: this checkout uses Next 16 and `app/tailwind.css`, so those supersede
the older paths/version in the brief. The existing gallery and login redirect are
retained. Active states use existing accent/primary tokens; boxed edges use the
existing `hairline-strong` role. No new colour tokens were introduced. Explicit
120ms colour and 180ms underline timing overrides the older motion values for
this family. Inactive panels unmount by default; `keepMounted` preserves them only
after first activation, while `forceMount` mounts them immediately but hides them.
