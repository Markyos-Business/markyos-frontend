/**
 * The page reviewer — a deterministic linter over the guideline page being
 * edited.
 *
 * This is the editor's feedback loop. The builder can already say what a page
 * *is*; before this it could not say what is wrong with it, so the way you found
 * out that a section would render empty on the client's site, or that a button
 * pointed nowhere, was to publish and look. The Framer teardown names this as
 * one of three loops its agent runs against every edit (layout rectangles, a
 * design linter with hard rules, rendered screenshots) — the linter is the one
 * that is just as useful to a person as to a model, and the only one of the
 * three that needs no server.
 *
 * Every rule here is deterministic and explainable: it fired because a field was
 * empty or a string didn't parse, never because something was scored. Nothing is
 * sent anywhere. A finding always names the block it is about and carries the
 * flow id needed to select it, so the panel can put you on the problem rather
 * than describing it.
 *
 * No React and no store: the same function runs in a Vitest run, and the report
 * is a value you can assert on. See `lib/doc/core/types.ts` for why that matters
 * in this codebase.
 */

import { BLOCK_META } from "./blockCatalog";
import { detectScript, lintCopy } from "./copyLint";
import { PageBlock, VoiceTrait } from "./types";

export type ReviewSeverity = "error" | "warning";

export interface ReviewFinding {
  /** Stable across re-runs: derived from the block and the rule, never a counter. */
  id: string;
  severity: ReviewSeverity;
  /** What to select when someone clicks this finding. */
  flowId: string;
  /** The block's name in the palette, so the finding says what it is about. */
  label: string;
  arLabel: string;
  message: string;
  arMessage: string;
  /**
   * Marks a finding as one instance of a condition that is normally systemic,
   * so the panel can show it as a single counted row instead of forty.
   *
   * Only the untranslated-Arabic rule sets it. A studio drafting in English has
   * no Arabic anywhere yet, and a linter that reports that once per field is a
   * linter people switch off — which would take the specific findings with it.
   * Everything else stays one row per problem, because everything else is local
   * to the block it is about.
   */
  group?: "ar-missing";
}

export interface ReviewReport {
  findings: ReviewFinding[];
  errors: number;
  warnings: number;
  /** How many blocks were looked at — so "no findings" can be said with a number. */
  checked: number;
}

/**
 * What brand data actually exists, for the blocks that are live views of it.
 *
 * Counts rather than the `Workspace` itself, on purpose: a `brandColors` block
 * on a workspace with no palette renders an empty section on the client's site,
 * and that is the whole of what the reviewer needs to know. Passing the
 * workspace would couple this file to a type that changes for unrelated
 * reasons, and would make every test build one.
 */
export interface BrandDataPresence {
  logoSlotsFilled: number;
  colorCount: number;
  iconAssetCount: number;
}

const EMPTY_PRESENCE: BrandDataPresence = {
  logoSlotsFilled: 0,
  colorCount: 0,
  iconAssetCount: 0,
};

function has(value: string | undefined): boolean {
  return !!value && value.trim().length > 0;
}

/**
 * Whether a link will resolve to what the studio meant.
 *
 * "example.com" is the one that matters: a browser reads a value with no scheme
 * as a path relative to the guideline site, so the button lands on
 * `/v/<slug>/example.com` and 404s. An absolute path or a fragment is fine, and
 * so is a mailto: or tel:.
 */
