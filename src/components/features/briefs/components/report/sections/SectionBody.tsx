"use client";

import type { ReactNode } from "react";
import { Badge, Table, cellClasses, rowClasses } from "@/components/ui";
import { CHANNEL_META, CONSTRAINT_META, LEVEL_META, PRIORITY_META, SECTION_META } from "../../../constants";
import type { SectionContent, SectionKey, Statement } from "../../../types";
import { CitationChips, EvidenceLine } from "../citations";

/** A slot beside an item for its own actions (Add to Strategy). */
export type ItemAction = (field: string, item: { id?: string }) => ReactNode;

type BodyProps<K extends SectionKey> = { content: SectionContent[K]; isAr: boolean; itemAction?: ItemAction };

const Text = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <p dir="auto" className={`text-body text-text ${className}`}>
    {children}
  </p>
);

const Label = ({ children }: { children: ReactNode }) => <h4 className="text-caption text-text-muted">{children}</h4>;

const Bullets = ({ items }: { items: string[] }) =>
  items.length ? (
    <ul className="flex list-disc flex-col gap-space-1 ps-space-6 text-body text-text">
      {items.map((x, i) => (
        <li key={i} dir="auto">
          {x}
        </li>
      ))}
    </ul>
  ) : null;

const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`flex flex-col gap-space-4 rounded-card bg-surface-sunken p-space-6 shadow-edge-soft ${className}`}>{children}</div>
);

const Head = ({ title, right }: { title: ReactNode; right?: ReactNode }) => (
  <div className="flex items-start justify-between gap-space-4">
    <h3 className="bidi-plain text-body font-medium text-text">{title}</h3>
    {right && <div className="flex shrink-0 items-center gap-space-3">{right}</div>}
  </div>
);

const t = (isAr: boolean, en: string, ar: string) => (isAr ? ar : en);

