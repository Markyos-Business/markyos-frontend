"use client";

import { Icon } from "@/components/Icon";
import { backgroundInkWarning, overriddenIn, patchScope, resolveStyle, SCALE_MAX, SCALE_MIN } from "@/lib/blockStyle";
import { resolveVariantKey, variantsFor } from "@/lib/sectionVariants";
import type { BlockStyle, ResponsiveStyle, Workspace } from "@/lib/types";
import type { Breakpoint, Dir } from "@/lib/doc/core/types";

/**
 * How one section looks, in the view you are looking at it from.
 *
 * The controls are semantic rather than free CSS on purpose: this page is
 * published bilingually and read on phones, so "align to the start" survives a
 * switch to Arabic and a hard left offset would not.
 *
 * What is new here is the scope. Edit a field from the phone view and it lands
 * as a phone override — nobody is asked whether they want one, because in
 * practice nobody knows what the honest answer is until later. A field with an
 * override somewhere shows a dot, and the dot is how you get it back.
 */

type Scope = "tablet" | "phone" | "rtl";

export type InspectorView = {
  breakpoint: Breakpoint;
  dir: Dir;
  /** The scope this view writes into, or null when it is the primary view. */
  scope: Scope | null;
};

const SCOPE_LABEL: Record<Scope, { en: string; ar: string }> = {
  tablet: { en: "Tablet", ar: "اللوحي" },
  phone: { en: "Phone", ar: "الهاتف" },
  rtl: { en: "Arabic", ar: "العربية" },
};

