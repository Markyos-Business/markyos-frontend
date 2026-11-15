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
export function sanitizeRichHtml(html: string, { media = false }: { media?: boolean } = {}): string {
  return sanitizeHtml(html, {
    allowedTags: media ? [...TAGS, "img", "figure", "figcaption"] : TAGS,
    allowedAttributes: {
      a: ["href", "title"],
      "*": ["dir"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
      ...(media ? { img: ["src", "alt", "width", "height"] } : {}),
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: media ? { img: ["http", "https"] } : {},
    allowProtocolRelative: false,
  });
}
