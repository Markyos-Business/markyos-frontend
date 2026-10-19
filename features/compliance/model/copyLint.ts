/**
 * Bilingual copy linter — the "Voice & Tone Matrix enforced by an integrated
 * bilingual copy linter" from the architecture doc.
 *
 * Every rule here is deterministic and explainable: it either matched a literal
 * phrase or it didn't. Nothing is scored, guessed, or sent to a model. A finding
 * always quotes the exact span it objected to, so a writer can disagree with it
 * on the evidence rather than on a confidence number.
 *
 * The Arabic rules are the point of the whole feature. Latin-only linters pass
 * Arabic copy that is broken in ways a native reader sees immediately — a Latin
 * comma mid-sentence, tatweel used as justification, a Latin product name that
 * renders on the wrong side of its own full stop. Those are the checks a
 * translation pass usually misses and a designer can't see in a mockup.
 *
 * Planned: a model-based check for tone-of-voice alignment, which is the
 * judgement call these rules deliberately don't make — "does this paragraph
 * sound like this brand" is not a string match. It belongs *alongside* these
 * rules rather than replacing them, and its findings must be visibly separated:
 * a deterministic finding can be argued with by looking at the quoted span, and
 * a model's cannot. `LintFinding` is the seam — a model-sourced finding should
 * carry its own severity and an explicit marker, so the UI can never present a
 * guess and a fact as the same kind of thing.
 */

import { VoiceTrait } from "@/core/data/types";

export type LintScript = "latin" | "arabic";

export type LintSeverity = "error" | "warning" | "suggestion";

export interface LintFinding {
  id: string;
  severity: LintSeverity;
  /** Which rule fired, shown as the finding's label. */
  rule: string;
  arRule: string;
  message: string;
  arMessage: string;
  /** Character offsets into the linted text. */
  start: number;
  end: number;
  excerpt: string;
  /** A concrete replacement, when the rule knows one. */
  replacement?: string;
}

// ---- shared helpers ----

const ARABIC_RANGE = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

/** Whether a body of text is predominantly Arabic script. */
export function detectScript(text: string): LintScript {
  const arabic = (text.match(/[؀-ۿ]/g) || []).length;
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  return arabic > latin ? "arabic" : "latin";
}

let counter = 0;
function finding(f: Omit<LintFinding, "id">): LintFinding {
  counter += 1;
  return { ...f, id: `lint-${counter}` };
}

function excerptAt(text: string, start: number, end: number): string {
  return text.slice(start, end);
}

/** Splits into sentences for both scripts — Arabic ends on ؟ ! . and ۔ too. */
function sentences(text: string): { text: string; start: number }[] {
  const out: { text: string; start: number }[] = [];
  const re = /[^.!?؟۔\n]+[.!?؟۔\n]*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m[0].trim()) out.push({ text: m[0], start: m.index });
    if (m.index === re.lastIndex) re.lastIndex += 1;
  }
  return out;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ---- rule 1: the workspace's own voice matrix ----

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "of", "to", "in", "on", "at", "for", "with",
  "is", "are", "was", "were", "be", "been", "it", "this", "that", "as", "by", "from",
]);

/**
 * Turns a trait's don't-example into literal phrases to watch for.
 *
 * Phrases, not words: matching single words out of "Give the logo some
 * breathing room" would flag every sentence containing "logo". A 2–4 word
 * run that appears verbatim in the copy is evidence; a shared noun is not.
 *
 * A phrase also has to carry two content words. One content word plus a
 * stopword is still a shared noun wearing a hat: "the Arabic" out of "…that
 * the Arabic composition should be prioritized" matched "Set the Arabic
 * first" — which is that same trait's *do* example. A rule that flags the
 * brand's own model sentence is measuring the wrong thing.
 */