export function DesignInspector({
  isAr,
  ws,
  style,
  view,
  sectionId,
  onChange,
}: {
  isAr: boolean;
  ws: Workspace;
  style: BlockStyle | undefined;
  view: InspectorView;
  /**
   * The derived section being edited, when it is one.
   *
   * Only these have alternate layouts: an authored block's shape is the block
   * kind that was chosen for it. Null for a block, and for a section with a
   * single layout the picker renders nothing.
   */
  sectionId?: string | null;
  /** Receives a whole replacement style, already scoped. */
  onChange: (next: BlockStyle) => void;
}) {
  const resolved = resolveStyle(style, { breakpoint: view.breakpoint, dir: view.dir }) ?? {};
  const scale = resolved.scale ?? 1;
  const inkWarning = backgroundInkWarning(resolved.background);
  const touched = Object.keys(style ?? {}).length > 0;

  /** Writes into whichever scope the current view owns. */
  function set(patch: Partial<ResponsiveStyle>) {
    if (view.scope) onChange(patchScope(style, view.scope, patch));
    else onChange({ ...(style ?? {}), ...patch });
  }

  /** Base-only fields: colour is one design decision, not a per-width one. */
  function setBase(patch: Partial<BlockStyle>) {
    onChange({ ...(style ?? {}), ...patch });
  }

  function clearScope(key: keyof ResponsiveStyle, scope: Scope) {
    onChange(patchScope(style, scope, { [key]: undefined }));
  }

  const overrideProps = (key: keyof ResponsiveStyle) => ({
    scopes: overriddenIn(style, key),
    activeScope: view.scope,
    onReset: (scope: Scope) => clearScope(key, scope),
  });

  return (
    <div className="flex flex-col gap-4">
      {/*
       * No "Design" heading of its own.
       *
       * The panel this renders into is already titled "Design", so the word
       * appeared twice — once at the top of the panel, once again three lines
       * below a paragraph — which reads as two sections rather than one.
       * "Reset all" is what this row is for, and it only exists when there is
       * something to reset.
       */}
      {touched && (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => onChange({})}
            className="mk-tap text-[11px] font-semibold cursor-pointer"
            style={{ color: "var(--accent-text)" }}
          >
            {isAr ? "إعادة الضبط" : "Reset all"}
          </button>
        </div>
      )}

      {view.scope && (
        <div
          className="flex items-start gap-2 rounded-lg px-2.5 py-2 text-[11px] leading-[1.45]"
          style={{ background: "var(--accent-soft)", color: "var(--accent-on-soft)" }}
        >
          <Icon name={view.scope === "rtl" ? "language" : view.scope === "phone" ? "mobile" : "tablet"} size={12} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            {isAr
              ? `التغييرات هنا تُحفظ كتجاوز لعرض ${SCOPE_LABEL[view.scope].ar} فقط.`
              : `Changes here are saved as a ${SCOPE_LABEL[view.scope].en} override only.`}
          </span>
        </div>
      )}

      {sectionId && (
        <LayoutPicker
          sectionId={sectionId}
          style={style}
          isAr={isAr}
          // Deck is a slide presentation that composes each section as a fixed
          // 1920×1080 frame of its own rather than rendering the shared section
          // bodies, so a layout chosen here has no effect while it is selected.
          // Saying so beats a control that moves and changes nothing.
          inert={ws.guidelineTemplate === "deck"}
          onChange={setBase}
        />
      )}

      <Group label={isAr ? "التخطيط" : "Layout"}>
        <Choice
          label={isAr ? "المحاذاة" : "Alignment"}
          value={resolved.align}
          onChange={(align) => set({ align })}
          isAr={isAr}
          {...overrideProps("align")}
          options={[
            { value: "start" as const, label: isAr ? "بداية" : "Start" },
            { value: "center" as const, label: isAr ? "وسط" : "Center" },
            { value: "end" as const, label: isAr ? "نهاية" : "End" },
          ]}
        />
        <Choice
          label={isAr ? "العرض" : "Width"}
          value={resolved.width}
          onChange={(width) => set({ width })}
          isAr={isAr}
          {...overrideProps("width")}
          options={[
            { value: "narrow" as const, label: isAr ? "ضيق" : "Narrow" },
            { value: "wide" as const, label: isAr ? "واسع" : "Wide" },
            { value: "full" as const, label: isAr ? "كامل" : "Full" },
          ]}
        />
        <Choice
          label={isAr ? "الحشو الداخلي" : "Padding"}
          value={resolved.padding}
          onChange={(padding) => set({ padding })}
          isAr={isAr}
          {...overrideProps("padding")}
          options={[
            { value: "none" as const, label: isAr ? "بدون" : "None" },
            { value: "sm" as const, label: "S" },
            { value: "md" as const, label: "M" },
            { value: "lg" as const, label: "L" },
          ]}
        />
        <Choice
          label={isAr ? "استدارة الحواف" : "Corners"}
          value={resolved.radius}
          onChange={(radius) => setBase({ radius })}
          isAr={isAr}
          scopes={[]}
          activeScope={null}
          onReset={() => {}}
          options={[
            { value: "none" as const, label: isAr ? "حادة" : "Sharp" },
            { value: "md" as const, label: "M" },
            { value: "lg" as const, label: "L" },
          ]}
        />
      </Group>

      <Group label={isAr ? "الحجم" : "Size"}>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "var(--text-faint)" }}>
              {isAr ? "المقياس" : "Scale"}
              <OverrideDot isAr={isAr} {...overrideProps("scale")} />
            </span>
            <span className="text-[11px]" style={{ color: resolved.scale ? "var(--accent)" : "var(--text-faint)" }}>
              {resolved.scale ? `${Math.round(scale * 100)}%` : isAr ? "تلقائي" : "Auto"}
            </span>
          </div>
          <input
            type="range"
            aria-label={isAr ? "حجم القسم" : "Section scale"}
            aria-valuetext={resolved.scale ? `${Math.round(scale * 100)}%` : isAr ? "تلقائي" : "Auto"}
            min={SCALE_MIN}
            max={SCALE_MAX}
            step={0.05}
            value={scale}
            onChange={(e) => {
              const next = Number(e.target.value);
              // Back at 1 there is nothing to store. Clearing it puts the
              // section back to following the template rather than pinning it
              // at a number that merely equals today's default.
              set({ scale: next === 1 ? undefined : next });
            }}
            className="w-full cursor-pointer"
            style={{ accentColor: "var(--accent)" }}
          />
        </div>
      </Group>

      <Group label={isAr ? "الألوان" : "Colour"}>
        {/* Colour is one decision for the whole brand page, not a per-width
            one: a section that is navy on desktop and beige on a phone is two
            designs, and the second one is the one nobody maintains. */}
        <PaletteColor
          isAr={isAr}
          ws={ws}
          label={isAr ? "خلفية القسم" : "Section background"}
          value={style?.background}
          onChange={(background) => setBase({ background })}
        />
        {style?.background && !style.textColor && (
          <span className="text-[11px] -mt-1" style={{ color: "var(--text-faint)" }}>
            {isAr
              ? "يتبع لون النص الخلفية تلقائيًا. اضبطه أدناه إن أردت لونًا محددًا."
              : "Text in this section follows the background automatically. Set a colour below to override it."}
          </span>
        )}
        {inkWarning && (
          <div
            className="flex gap-2 rounded-lg px-2.5 py-2"
            style={{ background: "color-mix(in srgb, var(--warning) 14%, transparent)" }}
          >
            <Icon name="exclamation-circle" size={13} style={{ color: "var(--warning)", flexShrink: 0, marginTop: 2 }} />
            <span className="text-[11px] leading-[1.45]" style={{ color: "var(--text-secondary)" }}>
              {isAr
                ? `أفضل تباين ممكن على هذه الخلفية هو ${inkWarning.ratio.toFixed(2)}:1 — أقل من 4.5:1. النص هنا سيبقى صعب القراءة مهما كان لونه.`
                : `The best contrast any ink reaches on this colour is ${inkWarning.ratio.toFixed(
                    2,
                  )}:1 — under the 4.5:1 floor. Body copy on this section will be hard to read whatever colour it is.`}
            </span>
          </div>
        )}
        <PaletteColor
          isAr={isAr}
          ws={ws}
          label={isAr ? "لون النص" : "Text colour"}
          value={style?.textColor}
          onChange={(textColor) => setBase({ textColor })}
        />
      </Group>

      <Group label={isAr ? "الظهور" : "Visibility"}>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={resolved.hidden === true}
            onChange={(e) => set({ hidden: e.target.checked ? true : undefined })}
            className="cursor-pointer"
            style={{ accentColor: "var(--accent)" }}
          />
          <span className="flex items-center gap-1.5 text-[12px]">
            {view.scope
              ? isAr
                ? `إخفاء في عرض ${SCOPE_LABEL[view.scope].ar}`
                : `Hide on ${SCOPE_LABEL[view.scope].en}`
              : isAr
                ? "إخفاء من الموقع المنشور"
                : "Hide from the published site"}
            <OverrideDot isAr={isAr} {...overrideProps("hidden")} />
          </span>
        </label>
        <span className="text-[11px] -mt-1" style={{ color: "var(--text-faint)" }}>
          {view.scope
            ? isAr
              ? "يبقى القسم على العروض الأخرى."
              : "The section stays on the other views."
            : isAr
              ? "يبقى ظاهرًا لك هنا، ولا يراه العميل."
              : "Stays visible to you here; the client never sees it."}
        </span>
      </Group>
    </div>
  );
}

