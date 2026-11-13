"use client";

import Link from "next/link";
import type { BoardState } from "../hooks/use-board-page";
import { BoardColumn } from "./board-column";
import { useInterfaceLang } from "@/contexts/useInterfaceLang";
import { Stagger } from "@/components/ui";

/** The intro, and the six stage columns (or the way to make a first brand). */
export function BoardView({ board }: { board: BoardState }) {
  const { columns, empty, ...handlers } = board;
  const { isAr } = useInterfaceLang();
  const t = (en: string, ar: string) => (isAr ? ar : en);
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 px-5 py-7 sm:px-10">
      <div className="max-w-[720px]">
        <h1 className="mb-1.5 font-display text-[28px] font-semibold tracking-tight">{t("Studio board", "لوحة الاستوديو")}</h1>
        <p className="text-[14px] text-text-muted">
          {t(
            "Every brand you own, by where it has got to. Drag a card, or use the arrows — this is a lifecycle board, not a CRM, so nothing here tracks a deal.",
            "كل علامة تملكها، حسب المرحلة التي وصلت إليها. اسحب البطاقة أو استخدم الأسهم. هذه لوحة لدورة حياة العلامة وليست نظام إدارة عملاء، فلا تتبّع صفقات هنا."
          )}
        </p>
      </div>

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
          <Stagger className="flex min-w-max items-start gap-3.5 pb-4">
            {columns.map((column) => (
              <BoardColumn key={column.stage.key} {...column} {...handlers} />
            ))}
          </Stagger>
        </div>
      )}
    </div>
  );
}