function dontPhrases(dontExample: string): string[] {
  const words = dontExample
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  const phrases: string[] = [];
  for (let n = 4; n >= 2; n--) {
    for (let i = 0; i + n <= words.length; i++) {
      const slice = words.slice(i, i + n);
      if (slice.filter((w) => !STOPWORDS.has(w)).length < 2) continue;
      phrases.push(slice.join(" "));
    }
  }
  return phrases;
}

function lintVoice(text: string, traits: VoiceTrait[]): LintFinding[] {
  const out: LintFinding[] = [];
  const haystack = text.toLowerCase();
  const claimed: boolean[] = new Array(text.length).fill(false);

  for (const trait of traits) {
    if (!trait.dontExample.trim()) continue;
    for (const phrase of dontPhrases(trait.dontExample)) {
      let from = 0;
      for (;;) {
        const at = haystack.indexOf(phrase, from);
        if (at === -1) break;
        from = at + 1;
        // Longer phrases are generated first; don't report a shorter one
        // nested inside a match already reported.
        if (claimed[at]) continue;
        for (let i = at; i < at + phrase.length; i++) claimed[i] = true;
        out.push(
          finding({
            severity: "warning",
            rule: `Voice — ${trait.trait}`,
            arRule: `النبرة — ${trait.trait}`,
            message: `Reads like the "don't" example for ${trait.trait}. Write it closer to: "${trait.doExample}"`,
            arMessage: `يشبه مثال «لا تفعل» لسمة ${trait.trait}. اكتبها أقرب إلى: «${trait.doExample}»`,
            start: at,
            end: at + phrase.length,
            excerpt: excerptAt(text, at, at + phrase.length),
          })
        );
      }
    }
  }
  return out;
}

// ---- rule 2: filler that survives every brand voice ----

const FILLER: { pattern: RegExp; replacement?: string }[] = [
  { pattern: /\butiliz(e|es|ed|ing)\b/gi, replacement: "use" },
  { pattern: /\bleverag(e|es|ed|ing)\b/gi, replacement: "use" },
  { pattern: /\bsynerg(y|ies|istic)\b/gi },
  { pattern: /\bworld[- ]class\b/gi },
  { pattern: /\bcutting[- ]edge\b/gi },
  { pattern: /\bbest[- ]in[- ]class\b/gi },
  { pattern: /\bindustry[- ]leading\b/gi },
  { pattern: /\bseamless(ly)?\b/gi },
  { pattern: /\brevolutionar(y|ise|ize)\b/gi },
  { pattern: /\bgame[- ]chang(er|ing)\b/gi },
  { pattern: /\bin order to\b/gi, replacement: "to" },
  { pattern: /\bat this point in time\b/gi, replacement: "now" },
  { pattern: /\bplease be advised\b/gi },
  { pattern: /\bwe are pleased to announce\b/gi },
];

function lintFiller(text: string): LintFinding[] {
  const out: LintFinding[] = [];
  for (const { pattern, replacement } of FILLER) {
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      out.push(
        finding({
          severity: "suggestion",
          rule: "Filler",
          arRule: "حشو",
          message: replacement
            ? `"${m[0]}" is filler — "${replacement}" says the same thing.`
            : `"${m[0]}" is marketing filler. Say what it actually does instead.`,
          arMessage: replacement
            ? `«${m[0]}» حشو — «${replacement}» تؤدي المعنى نفسه.`
            : `«${m[0]}» عبارة تسويقية عامة. اذكر ما تفعله فعلًا بدلًا منها.`,
          start: m.index,
          end: m.index + m[0].length,
          excerpt: m[0],
          replacement,
        })
      );
    }
  }
  return out;
}

// ---- rule 3: mechanics that apply to both scripts ----

const LONG_SENTENCE = 28;

