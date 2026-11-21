"use client";

import Link from "next/link";
import { Button, EmptyState, Icon, MarkyosLogo } from "@/components/ui";
import { useCurrentAccount } from "@/contexts/AppContext";
import { useDocumentLang, useInterfaceLang } from "@/contexts/useInterfaceLang";
import { homePath } from "@/lib/data/access";

/**
 * Any URL nothing answers. Follows the reader's language and theme like
 * every other page, and always offers one way back: their home when signed
 * in, sign-in otherwise.
 */
export default function NotFound() {
  const { isAr, lang, settled } = useInterfaceLang();
  useDocumentLang(lang, settled);
  const account = useCurrentAccount();
  const home = account ? homePath(account) : "/login";
  return (
    <main className="flex min-h-screen flex-col items-center gap-space-11 bg-canvas px-space-6 py-space-11">
      <Link /* button-audit-ignore: the wordmark linking home, mk-tap only sizes its tap target */ href={home} aria-label="Markyos" className="mk-tap">
        <MarkyosLogo variant="wordmark" className="h-4" isAr={isAr} />
      </Link>
      <div className="flex w-full max-w-120 flex-1 flex-col justify-center">
        <h1 className="sr-only">{isAr ? "الصفحة غير موجودة" : "Page not found"}</h1>
        <EmptyState
          icon="unlink"
          title={isAr ? "الصفحة غير موجودة" : "Page not found"}
          description={isAr ? "قد يكون الرابط قديمًا أو فيه خطأ." : "The link may be old or mistyped."}
          action={
            <Button variant="primary" href={home} icon={<Icon name="arrow-left" size={18} />}>
              {account ? (isAr ? "العودة إلى Markyos" : "Back to Markyos") : isAr ? "تسجيل الدخول" : "Sign in"}
            </Button>
          }
        />
      </div>
    </main>
  );
}
