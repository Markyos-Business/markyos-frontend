/**
 * Client-side text extraction + heuristic section-splitting for the
 * "Import from file" feature on the Strategy page. Everything here runs in
 * the browser — no server, no AI call. It only recognizes headings that
 * literally appear in the document; it never invents content for a field
 * it couldn't find text for.
 *
 * It reads both scripts. A strategy deck written in Arabic is the normal case
 * for this product, and a matcher that only knew "Vision" silently returned
 * nothing for half its users — which looks identical to a broken importer.
 */

export type SingleStrategyKey =
  | "purpose"
  | "vision"
  | "mission"
  | "targetAudienceSummary"
  | "positioningStatement"
  | "uvp";

export interface ParsedListItem {
  title: string;
  description: string;
}

export interface ParsedPersona {
  name: string;
  role: string;
  description: string;
}

export interface ParsedVoiceTrait {
  trait: string;
  doExample: string;
  dontExample: string;
}

export interface ParsedStrategy {
  purpose?: string;
  vision?: string;
  mission?: string;
  targetAudienceSummary?: string;
  positioningStatement?: string;
  uvp?: string;
  coreValues?: ParsedListItem[];
  competitors?: ParsedListItem[];
  personas?: ParsedPersona[];
  voiceTraits?: ParsedVoiceTrait[];
  /** The literal heading line each field was taken from, so a review screen
   *  can show its evidence instead of asking for trust. */
  headings: Partial<Record<HeadingKey, string>>;
  /** Lines that read as headings but matched nothing known. Surfacing these is
   *  what turns "found nothing" into "found these, didn't recognise them". */
  unmatched: string[];
}

const MAX_TEXT_LENGTH = 1200;
const MAX_LIST_ITEMS = 12;
/** A heading is a short line. Past this, it's a paragraph that starts with a word. */
const MAX_HEADING_LENGTH = 70;

type ListKey = "coreValues" | "competitors" | "personas" | "voiceTraits";
export type HeadingKey = SingleStrategyKey | ListKey;

/**
 * Arabic has several orthographic variants that mean the same word to a
 * reader and different strings to `===`: the alef forms, the two ya, the
 * ta-marbuta, optional diacritics, and tatweel used for justification. A
 * document typed in one convention must still match an alias written in
 * another, so both sides are normalized before comparison.
 */
function normalizeArabic(s: string): string {
  return s
    .replace(/[ً-ْٰ]/g, "") // harakat
    .replace(/ـ/g, "") // tatweel
    .replace(/[آأإ]/g, "ا") // آ أ إ → ا
    .replace(/ى/g, "ي") // ى → ي
    .replace(/ة/g, "ه"); // ة → ه
}

