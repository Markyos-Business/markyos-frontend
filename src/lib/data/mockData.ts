import {
  Account,
  Billing,
  ClientAccess,
  ColorSwatch,
  CompetitorColumn,
  DeveloperSettings,
  LogoSlot,
  Persona,
  SlotKind,
  Typography,
  VoiceTrait,
  Workspace,
} from "../../types";

export function defaultColors(): ColorSwatch[] {
  return [
    { id: "canvas", name: "Canvas", hex: "#090909", locked: true },
    { id: "surface-1", name: "Surface 1", hex: "#141414", locked: true },
    { id: "surface-2", name: "Surface 2", hex: "#1c1c1c", locked: true },
    { id: "accent", name: "Accent", hex: "#0099ff", isPrimary: true, locked: true },
    { id: "ink-reversed", name: "Ink reversed", hex: "#ffffff", locked: true },
    { id: "muted", name: "Muted", hex: "#8a8a94", locked: true },
  ];
}

export function emptySlot(kind: SlotKind): LogoSlot {
  return { kind, phase: "empty", clearspaceMultiplier: 0.5 };
}

function emptyLogo(): Record<SlotKind, LogoSlot> {
  return {
    arabic: emptySlot("arabic"),
    latin: emptySlot("latin"),
    symbol: emptySlot("symbol"),
  };
}

export function defaultClientAccess(): ClientAccess {
  return { passwordEnabled: false, password: "", customDomain: "", domainStatus: "none", subdomain: "" };
}

export function defaultBilling(): Billing {
  return { plan: "free" };
}

export function defaultTypography(): Typography {
  return { latinFamily: "Inter Variable", arabicFamily: "IBM Plex Sans Arabic" };
}

export function defaultDeveloper(): DeveloperSettings {
  return {
    apiKey: "mk_test_" + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6),
    webhookUrl: "",
    figmaConnected: false,
  };
}

/** Every competitive analysis starts with one column; the studio adds its own. */
export function defaultCompetitorColumns(): CompetitorColumn[] {
  return [{ id: "notes", label: "Notes" }];
}

export function defaultVoiceTrait(trait: string, doExample: string, dontExample: string): VoiceTrait {
  return { id: `vt-${trait.toLowerCase().replace(/\s+/g, "-")}`, trait, doExample, dontExample };
}

export function defaultPersona(name: string, role: string, description: string): Persona {
  return { id: `p-${name.toLowerCase().replace(/\s+/g, "-")}`, name, role, description };
}

const DEFAULT_OVERVIEW = `<h2>A studio that reads both ways</h2>
<p>Nadeen Studio builds identity systems for clients in Riyadh, Amman and Berlin. Every system ships in Arabic and Latin at the same time — not as a localisation pass, but as two equal drafts of the same idea.</p>
<p>This brand book is the single source for the studio's own mark, palette and type. Sections stay short on purpose: a rule that needs a paragraph of defence is usually the wrong rule.</p>
<blockquote>Set the Arabic first. If the layout survives it, the Latin will be fine.</blockquote>`;

/**
 * The account the seeded brands belong to.
 *
 * Brands are owned by an account now, so the demo content needs an owner or it
 * belongs to nobody and shows up in no gallery. Giving it a real account also
 * means the demo is reached the same way any other account is — by signing in —
 * rather than through a side door where any email at all worked.
 *
 * The password is stored in the `plain$` form on purpose. `defaultState()` is
 * synchronous and deriving a key is not, and this is seed data in a public
 * repo, so there is nothing to protect: the credentials are printed on the
 * login screen. It also means the first real sign-in exercises the upgrade
 * path, and the record becomes a proper PBKDF2 hash like any other.
 */
export const DEMO_ACCOUNT_ID = "acc-demo";
export const DEMO_EMAIL = "nadeen@studio.com";
export const DEMO_PASSWORD = "markyos2026";

export function buildDemoAccount(): Account {
  const now = Date.now();
  return {
    id: DEMO_ACCOUNT_ID,
    name: "Nadeen Darwish",
    email: DEMO_EMAIL,
    password: `plain$${DEMO_PASSWORD}`,
    passwordUpdatedAt: now,
    createdAt: now - 1000 * 60 * 60 * 24 * 60,
    lastLoginAt: null,
    // No preference, so the chrome follows whichever brand is open — the same
    // behaviour the single `lang` field gave, which is what the seed should
    // demonstrate.
    adminLang: null,
  };
}

