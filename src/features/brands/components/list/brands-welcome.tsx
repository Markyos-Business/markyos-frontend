"use client";

import { DashboardProvider } from "@/components/ui";
import { WelcomeMessage } from "@/features/account";
import type { BRANDS_COPY } from "../../copy";
import type { Lang } from "@/types/lang";

/** The welcome above the brands, in the same column as the list below it. */
export function BrandsWelcome({ c, lang, reviewer = false }: { c: (typeof BRANDS_COPY)["en"]; lang: Lang; reviewer?: boolean }) {
  return (
    <div className="px-space-6 pt-space-6 pb-space-5 sm:px-space-10 max-w-[1240px] w-full mx-auto">
      <DashboardProvider lang={lang}>
        {/* No buttons: Questionnaires and People are already in the nav above. */}
        <WelcomeMessage message={reviewer ? (lang === "ar" ? "هنا العلامات التي شاركها معك فريقها." : "Here are the brands their teams have shared with you.") : c.welcome} />
      </DashboardProvider>
    </div>
  );
}
