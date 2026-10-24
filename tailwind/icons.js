/**
 * The icon set: an offline stand-in for Line Awesome, drawn as CSS masks.
 * Class names are built at runtime (`la-${name}`), so these are registered
 * as base styles, which are always emitted, rather than utilities, which
 * Tailwind only emits when it finds the class name written out.
 */
export const iconStyles = [
  /* Offline stand-in for Line Awesome: same .las/.lab class vocabulary, drawn as
  currentColor masks so glyphs render with no network. Swap back to the real
  webfont when the binaries are vendored. */
  /* Builder view switcher and moodboard card kinds. A name this file does not
  define renders as a solid square, so each one has to be drawn before it can
  be asked for. */
  {
    ".la-tablet": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"5\" y=\"2.5\" width=\"14\" height=\"19\" rx=\"2\"/><path d=\"M10.5 18.8h3\"/></svg>')",
    },
  },
  {
    ".la-mobile": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"7\" y=\"2.5\" width=\"10\" height=\"19\" rx=\"2\"/><path d=\"M11 18.6h2\"/></svg>')",
    },
  },
  {
    ".la-sticky-note": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5V14l-6 6H5.5A1.5 1.5 0 0 1 4 18.5z\"/><path d=\"M20 14h-4.5a1.5 1.5 0 0 0-1.5 1.5V20\"/><path d=\"M7.5 9h9M7.5 12.5h5\"/></svg>')",
    },
  },
  {
    ".la-swatchbook": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3.5\" y=\"3.5\" width=\"7\" height=\"17\" rx=\"1.6\"/><path d=\"M14 20.5h5.1a1.4 1.4 0 0 0 1.4-1.4V8.4a1.4 1.4 0 0 0-1.4-1.4h-3\"/><path d=\"M3.5 15.5h7\"/><path d=\"M7 17.8h.01\" stroke-width=\"2.4\"/></svg>')",
    },
  },
  {
    ".la-th-large": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linejoin=\"round\"><rect x=\"3.5\" y=\"3.5\" width=\"7.5\" height=\"7\"/><rect x=\"13\" y=\"3.5\" width=\"7.5\" height=\"7\"/><rect x=\"3.5\" y=\"13\" width=\"7.5\" height=\"7.5\"/><rect x=\"13\" y=\"13\" width=\"7.5\" height=\"7.5\"/></svg>')",
    },
  },
  {
    ".la-eye-dropper": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m16 3.5 4.5 4.5\"/><path d=\"M14.8 5.2 18.8 9.2\"/><path d=\"m16.5 7.5-8 8L4 17l1.5-4.5 8-8z\"/></svg>')",
    },
  },
  {
    ".la-trash": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4.5 6.5h15\"/><path d=\"M9 6.5V4.8A1.3 1.3 0 0 1 10.3 3.5h3.4A1.3 1.3 0 0 1 15 4.8v1.7\"/><path d=\"M6.5 6.5 7.4 19a1.4 1.4 0 0 0 1.4 1.3h6.4a1.4 1.4 0 0 0 1.4-1.3l.9-12.5\"/><path d=\"M10.5 10v6.5M13.5 10v6.5\"/></svg>')",
    },
  },
  {
    ".la-thumbtack": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 15v6\"/><path d=\"M8.5 3.5h7l-.8 5.2 2.8 2.3v1.5H6.5V11l2.8-2.3z\"/></svg>')",
    },
  },
  {
    ".la-star": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m12 3.6 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z\"/></svg>')",
    },
  },
  {
    ".la-sitemap": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"9.5\" y=\"3\" width=\"5\" height=\"4\" rx=\"1\"/><rect x=\"3\" y=\"17\" width=\"5\" height=\"4\" rx=\"1\"/><rect x=\"9.5\" y=\"17\" width=\"5\" height=\"4\" rx=\"1\"/><rect x=\"16\" y=\"17\" width=\"5\" height=\"4\" rx=\"1\"/><path d=\"M12 7v4M5.5 17v-3a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v3M12 13v4\"/></svg>')",
    },
  },
  /* Moodboard canvas: the tool palette along the bottom of the board. */
  {
    ".la-mouse-pointer": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 3.2 18 11l-5.4 1.4L10 19z\"/></svg>')",
    },
  },
  {
    ".la-hand-paper": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9 11V4.6a1.4 1.4 0 0 1 2.8 0V11\"/><path d=\"M11.8 10.4V3.6a1.4 1.4 0 0 1 2.8 0V11\"/><path d=\"M14.6 11V5.6a1.4 1.4 0 0 1 2.8 0V14\"/><path d=\"M9 11V8.6a1.4 1.4 0 0 0-2.8 0v5.6c0 3.4 2.4 6.3 5.8 6.3s5.4-2.6 5.4-6\"/></svg>')",
    },
  },
  {
    ".la-share-alt": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"18\" cy=\"5.5\" r=\"2.6\"/><circle cx=\"6\" cy=\"12\" r=\"2.6\"/><circle cx=\"18\" cy=\"18.5\" r=\"2.6\"/><path d=\"m8.3 10.8 7.4-4M8.3 13.2l7.4 4\"/></svg>')",
    },
  },
  {
    ".la-crosshairs": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"6.5\"/><path d=\"M12 2.2v3.4M12 18.4v3.4M2.2 12h3.4M18.4 12h3.4\"/></svg>')",
    },
  },
  {
    ".la-expand-arrows-alt": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M8.5 3.5h-5v5\"/><path d=\"M15.5 3.5h5v5\"/><path d=\"M8.5 20.5h-5v-5\"/><path d=\"M15.5 20.5h5v-5\"/></svg>')",
    },
  },
  {
    ".la-compress": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3.5 8.5h5v-5\"/><path d=\"M20.5 8.5h-5v-5\"/><path d=\"M3.5 15.5h5v5\"/><path d=\"M20.5 15.5h-5v5\"/></svg>')",
    },
  },
  /* Moodboard canvas: the zoom control and the resize corner. */
  {
    ".la-minus": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.8\" stroke-linecap=\"round\"><path d=\"M5 12h14\"/></svg>')",
    },
  },
  {
    ".la-expand": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14.5 4.5H19.5V9.5\"/><path d=\"M9.5 19.5H4.5V14.5\"/><path d=\"M19.5 4.5 13 11M4.5 19.5 11 13\"/></svg>')",
    },
  },
  {
    ".las, .lab, .lar": {
      "display": "inline-block",
      "width": "1em",
      "height": "1em",
      "flex": "none",
      "background-color": "currentColor",
      "-webkit-mask": "center/contain no-repeat var(--i)",
      "mask": "center/contain no-repeat var(--i)",
      "vertical-align": "-.14em",
    },
  },
  {
    ".la-file-alt": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z\"/><path d=\"M14 3v4h4\"/><path d=\"M9.5 12.5h5M9.5 16h5\"/></svg>')",
    },
  },
  /* Creation Layer. A name this file does not define renders as a solid square,
  so every glyph a component asks for has to be drawn here first. */
  {
    ".la-clipboard-list": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9 4H7a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-2\"/><rect x=\"9\" y=\"2.5\" width=\"6\" height=\"3.2\" rx=\"1\"/><path d=\"M9 11h6M9 14.5h6M9 18h3\"/></svg>')",
    },
  },
  {
    ".la-robot": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"4\" y=\"8\" width=\"16\" height=\"11\" rx=\"2.5\"/><path d=\"M12 8V4.5\"/><circle cx=\"12\" cy=\"3.4\" r=\"1.4\"/><path d=\"M9 12.5h.01M15 12.5h.01\" stroke-width=\"2.6\"/><path d=\"M9.5 16h5\"/></svg>')",
    },
  },
  {
    ".la-file-import": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z\"/><path d=\"M14 3v4h4\"/><path d=\"M8 14h6\"/><path d=\"m11.5 11.5 2.5 2.5-2.5 2.5\"/></svg>')",
    },
  },
  {
    ".la-inbox": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3.5 13.5 6 5.2A1.6 1.6 0 0 1 7.5 4h9A1.6 1.6 0 0 1 18 5.2l2.5 8.3\"/><path d=\"M3.5 13.5h4l1.2 2.6h6.6l1.2-2.6h4v4.9a1.6 1.6 0 0 1-1.6 1.6H5.1a1.6 1.6 0 0 1-1.6-1.6z\"/></svg>')",
    },
  },
  {
    ".la-shapes": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"8.5\" cy=\"8\" r=\"4.2\"/><rect x=\"12\" y=\"12.5\" width=\"8\" height=\"8\" rx=\"1.2\"/></svg>')",
    },
  },
  {
    ".la-palette": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M8.5 9h.01M12 8h.01M15.5 9.5h.01M9 14h.01\" stroke-width=\"2.6\"/></svg>')",
    },
  },
  {
    ".la-font": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 20 12 4l7 16\"/><path d=\"M8 14.5h8\"/></svg>')",
    },
  },
  {
    ".la-angle-right": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9 5l7 7-7 7\"/></svg>')",
    },
  },
  {
    ".la-angle-left": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M15 5l-7 7 7 7\"/></svg>')",
    },
  },
  {
    ".la-angle-down": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 9l7 7 7-7\"/></svg>')",
    },
  },
  {
    ".la-angle-up": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 15l7-7 7 7\"/></svg>')",
    },
  },
  {
    ".la-arrow-left": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20 12H4\"/><path d=\"M10 6l-6 6 6 6\"/></svg>')",
    },
  },
  {
    ".la-arrow-right": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 12h16\"/><path d=\"M14 6l6 6-6 6\"/></svg>')",
    },
  },
  {
    ".la-external-link-alt": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M10 5H6a1.5 1.5 0 0 0-1.5 1.5v11A1.5 1.5 0 0 0 6 19h11a1.5 1.5 0 0 0 1.5-1.5v-4\"/><path d=\"M14 4h6v6\"/><path d=\"M20 4l-8.5 8.5\"/></svg>')",
    },
  },
  {
    ".la-info-circle": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 11v6\"/><path d=\"M12 7.6h.01\" stroke-width=\"2.2\"/></svg>')",
    },
  },
  {
    ".la-plus": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.8\" stroke-linecap=\"round\"><path d=\"M12 5v14M5 12h14\"/></svg>')",
    },
  },
  {
    ".la-file-code": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z\"/><path d=\"M14 3v4h4\"/><path d=\"M10.5 12.5 9 14.5l1.5 2M13.5 12.5l1.5 2-1.5 2\"/></svg>')",
    },
  },
  {
    ".la-ellipsis-h": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"2.8\" stroke-linecap=\"round\"><path d=\"M5.5 12h.01M12 12h.01M18.5 12h.01\"/></svg>')",
    },
  },
  {
    ".la-adjust": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 3a9 9 0 0 1 0 18z\" fill=\"%23000\"/></svg>')",
    },
  },
  {
    ".la-sun": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6\"/></svg>')",
    },
  },
  {
    ".la-moon": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z\"/></svg>')",
    },
  },
  {
    ".la-desktop": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"4\" width=\"18\" height=\"12\" rx=\"1.4\"/><path d=\"M9 20h6M12 16v4\"/></svg>')",
    },
  },
  {
    ".la-copy": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"9\" y=\"9\" width=\"11\" height=\"11\" rx=\"1.4\"/><path d=\"M15 9V5.4A1.4 1.4 0 0 0 13.6 4H5.4A1.4 1.4 0 0 0 4 5.4v8.2A1.4 1.4 0 0 0 5.4 15H9\"/></svg>')",
    },
  },
  {
    ".la-heading": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.8\" stroke-linecap=\"round\"><path d=\"M6 5v14M18 5v14M6 12h12\"/></svg>')",
    },
  },
  {
    ".la-bold": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M8 5h4.5a3.5 3.5 0 0 1 0 7H8z\"/><path d=\"M8 12h5.5a3.5 3.5 0 0 1 0 7H8z\"/></svg>')",
    },
  },
  {
    ".la-italic": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.7\" stroke-linecap=\"round\"><path d=\"M10 5h8M6 19h8M14.5 5 9.5 19\"/></svg>')",
    },
  },
  {
    ".la-link": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9.5 14.5 14.5 9.5\"/><path d=\"M13.5 6.5 15 5a4.2 4.2 0 0 1 6 6l-1.5 1.5\"/><path d=\"M10.5 17.5 9 19a4.2 4.2 0 0 1-6-6l1.5-1.5\"/></svg>')",
    },
  },
  {
    ".la-list-ul": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.7\" stroke-linecap=\"round\"><path d=\"M9 6.5h11M9 12h11M9 17.5h11\"/><path d=\"M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01\" stroke-width=\"2.6\"/></svg>')",
    },
  },
  {
    ".la-quote-right": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 7h5v5a4 4 0 0 1-4 4\"/><path d=\"M14 7h5v5a4 4 0 0 1-4 4\"/></svg>')",
    },
  },
  {
    ".la-list-ol": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M10 6.5h10M10 12h10M10 17.5h10\"/><path d=\"M4 5.5h1.2V9M3.6 9h2.2\"/><path d=\"M3.6 12.2a1.1 1.1 0 1 1 1.9.8L3.6 15h2.2\"/><path d=\"M3.7 16.6h1.9l-1.2 1.4a1.1 1.1 0 1 1-.6 2\"/></svg>')",
    },
  },
  {
    ".la-table": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3.5\" y=\"4.5\" width=\"17\" height=\"15\" rx=\"1.4\"/><path d=\"M3.5 9.5h17M3.5 14.5h17M9.5 9.5v10M15 9.5v10\"/></svg>')",
    },
  },
  {
    ".la-times": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.8\" stroke-linecap=\"round\"><path d=\"M6 6l12 12M18 6 6 18\"/></svg>')",
    },
  },
  {
    ".la-check": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 13l4.5 4.5L19 7\"/></svg>')",
    },
  },
  {
    ".la-check-circle": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M8 12.4l3 3 5-6\"/></svg>')",
    },
  },
  {
    ".la-cog": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"3.2\"/><path d=\"M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7\"/></svg>')",
    },
  },
  {
    ".la-exclamation-circle": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7v6\"/><path d=\"M12 16.4h.01\" stroke-width=\"2.2\"/></svg>')",
    },
  },
  {
    ".la-globe": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M3.3 12h17.4\"/><path d=\"M12 3c3 3.6 3 14.4 0 18-3-3.6-3-14.4 0-18z\"/></svg>')",
    },
  },
  {
    ".la-lock": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"5\" y=\"10.5\" width=\"14\" height=\"9.5\" rx=\"2\"/><path d=\"M8.2 10.5V8a3.8 3.8 0 0 1 7.6 0v2.5\"/></svg>')",
    },
  },
  {
    ".la-credit-card": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"6\" width=\"18\" height=\"12\" rx=\"2.2\"/><path d=\"M3 10.2h18M6.5 14.5h3\"/></svg>')",
    },
  },
  {
    ".la-undo": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4.5 9h9.5a5 5 0 0 1 0 10H8.5\"/><path d=\"M8 5 4 9l4 4\"/></svg>')",
    },
  },
  {
    ".la-language": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 5.5h8M7 3.5v2M9.2 5.5c0 3.4-2.4 6.4-5.7 7.4M5 9.2c.9 2 2.7 3.5 4.9 4.1\"/><path d=\"M12.5 20.5l3.8-9 3.7 9\"/><path d=\"M13.8 17.4h5\"/></svg>')",
    },
  },
  {
    ".la-universal-access": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><circle cx=\"12\" cy=\"7.8\" r=\"1.1\" fill=\"%23000\"/><path d=\"M7.8 10.4c2.8.8 5.6.8 8.4 0\"/><path d=\"M12 10.8v3.4M12 14.2l-2 4M12 14.2l2 4\"/></svg>')",
    },
  },
  {
    ".la-eye-slash": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9.9 5.2A9.5 9.5 0 0 1 12 5c5 0 9 4.4 9 7 0 .9-.5 2-1.4 3.1M6.4 6.9C4.2 8.4 3 10.4 3 12c0 2.6 4 7 9 7 1.7 0 3.2-.5 4.5-1.2\"/><path d=\"M9.9 9.9a3 3 0 0 0 4.2 4.2\"/><path d=\"M4 4l16 16\"/></svg>')",
    },
  },
  {
    ".la-arrows-alt-h": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3.5 12h17\"/><path d=\"M7 8.5 3.5 12 7 15.5M17 8.5 20.5 12 17 15.5\"/></svg>')",
    },
  },
  {
    ".la-align-center": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.7\" stroke-linecap=\"round\"><path d=\"M4 6.5h16M7 12h10M4 17.5h16\"/></svg>')",
    },
  },
  {
    ".la-align-left": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.7\" stroke-linecap=\"round\"><path d=\"M4 6.5h16M4 12h10M4 17.5h16\"/></svg>')",
    },
  },
  {
    ".la-align-right": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.7\" stroke-linecap=\"round\"><path d=\"M4 6.5h16M10 12h10M4 17.5h16\"/></svg>')",
    },
  },
  {
    ".la-fill-drip": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5.5 11.5 12 5l6.5 6.5-6.5 6.5z\"/><path d=\"M9 8 7 6\"/><path d=\"M20 16.5c0 1-.8 1.8-1.8 1.8s-1.7-.8-1.7-1.8 1.7-3 1.7-3 1.8 2 1.8 3z\"/></svg>')",
    },
  },
  {
    ".la-circle-notch": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.8\" stroke-linecap=\"round\"><path d=\"M12 3a9 9 0 1 0 6.4 2.65\"/></svg>')",
    },
  },
  {
    ".la-question-circle": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M9.6 9.6a2.5 2.5 0 1 1 3.6 2.3c-.7.4-1.2 1-1.2 1.8\"/><path d=\"M12 16.8h.01\" stroke-width=\"2.2\"/></svg>')",
    },
  },
  {
    ".la-user": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"8.2\" r=\"3.8\"/><path d=\"M4.5 20c1.6-3.9 4.3-5.8 7.5-5.8s5.9 1.9 7.5 5.8\"/></svg>')",
    },
  },
  {
    ".la-sign-out-alt": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14 4.5H7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h7\"/><path d=\"M17.5 8.5 21 12l-3.5 3.5\"/><path d=\"M21 12h-9.5\"/></svg>')",
    },
  },
  {
    ".la-receipt": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6 3h12v18l-3-2-3 2-3-2-3 2z\"/><path d=\"M9 8h6M9 12h6\"/></svg>')",
    },
  },
  {
    ".la-share-square, .la-external-link-alt": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M10 4.5H6a2 2 0 0 0-2 2V18a2 2 0 0 0 2 2h11.5a2 2 0 0 0 2-2v-4\"/><path d=\"M14 4.5h5.5V10\"/><path d=\"M19.5 4.5 11.5 12.5\"/></svg>')",
    },
  },
  {
    ".la-search": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"10.8\" cy=\"10.8\" r=\"6.4\"/><path d=\"M15.5 15.5 20 20\"/></svg>')",
    },
  },
  {
    ".la-google": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20.5 12.6a8.6 8.6 0 1 1-2.6-6.1\"/><path d=\"M20.5 12.6H13\"/></svg>')",
    },
  },
  {
    ".la-pen": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 20l.9-4.2L15.6 5.1a1.5 1.5 0 0 1 2.1 0l1.2 1.2a1.5 1.5 0 0 1 0 2.1L8.2 19.1z\"/><path d=\"M13.5 7.2l3.3 3.3\"/></svg>')",
    },
  },
  {
    ".la-clock": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7v5l3.5 2\"/></svg>')",
    },
  },
  {
    ".la-unlink": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9.5 14.5 11 13\"/><path d=\"M13 11l1.5-1.5\"/><path d=\"M14.5 6.5 16 5a4.2 4.2 0 0 1 6 6l-1.5 1.5\"/><path d=\"M9.5 17.5 8 19a4.2 4.2 0 0 1-6-6l1.5-1.5\"/><path d=\"M4.5 4.5l15 15\"/></svg>')",
    },
  },
  {
    ".la-sliders": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\"><path d=\"M5 4v9M5 17v3M12 4v3M12 11v9M19 4v13M19 21v-1\"/><circle cx=\"5\" cy=\"15\" r=\"2\" fill=\"%23000\" stroke=\"none\"/><circle cx=\"12\" cy=\"9\" r=\"2\" fill=\"%23000\" stroke=\"none\"/><circle cx=\"19\" cy=\"19\" r=\"2\" fill=\"%23000\" stroke=\"none\"/></svg>')",
    },
  },
  {
    ".la-bullseye": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><circle cx=\"12\" cy=\"12\" r=\"5\"/><circle cx=\"12\" cy=\"12\" r=\"1.4\" fill=\"%23000\" stroke=\"none\"/></svg>')",
    },
  },
  {
    ".la-book": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 6.5c-1.8-1.3-4-2-6.5-2v13c2.5 0 4.7.7 6.5 2 1.8-1.3 4-2 6.5-2V4.5c-2.5 0-4.7.7-6.5 2z\"/><path d=\"M12 6.5v13\"/></svg>')",
    },
  },
  {
    ".la-shield-alt": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z\"/><path d=\"M9 12l2 2 4-4.5\"/></svg>')",
    },
  },
  {
    ".la-users": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"9\" cy=\"8.5\" r=\"3.2\"/><path d=\"M2.8 19c1.3-3.3 3.6-5 6.2-5s4.9 1.7 6.2 5\"/><circle cx=\"17\" cy=\"9\" r=\"2.6\"/><path d=\"M15.5 11.3c2.2.4 3.9 1.9 4.9 4.4\"/></svg>')",
    },
  },
  {
    ".la-history": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3.5 9A8.5 8.5 0 1 1 4 14.5\"/><path d=\"M3.5 4.5v4.5H8\"/><path d=\"M12 8v4.5l3 2\"/></svg>')",
    },
  },
  {
    ".la-chart-line": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 4v16h16\"/><path d=\"M6.5 15l4-4.5 3 3 5-6\"/></svg>')",
    },
  },
  {
    ".la-key": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"8\" cy=\"15\" r=\"4\"/><path d=\"M11 12l9-9\"/><path d=\"M16 7l3 3\"/><path d=\"M19 4l1 1\"/></svg>')",
    },
  },
  {
    ".la-id-badge": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"5\" y=\"4\" width=\"14\" height=\"17\" rx=\"2\"/><circle cx=\"12\" cy=\"11\" r=\"2.4\"/><path d=\"M8.5 17c.8-1.6 2-2.4 3.5-2.4s2.7.8 3.5 2.4\"/><path d=\"M10 4V2.5h4V4\"/></svg>')",
    },
  },
  {
    ".la-store": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3.5 9.5 4.5 4h15l1 5.5\"/><path d=\"M3.5 9.5a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0\"/><path d=\"M5 10v10h14V10\"/><path d=\"M10 20v-5h4v5\"/></svg>')",
    },
  },
  {
    ".la-upload": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 15V4\"/><path d=\"M8 8l4-4 4 4\"/><path d=\"M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4\"/></svg>')",
    },
  },
  /* These three were referenced in code with no glyph behind them, so they drew
  as solid squares: `bars` is Signal's menu button, `share-square` is the
  Social category in the block palette, `sync` is a busy state. */
  {
    ".la-bars": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\"><path d=\"M4 7h16\"/><path d=\"M4 12h16\"/><path d=\"M4 17h16\"/></svg>')",
    },
  },
  {
    ".la-share-square": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4\"/><path d=\"M14 4h6v6\"/><path d=\"M20 4l-9 9\"/></svg>')",
    },
  },
  {
    ".la-sync": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20 11a8 8 0 0 0-13.7-5.3L4 8\"/><path d=\"M4 4v4h4\"/><path d=\"M4 13a8 8 0 0 0 13.7 5.3L20 16\"/><path d=\"M20 20v-4h-4\"/></svg>')",
    },
  },
  /* Panel and rail controls. */
  {
    ".la-angle-double-left": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M11 6l-6 6 6 6\"/><path d=\"M18 6l-6 6 6 6\"/></svg>')",
    },
  },
  {
    ".la-angle-double-right": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M13 6l6 6-6 6\"/><path d=\"M6 6l6 6-6 6\"/></svg>')",
    },
  },
  {
    ".la-eye": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 12c0-2.6 4-7 9-7s9 4.4 9 7c0 2.6-4 7-9 7s-9-4.4-9-7z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/></svg>')",
    },
  },
  {
    ".la-download": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 4v11\"/><path d=\"M8 11l4 4 4-4\"/><path d=\"M4 16v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4\"/></svg>')",
    },
  },
  {
    ".la-map-marker": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z\"/><circle cx=\"12\" cy=\"9.5\" r=\"2.4\"/></svg>')",
    },
  },
  {
    ".la-image": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"4\" width=\"18\" height=\"16\" rx=\"2\"/><circle cx=\"8.5\" cy=\"9.5\" r=\"1.6\"/><path d=\"M3 16.5l5-5 4 4 3-3 6 6\"/></svg>')",
    },
  },
  {
    ".la-grip-vertical": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"2.4\" stroke-linecap=\"round\"><path d=\"M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01\"/></svg>')",
    },
  },
  {
    ".la-layer-group": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 3 3 8l9 5 9-5z\"/><path d=\"M3 13l9 5 9-5\"/><path d=\"M3 16.5l9 5 9-5\"/></svg>')",
    },
  },
  {
    ".la-play": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M10 8.5l6 3.5-6 3.5z\" fill=\"%23000\" stroke=\"none\"/></svg>')",
    },
  },
  {
    ".la-envelope": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"5.5\" width=\"18\" height=\"13\" rx=\"2\"/><path d=\"M4 7l8 6 8-6\"/></svg>')",
    },
  },
  {
    ".la-arrows-v": {
      "--i": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23000\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 3v18\"/><path d=\"M8 7l4-4 4 4\"/><path d=\"M8 17l4 4 4-4\"/></svg>')",
    },
  },
];
