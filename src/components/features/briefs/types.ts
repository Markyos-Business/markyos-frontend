// The brief analysis report: 10 sections in a fixed order, each with its own
// shape. These mirror the backend's section schemas (apps/briefs/schemas.py).

export type SectionKey =
  | "snapshot"
  | "goals"
  | "audience"
  | "market"
  | "personality"
  | "tensions"
  | "gaps"
  | "routes"
  | "creative"
  | "constraints";

export type Level = "high" | "medium" | "low";

/** Where a claim came from. `sourceId` is the material's id: F1.Q12, C2.T4, C1.P3. */
export type Citation = { source: "form" | "call"; sourceId: string; quote: string };

/** Every claim is either cited, or inferred with a confidence. */
export type Evidence = { citations: Citation[]; basis: "cited" | "inferred"; confidence: Level };

type Item = { id?: string };

export type Fact = Item & Evidence & { label: string; value: string };
export type Goal = Item & Evidence & { text: string; priority: Level };
export type Segment = Item & Evidence & { name: string; description: string };
export type Persona = Item &
  Evidence & {
    name: string;
    ageRange: string;
    city: string;
    job: string;
    needs: string[];
    frustrations: string[];
    quote: string | null;
    howTheyChoose: string;
  };
export type Competitor = Item &
  Evidence & { name: string; positioning: string; strengths: string; gaps: string; mentionedBy: "client" | "asked" };
export type WhiteSpace = Item & Evidence & { text: string };
export type Trait = Item & Evidence & { trait: string; evidence: string };
export type Slider = Item & Evidence & { left: string; right: string; value: number; evidence: string };
export type Statement = { text: string; citations: Citation[] };
export type Tension = Item & { statementA: Statement; statementB: Statement; whyItMatters: string; question: string; severity: Level };
export type Gap = Item & {
  question: string;
  whyItMatters: string;
  blocks: Exclude<SectionKey, "tensions" | "gaps">;
  channel: "form" | "call";
};
export type Route = Item &
  Evidence & {
    name: string;
    idea: string;
    positioning: string;
    leansOn: { goals: string[]; audience: string[]; tensions: string[] };
    pros: string[];
    risks: string[];
    fit: number;
  };
export type CreativeRoute = Item & { routeName: string; themes: string[]; visualCues: string[]; verbalCues: string[]; references: string[] };
export type ConstraintCategory = "legal" | "cultural" | "religious" | "regional" | "budget" | "timing" | "technical" | "script";
export type Constraint = Item & Evidence & { category: ConstraintCategory; text: string; severity: Level; mitigation: string };

export type SectionContent = {
  snapshot: { client: string; offer: string; market: string; projectType: string; scope: string[]; facts: Fact[] };
  goals: { business: Goal[]; brand: Goal[] };
  audience: { segments: Segment[]; personas: Persona[] };
  market: { context: string; competitors: Competitor[]; whiteSpace: WhiteSpace[] };
  personality: { traits: Trait[]; sliders: Slider[]; wordsToUse: string[]; wordsToAvoid: string[] };
  tensions: { items: Tension[] };
  gaps: { items: Gap[] };
  routes: { items: Route[] };
  creative: { routes: CreativeRoute[] };
  constraints: { items: Constraint[] };
};

export type SectionStatus = "pending" | "ready" | "failed" | "regenerating";

export type Section<K extends SectionKey = SectionKey> = {
  key: K;
  order: number;
  status: SectionStatus;
  error: string;
  content: SectionContent[K] | Record<string, never>;
  editedContent: SectionContent[K] | null;
  editedByUser: boolean;
  /** The studio's edit when there is one, otherwise the AI's version. */
  current: SectionContent[K] | Record<string, never> | null;
  addedToStrategyAt: string | null;
  strategyDraftId: string | null;
  strategyItems: Record<string, { draftId: string; at: string }>;
  updatedAt: string;
};

/** What a cited source is, without its text: enough to open it. */
export type SourceRef =
  | { label: string; ref: { type: "form"; formId: string; formName: string; questionId: string; number: number } }
  | { label: string; ref: { type: "call"; noteId: string; title: string; turn?: number; para?: number; speaker?: string; role?: string } };

export type StageKey = "extraction" | "tensions_gaps" | "routes_creative" | "constraints" | "snapshot";
export type Stage = { key: StageKey; status: "waiting" | "running" | "done" | "failed"; detail: string };

export type AnalysisStatus = "queued" | "running" | "ready" | "failed";

export type AnalysisSummary = {
  id: string;
  workspaceId: string;
  workspaceSlug: string;
  version: number;
  status: AnalysisStatus;
  stale: boolean;
  language: "en" | "ar";
  progress: Stage[];
  sourceCounts: { answers?: number; calls?: number; words?: number };
  truncation: { noteId: string; title: string; wordsSent: number; wordsTotal: number }[];
  model: string;
  promptVersion: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: string;
  creditsCharged: number;
  isFreeRun: boolean;
  createdBy: string;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  error: string;
};

export type BriefAnalysis = AnalysisSummary & { sections: Section[]; sourceIndex: Record<string, SourceRef> };

export type Quote = { free: boolean; credits: number; balance: number | null; allowed: boolean };

export type SourceWarning = "no_submitted_form" | "form_not_submitted" | "no_call_notes" | "few_answers";

export type Overview = {
  brand: { id: string; slug: string; name: string };
  canEdit: boolean;
  configured: boolean;
  sources: { answers: number; calls: number; words: number; warnings: SourceWarning[]; digest: string };
  quote: Quote;
  versions: AnalysisSummary[];
  now: string;
};

export type Comparison = {
  from: number;
  to: number;
  sections: { key: SectionKey; status: "same" | "changed"; changes: Record<string, unknown> }[];
};