/**
 * Which layout this section is drawn in.
 *
 * Top of the panel, above the style controls, because it is the biggest decision
 * here and the one the rest are adjustments to: padding and alignment applied to
 * a swatch grid and to a band of colour mean different things, so choosing the
 * arrangement first is the order the work actually happens in.
 *
 * Full-width rows with a sentence each rather than a row of pills. These are not
 * four values of one property — they are four arrangements of the same
 * information, and which one you want depends on something a two-word label
 * can't say ("for a palette with a lot in it").
 *
 * It renders nothing when the section has only one layout, so a section that has
 * never had alternates written for it does not grow an empty picker.
 */
function LayoutPicker({
  sectionId,
  style,
  isAr,
  inert,
  onChange,
}: {
  sectionId: string;
  style: BlockStyle | undefined;
  isAr: boolean;
  /** The active template draws this section itself and ignores the choice. */
  inert?: boolean;
  onChange: (patch: Partial<BlockStyle>) => void;
}) {
  const options = variantsFor(sectionId);
  if (options.length < 2) return null;
  const active = resolveVariantKey(sectionId, style?.variant);

  return (
    <Group label={isAr ? "تخطيط القسم" : "Section layout"}>
      {inert && (
        <div
          className="flex items-start gap-2 rounded-lg px-2.5 py-2 text-[11px] leading-[1.45]"
          style={{ background: "var(--surface-1)", color: "var(--text-muted)" }}
        >
          <Icon name="exclamation-circle" size={12} style={{ flexShrink: 0, marginTop: 1, color: "var(--warning)" }} />
          <span>
            {isAr
              ? "قالب Deck يبني كل قسم كشريحة خاصة به، لذا لا يؤثر هذا الاختيار عليه. يُحفظ الاختيار وينطبق عند التبديل إلى قالب آخر."
              : "The Deck template builds each section as a slide of its own, so this choice has no effect while it is selected. It is still saved, and applies if you switch template."}
          </span>
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        {options.map((v, i) => {
          const on = v.key === active;
          return (
            <button
              key={v.key}
              type="button"
              aria-pressed={on}
              data-layout-option={v.key}
              // The default is stored as *unset* rather than as its own key, so
              // a section following the default keeps following it if the
              // default ever changes — the same argument as every other unset
              // field in this panel.
              onClick={() => onChange({ variant: i === 0 ? undefined : v.key })}
              className="flex flex-col gap-0.5 rounded-xl px-3 py-2.5 text-start cursor-pointer"
              style={{
                background: on ? "var(--accent-soft)" : "var(--surface-1)",
                boxShadow: on ? "inset 0 0 0 1px var(--accent)" : undefined,
                color: on ? "var(--accent-on-soft)" : "var(--text)",
              }}
            >
              <span className="flex items-center gap-1.5">
                <span className="text-[12px] font-semibold">{isAr ? v.arLabel : v.label}</span>
                {i === 0 && (
                  <span className="text-[9px] font-semibold" style={{ opacity: 0.7 }}>
                    {isAr ? "(الافتراضي)" : "(DEFAULT)"}
                  </span>
                )}
              </span>
              <span
                className="text-[10.5px] leading-[1.45]"
                style={{ color: on ? "var(--accent-on-soft)" : "var(--text-faint)", opacity: on ? 0.85 : 1 }}
              >
                {isAr ? v.arHint : v.hint}
              </span>
            </button>
          );
        })}
      </div>
    </Group>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 pt-3.5" style={{ boxShadow: "inset 0 1px 0 var(--hairline)" }}>
      <span className="text-[10px] font-semibold uppercase" style={{ letterSpacing: ".08em", color: "var(--text-faint)" }}>
        {label}
      </span>
      {children}
    </div>
  );
}

/**
 * The mark that says "this field is not the same everywhere".
 *
 * Without it the inspector lies by omission: you change the desktop padding,
 * nothing moves on the phone, and there is no way to find out why short of
 * visiting every view and comparing by eye.
 */
function OverrideDot({
  scopes,
  activeScope,
  onReset,
  isAr,
}: {
  scopes: Scope[];
  activeScope: Scope | null;
  onReset: (scope: Scope) => void;
  isAr: boolean;
}) {
  if (scopes.length === 0) return null;
  const here = activeScope && scopes.includes(activeScope) ? activeScope : null;
  const names = scopes.map((s) => (isAr ? SCOPE_LABEL[s].ar : SCOPE_LABEL[s].en)).join(", ");

  if (!here) {
    return (
      <span
        title={isAr ? `متجاوَز في: ${names}` : `Overridden on ${names}`}
        aria-label={isAr ? `متجاوَز في: ${names}` : `Overridden on ${names}`}
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: "var(--accent)" }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        onReset(here);
      }}
      title={isAr ? "إعادة إلى قيمة سطح المكتب" : "Reset to the Desktop value"}
      aria-label={isAr ? "إعادة إلى قيمة سطح المكتب" : "Reset to the Desktop value"}
      className="mk-tap text-[10px] font-semibold px-1.5 rounded-full cursor-pointer shrink-0"
      style={{ background: "var(--accent-soft)", color: "var(--accent-on-soft)" }}
    >
      {isAr ? "إعادة" : "Reset"}
    </button>
  );
}

