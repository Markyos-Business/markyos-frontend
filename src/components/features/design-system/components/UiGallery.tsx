"use client";

import { useState } from "react";
import { ActionsDropdown, AppDate, AsyncStateView, Badge, Button, Faq, FilterChip, Icon, IconBadge, IconButton, ModalHeader, Skeleton, SolidBadge, Table, TableEmptyRow, TableErrorRow, TableLoadingRow, TablePagination, Tabs, Tooltip, cellClasses, rowClasses, useToast, type BadgeTone } from "@/components/ui";
import {
  Combobox,
  FileField,
  FilterSelectField,
  OtpField,
  PhoneField,
  RadioCardGroup,
  RadioField,
  RepeaterField,
  SearchableChecklist,
  SegmentedToggle,
  SelectField,
  SortControl,
  TextareaField,
  ToggleCardGroup,
  ToggleField,
  type RepeaterRow,
} from "@/components/form";
import { ThemeToggle } from "@/contexts/ThemeProvider";

const TONES: BadgeTone[] = ["neutral", "info", "success", "warning", "attention", "danger"];
const OPTIONS = [
  { value: "dubai", label: "Dubai" },
  { value: "riyadh", label: "Riyadh" },
  { value: "cairo", label: "Cairo" },
  { value: "amman", label: "Amman", disabled: true },
];

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mk-surface flex flex-col gap-space-6 rounded-card bg-surface-1 p-space-10" data-gallery-section={title}>
    <h2 className="text-h5 font-medium text-text">{title}</h2>
    {children}
  </section>
);

/**
 * Every shared component in one place, in both directions and both themes:
 * the page the motion and port checks run against. Not linked from the app.
 */
