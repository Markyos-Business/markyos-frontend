"use client";

import { DashboardProvider } from "@/components/ui";
import { WelcomeMessage } from "@/features/account";
import type { BRANDS_COPY } from "../../copy";
import type { Lang } from "@/types/lang";

/** The welcome above the brands, in the same column as the list below it. */
export function BrandsWelcome({ c, lang }: { c: (typeof BRANDS_COPY)["en"]; lang: Lang }) {
  return (
    <div className="px-space-6 pt-space-6 pb-space-5 sm:px-space-10 max-w-[1240px] w-full mx-auto">
      <DashboardProvider lang={lang}>
        <WelcomeMessage
          message={c.welcome}
          actions={[
            { label: c.welcomeForms, href: "/forms" },
            { label: c.welcomePeople, href: "/people" },
          ]}
        />
      </DashboardProvider>
    </div>
  );
}
