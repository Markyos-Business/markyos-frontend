import sanitizeHtml from "sanitize-html";

/** Shared by the server render and browser: rich text never carries active HTML. */
export function sanitizeRichHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["p", "div", "br", "h1", "h2", "h3", "h4", "h5", "h6", "strong", "b", "em", "i", "u", "s", "ul", "ol", "li", "blockquote", "a", "table", "thead", "tbody", "tfoot", "tr", "th", "td", "span", "hr", "sup", "sub"],
    allowedAttributes: { a: ["href", "title"], "*": ["dir"], th: ["colspan", "rowspan"], td: ["colspan", "rowspan"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
  });
}
