"use client";

import { useEffect } from "react";
import { Button, ErrorState, useUiStrings } from "@/components/ui";

/**
 * A page that crashed, in the person's own language.
 *
 * Without this file Next showed its built-in page: English only ("This page
 * couldn't load", "Reload", "Back") on an Arabic account, and no way back into
 * the app. It renders inside the root layout, so the interface language is
 * already known. Retry re-renders the segment; Back goes to the brands list.
 */
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { t, isAr } = useUiStrings();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main dir={isAr ? "rtl" : "ltr"} className="flex min-h-screen flex-col items-center justify-center px-space-6">
      <ErrorState title={t.pageErrorTitle} message={t.pageErrorBody} onRetry={retry} />
      <Button href="/brands" variant="ghost" size="sm">
        {t.backToBrands}
      </Button>
    </main>
  );
}
