import { Asset, DepartmentView, GuidePage, Lang, PageBlock, SlotKind, Workspace } from "@/core/data/types";
import { BrandTheme } from "@/features/guideline-site/model/theme";
import type { FlowItem } from "@/features/guideline-site/hooks/useGuidelineViewer";

export type { FlowItem };

export interface TocSection {
  id: string;
  label: string;
  arLabel: string;
}

/** Everything a guideline-site template needs — computed once in the page
 *  dispatcher (gating, scroll-spy, section list) and handed to whichever
 *  template is selected, so that logic never has to be duplicated per
 *  template. */
export interface TemplateProps {
  ws: Workspace;
  isAr: boolean;
  theme: BrandTheme;
  sections: TocSection[];
  activeId: string;
  scrollTo: (id: string) => void;
  sectionIndex: (id: string) => number;
  /** True when a fixed section has data to show and hasn't been hidden. */
  showSection: (id: string) => boolean;
  /** This section's heading — the studio's rename if there is one, else the
   *  template's own wording, which it passes in as the fallback. */
  sectionTitle: (id: string, fallback: string) => string;
  /** The studio's own copy under this section's heading, or "" if none. */
  sectionNote: (id: string) => string;
  /**
   * The page's sections in the order they render — derived and authored ones
   * in one list. Templates walk this instead of hard-coding the sequence,
   * which is what lets a studio rearrange the page.
   */
  flow: FlowItem[];
  /** The statement band's text — the studio's override, else the mission. */
  statementText: string;
  attachedSlots: SlotKind[];
  photoAssets: Asset[];
  iconAssets: Asset[];
  /** Applied mockups — the brand on real surfaces. */
  mockupAssets: Asset[];
  /** Department instruction pages the studio chose to publish to this site. */
  publishedDepartments: DepartmentView[];
  customBlocks: PageBlock[];
  downloadOpen: boolean;
  setDownloadOpen: (v: boolean) => void;
  previewLang: Lang;
  setPreviewLang: (l: Lang) => void;
  showMarkyosBadge: boolean;
  /** Every custom page beyond Home, for cross-page nav links. */
  pages: GuidePage[];
  /** Set when viewing one of `pages` instead of Home — the template renders
   *  only that page's own blocks and skips the fixed Home sections. */
  activePage?: GuidePage;
}
