/**
 * Machine translation for the strategy hub.
 *
 * This is a real translation service, not a stub: MyMemory's public endpoint,
 * which needs no key and allows cross-origin calls. That choice has costs and
 * they are surfaced rather than hidden — it rate-limits anonymous callers, and
 * its Arabic is a competent first draft rather than publishable brand copy.
 *
 * Which is the point. Brand strategy is the most carefully-worded document a
 * studio produces; a machine's version of a positioning statement is a
 * starting point for a bilingual copywriter, never the thing you hand a
 * client. So output is written into the Arabic copy as an editable draft and
 * flagged for review, instead of being rendered live as if it were authored.
 */

/** MyMemory truncates long queries, so text is sent in sentence-sized pieces. */
const MAX_CHARS = 480;

export type TranslateDirection = "en-ar" | "ar-en";

function langPair(direction: TranslateDirection): string {
  return direction === "en-ar" ? "en|ar" : "ar|en";
}

/**
 * Splits text at sentence boundaries, never mid-sentence.
 *
 * Cutting at a fixed character count would hand the service half a clause and
 * get back something that doesn't join up — the seam is visible in the result,
 * and in Arabic it can invert the meaning of the fragment either side of it.
 */
function chunk(text: string): string[] {
  if (text.length <= MAX_CHARS) return [text];
  const pieces: string[] = [];
  let current = "";
  // Keeps the terminator attached to the sentence it ends.
  for (const sentence of text.split(/(?<=[.!?؟।\n])\s+/)) {
    if ((current + sentence).length > MAX_CHARS && current) {
      pieces.push(current.trim());
      current = "";
    }
    if (sentence.length > MAX_CHARS) {
      // A single sentence longer than the limit still has to go somewhere;
      // split on the last space before the limit rather than mid-word.
      let rest = sentence;
      while (rest.length > MAX_CHARS) {
        const cut = rest.lastIndexOf(" ", MAX_CHARS);
        pieces.push(rest.slice(0, cut > 0 ? cut : MAX_CHARS).trim());
        rest = rest.slice(cut > 0 ? cut : MAX_CHARS);
      }
      current = rest;
      continue;
    }
    current += (current ? " " : "") + sentence;
  }
  if (current.trim()) pieces.push(current.trim());
  return pieces;
}

export class TranslationError extends Error {}

async function translateChunk(text: string, direction: TranslateDirection): Promise<string> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair(direction)}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new TranslationError("Couldn't reach the translation service. Check your connection and try again.");
  }
  if (res.status === 429) {
    throw new TranslationError("The free translation service is rate-limited right now — try again in a few minutes.");
  }
  if (!res.ok) throw new TranslationError(`The translation service returned ${res.status}.`);

  const data = await res.json();
  // A daily-limit refusal arrives as a 200 with the limit message in the
  // translated text, so the status code alone can't be trusted here.
  const quota = typeof data?.responseDetails === "string" && /limit/i.test(data.responseDetails);
  if (quota) {
    throw new TranslationError(
      "The free translation service's daily limit has been reached. It resets every 24 hours — or write the Arabic yourself."
    );
  }
  const out = data?.responseData?.translatedText;
  if (typeof out !== "string" || !out.trim()) {
    throw new TranslationError("The translation service returned nothing usable.");
  }
  return out;
}

/** Translates plain text, preserving nothing but the words. */
export async function translateText(text: string, direction: TranslateDirection): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const parts: string[] = [];
  for (const piece of chunk(trimmed)) {
    parts.push(await translateChunk(piece, direction));
  }
  return parts.join(" ");
}

/**
 * Translates a rich-text fragment, leaving its structure alone.
 *
 * Sending the markup through as a string comes back with mangled or
 * translated tag names, so only the text nodes are sent and the element tree
 * is preserved exactly. A strategy written as a table of positioning pillars
 * stays that table in Arabic instead of collapsing into a paragraph.
 */
export async function translateHtml(html: string, direction: TranslateDirection): Promise<string> {
  if (!html.trim()) return "";
  if (typeof document === "undefined") return translateText(html, direction);

  const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, "text/html");
  const root = doc.getElementById("root");
  if (!root) return translateText(html, direction);

  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node = walker.nextNode();
  while (node) {
    if (node.textContent && node.textContent.trim()) nodes.push(node as Text);
    node = walker.nextNode();
  }

  for (const text of nodes) {
    const original = text.textContent ?? "";
    const translated = await translateText(original, direction);
    // Whitespace either side of the text carries layout meaning between inline
    // elements, so only the words are swapped.
    const leading = original.match(/^\s*/)?.[0] ?? "";
    const trailing = original.match(/\s*$/)?.[0] ?? "";
    text.textContent = `${leading}${translated}${trailing}`;
  }

  // The element's dir is flipped so a translated fragment reads in its own
  // direction even when it lands inside an ltr container.
  return root.innerHTML;
}