function Snapshot({ content, isAr }: BodyProps<"snapshot">) {
  const rows: [string, string][] = [
    [t(isAr, "Client", "العميل"), content.client],
    [t(isAr, "Offer", "العرض"), content.offer],
    [t(isAr, "Market", "السوق"), content.market],
    [t(isAr, "Project", "المشروع"), content.projectType],
  ];
  return (
    <div className="flex flex-col gap-space-6">
      <dl className="grid grid-cols-1 gap-space-5 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-space-1">
            <dt className="text-caption text-text-muted">{label}</dt>
            <dd dir="auto" className="text-body text-text">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-space-3">
        <Label>{t(isAr, "Scope", "النطاق")}</Label>
        <Bullets items={content.scope} />
      </div>
      {content.facts.length > 0 && (
        <div className="flex flex-col gap-space-3">
          <Label>{t(isAr, "Key facts", "حقائق رئيسية")}</Label>
          <ul className="flex flex-col">
            {content.facts.map((fact, i) => (
              <li key={fact.id ?? i} className="flex flex-wrap items-start justify-between gap-space-4 py-space-4 shadow-rule-t first:shadow-none">
                <div className="flex min-w-0 flex-col gap-space-1">
                  <span className="text-caption text-text-muted">{fact.label}</span>
                  <Text>{fact.value}</Text>
                </div>
                <EvidenceLine evidence={fact} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Goals({ content, isAr, itemAction }: BodyProps<"goals">) {
  const group = (title: string, field: "business" | "brand") => (
    <div className="flex flex-col gap-space-3">
      <Label>{title}</Label>
      <ul className="flex flex-col">
        {content[field].map((goal, i) => (
          <li key={goal.id ?? i} className="flex flex-col gap-space-3 py-space-4 shadow-rule-t first:shadow-none">
            <div className="flex items-start justify-between gap-space-4">
              <Text>{goal.text}</Text>
              <div className="flex shrink-0 items-center gap-space-3">
                <Badge tone={LEVEL_META[goal.priority].tone} dot>
                  {PRIORITY_META[goal.priority][isAr ? "ar" : "en"]}
                </Badge>
                {itemAction?.(field, goal)}
              </div>
            </div>
            <EvidenceLine evidence={goal} />
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <div className="grid grid-cols-1 gap-space-8 lg:grid-cols-2">
      {group(t(isAr, "Business goals", "أهداف العمل"), "business")}
      {group(t(isAr, "Brand goals", "أهداف العلامة"), "brand")}
    </div>
  );
}

function Audience({ content, isAr, itemAction }: BodyProps<"audience">) {
  return (
    <div className="flex flex-col gap-space-8">
      <div className="flex flex-col gap-space-3">
        <Label>{t(isAr, "Segments", "الشرائح")}</Label>
        <ul className="flex flex-col">
          {content.segments.map((segment, i) => (
            <li key={segment.id ?? i} className="flex flex-col gap-space-2 py-space-4 shadow-rule-t first:shadow-none">
              <Head title={segment.name} right={itemAction?.("segments", segment)} />
              <Text className="text-text-secondary">{segment.description}</Text>
              <EvidenceLine evidence={segment} />
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-space-3">
        <Label>{t(isAr, "Personas", "الشخصيات")}</Label>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {content.personas.map((persona, i) => (
            <Card key={persona.id ?? i}>
              <Head title={persona.name} right={itemAction?.("personas", persona)} />
              <p className="bidi-plain text-caption text-text-muted">
                {[persona.ageRange, persona.job, persona.city].filter(Boolean).join(" · ")}
              </p>
              <div className="flex flex-col gap-space-2">
                <Label>{t(isAr, "Needs", "الاحتياجات")}</Label>
                <Bullets items={persona.needs} />
              </div>
              <div className="flex flex-col gap-space-2">
                <Label>{t(isAr, "Frustrations", "الإحباطات")}</Label>
                <Bullets items={persona.frustrations} />
              </div>
              <div className="flex flex-col gap-space-2">
                <Label>{t(isAr, "How they choose", "كيف يختارون")}</Label>
                <Text>{persona.howTheyChoose}</Text>
              </div>
              {persona.quote && (
                <blockquote className="flex gap-space-4 text-body text-text-secondary">
                  <span aria-hidden className="w-0.5 shrink-0 rounded-full bg-accent" />
                  <span dir="auto">{persona.quote}</span>
                </blockquote>
              )}
              <EvidenceLine evidence={persona} />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function Market({ content, isAr, itemAction }: BodyProps<"market">) {
  return (
    <div className="flex flex-col gap-space-8">
      <Text>{content.context}</Text>
      <Table
        label={t(isAr, "Competitors", "المنافسون")}
        columns={[
          { key: "name", label: t(isAr, "Competitor", "المنافس") },
          { key: "positioning", label: t(isAr, "Positioning", "التموضع") },
          { key: "strengths", label: t(isAr, "Strengths", "نقاط القوة"), className: "hidden md:table-cell" },
          { key: "gaps", label: t(isAr, "Gaps", "الثغرات"), className: "hidden md:table-cell" },
          { key: "sources", label: t(isAr, "Sources", "المصادر") },
        ]}
      >
        {content.competitors.map((c, i) => (
          <tr key={c.id ?? i} className={rowClasses}>
            <td className={cellClasses}>
              <div className="flex flex-col gap-space-1">
                <span className="bidi-plain font-medium text-text">{c.name}</span>
                <span className="text-caption text-text-muted">{c.mentionedBy === "client" ? t(isAr, "Named by the client", "ذكره العميل") : t(isAr, "Added on request", "أُضيف بطلب")}</span>
              </div>
            </td>
            <td className={cellClasses}>
              <span dir="auto">{c.positioning}</span>
            </td>
            <td className={`${cellClasses} hidden md:table-cell`}>
              <span dir="auto">{c.strengths}</span>
            </td>
            <td className={`${cellClasses} hidden md:table-cell`}>
              <span dir="auto">{c.gaps}</span>
            </td>
            <td className={cellClasses}>
              <div className="flex items-center gap-space-3">
                <EvidenceLine evidence={c} />
                {itemAction?.("competitors", c)}
              </div>
            </td>
          </tr>
        ))}
      </Table>
      {content.whiteSpace.length > 0 && (
        <div className="flex flex-col gap-space-3">
          <Label>{t(isAr, "White space", "المساحة الفارغة")}</Label>
          {content.whiteSpace.map((w, i) => (
            <div key={w.id ?? i} className="flex flex-col gap-space-2">
              <div className="flex items-start justify-between gap-space-4">
                <Text>{w.text}</Text>
                {itemAction?.("whiteSpace", w)}
              </div>
              <EvidenceLine evidence={w} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Personality({ content, isAr, itemAction }: BodyProps<"personality">) {
  return (
    <div className="flex flex-col gap-space-8">
      <div className="flex flex-col gap-space-3">
        <Label>{t(isAr, "Traits", "السمات")}</Label>
        <ul className="flex flex-col">
          {content.traits.map((trait, i) => (
            <li key={trait.id ?? i} className="flex flex-col gap-space-2 py-space-4 shadow-rule-t first:shadow-none">
              <div className="flex items-center justify-between gap-space-4">
                <Badge tone="accent" size="md">
                  <span className="bidi-plain">{trait.trait}</span>
                </Badge>
                {itemAction?.("traits", trait)}
              </div>
              <Text className="text-text-secondary">{trait.evidence}</Text>
              <EvidenceLine evidence={trait} />
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-space-5">
        <Label>{t(isAr, "Tone", "النبرة")}</Label>
        {content.sliders.map((slider, i) => (
          <div key={slider.id ?? i} className="flex flex-col gap-space-2">
            <div className="flex justify-between gap-space-4 text-caption text-text-secondary">
              <span className="bidi-plain">{slider.left}</span>
              <span className="bidi-plain">{slider.right}</span>
            </div>
            {/* 1 is the start label, 5 the end; it mirrors with the page. */}
            <div role="meter" aria-valuemin={1} aria-valuemax={5} aria-valuenow={slider.value} aria-label={`${slider.left} – ${slider.right}`} className="relative h-1.5 rounded-full bg-ink-soft">
              <span className="absolute inset-y-0 start-0 rounded-full bg-accent transition-[width] duration-base ease-standard" style={{ width: `${((slider.value - 1) / 4) * 100}%` }} />
              <span className="absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_0_2px_var(--surface-1)] rtl:translate-x-1/2 ltr:-translate-x-1/2" style={{ insetInlineStart: `${((slider.value - 1) / 4) * 100}%` }} />
            </div>
            <Text className="text-caption text-text-muted">{slider.evidence}</Text>
            <EvidenceLine evidence={slider} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-space-6 sm:grid-cols-2">
        <div className="flex flex-col gap-space-3">
          <Label>{t(isAr, "Words to use", "كلمات تُستخدم")}</Label>
          <div className="flex flex-wrap gap-space-2">
            {content.wordsToUse.map((w) => (
              <Badge key={w} tone="success">
                <span dir="auto">{w}</span>
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-space-3">
          <Label>{t(isAr, "Words to avoid", "كلمات تُتجنّب")}</Label>
          <div className="flex flex-wrap gap-space-2">
            {content.wordsToAvoid.map((w) => (
              <Badge key={w} tone="danger">
                <span dir="auto">{w}</span>
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const StatementCard = ({ side, statement }: { side: string; statement: Statement }) => (
  <div className="flex flex-col gap-space-3 rounded-lg bg-surface-1 p-space-5 shadow-edge-soft">
    <span className="text-caption text-text-muted">{side}</span>
    <Text>{statement.text}</Text>
    <CitationChips citations={statement.citations} />
  </div>
);

function Tensions({ content, isAr, itemAction }: BodyProps<"tensions">) {
  if (!content.items.length) return <Text className="text-text-muted">{t(isAr, "No contradictions found.", "لم تُرصد تناقضات.")}</Text>;
  return (
    <ul className="flex flex-col gap-5">
      {content.items.map((tension, i) => (
        <li key={tension.id ?? i}>
          <Card>
            <div className="flex items-center justify-between gap-space-4">
              <Badge tone={LEVEL_META[tension.severity].tone} dot>
                {LEVEL_META[tension.severity][isAr ? "ar" : "en"]}
              </Badge>
              {itemAction?.("items", tension)}
            </div>
            <div className="grid grid-cols-1 items-stretch gap-space-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
              <StatementCard side="A" statement={tension.statementA} />
              <span aria-hidden className="grid place-items-center text-text-muted">
                ↔
              </span>
              <StatementCard side="B" statement={tension.statementB} />
            </div>
            <div className="flex flex-col gap-space-2">
              <Label>{t(isAr, "Why it matters", "لماذا يهم")}</Label>
              <Text className="text-text-secondary">{tension.whyItMatters}</Text>
            </div>
            <div className="flex flex-col gap-space-2">
              <Label>{t(isAr, "Ask", "اسأل")}</Label>
              <Text>{tension.question}</Text>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}

function Gaps({ content, isAr, itemAction }: BodyProps<"gaps">) {
  return (
    <ul className="flex flex-col">
      {content.items.map((gap, i) => (
        <li key={gap.id ?? i} className="flex items-start gap-space-4 py-space-5 shadow-rule-t first:shadow-none">
          <span aria-hidden className="mt-0.5 size-5 shrink-0 rounded-sm shadow-edge" />
          <div className="flex min-w-0 flex-1 flex-col gap-space-2">
            <Text className="font-medium">{gap.question}</Text>
            <Text className="text-text-secondary">{gap.whyItMatters}</Text>
            <div className="flex flex-wrap items-center gap-space-3 text-caption text-text-muted">
              <span>
                {t(isAr, "Blocks", "يعطّل")}: {SECTION_META[gap.blocks][isAr ? "ar" : "en"]}
              </span>
              <Badge>{CHANNEL_META[gap.channel][isAr ? "ar" : "en"]}</Badge>
            </div>
          </div>
          {itemAction?.("items", gap)}
        </li>
      ))}
    </ul>
  );
}

function Routes({ content, isAr, itemAction }: BodyProps<"routes">) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
      {content.items.map((route, i) => (
        <Card key={route.id ?? i}>
          <Head
            title={route.name}
            right={
              <>
                <Badge tone={route.fit >= 4 ? "success" : route.fit >= 3 ? "warning" : "neutral"}>
                  {t(isAr, "Fit", "الملاءمة")} {route.fit}/5
                </Badge>
                {itemAction?.("items", route)}
              </>
            }
          />
          <Text className="font-medium">{route.idea}</Text>
          <Text className="text-text-secondary">{route.positioning}</Text>
          <div className="grid grid-cols-1 gap-space-4 sm:grid-cols-2">
            <div className="flex flex-col gap-space-2">
              <Label>{t(isAr, "Pros", "الإيجابيات")}</Label>
              <Bullets items={route.pros} />
            </div>
            <div className="flex flex-col gap-space-2">
              <Label>{t(isAr, "Risks", "المخاطر")}</Label>
              <Bullets items={route.risks} />
            </div>
          </div>
          {[...route.leansOn.goals, ...route.leansOn.audience, ...route.leansOn.tensions].length > 0 && (
            <div className="flex flex-col gap-space-2">
              <Label>{t(isAr, "Leans on", "يعتمد على")}</Label>
              <div className="flex flex-wrap gap-space-2">
                {[...route.leansOn.goals, ...route.leansOn.audience, ...route.leansOn.tensions].map((x, j) => (
                  <Badge key={j}>
                    <span dir="auto">{x}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <EvidenceLine evidence={route} />
        </Card>
      ))}
    </div>
  );
}

function Creative({ content, isAr }: BodyProps<"creative">) {
  const row = (label: string, items: string[]) =>
    items.length ? (
      <div className="flex flex-col gap-space-2">
        <Label>{label}</Label>
        <Bullets items={items} />
      </div>
    ) : null;
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
      {content.routes.map((route, i) => (
        <Card key={route.id ?? i}>
          <Head title={route.routeName} />
          {row(t(isAr, "Themes", "الثيمات"), route.themes)}
          {row(t(isAr, "Visual cues", "إشارات بصرية"), route.visualCues)}
          {row(t(isAr, "Verbal cues", "إشارات لفظية"), route.verbalCues)}
          {row(t(isAr, "References", "مراجع"), route.references)}
        </Card>
      ))}
    </div>
  );
}

function Constraints({ content, isAr, itemAction }: BodyProps<"constraints">) {
  return (
    <Table
      label={t(isAr, "Constraints", "القيود")}
      columns={[
        { key: "category", label: t(isAr, "Area", "المجال") },
        { key: "text", label: t(isAr, "Constraint", "القيد") },
        { key: "severity", label: t(isAr, "Severity", "الخطورة") },
        { key: "mitigation", label: t(isAr, "Mitigation", "المعالجة"), className: "hidden md:table-cell" },
        { key: "sources", label: t(isAr, "Sources", "المصادر") },
      ]}
    >
      {content.items.map((c, i) => (
        <tr key={c.id ?? i} className={rowClasses}>
          <td className={cellClasses}>{CONSTRAINT_META[c.category][isAr ? "ar" : "en"]}</td>
          <td className={cellClasses}>
            <span dir="auto">{c.text}</span>
          </td>
          <td className={cellClasses}>
            <Badge tone={LEVEL_META[c.severity].tone} dot>
              {LEVEL_META[c.severity][isAr ? "ar" : "en"]}
            </Badge>
          </td>
          <td className={`${cellClasses} hidden md:table-cell`}>
            <span dir="auto">{c.mitigation}</span>
          </td>
          <td className={cellClasses}>
            <div className="flex items-center gap-space-3">
              <EvidenceLine evidence={c} />
              {itemAction?.("items", c)}
            </div>
          </td>
        </tr>
      ))}
    </Table>
  );
}

/** The right renderer for a section's content. */
export function SectionBody({ sectionKey, content, isAr, itemAction }: { sectionKey: SectionKey; content: unknown; isAr: boolean; itemAction?: ItemAction }) {
  switch (sectionKey) {
    case "snapshot":
      return <Snapshot content={content as SectionContent["snapshot"]} isAr={isAr} itemAction={itemAction} />;
    case "goals":
      return <Goals content={content as SectionContent["goals"]} isAr={isAr} itemAction={itemAction} />;
    case "audience":
      return <Audience content={content as SectionContent["audience"]} isAr={isAr} itemAction={itemAction} />;
    case "market":
      return <Market content={content as SectionContent["market"]} isAr={isAr} itemAction={itemAction} />;
    case "personality":
      return <Personality content={content as SectionContent["personality"]} isAr={isAr} itemAction={itemAction} />;
    case "tensions":
      return <Tensions content={content as SectionContent["tensions"]} isAr={isAr} itemAction={itemAction} />;
    case "gaps":
      return <Gaps content={content as SectionContent["gaps"]} isAr={isAr} itemAction={itemAction} />;
    case "routes":
      return <Routes content={content as SectionContent["routes"]} isAr={isAr} itemAction={itemAction} />;
    case "creative":
      return <Creative content={content as SectionContent["creative"]} isAr={isAr} itemAction={itemAction} />;
    case "constraints":
      return <Constraints content={content as SectionContent["constraints"]} isAr={isAr} itemAction={itemAction} />;
  }
}
