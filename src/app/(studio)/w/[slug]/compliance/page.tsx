"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { TopBar } from "@/components/layout";
import { AssetColorContent, CopyLinterContent } from "@/components/features/compliance";

type Tab = "colors" | "copy";

export default function CompliancePage() {
  const params = useParams<{ slug: string }>();
  const { getWorkspace } = useApp();
  const ws = getWorkspace(params.slug);
  const [tab, setTab] = useState<Tab>("colors");

  if (!ws) return null;

  return (
    <>
      <TopBar
        workspace={ws}
        section="Compliance"
        arSection="المطابقة"
        tabs={[
          { key: "colors", label: "Asset colors", arLabel: "ألوان الأصول", active: tab === "colors", onSelect: () => setTab("colors") },
          { key: "copy", label: "Copy linter", arLabel: "مدقّق النصوص", active: tab === "copy", onSelect: () => setTab("copy") },
        ]}
      />
      {tab === "colors" ? <AssetColorContent ws={ws} /> : <CopyLinterContent ws={ws} />}
    </>
  );
}