export function buildInitialWorkspaces(): Workspace[] {
  const now = Date.now();
  const day = 1000 * 60 * 60 * 24;

  const nadeen: Workspace = {
    id: "ws-nadeen",
    ownerAccountId: DEMO_ACCOUNT_ID,
    slug: "nadeen-studio",
    name: "Nadeen Studio",
    initials: "NS",
    primaryLocale: "en",
    sharedStatus: "shared",
    createdAt: now - day * 40,
    updatedAt: now - 1000 * 60 * 10,
    overviewHtml: DEFAULT_OVERVIEW,
    overviewSavedAt: now - 1000 * 60 * 10,
    industry: "Brand & identity design",
    tagline: "One brand, two directions.",
    foundedYear: "2019",
    colors: defaultColors(),
    typography: defaultTypography(),
    clientAccess: {
      passwordEnabled: true,
      password: "nadeen2026",
      customDomain: "brand.nadeenstudio.com",
      domainStatus: "verified",
      subdomain: "nadeen",
    },
    billing: { plan: "subscription", purchasedAt: now - day * 35 },
    logo: {
      arabic: emptySlot("arabic"),
      latin: {
        kind: "latin",
        phase: "attached",
        fileName: "nadeen-latin.svg",
        fileSizeKB: 14,
        format: "svg",
        url: "/markyos-lockup.svg",
        width: 1080,
        height: 285.96,
        clearspaceMultiplier: 0.5,
      },
      symbol: {
        kind: "symbol",
        phase: "attached",
        fileName: "nadeen-mark.svg",
        fileSizeKB: 4,
        format: "svg",
        url: "/markyos-mark.svg",
        width: 236.66,
        height: 285.96,
        clearspaceMultiplier: 0.5,
      },
    },
    logoUsageNotes:
      "Dark canvas first — it's what the client viewer shows by default. Never place the symbol alone smaller than 24px; drop to the Latin lockup instead. Keep 0.5x clearspace measured from the mark's own height.",
    logoColorIds: ["canvas", "accent"],
    // v2.0 — sign-off pins left by the client on their last review pass
    signOffPins: [
      {
        id: "pin-1",
        section: "color",
        authorName: "Layla — Almarai Foods",
        note: "Accent blue reads great on the dark canvas. Approved.",
        createdAt: now - day * 3,
        resolved: true,
      },
      {
        id: "pin-2",
        section: "typography",
        authorName: "Layla — Almarai Foods",
        note: "Can we see the Arabic headline a touch heavier?",
        createdAt: now - day * 1,
        resolved: false,
      },
    ],
    // v3.0 — strategy hub
    strategy: {
      purpose: "Make bilingual identity systems that never feel translated.",
      mission:
        "Every studio deliverable ships in Arabic and Latin at the same time, built by native speakers of each script, so no client ever has to explain their brand twice.",
      vision: "A region where every brand reads as confidently in Arabic as it does in Latin, with no version treated as the translation.",
      coreValues: [
        { id: "cv-1", title: "Set the Arabic first", description: "The Arabic composition is drafted before the Latin, every time — never adapted after the fact." },
        { id: "cv-2", title: "No paragraph rules", description: "If a guideline needs a paragraph to defend itself, it's the wrong rule." },
        { id: "cv-3", title: "One link, not a folder", description: "Clients and agencies get a single guideline link, not a stack of exported PDFs." },
      ],
      targetAudienceSummary:
        "Regional F&B and hospitality brands expanding across Gulf markets, plus the agencies and freelancers who execute their campaigns day to day.",
      personas: [
        defaultPersona(
          "Layla",
          "Marketing lead at a regional F&B brand",
          "Needs to hand this guideline to three agencies at once and trust they'll all render it the same way."
        ),
        defaultPersona(
          "Omar",
          "Freelance motion designer",
          "Opens the guideline once a quarter for a campaign refresh — wants the logo files fast, not a lecture."
        ),
      ],
      competitorColumns: [
        { id: "notes", label: "Notes" },
        { id: "arabic", label: "Arabic support" },
        { id: "delivery", label: "Delivery format" },
        { id: "gap", label: "Gap we exploit" },
      ],
      competitors: [
        {
          id: "comp-1",
          name: "Dual Studio",
          notes: "Positions on speed and price.",
          cells: {
            arabic: "None — Latin only",
            delivery: "Static PDF",
            gap: "No governance after handover; the PDF is stale the day it ships.",
          },
        },
        {
          id: "comp-2",
          name: "Kalima Brand Co.",
          notes: "Strong Arabic type craft.",
          cells: {
            arabic: "Excellent, but sequential",
            delivery: "PDF + asset folder",
            gap: "Latin is always an afterthought pass, so the two scripts never share metrics.",
          },
        },
      ],
      positioningStatement:
        "For regional brands expanding across Gulf markets, Nadeen Studio is the identity partner that designs Arabic and Latin as equal originals — not a design studio that translates a Western system after the fact.",
      uvp: "The only regional studio that drafts Arabic and Latin lockups simultaneously, by native speakers of each script, and hands clients one governed link instead of a folder of export files.",
      voiceTraits: [
        defaultVoiceTrait("Plain", "Set the Arabic first.", "Please be advised that the Arabic composition should be prioritized."),
        defaultVoiceTrait("Direct", "No bounce, no spring.", "We generally try to avoid excessive motion where possible."),
        defaultVoiceTrait("Specific", "0.5× clearspace, measured from the mark's height.", "Give the logo some breathing room."),
      ],
    },
    // Pillar 1 — brand assets manager (beyond the three fixed logo slots)
    assets: [
      {
        id: "asset-1",
        type: "icon",
        fileName: "app-icon-mono.svg",
        url: "/markyos-mark.svg",
        sizeKB: 4,
        tags: ["ui", "monochrome"],
        uploadedAt: now - day * 12,
        status: "approved",
        versions: [],
      },
      {
        id: "asset-2",
        type: "export",
        fileName: "lockup-social-export.svg",
        url: "/markyos-lockup.svg",
        sizeKB: 14,
        tags: ["social", "export"],
        uploadedAt: now - day * 5,
        status: "approved",
        versions: [
          { id: "asset-2-v1", url: "/markyos-lockup.svg", fileName: "lockup-social-export-draft.svg", sizeKB: 12, createdAt: now - day * 9 },
        ],
      },
    ],
    // Pillar 3 — department views: a *selection* into sections + strategy
    // content, resolved live at render time, never a copied paragraph.
    departmentViews: [
      {
        id: "dv-1",
        name: "Sales",
        createdAt: now - day * 10,
        guidelineText:
          "Pitch decks use the reversed lockup on the dark canvas only — never the light variant in a client deck. Lead with the positioning statement from Strategy, not the mission paragraph.",
        publishToSite: true,
        instructionSections: [
          {
            id: "dis-1",
            heading: "Before a pitch",
            body: "Open the guideline link, not a downloaded deck — the link is versioned and the download isn't. Confirm the client's language before you build: an Arabic-first client gets the Arabic lockup on the title slide, not a translated subtitle under the Latin one.",
          },
          {
            id: "dis-2",
            heading: "Slides",
            body: "One idea per slide. The positioning statement is the opening claim; the mission paragraph is background and belongs in the appendix if it appears at all.\n\nNever set body copy over the accent blue. It is a link and focus colour, and at paragraph size it fails contrast.",
          },
        ],
        items: [
          { id: "dvi-1", itemType: "section", sectionKey: "logo", relevanceNote: "Title slides use the reversed lockup on canvas #090909 only." },
          { id: "dvi-2", itemType: "section", sectionKey: "color", relevanceNote: "Never place the accent blue behind body text — it's a link color, not a fill." },
        ],
      },
      {
        id: "dv-2",
        name: "Marketing",
        createdAt: now - day * 8,
        guidelineText: "",
        publishToSite: true,
        instructionSections: [],
        items: [
          { id: "dvi-3", itemType: "mission" },
          { id: "dvi-4", itemType: "voiceTrait", refId: "vt-direct" },
        ],
      },
    ],
    developer: {
      apiKey: "mk_test_nadeen8f2a91c3",
      webhookUrl: "https://hooks.nadeenstudio.com/markyos",
      figmaConnected: true,
      figmaSyncedAt: now - 1000 * 60 * 40,
    },
    // v4.0 — team, approvals, version history
    team: [
      { id: "tm-1", name: "Nadeen Al-Rashid", email: "nadeen@studio.com", role: "owner" },
      { id: "tm-2", name: "Omar Haddad", email: "omar@studio.com", role: "editor" },
      { id: "tm-3", name: "Layla — Almarai Foods", email: "layla@almaraifoods.com", role: "client" },
    ],
    approvals: [
      {
        id: "ap-1",
        summary: "Add a fourth secondary color (warm sand #D9C9A8) to the extended palette",
        proposedBy: "Omar Haddad",
        status: "pending",
        createdAt: now - 1000 * 60 * 60 * 5,
      },
      {
        id: "ap-2",
        summary: "Loosen logo clearspace from 0.5× to 0.6× for small digital placements",
        proposedBy: "Omar Haddad",
        status: "approved",
        createdAt: now - day * 6,
        resolvedAt: now - day * 5,
        reviewNote: "Agreed — the mark was feeling cramped at 16px.",
      },
    ],
    versionHistory: [
      {
        id: "vh-1",
        label: "Initial system",
        createdAt: now - day * 38,
        createdBy: "Nadeen Al-Rashid",
        overviewHtml: DEFAULT_OVERVIEW,
        colors: defaultColors(),
        typography: defaultTypography(),
      },
    ],
    whiteLabel: true,
    complianceChecks: [
      {
        id: "cc-1",
        fileName: "instagram-story-draft.png",
        createdAt: now - day * 2,
        matchedSwatchIds: ["accent", "canvas"],
        flaggedColors: ["#E4572E"],
      },
    ],
    /*
     * Two answers from the client's discovery form, waiting on the studio.
     *
     * Deliberately pending rather than already written into the strategy: what
     * a client typed into a form is a useful starting point and not the brand's
     * positioning statement until someone who does this for a living has read
     * it. Seeded so the queue shows what it is for instead of an empty state.
     */
    drafts: [
      {
        id: "draft-1",
        targetType: "strategyField",
        targetRef: "positioningStatement",
        content:
          "For founders launching in the Gulf who need to look credible in Arabic and English from day one, Nadeen Studio builds brand systems that read as native in both — not a Latin brand with Arabic bolted on.",
        source: "brief",
        provenance: {
          summary: "Discovery form — “Finish this: For [who] who need [what]…”",
          inputs: ["positioning", "who-for"],
          requestedBy: "Nadeen Darwish",
        },
        status: "pending",
        createdAt: now - day * 1,
        decidedAt: null,
        decidedBy: null,
      },
      {
        id: "draft-2",
        targetType: "strategyField",
        targetRef: "uvp",
        content: "Arabic-first brand systems, delivered as a living site rather than a PDF nobody opens twice.",
        source: "brief",
        provenance: {
          summary: "Discovery form — “What do you do better than anyone near you?”",
          inputs: ["why-you"],
          requestedBy: "Nadeen Darwish",
        },
        status: "pending",
        createdAt: now - day * 1,
        decidedAt: null,
        decidedBy: null,
      },
    ],
    // Empty on purpose: a moodboard is built from images a studio has actually
    // gathered, and seeding it with stock photography would be inventing taste
    // this brand never expressed.
    moodboards: [],
    stage: "live",
    // Website builder — freeform sections added beyond the fixed pages
    customBlocks: [
      {
        id: "block-1",
        kind: "quote",
        order: 0,
        text: "Nadeen Studio handed us one link instead of a stack of PDFs — every agency we work with opens the same page now.",
        arText: "أرسل لنا استوديو نادين رابطًا واحدًا بدلاً من مجموعة ملفات PDF — كل وكالة نتعامل معها تفتح نفس الصفحة الآن.",
        attribution: "Layla — Almarai Foods",
      },
      {
        id: "block-2",
        kind: "text",
        order: 1,
        title: "Print & merchandise",
        arTitle: "الطباعة والمنتجات",
        text: "Use the reversed lockup on any solid-color substrate. Never stretch the mark to fill a panel — let it sit inside the clearspace and breathe.",
        arText: "استخدم النسخة المعكوسة من الشعار على أي خلفية بلون واحد. لا تقم مطلقًا بتمديد الشعار لملء المساحة — اتركه ضمن المسافة الآمنة.",
      },
    ],
    shareLinks: [],
    hiddenSections: [],
    sectionTitles: {},
    sectionNotes: {},
    strategyTranslation: { source: "manual", translatedAt: null, direction: null, unreviewed: [] },
    sectionOrder: [],
    sectionStyles: {},
    sectionOptions: {},
    siteMode: "auto",
    published: null,
    publishedAt: null,
    guidelineTemplate: "studio",
    studioStyle: "prism",
    // Guidelines editor — a real additional page beyond Home, with its own
    // url (/v/nadeen-studio/p/examples) and its own independent block list.
    pages: [
      {
        id: "page-examples",
        name: "Examples",
        arName: "أمثلة",
        slug: "examples",
        order: 0,
        blocks: [
          {
            id: "pg-block-1",
            kind: "text",
            order: 0,
            title: "Applied, not just specified",
            arTitle: "مطبّق، لا مجرد موصوف",
            text: "A few places the system already shows up in the wild — signage, social, and stationery.",
            arText: "بعض الأماكن التي يظهر فيها النظام بالفعل — اللافتات، التواصل الاجتماعي، والقرطاسية.",
          },
          { id: "pg-block-2", kind: "gallery", order: 1, assetIds: ["asset-1", "asset-2"] },
        ],
      },
    ],
  };

  const brandColors = (canvasHex: string, accentHex: string, mutedHex: string): ColorSwatch[] => [
    { id: "canvas", name: "Canvas", hex: canvasHex, locked: true },
    { id: "accent", name: "Accent", hex: accentHex, isPrimary: true, locked: true },
    { id: "ink-reversed", name: "Ink reversed", hex: "#ffffff", locked: true },
    { id: "muted", name: "Muted", hex: mutedHex, locked: true },
  ];

  const brand = (
    id: string,
    name: string,
    initials: string,
    sharedStatus: "shared" | "draft",
    daysAgo: number,
    sections: number,
    template: Workspace["guidelineTemplate"] = "vault",
    colors?: ColorSwatch[]
  ): Workspace => ({
    id,
    ownerAccountId: DEMO_ACCOUNT_ID,
    slug: id,
    name,
    initials,
    primaryLocale: "en",
    sharedStatus,
    createdAt: now - day * (daysAgo + 20),
    updatedAt: now - day * daysAgo,
    overviewHtml: `<h2>${name}</h2><p>Brand overview — nothing written yet.</p>`,
    overviewSavedAt: now - day * daysAgo,
    industry: "",
    tagline: "",
    foundedYear: "",
    colors: sections > 2 ? colors || defaultColors().slice(0, 4) : [],
    typography: defaultTypography(),
    clientAccess:
      sharedStatus === "shared"
        ? { passwordEnabled: true, password: "guideline2026", customDomain: "", domainStatus: "none", subdomain: "" }
        : defaultClientAccess(),
    billing: sharedStatus === "shared" ? { plan: "pass", purchasedAt: now - day * daysAgo } : defaultBilling(),
    logo: emptyLogo(),
    logoUsageNotes: "",
    logoColorIds: [],
    signOffPins: [],
    strategy: {
      purpose: "",
      mission: "",
      vision: "",
      coreValues: [],
      targetAudienceSummary: "",
      personas: [],
      competitors: [],
      competitorColumns: defaultCompetitorColumns(),
      positioningStatement: "",
      uvp: "",
      voiceTraits: [],
    },
    assets: [],
    departmentViews: [],
    developer: defaultDeveloper(),
    team: [{ id: `${id}-owner`, name: "You", email: "you@studio.com", role: "owner" }],
    approvals: [],
    versionHistory: [],
    whiteLabel: false,
    complianceChecks: [],
    drafts: [],
    moodboards: [],
    // Shared with a client means it has been delivered; the rest are mid-flight.
    stage: sharedStatus === "shared" ? "delivered" : "design",
    customBlocks: [],
    shareLinks: [],
    hiddenSections: [],
    sectionTitles: {},
    sectionNotes: {},
    strategyTranslation: { source: "manual", translatedAt: null, direction: null, unreviewed: [] },
    sectionOrder: [],
    sectionStyles: {},
    sectionOptions: {},
    siteMode: "auto",
    guidelineTemplate: template,
    studioStyle: "prism",
    pages: [],
    published: null,
    publishedAt: null,
  });

  /** A workspace already shared with a client is, by definition, published. */
  const asPublished = (ws: Workspace): Workspace => {
    const { published: _p, publishedAt: _pa, ...rest } = ws;
    void _p;
    void _pa;
    return { ...ws, published: JSON.parse(JSON.stringify(rest)), publishedAt: ws.updatedAt };
  };

  return [
    asPublished(nadeen),
    brand("almarai-foods", "Almarai Foods", "AF", "draft", 2, 3, "docs", brandColors("#fafaf7", "#0f6b3c", "#8a8f7f")),
    asPublished({ ...brand("wadi-rum-coffee", "Wadi Rum Coffee", "WR", "shared", 6, 4, "studio", brandColors("#120b08", "#c1652b", "#8a6a52")), studioStyle: "signal" }),
    asPublished(brand("beit-rima", "Beit Rima", "بيت", "shared", 21, 4, "docs", brandColors("#fff8f5", "#9c2b2b", "#a58a7f"))),
    brand("hala-kitchens", "Hala Kitchens", "HK", "draft", 30, 2, "vault"),
    // Nadeen and Wadi Rum default to Studio (the app's new default), Almarai
    // and Beit Rima demo the Docs alternative, Hala demos Vault.
  ];
}