function lintMechanics(text: string): LintFinding[] {
  const out: LintFinding[] = [];

  for (const s of sentences(text)) {
    const n = wordCount(s.text);
    if (n > LONG_SENTENCE) {
      out.push(
        finding({
          severity: "suggestion",
          rule: "Long sentence",
          arRule: "جملة طويلة",
          message: `${n} words. Sentences over ${LONG_SENTENCE} words are hard to read in either script — try splitting it.`,
          arMessage: `${n} كلمة. الجمل التي تتجاوز ${LONG_SENTENCE} كلمة يصعب قراءتها في اللغتين — جرّب تقسيمها.`,
          start: s.start,
          end: s.start + s.text.length,
          excerpt: s.text.trim().slice(0, 80),
        })
      );
    }
  }

  let m: RegExpExecArray | null;

  const doubleSpace = / {2,}/g;
  while ((m = doubleSpace.exec(text)) !== null) {
    out.push(
      finding({
        severity: "suggestion",
        rule: "Spacing",
        arRule: "مسافات",
        message: "Repeated space.",
        arMessage: "مسافة مكررة.",
        start: m.index,
        end: m.index + m[0].length,
        excerpt: "␣".repeat(m[0].length),
        replacement: " ",
      })
    );
  }

  const spaceBeforePunct = /\s+([,.;:!?،؛؟])/g;
  while ((m = spaceBeforePunct.exec(text)) !== null) {
    out.push(
      finding({
        severity: "warning",
        rule: "Spacing",
        arRule: "مسافات",
        message: `Space before "${m[1]}" — punctuation attaches to the word before it.`,
        arMessage: `مسافة قبل «${m[1]}» — علامة الترقيم تلتصق بالكلمة التي قبلها.`,
        start: m.index,
        end: m.index + m[0].length,
        excerpt: m[0],
        replacement: m[1],
      })
    );
  }

  const bang = /!{2,}|\?{2,}|؟{2,}/g;
  while ((m = bang.exec(text)) !== null) {
    out.push(
      finding({
        severity: "warning",
        rule: "Emphasis",
        arRule: "التوكيد",
        message: "Repeated end punctuation reads as shouting.",
        arMessage: "تكرار علامة النهاية يُقرأ كصياح.",
        start: m.index,
        end: m.index + m[0].length,
        excerpt: m[0],
        replacement: m[0][0],
      })
    );
  }

  return out;
}

// ---- rule 4: Latin-only mechanics ----

