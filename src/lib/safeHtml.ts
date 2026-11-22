import sanitizeHtml from "sanitize-html";

const TAGS = ["p", "div", "br", "h1", "h2", "h3", "h4", "h5", "h6", "strong", "b", "em", "i", "u", "s", "ul", "ol", "li", "blockquote", "a", "table", "thead", "tbody", "tfoot", "tr", "th", "td", "span", "hr", "sup", "sub"];

/**
 * Shared by the server render and browser: rich text never carries active HTML.
 *
 * `media` lets images through (with a figure and caption), for website
 * articles. Brand copy leaves it off: an image there would be a remote file
 * nobody chose to put in the brand. Image sources are http(s) only, never
 * `data:` — the same rule the backend's cleaner applies on save.
 */
/** Help Center additions (`help`): code blocks, callouts and video links, the same set the backend's help cleaner keeps. */
const HELP_TAGS = ["pre", "code", "aside"];

export function sanitizeRichHtml(html: string, { media = false, help = false }: { media?: boolean; help?: boolean } = {}): string {
  const images = media || help;
  return sanitizeHtml(html, {
    allowedTags: [...TAGS, ...(images ? ["img", "figure", "figcaption"] : []), ...(help ? HELP_TAGS : [])],
    // Classes only with these exact values: a callout's kind and the video marker.
    allowedClasses: help ? { aside: ["callout-note", "callout-warning"], a: ["video-embed"] } : {},
    allowedAttributes: {
      a: ["href", "title"],
      "*": ["dir"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
      ...(images ? { img: ["src", "alt", "width", "height"] } : {}),
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: images ? { img: ["http", "https"] } : {},
    allowProtocolRelative: false,
  });
}