/**
 * A row of mutually exclusive choices where one of them is "leave it alone".
 *
 * That last option is the point: an unset value means the section keeps
 * following whatever template it is rendered in, so a studio that nudged the
 * padding once has not silently opted out of every future template switch.
 */
function Choice<T extends string | number>({
  label,
  value,
  options,
  onChange,
  isAr,
  scopes,
  activeScope,
  onReset,
}: {
  label: string;
  value: T | undefined;
  options: { value: T; label: string }[];
  onChange: (next: T | undefined) => void;
  isAr: boolean;
  scopes: Scope[];
  activeScope: Scope | null;
  onReset: (scope: Scope) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "var(--text-faint)" }}>
        {label}
        <OverrideDot scopes={scopes} activeScope={activeScope} onReset={onReset} isAr={isAr} />
      </span>
      <div className="flex rounded-full p-0.5 gap-0.5" style={{ background: "var(--surface-1)" }}>
        <button
          type="button"
          onClick={() => onChange(undefined)}
          title={isAr ? "اترك كما هو في القالب" : "Leave as the template has it"}
          className="h-8 px-2.5 rounded-full text-[11px] font-semibold cursor-pointer shrink-0"
          style={{
            background: value === undefined ? "var(--surface-2)" : "transparent",
            color: value === undefined ? "var(--text)" : "var(--text-faint)",
          }}
        >
          {isAr ? "تلقائي" : "Auto"}
        </button>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            className="flex-1 h-8 rounded-full text-[11px] font-semibold cursor-pointer"
            style={{
              background: value === o.value ? "var(--accent-soft)" : "transparent",
              color: value === o.value ? "var(--accent-on-soft)" : "var(--text-faint)",
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * A colour, chosen from the brand's own palette first.
 *
 * Offering an arbitrary picker as the primary control would invite a guideline
 * that breaks its own palette on its own pages, so the swatches come first and
 * the free picker sits beside them for the cases the palette genuinely does not
 * cover — a tint behind a callout, say.
 */
function PaletteColor({
  label,
  value,
  ws,
  onChange,
  isAr,
}: {
  label: string;
  value: string | undefined;
  ws: Workspace;
  onChange: (next: string | undefined) => void;
  isAr: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium" style={{ color: "var(--text-faint)" }}>{label}</span>
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => onChange(undefined)}
          title={isAr ? "اترك كما هو في القالب" : "Leave as the template has it"}
          className="h-7 px-2.5 rounded-full text-[10.5px] font-semibold cursor-pointer"
          style={{
            background: value === undefined ? "var(--surface-2)" : "var(--surface-1)",
            color: value === undefined ? "var(--text)" : "var(--text-faint)",
          }}
        >
          {isAr ? "تلقائي" : "Auto"}
        </button>
        {ws.colors.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.hex)}
            title={`${c.name} — ${c.hex}`}
            aria-label={c.name}
            className="w-7 h-7 rounded-full cursor-pointer shrink-0"
            style={{
              background: c.hex,
              boxShadow:
                value?.toLowerCase() === c.hex.toLowerCase()
                  ? "0 0 0 2px var(--accent)"
                  : "inset 0 0 0 1px rgba(127,127,127,.35)",
            }}
          />
        ))}
        <label
          title={isAr ? "لون مخصص" : "Custom colour"}
          className="w-7 h-7 rounded-full cursor-pointer grid place-items-center shrink-0"
          style={{ background: "var(--surface-1)", color: "var(--text-faint)" }}
        >
          <Icon name="fill-drip" size={12} />
          <input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} className="sr-only" />
        </label>
      </div>
    </div>
  );
}
