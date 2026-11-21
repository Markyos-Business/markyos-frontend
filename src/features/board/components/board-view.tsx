"use client";

import Link from "next/link";
import type { BoardState } from "../hooks/use-board-page";
import { BoardColumn } from "./board-column";
import { useInterfaceLang } from "@/contexts/useInterfaceLang";
import { Stagger, PageHeader } from "@/components/ui";

/** The intro, and the six stage columns (or the way to make a first brand). */
export function BoardView({ board }: { board: BoardState }) {
  const { columns, empty, ...handlers } = board;
  const { isAr } = useInterfaceLang();
  const t = (en: string, ar: string) => (isAr ? ar : en);
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 px-5 py-7 sm:px-10">
      <PageHeader title={t("Brand board", "لوحة العلامات")} description={t(
            "Every brand you own, by stage. Drag a card or use its arrows to move it.",
            "كل علامة تملكها حسب مرحلتها. اسحب البطاقة أو استخدم أسهمها لنقلها."
          )} />

      {empty ? (
        <p className="text-[13.5px] text-text-faint">
          {t("No brands yet.", "لا توجد علامات بعد.")}{" "}
          <Link href="/brands/new" className="text-accent-text">
            {t("Start one", "ابدأ واحدة")}
          </Link>
          .
        </p>
      ) : (
        // Horizontal scroll is correct for a board: six columns can't be made
        // legible at 390px by stacking them.
        <div className="min-h-0 flex-1 overflow-x-auto">
          {/* From 1280px the six columns share the width, so the last stage
              isn't cut off at the edge; narrower, the board scrolls. */}
          <Stagger className="flex min-w-max items-start gap-3.5 pb-4 xl:min-w-0">
            {columns.map((column) => (
              <BoardColumn key={column.stage.key} {...column} {...handlers} />
            ))}
          </Stagger>
        </div>
      )}
    </div>
  );
}
