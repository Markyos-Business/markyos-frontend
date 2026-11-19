import { PageHeader } from "@/components/ui";
import { PAGE_SECTION } from "../../constants";

/**
 * The intro is onboarding, and the canvas needs the height more than a
 * returning user needs the paragraph again. It stays on the list view and
 * whenever there is no board yet, which is when it is being read.
 */
export function MoodboardIntro({ isAr, compact, hidden }: { isAr: boolean; compact: boolean; hidden: boolean }) {
  const title = isAr ? PAGE_SECTION.ar : PAGE_SECTION.en;
  const description = <MoodboardIntroText isAr={isAr} />;
  return (
    // Compact sits above an open board, whose own title is the page's h1, so
    // here it is a label rather than a second heading.
    <div className={`max-w-[860px] shrink-0 ${hidden ? "hidden" : ""}`}>
      {compact ? <div className="text-h4 font-medium text-text">{title}</div> : <PageHeader title={title} description={description} />}
    </div>
  );
}

function MoodboardIntroText({ isAr }: { isAr: boolean }) {
  return (
    <>
        {isAr ? (
          <>
            اجمع المراجع، واتفق على اتجاه، ثم اقترح ما استقرّ عليه الفريق. كل ما هنا مُعلَّم <strong className="text-text-secondary">استكشافًا</strong> — لا يصل
            إلى الدليل المنشور ولا إلى التصدير ولا إلى رابط المشاركة.
          </>
        ) : (
          <>
            Gather references, agree on a direction, and propose what the team settled on. Everything here is marked{" "}
            <strong className="text-text-secondary">exploration</strong> — it never reaches the published guideline, an export, or a share link.
          </>
        )}
    </>
  );
}