const UiGallery = () => {
  const [dir, setDir] = useState<"ltr" | "rtl">("ltr");
  const [tab, setTab] = useState("one");
  const [view, setView] = useState("list");
  const [city, setCity] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [radio, setRadio] = useState("a");
  const [card, setCard] = useState<"transfer" | "share">("transfer");
  const [toggle, setToggle] = useState(true);
  const [toggles, setToggles] = useState<string[]>(["email"]);
  const [mode, setMode] = useState(false);
  const [otp, setOtp] = useState("12");
  const [dial, setDial] = useState("+971");
  const [phone, setPhone] = useState("");
  const [sort, setSort] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set(["1"]));
  const [rows, setRows] = useState<RepeaterRow[]>([{ name: "Tuition", amount: "1200" }]);
  const [file, setFile] = useState<File | null>(null);
  const [page, setPage] = useState(1);
  const { showToast } = useToast();
  // Once, not on every render: a relative date needs a fixed "a moment ago".
  const [recent] = useState(() => new Date(Date.now() - 5 * 60_000));

  return (
    <div dir={dir} className="min-h-screen bg-canvas text-text">
      <header className="sticky top-0 z-sticky flex flex-wrap items-center justify-between gap-3 bg-canvas px-5 py-3 shadow-rule-b">
        <h1 className="text-h3 font-medium">UI gallery</h1>
        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" onClick={() => setDir((d) => (d === "ltr" ? "rtl" : "ltr"))} data-gallery-dir>
            {dir === "ltr" ? "Switch to RTL" : "Switch to LTR"}
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-8">
        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-space-4">
            <Button variant="primary" icon={<Icon name="plus" size={18} />}>
              Save
            </Button>
            <Button variant="outline">Add task</Button>
            <Button variant="ghost">Mark all reviewed</Button>
            <Button variant="danger">Delete brand</Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
            <Button variant="primary" size="sm">
              Compact
            </Button>
            <IconButton variant="primary" icon="arrow-right" label="Next asset" iconSize={18} className="rtl:-scale-x-100" />
            <IconButton variant="outline" icon="plus" label="Add asset" />
            <IconButton icon="times" label="Close" />
            <Button variant="link">View all</Button>
          </div>
        </Section>

        <Section title="Badges">
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <Badge key={t} tone={t}>
                {t}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <Badge key={t} tone={t} size="md" dot>
                {t}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {TONES.map((t) => (
              <SolidBadge key={t} tone={t}>
                {TONES.indexOf(t) + 3}
              </SolidBadge>
            ))}
            {TONES.map((t) => (
              <IconBadge key={`i-${t}`} tone={t} icon="users" />
            ))}
          </div>
        </Section>

        <Section title="Buttons, tooltip, chips, dates">
          <div className="flex flex-wrap items-center gap-3">
            <Tooltip content="Opens on the reading-end side." side="end">
              <Button variant="outline">Tooltip end</Button>
            </Tooltip>
            <Tooltip content="Above the trigger.">
              <Button>Tooltip top</Button>
            </Tooltip>
            <ActionsDropdown
              items={[
                { label: "Edit", icon: "pen", onSelect: () => showToast("Edited", "success") },
                { label: "Share", icon: "share-alt", onSelect: () => showToast("Shared"), tone: "success" },
                { label: "Delete", icon: "trash", onSelect: () => showToast("Deleted", "danger"), tone: "danger" },
              ]}
            />
            <FilterChip label="Dubai" onRemove={() => showToast("Filter removed")} />
            <AppDate value="2026-06-23T14:30:00Z" format="long" />
            <AppDate value={recent} format="relative" />
          </div>
        </Section>

        <Section title="Tabs and accordion">
          <Tabs
            label="Gallery tabs"
            tabs={[
              { key: "one", label: "Overview" },
              { key: "two", label: "Activity" },
              { key: "three", label: "Settings" },
            ]}
            active={tab}
            onChange={setTab}
          />
          <p className="text-body text-text-muted">Panel: {tab}</p>
          <Tabs
            label="View"
            variant="icon"
            tabs={[
              { key: "list", label: "List", icon: "list-ul" },
              { key: "grid", label: "Grid", icon: "th-large" },
            ]}
            active={view}
            onChange={setView}
          />
          <Faq
            items={[
              { question: "What is Markyos?", answer: "A studio for brand guidelines." },
              { question: "Does it work in Arabic?", answer: "Every screen mirrors, in both themes." },
            ]}
          />
        </Section>

        <Section title="Table">
          <Table
            label="Gallery table"
            columns={[
              { key: "name", label: "Name" },
              { key: "city", label: "City" },
              { key: "status", label: "Status" },
              { key: "a", label: "Column A" },
              { key: "b", label: "Column B" },
              { key: "c", label: "Column C" },
            ]}
            footer={<TablePagination currentPage={page} onPageChange={setPage} itemsPerPage={2} itemCount={2} totalCount={6} itemLabel="people" />}
          >
            {["Nadeen", "Omar"].map((n) => (
              <tr key={n} className={rowClasses}>
                <td className={cellClasses}>{n}</td>
                <td className={cellClasses}>Dubai</td>
                <td className={cellClasses}>
                  <Badge tone="success" dot>
                    Active
                  </Badge>
                </td>
                <td className={`${cellClasses} whitespace-nowrap`}>A long value that makes the table scroll</td>
                <td className={`${cellClasses} whitespace-nowrap`}>Another long value here</td>
                <td className={`${cellClasses} whitespace-nowrap`}>And one more for good measure</td>
              </tr>
            ))}
            <TableLoadingRow colSpan={6} rows={1} columns={6} />
            <TableErrorRow colSpan={6} onRetry={() => showToast("Retrying")} />
            <TableEmptyRow colSpan={6} title="No people match" description="Try another search." />
          </Table>
        </Section>

        <Section title="Async states and modal header">
          <AsyncStateView status="empty" skeleton={<Skeleton />} emptyTitle="No brands yet" emptyDescription="Create one to start." emptyIcon="inbox">
            <span />
          </AsyncStateView>
          <AsyncStateView status="loading" skeleton={<Skeleton className="h-10 w-full rounded-lg" />} emptyTitle="" emptyDescription="">
            <span />
          </AsyncStateView>
          <div className="overflow-hidden rounded-2xl bg-surface-0 shadow-edge">
            <ModalHeader title="Transfer brand" description="Move it to another studio." icon="share-alt" tone="info" onClose={() => showToast("Closed")} />
          </div>
        </Section>

        <Section title="Form fields">
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField label="City" required value={city} onChange={(e) => setCity(e.target.value)} options={OPTIONS} />
            <Combobox label="City (search)" options={OPTIONS} value={city} onChange={setCity} emptyActions={[{ label: "Add city", onSelect: () => showToast("Added") }]} />
            <Combobox label="Cities" multiple options={OPTIONS} value={cities} onChange={setCities} />
            <TextareaField label="Notes" placeholder="Anything we should know" />
            <PhoneField dialCode={dial} number={phone} onDialCodeChange={setDial} onNumberChange={setPhone} required />
            <OtpField label="Code" value={otp} onChange={setOtp} />
            <RadioField label="Plan" options={[{ value: "a", label: "Monthly" }, { value: "b", label: "Yearly" }]} value={radio} onChange={setRadio} />
            <div className="flex flex-wrap items-end gap-3">
              <FilterSelectField label="Status" hideLabel icon="sliders" options={[{ value: "", label: "Any status" }, { value: "a", label: "Active" }]} />
              <SortControl options={[{ value: "name", label: "Name A–Z" }]} value={sort} onChange={setSort} />
              <SegmentedToggle label="Mode" off={{ label: "From list", icon: "list-ul" }} on={{ label: "Type it", icon: "pen" }} value={mode} onChange={setMode} />
            </div>
          </div>
          <RadioCardGroup
            label="Ownership"
            options={[
              { value: "transfer", label: "Transfer", hint: "They become the owner.", icon: "share-square" },
              { value: "share", label: "Share", hint: "You stay the owner.", icon: "users" },
            ]}
            value={card}
            onChange={setCard}
          />
          <ToggleField label="Visible to clients" checked={toggle} onChange={setToggle} description={{ on: "Clients can open it", off: "Only your team" }} />
          <ToggleCardGroup
            label="Notifications"
            options={[
              { id: "email", name: "Email" },
              { id: "sms", name: "SMS" },
              { id: "push", name: "Push" },
            ]}
            value={toggles}
            onChange={setToggles}
          />
          <SearchableChecklist
            items={[
              { id: "1", label: "Nadeen Darwish", sublabel: "nadeen@studio.com", badge: "Owner" },
              { id: "2", label: "Omar Haddad", sublabel: "omar@studio.com" },
            ]}
            selected={picked}
            onChange={setPicked}
            itemNoun="people"
          />
          <SearchableChecklist items={OPTIONS.map((o) => ({ id: o.value, label: o.label }))} selected={picked} onChange={setPicked} itemNoun="cities" layout="chips" />
          <RepeaterField
            label="Fees"
            rowLabel="fee"
            columns={[
              { key: "name", label: "Name" },
              { key: "amount", label: "Amount", type: "number" },
            ]}
            rows={rows}
            onChange={setRows}
          />
          <FileField label="Brand guide" accept=".pdf,image/*" acceptLabel="PDF or image" file={file} onFileChange={setFile} onRemove={() => setFile(null)} />
          <FileField label="Logo" variant="compact" accept="image/*" acceptLabel="image" file={file} onFileChange={setFile} onRemove={() => setFile(null)} uploading={!!file} progress={45} />
        </Section>
      </main>
    </div>
  );
};

export { UiGallery };