/** Strips the decoration around a heading: numbering, markdown, bullets, trailing colons. */
function normalizeHeading(raw: string): string {
  return normalizeArabic(
    raw
      .replace(/^[\s#*_>•\-–—]+/, "")
      .replace(/^[\d٠-٩]+[.)\-–]\s*/, "") // "1. ", "٢) "
      .replace(/^[\d٠-٩]+(\.[\d٠-٩]+)+\s*/, "") // "1.2 "
      .replace(/[:：\-–—*_]+\s*$/, "")
      .trim()
      .toLowerCase()
  ).replace(/\s+/g, " ");
}

const HEADING_ALIASES: { key: HeadingKey; patterns: string[] }[] = [
  {
    key: "purpose",
    patterns: [
      "purpose", "brand purpose", "our purpose", "why we exist", "reason for being",
      "الغاية", "غايتنا", "الغرض", "هدفنا", "غاية العلامة", "لماذا نوجد", "سبب وجودنا",
    ],
  },
  {
    key: "vision",
    patterns: ["vision", "vision statement", "our vision", "brand vision", "الرؤية", "رؤيتنا", "رؤية العلامة"],
  },
  {
    key: "mission",
    patterns: ["mission", "mission statement", "our mission", "brand mission", "الرسالة", "رسالتنا", "مهمتنا", "رسالة العلامة"],
  },
  {
    key: "coreValues",
    patterns: [
      "core values", "brand values", "our values", "values", "guiding principles", "principles",
      "القيم", "قيمنا", "القيم الجوهرية", "القيم الأساسية", "المبادئ", "مبادئنا",
    ],
  },
  {
    key: "targetAudienceSummary",
    patterns: [
      "target audience", "audience", "target market", "target audience & personas",
      "target audience and personas", "who we serve", "customer profile",
      "الجمهور", "الجمهور المستهدف", "جمهورنا", "السوق المستهدف", "الفئة المستهدفة", "العملاء المستهدفون",
    ],
  },
  {
    key: "personas",
    patterns: [
      "personas", "audience personas", "customer personas", "buyer personas", "user personas",
      "الشخصيات", "شخصيات الجمهور", "شخصيات العملاء", "نماذج العملاء",
    ],
  },
  {
    key: "competitors",
    patterns: [
      "competitive analysis", "competitors", "competition", "competitive landscape", "market landscape",
      "تحليل المنافسين", "المنافسون", "المنافسين", "المشهد التنافسي", "تحليل السوق",
    ],
  },
  {
    key: "positioningStatement",
    patterns: [
      "brand positioning", "positioning statement", "positioning", "market position",
      "التموضع", "تموضع العلامة", "بيان التموضع", "الموقع التنافسي",
    ],
  },
  {
    key: "uvp",
    patterns: [
      "unique value proposition", "uvp", "value proposition", "unique selling proposition", "usp",
      "عرض القيمة", "عرض القيمة الفريد", "القيمة المضافة", "ما يميزنا",
    ],
  },
  {
    key: "voiceTraits",
    patterns: [
      "tone of voice", "voice and tone", "voice & tone", "brand voice", "personality and tone",
      "personality & tone", "brand personality", "tone",
      "النبرة", "نبرة الصوت", "الصوت والنبرة", "الشخصية والنبرة", "شخصية العلامة", "أسلوب الخطاب",
    ],
  },
];

/** Aliases pre-normalized once, longest first so "value proposition" can't
 *  win over "unique value proposition" on the same line. */
const NORMALIZED_ALIASES: { key: HeadingKey; alias: string }[] = HEADING_ALIASES.flatMap(({ key, patterns }) =>
  patterns.map((p) => ({ key, alias: normalizeArabic(p.toLowerCase()) }))
).sort((a, b) => b.alias.length - a.alias.length);

const COMBINED: { patterns: string[]; keys: HeadingKey[] }[] = [
  { patterns: ["vision & mission", "vision and mission", "vision, mission", "الرؤية والرسالة"], keys: ["vision", "mission"] },
  {
    patterns: ["target audience & personas", "target audience and personas", "الجمهور والشخصيات"],
    keys: ["targetAudienceSummary", "personas"],
  },
];

/**
 * Which field(s) a line is the heading for, or none.
 *
 * Exact match first, then a prefix match — "Brand Purpose Statement" and
 * "الرؤية الاستراتيجية" are the same heading as "Purpose" and "الرؤية" to a
 * reader. The prefix rule requires the alias to be most of the line, so a
 * sentence that merely opens with the word isn't mistaken for a heading.
 */
function matchHeading(raw: string): HeadingKey[] {
  const line = normalizeHeading(raw);
  if (!line || line.length > MAX_HEADING_LENGTH) return [];
  if (/[.!؟?]\s*\S/.test(line)) return []; // more than one sentence: prose

  for (const { patterns, keys } of COMBINED) {
    if (patterns.some((p) => normalizeArabic(p) === line)) return keys;
  }
  for (const { key, alias } of NORMALIZED_ALIASES) {
    if (line === alias) return [key];
  }
  for (const { key, alias } of NORMALIZED_ALIASES) {
    if (alias.length < 4) continue;
    if (!line.startsWith(alias + " ")) continue;
    // The alias has to carry the line, not just open it.
    if (alias.length / line.length >= 0.55) return [key];
  }
  return [];
}

/** Whether a line looks like a heading at all, regardless of whether we know it. */
function looksLikeHeading(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > MAX_HEADING_LENGTH) return false;
  if (/[.!؟?,،;؛]$/.test(trimmed)) return false;
  // A bullet is a list item by definition — "- Clarity" is a value in a list,
  // not a heading, and treating it as one cuts the list it belongs to in half.
  if (/^[•\-*–—]\s/.test(trimmed)) return false;
  if (/^#/.test(trimmed)) return true;
  if (/^[\d٠-٩]+[.)\-–]\s+\S/.test(trimmed)) return true;
  if (/:$/.test(trimmed)) return true;
  const words = trimmed.split(/\s+/);
  if (words.length > 7) return false;
  // Title Case or ALL CAPS in Latin; any short standalone line in Arabic.
  if (/[A-Za-z]/.test(trimmed)) return /^[A-Z]/.test(trimmed.replace(/^[^A-Za-z]+/, ""));
  return /[؀-ۿ]/.test(trimmed);
}

