import Link from "next/link";

/** Where everything proposed from the board goes. */
export function MoodboardFootnote({ slug, isAr, hidden }: { slug: string; isAr: boolean; hidden: boolean }) {
  const drafts = `/w/${slug}/drafts`;
  return (
    <p className={`max-w-[640px] shrink-0 text-[12px] text-text-faint ${hidden ? "hidden" : ""}`}>
      {isAr ? (
        <>
          كل اقتراح من هنا يذهب إلى{" "}
          <Link href={drafts} className="text-accent-text">
            المسودات
          </Link>{" "}
          — لا شيء يصل إلى الهوية حتى يوافق عليه شخص.
        </>
      ) : (
        <>
          Everything proposed from this page lands in{" "}
          <Link href={drafts} className="text-accent-text">
            Drafts
          </Link>{" "}
          — nothing reaches the brand until a person accepts it.
        </>
      )}
    </p>
  );
}