function lintLatin(text: string): LintFinding[] {
  const out: LintFinding[] = [];
  let m: RegExpExecArray | null;

  const straight = /['"]/g;
  while ((m = straight.exec(text)) !== null) {
    out.push(
      finding({
        severity: "suggestion",
        rule: "Typography",
        arRule: "الطباعة",
        message: `Straight ${m[0] === '"' ? "quote" : "apostrophe"} — use a typographic one (${
          m[0] === '"' ? "“ ”" : "’"
        }).`,
        arMessage: "علامة اقتباس مستقيمة — استخدم العلامة الطباعية.",
        start: m.index,
        end: m.index + 1,
        excerpt: m[0],
      })
    );
  }

  // Four or more capitals in a row, excluding common initialisms the brand
  // may legitimately own — flagged, not corrected, since only the writer
  // knows whether it's an acronym.
  const shouting = /\b[A-Z]{4,}\b/g;
  while ((m = shouting.exec(text)) !== null) {
    out.push(
      finding({
        severity: "suggestion",
        rule: "Emphasis",
        arRule: "التوكيد",
        message: `"${m[0]}" is set in caps. If it isn't an acronym, set it in sentence case and let the type carry the emphasis.`,
        arMessage: `«${m[0]}» مكتوبة بأحرف كبيرة. إن لم تكن اختصارًا، اكتبها عاديًا ودع الخط يحمل التوكيد.`,
        start: m.index,
        end: m.index + m[0].length,
        excerpt: m[0],
      })
    );
  }

  return out;
}

// ---- rule 5: Arabic mechanics — the checks a Latin linter can't make ----

function lintArabic(text: string): LintFinding[] {
  const out: LintFinding[] = [];
  let m: RegExpExecArray | null;

  // Latin punctuation inside Arabic copy. The comma is the most common one to
  // survive a translation pass, and it visually leans the wrong way in RTL.
  const LATIN_PUNCT: { char: string; correct: string; name: string; arName: string }[] = [
    { char: ",", correct: "،", name: "comma", arName: "الفاصلة" },
    { char: ";", correct: "؛", name: "semicolon", arName: "الفاصلة المنقوطة" },
    { char: "?", correct: "؟", name: "question mark", arName: "علامة الاستفهام" },
  ];
  for (const p of LATIN_PUNCT) {
    for (let i = 0; i < text.length; i++) {
      if (text[i] !== p.char) continue;
      // Only when it sits in Arabic context — a Latin brand name or a URL in
      // the same paragraph is allowed to keep its own punctuation.
      const before = text.slice(Math.max(0, i - 12), i);
      const after = text.slice(i + 1, i + 13);
      if (!ARABIC_RANGE.test(before) && !ARABIC_RANGE.test(after)) continue;
      out.push(
        finding({
          severity: "warning",
          rule: "Arabic punctuation",
          arRule: "ترقيم عربي",
          message: `Latin ${p.name} in Arabic copy — use "${p.correct}".`,
          arMessage: `${p.arName} اللاتينية داخل نص عربي — استخدم «${p.correct}».`,
          start: i,
          end: i + 1,
          excerpt: p.char,
          replacement: p.correct,
        })
      );
    }
  }

  // Tatweel (ـ) used to stretch words for justification. It looks like
  // typesetting and behaves like a typo: it breaks search, copy-paste and
  // screen readers, because it is a real character inside the word.
  const tatweel = /ـ+/g;
  while ((m = tatweel.exec(text)) !== null) {
    out.push(
      finding({
        severity: "error",
        rule: "Tatweel",
        arRule: "التطويل",
        message:
          "Tatweel (ـ) stretches the word visually but stays in the text — it breaks search, copy-paste and screen readers. Justify with CSS, not characters.",
        arMessage:
          "التطويل (ـ) يمدّ الكلمة بصريًا لكنه يبقى ضمن النص — يُعطّل البحث والنسخ وقارئ الشاشة. اضبط المحاذاة عبر CSS لا عبر الحروف.",
        start: m.index,
        end: m.index + m[0].length,
        excerpt: m[0],
        replacement: "",
      })
    );
  }

  // Mixed digit systems in one body of copy. Either convention is defensible;
  // using both in the same paragraph is not.
  const ascii = /[0-9]/.test(text);
  const arabicIndic = /[٠-٩]/.test(text);
  if (ascii && arabicIndic) {
    const first = text.search(/[٠-٩]/);
    out.push(
      finding({
        severity: "warning",
        rule: "Digits",
        arRule: "الأرقام",
        message:
          "This copy mixes Latin digits (0-9) with Arabic-Indic digits (٠-٩). Either is fine — pick one and hold it across the brand.",
        arMessage:
          "النص يخلط الأرقام اللاتينية (0-9) بالأرقام العربية (٠-٩). كلاهما مقبول — اختر واحدًا والتزم به في الهوية كلها.",
        start: first,
        end: first + 1,
        excerpt: text.slice(first, first + 1),
      })
    );
  }

  // A Latin run butted against RTL punctuation renders on the wrong side of
  // its own sentence without a bidi isolate. This is the bug that ships in
  // almost every bilingual site and is invisible until an Arabic reader sees it.
  const bidiRisk = /[A-Za-z][A-Za-z0-9._-]{1,}\s*(?=[.،؛؟)\]])/g;
  while ((m = bidiRisk.exec(text)) !== null) {
    const context = text.slice(Math.max(0, m.index - 20), m.index);
    if (!ARABIC_RANGE.test(context)) continue;
    out.push(
      finding({
        severity: "warning",
        rule: "Bidi ordering",
        arRule: "ترتيب الاتجاهين",
        message: `"${m[0].trim()}" is Latin text against RTL punctuation. Wrap it in <bdi> (or an RLM) or it renders on the wrong side of the sentence.`,
        arMessage: `«${m[0].trim()}» نص لاتيني ملاصق لعلامة ترقيم في سياق من اليمين لليسار. ضعه داخل <bdi> أو أضف علامة RLM، وإلا ظهر في الجهة الخاطئة من الجملة.`,
        start: m.index,
        end: m.index + m[0].trimEnd().length,
        excerpt: m[0].trim(),
      })
    );
  }

  // Untranslated Latin terms sitting inside Arabic prose. Often intentional
  // (a product name); often a line the translator skipped. Worth a look, not
  // an error.
  const latinRun = /[A-Za-z][A-Za-z'-]{3,}(?:\s+[A-Za-z][A-Za-z'-]{2,})*/g;
  while ((m = latinRun.exec(text)) !== null) {
    const before = text.slice(Math.max(0, m.index - 24), m.index);
    const after = text.slice(m.index + m[0].length, m.index + m[0].length + 24);
    if (!ARABIC_RANGE.test(before) || !ARABIC_RANGE.test(after)) continue;
    out.push(
      finding({
        severity: "suggestion",
        rule: "Untranslated term",
        arRule: "مصطلح غير مترجم",
        message: `"${m[0]}" stayed in Latin script. Confirm it's a name that shouldn't be translated.`,
        arMessage: `«${m[0]}» بقي بالحروف اللاتينية. تأكّد أنه اسم لا يُترجم.`,
        start: m.index,
        end: m.index + m[0].length,
        excerpt: m[0],
      })
    );
  }

  return out;
}