function joinParagraphs(lines: string[]): string {
  const paragraphs: string[] = [];
  let current: string[] = [];
  for (const l of lines) {
    if (l.trim() === "") {
      if (current.length) {
        paragraphs.push(current.join(" "));
        current = [];
      }
    } else {
      current.push(l.trim());
    }
  }
  if (current.length) paragraphs.push(current.join(" "));
  return paragraphs.join("\n\n");
}

function stripBullet(raw: string): string {
  return raw
    .replace(/^[•\-*–—]\s*/, "")
    .replace(/^[\d٠-٩]+[.)]\s*/, "")
    .trim();
}

function parseListBody(lines: string[]): ParsedListItem[] {
  const items: ParsedListItem[] = [];
  for (const raw of lines) {
    const line = stripBullet(raw);
    if (!line) continue;
    const sep = /^(.{1,60}?)\s*[:：\-–—]\s*(.+)$/.exec(line);
    if (sep) items.push({ title: sep[1].trim(), description: sep[2].trim() });
    else items.push({ title: line, description: "" });
  }
  return items;
}

/**
 * A persona line carries three fields, in one of a few shapes:
 *
 *   Layla Haddad — Art Director: signs off every lockup.
 *   Omar Nasser (Studio Lead): owns the client relationship.
 *   Rana: reads the guideline once and never again.
 *
 * Parsed off the whole line rather than off a pre-split title, because
 * splitting on the first separator consumed the dash that separates the name
 * from the role and left every em-dash persona with no role at all.
 */
function parsePersonaBody(lines: string[]): ParsedPersona[] {
  const out: ParsedPersona[] = [];
  for (const raw of lines) {
    const line = stripBullet(raw);
    if (!line) continue;

    // Name (Role): description
    let m = /^(.{1,50}?)\s*[(（]\s*(.{1,50}?)\s*[)）]\s*[:：]?\s*(.*)$/.exec(line);
    if (m) {
      out.push({ name: m[1].trim(), role: m[2].trim(), description: m[3].trim() });
      continue;
    }
    // Name — Role: description
    m = /^(.{1,50}?)\s*[—–-]\s*(.{1,50}?)\s*[:：]\s*(.+)$/.exec(line);
    if (m) {
      out.push({ name: m[1].trim(), role: m[2].trim(), description: m[3].trim() });
      continue;
    }
    // Name — Role   (no description)
    m = /^(.{1,50}?)\s*[—–]\s*(.{1,60})$/.exec(line);
    if (m) {
      out.push({ name: m[1].trim(), role: m[2].trim(), description: "" });
      continue;
    }
    // Name: description
    m = /^(.{1,50}?)\s*[:：]\s*(.+)$/.exec(line);
    if (m) {
      out.push({ name: m[1].trim(), role: "", description: m[2].trim() });
      continue;
    }
    out.push({ name: line, role: "", description: "" });
  }
  return out;
}

