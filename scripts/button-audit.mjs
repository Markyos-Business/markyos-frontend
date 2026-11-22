// One button component (docs/MARKYOS_COMPONENTS.md, review item 3, 22 Nov 2026).
//
// Outside the kit (src/components/ui) a button is `Button`, `IconButton`,
// `LinkButton` or another kit control, never a hand-styled element. This
// audit refuses:
//
//   1. a native <button> that styles itself: a `className` or a `style`
//      (an unstyled <button> wrapping a kit control is fine);
//   2. an <a> or <Link> drawn as a button: the button classes (`mk-btn`,
//      `mk-tap`, `mk-icon-btn`), or a control height with a fill or corner.
//      A link that looks like a button is `<Button href>` / `LinkButton`;
//   3. a round button (`shape="round"`): every button takes the control
//      corner (MARKYOS_UI §2.6); only the kit's floating action button is
//      round.
//
// A deliberate exception, something that is a button to assistive tech but
// not a button to look at (a card, a tile, a tree row, a drop zone, a canvas
// handle), carries `button-audit-ignore: <reason>` inside its opening tag or
// on the line above. Exempt like the control audit: the guideline-site
// templates and the public questionnaire (client brand themes) and the
// design-system galleries (specimens).
//
//   node scripts/button-audit.mjs           the list, exit 1 if any
//   node scripts/button-audit.mjs --count   only the totals
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = "src";
const EXEMPT = ["src/components/ui/", "src/features/guideline-site/", "src/features/discovery/components/client/", "src/features/design-system/"];
const BUTTONISH = /\b(mk-btn|mk-tap|mk-icon-btn)\b|\bh-(ctl|control)-\w+\b[^"`]*\b(bg-|rounded-)|\b(bg-|rounded-)[^"`]*\bh-(ctl|control)-\w+\b/;

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : path.endsWith(".tsx") && !path.endsWith(".test.tsx") ? [path] : [];
  });
}

/** The JSX opening tag starting at `index`, up to its closing `>` (not an arrow's `=>`). */
function openingTag(text, index) {
  let depth = 0;
  for (let i = index; i < text.length; i++) {
    const c = text[i];
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === ">" && depth === 0 && text[i - 1] !== "=") return text.slice(index, i + 1);
  }
  return text.slice(index);
}

const problems = [];
let ignoredCount = 0;
for (const file of files(ROOT)) {
  if (EXEMPT.some((prefix) => file.startsWith(prefix))) continue;
  const text = readFileSync(file, "utf8");
  const lines = text.split("\n");
  const lineOf = (index) => text.slice(0, index).split("\n").length;
  for (const match of text.matchAll(/<(IconButton|Button)\b/g)) {
    const tag = openingTag(text, match.index);
    const line = lineOf(match.index);
    if (/shape="round"/.test(tag) && !/button-audit-ignore:/.test(tag)) problems.push(`${relative(".", file)}:${line}  round <${match[1]}> — buttons take the control corner`);
  }
  for (const match of text.matchAll(/<(button|a|Link)\b/g)) {
    const tag = openingTag(text, match.index);
    const line = lineOf(match.index);
    if (/button-audit-ignore:/.test(tag) || /button-audit-ignore:/.test(lines[line - 2] ?? "")) {
      ignoredCount++;
      continue;
    }
    const where = `${relative(".", file)}:${line}`;
    if (match[1] === "button") {
      if (/\bclassName=/.test(tag) && !/className="(sr-only|contents)"/.test(tag)) problems.push(`${where}  <button> styled with className — use Button / IconButton`);
      else if (/\bstyle=\{/.test(tag)) problems.push(`${where}  <button> styled inline — use Button / IconButton`);
    } else {
      const cls = tag.match(/className=(?:"([^"]*)"|\{`([^`]*)`\})/);
      if (cls && BUTTONISH.test(cls[1] ?? cls[2])) problems.push(`${where}  <${match[1]}> drawn as a button — use <Button href> / LinkButton`);
    }
  }
}

if (process.argv.includes("--count")) {
  console.log(`${problems.length} custom button(s), ${ignoredCount} marked exception(s)`);
} else if (problems.length) {
  console.error(`Custom buttons outside the kit (docs/MARKYOS_COMPONENTS.md):\n${problems.join("\n")}\n\n${problems.length} to fix. A real exception carries "button-audit-ignore: <reason>".`);
  process.exit(1);
} else {
  console.log(`Buttons — every one is the kit's (${ignoredCount} marked exception(s)).`);
}