// ---- public API ----

export function lintCopy(text: string, traits: VoiceTrait[], script?: LintScript): LintFinding[] {
  if (!text.trim()) return [];
  const resolved = script ?? detectScript(text);
  const findings = [
    ...lintVoice(text, traits),
    ...lintFiller(text),
    ...lintMechanics(text),
    ...(resolved === "arabic" ? lintArabic(text) : lintLatin(text)),
  ];
  return findings.sort((a, b) => a.start - b.start);
}

export interface ParityFinding {
  severity: LintSeverity;
  message: string;
  arMessage: string;
}

/**
 * Compares the two language drafts against each other. Arabic normally lands
 * around 20–25% shorter than the same English in word count, so a much wider
 * gap than that usually means one side is missing a sentence rather than that
 * the translation is tight.
 */
export function lintParity(en: string, ar: string): ParityFinding[] {
  const enWords = wordCount(en);
  const arWords = wordCount(ar);
  if (!enWords && !arWords) return [];

  if (enWords && !arWords) {
    return [
      {
        severity: "error",
        message: "No Arabic version. Arabic and English ship together — a Latin-only line is an unfinished line.",
        arMessage: "لا توجد نسخة عربية. العربية والإنجليزية تُنشران معًا — السطر بلغة واحدة سطر غير مكتمل.",
      },
    ];
  }
  if (arWords && !enWords) {
    return [
      {
        severity: "error",
        message: "No English version.",
        arMessage: "لا توجد نسخة إنجليزية.",
      },
    ];
  }

  const ratio = arWords / enWords;
  if (ratio < 0.5) {
    return [
      {
        severity: "warning",
        message: `Arabic is ${arWords} words to English's ${enWords} — far shorter than a normal translation. Check whether a sentence was dropped.`,
        arMessage: `العربية ${arWords} كلمة مقابل ${enWords} بالإنجليزية — أقصر بكثير من الترجمة المعتادة. تحقّق إن كانت جملة قد سقطت.`,
      },
    ];
  }
  if (ratio > 1.4) {
    return [
      {
        severity: "warning",
        message: `Arabic is ${arWords} words to English's ${enWords} — Arabic usually lands shorter. Check whether the English is missing something.`,
        arMessage: `العربية ${arWords} كلمة مقابل ${enWords} بالإنجليزية — العربية عادةً أقصر. تحقّق إن كان النص الإنجليزي ينقصه شيء.`,
      },
    ];
  }
  return [];
}