const DO_MARKERS = /^(do|افعل|نعم)\s*[:：-]\s*/i;
const DONT_MARKERS = /^(don'?t|do not|avoid|لا تفعل|تجنب|لا)\s*[:：-]\s*/i;

/**
 * A voice matrix is three lines per trait, not one:
 *
 *   Plain
 *   Do: Set the Arabic first.
 *   Don't: Please be advised that…
 *
 * A trait with no do/don't pair under it is still worth keeping — the studio
 * can fill the examples in — so the name alone is enough to emit one.
 */
function parseVoiceBody(lines: string[]): ParsedVoiceTrait[] {
  const traits: ParsedVoiceTrait[] = [];
  let current: ParsedVoiceTrait | null = null;

  for (const raw of lines) {
    const line = stripBullet(raw);
    if (!line) continue;

    if (DO_MARKERS.test(line)) {
      if (current) current.doExample = line.replace(DO_MARKERS, "").trim();
      continue;
    }
    if (DONT_MARKERS.test(line)) {
      if (current) current.dontExample = line.replace(DONT_MARKERS, "").trim();
      continue;
    }
    // Anything else starts a new trait. "Plain — say it straight" keeps the
    // dash half as the do-example rather than throwing it away.
    const sep = /^(.{1,40}?)\s*[:：\-–—]\s*(.+)$/.exec(line);
    current = sep
      ? { trait: sep[1].trim(), doExample: sep[2].trim(), dontExample: "" }
      : { trait: line, doExample: "", dontExample: "" };
    traits.push(current);
  }
  return traits.filter((t) => t.trait);
}

/**
 * Scans raw extracted text for known strategy headings and returns whatever it
 * could confidently match. Fields with no matching heading (or an empty body
 * under that heading) are simply absent from the result — never filled with a
 * guess — and headings it saw but didn't recognise come back in `unmatched`.
 */
export function parseStrategyDocument(rawText: string): ParsedStrategy {
  const lines = rawText.split(/\r?\n/);
  const matches: { index: number; keys: HeadingKey[] }[] = [];
  const unmatched: string[] = [];

  lines.forEach((line, i) => {
    const keys = matchHeading(line);
    if (keys.length) matches.push({ index: i, keys });
    else if (looksLikeHeading(line)) unmatched.push(line.trim());
  });

  const result: ParsedStrategy = { headings: {}, unmatched: [] };

  /**
   * Where a matched section's body stops.
   *
   * Not simply "the next heading we recognised": the last recognised heading
   * in a document would then run to the end of the file and swallow every
   * unrelated section after it — which is how "Tone of voice" ended up
   * reporting a Sustainability chapter as two voice traits. Any heading ends
   * the section, known or not.
   *
   * The exception is a heading the section's own grammar owns. A voice matrix
   * is written as bare trait names followed by do/don't lines, and those names
   * look exactly like headings; one is part of the matrix when a do/don't line
   * follows it, and a foreign heading when one doesn't.
   */
  function bodyEnd(startLine: number, hardEnd: number, keys: HeadingKey[]): number {
    const ownsTraitNames = keys.includes("voiceTraits");
    for (let i = startLine; i < hardEnd; i++) {
      if (!looksLikeHeading(lines[i])) continue;
      if (ownsTraitNames) {
        const next = lines.slice(i + 1, hardEnd).find((l) => l.trim());
        if (next && (DO_MARKERS.test(stripBullet(next)) || DONT_MARKERS.test(stripBullet(next)))) continue;
      }
      return i;
    }
    return hardEnd;
  }

  matches.forEach((m, mi) => {
    const start = m.index + 1;
    const nextMatched = mi + 1 < matches.length ? matches[mi + 1].index : lines.length;
    const end = bodyEnd(start, nextMatched, m.keys);
    const body = lines.slice(start, end);
    const nonEmpty = body.filter((l) => l.trim().length > 0);
    if (nonEmpty.length === 0) return;

    const headingText = lines[m.index].trim();

    for (const key of m.keys) {
      if (key === "coreValues" || key === "competitors") {
        const list = parseListBody(nonEmpty).slice(0, MAX_LIST_ITEMS);
        if (list.length) {
          result[key] = list;
          result.headings[key] = headingText;
        }
      } else if (key === "personas") {
        const list = parsePersonaBody(nonEmpty).slice(0, MAX_LIST_ITEMS);
        if (list.length) {
          result.personas = list;
          result.headings.personas = headingText;
        }
      } else if (key === "voiceTraits") {
        const list = parseVoiceBody(nonEmpty).slice(0, MAX_LIST_ITEMS);
        if (list.length) {
          result.voiceTraits = list;
          result.headings.voiceTraits = headingText;
        }
      } else {
        const text = joinParagraphs(body).slice(0, MAX_TEXT_LENGTH).trim();
        if (text) {
          result[key] = text;
          result.headings[key] = headingText;
        }
      }
    }
  });

  // Only report unrecognised headings the reader would actually wonder about:
  // drop anything that ended up inside a matched section's body anyway.
  const matchedLines = new Set(matches.map((m) => lines[m.index].trim()));
  result.unmatched = [...new Set(unmatched.filter((u) => !matchedLines.has(u)))].slice(0, 12);

  return result;
}

// ---- Generic document sectioning, for department instruction pages ----

export interface ParsedDocSection {
  heading: string;
  body: string;
}

/**
 * Splits any document into its headed sections, with no fixed vocabulary.
 *
 * The strategy parser above only recognises headings it has an alias for,
 * which is right when the target is a known set of fields. A department
 * handbook has no known fields — whatever headings it uses *are* the
 * structure — so this keeps them as written.
 */
export function parseDocumentSections(rawText: string, maxSections = 40): ParsedDocSection[] {
  const lines = rawText.split(/\r?\n/);
  const headingIdx: number[] = [];
  lines.forEach((l, i) => {
    if (looksLikeHeading(l)) headingIdx.push(i);
  });

  const sections: ParsedDocSection[] = [];

  // Text before the first heading is the document's own preamble.
  if (headingIdx.length === 0 || headingIdx[0] > 0) {
    const lead = joinParagraphs(lines.slice(0, headingIdx[0] ?? lines.length)).trim();
    if (lead) sections.push({ heading: "", body: lead });
  }

  headingIdx.forEach((idx, n) => {
    const end = n + 1 < headingIdx.length ? headingIdx[n + 1] : lines.length;
    const body = joinParagraphs(lines.slice(idx + 1, end)).trim();
    const heading = lines[idx]
      .trim()
      .replace(/^[\s#*_>•\-–—]+/, "")
      .replace(/[:：]\s*$/, "")
      .trim();
    // A heading with nothing under it is a stray line, not a section.
    if (heading && body) sections.push({ heading, body });
  });

  return sections.slice(0, maxSections);
}

async function extractTextFromDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const buffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
  const lines: string[] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    let lastY: number | null = null;
    let currentLine = "";
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const y = item.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        lines.push(currentLine.trim());
        currentLine = "";
      }
      currentLine += currentLine && !currentLine.endsWith(" ") ? ` ${item.str}` : item.str;
      lastY = y;
    }
    if (currentLine.trim()) lines.push(currentLine.trim());
    lines.push("");
  }

  return lines.join("\n");
}

/** Reads a .docx, .pdf, .md or .txt File into plain text, entirely client-side. */
export async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    return extractTextFromPdf(file);
  }
  if (
    name.endsWith(".docx") ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractTextFromDocx(file);
  }
  if (name.endsWith(".txt") || name.endsWith(".md") || file.type.startsWith("text/")) {
    return file.text();
  }
  throw new Error("Unsupported file type — upload a .docx, .pdf, .md or .txt file.");
}