function linkShape(url: string): "ok" | "schemeless" {
  const trimmed = url.trim();
  if (/^([a-z][a-z0-9+.-]*:|\/|#|\?)/i.test(trimmed)) return "ok";
  // A bare word is a relative path someone typed on purpose often enough
  // ("downloads"); a dotted host is almost never one.
  return /\./.test(trimmed) ? "schemeless" : "ok";
}

export function reviewPage(input: {
  blocks: PageBlock[];
  /** Voice traits, for the copy rules. Empty is fine — the rest still run. */
  traits?: VoiceTrait[];
  brand?: BrandDataPresence;
}): ReviewReport {
  const { blocks, traits = [], brand = EMPTY_PRESENCE } = input;
  const findings: ReviewFinding[] = [];

  /** Children keyed by the container they sit in, for the columns rule. */
  const childCount = new Map<string, number>();
  for (const b of blocks) {
    if (b.parentId) childCount.set(b.parentId, (childCount.get(b.parentId) ?? 0) + 1);
  }

  for (const block of blocks) {
    const meta = BLOCK_META[block.kind];
    const base = { flowId: `block-${block.id}`, label: meta.label, arLabel: meta.arLabel };
    const add = (
      rule: string,
      severity: ReviewSeverity,
      message: string,
      arMessage: string,
      group?: ReviewFinding["group"]
    ) => {
      findings.push({ id: `${block.id}:${rule}`, severity, ...base, message, arMessage, group });
    };

    emptiness(block, add, brand, childCount);
    translation(block, add);
    links(block, add);
    copy(block, add, traits);
  }

  const errors = findings.filter((f) => f.severity === "error").length;
  return { findings, errors, warnings: findings.length - errors, checked: blocks.length };
}

type Add = (
  rule: string,
  severity: ReviewSeverity,
  message: string,
  arMessage: string,
  group?: ReviewFinding["group"]
) => void;

/**
 * Sections that will render as nothing.
 *
 * The most valuable class of finding, because it is invisible in the editor: a
 * gallery with no images and a gallery you haven't scrolled to look at are the
 * same thing on screen. Split by what the block needs — a stat with no number is
 * broken, a stat with no caption is only unfinished.
 */
function emptiness(block: PageBlock, add: Add, brand: BrandDataPresence, childCount: Map<string, number>) {
  const title = has(block.title) || has(block.arTitle);
  const text = has(block.text) || has(block.arText);
  const assets = (block.assetIds?.length ?? 0) > 0;

  switch (block.kind) {
    case "text":
      if (!title && !text) add("empty", "error", "This section has no heading and no text.", "هذا القسم بلا عنوان ولا نص.");
      break;
    case "quote":
      if (!text) add("empty", "error", "The quote is empty.", "الاقتباس فارغ.");
      break;
    case "stat":
      if (!title) add("empty", "error", "The stat has no number.", "الإحصائية بلا رقم.");
      else if (!text) add("no-caption", "warning", "The number has no caption saying what it counts.", "الرقم بلا وصف يوضح ما يعدّه.");
      break;
    case "faq":
      if (!title) add("empty", "error", "The question is missing.", "السؤال غير مكتوب.");
      else if (!text) add("no-answer", "error", "The question has no answer.", "السؤال بلا إجابة.");
      break;
    case "image":
      if (!assets) add("empty", "error", "No image has been chosen.", "لم يتم اختيار صورة.");
      break;
    case "gallery":
      if (!assets) add("empty", "error", "The gallery has no images in it.", "المعرض بلا صور.");
      break;
    case "video":
      if (!has(block.videoUrl)) add("empty", "error", "No video link has been set.", "لم يتم وضع رابط الفيديو.");
      break;
    case "embed":
      if (!has(block.embedHtml)) add("empty", "error", "The embed has no code in it.", "الكود المضمّن فارغ.");
      break;
    case "button":
      if (!title) add("empty", "error", "The button has no label.", "الزر بلا نص.");
      break;
    case "socialLinks":
      if ((block.socialLinks?.length ?? 0) === 0)
        add("empty", "error", "No social accounts have been added.", "لم تُضف أي حسابات.");
      break;
    case "columns":
      if ((childCount.get(block.id) ?? 0) === 0)
        add("empty", "warning", "The column layout is empty — nothing has been put in it yet.", "تخطيط الأعمدة فارغ — لم يُضف إليه شيء بعد.");
      break;
    // The brand blocks are live views of the workspace's own data, so what is
    // missing is upstream of the block: nothing can be typed into them here.
    // Each rule below mirrors a real `EmptyBlockState` branch in
    // `BlockRenderer` — the condition under which the client sees a placeholder
    // instead of a section. `brandType` is deliberately absent: the type
    // specimen always renders something, so there is no state to warn about.
    case "brandLogo":
      if (brand.logoSlotsFilled === 0)
        add("no-data", "error", "No logo has been uploaded yet, so this section renders empty.", "لم يُرفع أي شعار بعد، لذا يظهر هذا القسم فارغًا.");
      break;
    case "brandColors":
      if (brand.colorCount === 0)
        add("no-data", "error", "The palette has no colors in it, so this section renders empty.", "لوحة الألوان فارغة، لذا يظهر هذا القسم فارغًا.");
      break;
    case "brandIcons":
      if (brand.iconAssetCount === 0)
        add("no-data", "error", "No icons have been uploaded, so this section renders empty.", "لم تُرفع أي أيقونات، لذا يظهر هذا القسم فارغًا.");
      break;
    // Unlike the other brand blocks, this one holds a chosen set rather than
    // showing everything: it renders `assetIds`, so an empty one is an empty
    // block, not missing brand data.
    case "files":
      if (!assets) add("empty", "error", "No files have been picked to download.", "لم تُختر ملفات للتحميل.");
      break;
    default:
      // divider, spacer, form, brandType — nothing that can be empty in a way
      // the client would see.
      break;
  }
}

/**
 * Bilingual gaps, weighted by what the renderer actually does about them.
 *
 * `BlockRenderer` resolves a field as `(isAr && block.arTitle) || block.title`,
 * and that asymmetry is the whole rule:
 *
 * - **Arabic missing** falls back to the English, so the Arabic site is
 *   readable but untranslated. A warning.
 * - **English missing** falls back to nothing, because there is nothing behind
 *   it — the English site renders a gap. An error.
 *
 * Getting this the wrong way round would flag the normal state of a page being
 * written as broken, and the actually-broken one as a nicety.
 */
function translation(block: PageBlock, add: Add) {
  const pairs: [string, string, string | undefined, string | undefined][] = [
    ["title", "heading", block.title, block.arTitle],
    ["text", "text", block.text, block.arText],
  ];
  for (const [key, what, en, ar] of pairs) {
    if (has(en) && !has(ar)) {
      add(
        `ar-missing-${key}`,
        "warning",
        `No Arabic ${what} — the Arabic site will show the English one.`,
        `لا يوجد ${what === "heading" ? "عنوان" : "نص"} عربي — سيظهر النص الإنجليزي في الموقع العربي.`,
        "ar-missing"
      );
    } else if (has(ar) && !has(en)) {
      add(
        `en-missing-${key}`,
        "error",
        `Arabic ${what} only — the English site has nothing to fall back to and renders a gap.`,
        `${what === "heading" ? "العنوان" : "النص"} بالعربية فقط — لا بديل في الموقع الإنجليزي وسيظهر فراغ.`
      );
    }
  }
}

/** Links that go nowhere, or somewhere other than where they were meant to. */
function links(block: PageBlock, add: Add) {
  if (block.kind === "button") {
    if (!has(block.linkUrl)) {
      add("no-link", "warning", "The button has no link, so clicking it does nothing.", "الزر بلا رابط، لذا لا يفعل شيئًا عند الضغط.");
    } else if (linkShape(block.linkUrl!) === "schemeless") {
      add(
        "link-schemeless",
        "error",
        `"${block.linkUrl!.trim()}" has no https://, so it is read as a page inside the guideline site and will 404.`,
        `"${block.linkUrl!.trim()}" بدون https://، لذا يُقرأ كصفحة داخل موقع الدليل وسيعطي خطأ 404.`
      );
    }
  }
  if (block.kind === "form" && !has(block.linkUrl)) {
    add("no-recipient", "error", "The form has no address to send to, so a client's message goes nowhere.", "النموذج بلا عنوان للإرسال، لذا لن تصل رسالة العميل.");
  }
  for (const link of block.socialLinks ?? []) {
    if (!has(link.url)) {
      add(`social-empty-${link.id}`, "warning", `The ${link.platform || "social"} link has no address.`, `رابط ${link.platform || "التواصل"} بلا عنوان.`);
    } else if (linkShape(link.url) === "schemeless") {
      add(`social-schemeless-${link.id}`, "error", `The ${link.platform || "social"} link has no https:// and will 404.`, `رابط ${link.platform || "التواصل"} بدون https:// وسيعطي خطأ 404.`);
    }
  }
}

/**
 * The bilingual copy rules, run over what is on the page.
 *
 * `lib/copyLint.ts` already holds them, including the Arabic ones a Latin-only
 * linter can't see; until now the only way to reach them was to paste text into
 * the Compliance page. Only `error` findings are surfaced here, because this
 * panel is read while working and the suggestion-level rules are a writing pass,
 * not a publish blocker. The Compliance page still shows all three severities.
 */
function copy(block: PageBlock, add: Add, traits: VoiceTrait[]) {
  const fields: [string, string | undefined][] = [
    ["title", block.title],
    ["arTitle", block.arTitle],
    ["text", block.text],
    ["arText", block.arText],
  ];
  for (const [key, value] of fields) {
    if (!has(value)) continue;
    for (const f of lintCopy(value!, traits, detectScript(value!))) {
      if (f.severity !== "error") continue;
      add(`copy-${key}-${f.start}`, "error", `${f.rule}: "${f.excerpt.trim()}"`, `${f.arRule}: "${f.excerpt.trim()}"`);
    }
  }
}
