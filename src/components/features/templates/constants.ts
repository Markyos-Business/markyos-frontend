/** The starting systems a studio can fork instead of a blank workspace. Brand content, not chrome: the hexes are each template's palette. */
export interface Template {
  id: string;
  name: string;
  tagline: string;
  colors: { name: string; hex: string }[];
  latinFamily: string;
  arabicFamily: string;
  overview: string;
}

export const TEMPLATES: Template[] = [
  {
    id: "heritage-fb",
    name: "Heritage F&B",
    tagline: "Warm, tactile, rooted in place — for restaurants, cafés and food brands.",
    colors: [
      { name: "Roast", hex: "#4A2E1F" },
      { name: "Cream", hex: "#F4E9D8" },
      { name: "Clay", hex: "#C46B3E" },
      { name: "Olive", hex: "#6B7A3A" },
    ],
    latinFamily: "Fraunces",
    arabicFamily: "Noto Naskh Arabic",
    overview: "<h2>A table, not a transaction</h2><p>This brand starts from hospitality, not menu engineering. Every surface — packaging, signage, the app — should read as an invitation, not an upsell.</p>",
  },
  {
    id: "modern-tech",
    name: "Modern Tech",
    tagline: "Confident, minimal, dark-canvas — for SaaS and startups.",
    colors: [
      { name: "Ink", hex: "#0B0B0F" },
      { name: "Cloud", hex: "#F5F5FA" },
      { name: "Signal", hex: "#5E5CE6" },
      { name: "Mint", hex: "#34D399" },
    ],
    latinFamily: "Inter",
    arabicFamily: "IBM Plex Sans Arabic",
    overview: "<h2>Built for the next hire, not just the founders</h2><p>The system needs to survive a team of forty, not just the two people who started it. Every rule here exists so someone new can ship on-brand without asking first.</p>",
  },
  {
    id: "boutique-retail",
    name: "Boutique Retail",
    tagline: "Editorial, high-contrast, a little precious — for fashion and lifestyle.",
    colors: [
      { name: "Blanc", hex: "#FAFAF8" },
      { name: "Noir", hex: "#1A1A1A" },
      { name: "Blush", hex: "#E8B4B8" },
      { name: "Gold", hex: "#B08D57" },
    ],
    latinFamily: "Canela",
    arabicFamily: "Aref Ruqaa",
    overview: "<h2>Slow down before you ship</h2><p>Every asset gets the same scrutiny as a print campaign, even a story sticker. Restraint is the brand's actual differentiator.</p>",
  },
  {
    id: "public-sector",
    name: "Public Sector / NGO",
    tagline: "Accessible, trustworthy, WCAG-first — for government and nonprofit work.",
    colors: [
      { name: "Navy", hex: "#1B3A5C" },
      { name: "Paper", hex: "#FFFFFF" },
      { name: "Teal", hex: "#0E7C7B" },
      { name: "Sand", hex: "#E8DCC8" },
    ],
    latinFamily: "Source Sans 3",
    arabicFamily: "Noto Sans Arabic",
    overview: "<h2>Clear enough to translate under pressure</h2><p>Every rule in this system optimizes for a reader who is stressed, on a bad connection, or reading a second language. Clever costs more than it earns here.</p>",
  },
];
