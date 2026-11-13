"use client";

import { createContext, useContext, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useApp } from "@/contexts/AppContext";
import { Icon, useToast } from "@/components/ui";
import { API_ENABLED } from "@/lib/api/client";
import { submitPublicSignOff } from "@/lib/api/public";
import { formatRelative } from "@/lib/utils";
import type { PinSection, SignOffPin, Workspace } from "@/types";
import { gCard, gInset } from "../shared/surface";

const SubmissionEnabled = createContext(false);

/** Only the published client surface accepts notes; editor previews do not. */
export function SignOffSurface({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  return <SubmissionEnabled.Provider value={enabled}>{children}</SubmissionEnabled.Provider>;
}

const SECTION: Record<PinSection, [string, string]> = {
  overview: ["Overview", "نظرة عامة"], logo: ["Logo", "الشعار"],
  color: ["Colour", "الألوان"], typography: ["Typography", "الخطوط"],
};

export function SignOffPanel({ ws, section, isAr }: { ws: Workspace; section: PinSection; isAr: boolean }) {
  const enabled = useContext(SubmissionEnabled);
  const { addSignOffPin } = useApp();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{ brandId: string; pins: SignOffPin[] } | null>(null);
  const inFlight = useRef(false);
  const attempt = useRef<{ key: string; id: string } | null>(null);
  const original = ws.signOffPins.filter((p) => p.section === section);
  const localPins = submitted?.brandId === ws.id ? submitted.pins : [];
  const pins = [...original, ...localPins.filter((pin) => !original.some((p) => p.id === pin.id))]
    .sort((a, b) => b.createdAt - a.createdAt);
  const sectionName = SECTION[section][isAr ? 1 : 0];

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!enabled || inFlight.current || !name.trim() || !note.trim()) return;
    inFlight.current = true;
    setSaving(true);
    setError(null);
    try {
      const key = JSON.stringify([ws.id, section, name.trim(), note.trim()]);
      if (attempt.current?.key !== key) attempt.current = { key, id: crypto.randomUUID() };
      const pin = API_ENABLED
        ? await submitPublicSignOff(ws.slug, { submissionId: attempt.current.id, section, authorName: name.trim(), note: note.trim() })
        : addSignOffPin(ws.id, section, name.trim(), note.trim());
      setSubmitted((previous) => ({ brandId: ws.id, pins: [pin, ...(previous?.brandId === ws.id ? previous.pins : []).filter((p) => p.id !== pin.id)] }));
      attempt.current = null;
      setNote("");
      showToast(API_ENABLED
        ? (isAr ? "تم إرسال الملاحظة إلى الاستوديو." : "Note sent to the studio.")
        : (isAr ? "حُفظت الملاحظة في هذا المتصفح فقط." : "Note saved in this browser only."), "success");
    } catch {
      setError(isAr ? "تعذّر إرسال الملاحظة. احتفظنا بالنص؛ حاول مجددًا، أو أعد فتح الدليل إذا تغيّرت كلمة المرور." : "Your note could not be sent. Your text is kept; try again, or reopen the guideline if its password changed.");
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="p-4 flex flex-col gap-3" role="group" aria-label={isAr ? `اعتماد ${sectionName}` : `Sign off ${sectionName}`} style={gCard}>
      <div className="flex items-center gap-2">
        <Icon name="map-marker" size={14} style={{ color: "var(--g-accent)" }} />
        <span className="text-[12px] font-semibold" style={{ color: "var(--g-text-muted)" }}>{isAr ? `اعتماد ${sectionName}` : `Sign off ${sectionName}`}</span>
        {pins.length > 0 && <span className="text-[12px]" style={{ color: "var(--g-text-faint)" }}>{isAr ? `${pins.length} ملاحظة` : `${pins.length} note${pins.length === 1 ? "" : "s"}`}</span>}
      </div>
      {pins.length > 0 && <div className="flex flex-col gap-2.5">{pins.map((pin) => (
        <div key={pin.id} className="flex items-start gap-2.5 text-[12px]">
          <Icon name={pin.resolved ? "check-circle" : "map-marker"} size={13} style={{ color: pin.resolved ? "var(--success)" : "var(--warning)", marginTop: 3, flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <span dir="auto" className="font-medium bidi-auto">{pin.authorName}</span>{" "}
            <span style={{ color: "var(--g-text-faint)" }}>· {formatRelative(pin.createdAt, undefined, isAr ? "ar" : "en")}</span>
            <div dir="auto" className="bidi-auto" style={{ color: "var(--g-text-muted)" }}>{pin.note}</div>
          </div>
        </div>
      ))}</div>}
      {enabled ? <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-2" aria-busy={saving}>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} disabled={saving}
            aria-label={isAr ? `اسمك — اعتماد ${sectionName}` : `Your name — signing off ${sectionName}`} placeholder={isAr ? "اسمك" : "Your name"}
            className="h-9 px-3 outline-none text-[12px] w-[150px] shrink-0" style={{ ...gInset, color: "var(--g-text)" }} />
          <input value={note} onChange={(e) => setNote(e.target.value)} required maxLength={2000} disabled={saving}
            aria-label={isAr ? `ملاحظة اعتماد ${sectionName}` : `Note on ${sectionName}`} placeholder={isAr ? "يبدو جيدًا — معتمد" : "Looks good — approved"}
            className="h-9 px-3 outline-none text-[12px] flex-1 min-w-0" style={{ ...gInset, color: "var(--g-text)" }} />
          <button type="submit" disabled={saving} aria-label={isAr ? `اعتماد ${sectionName}` : `Sign off ${sectionName}`}
            className="h-9 px-4 text-[12px] font-semibold cursor-pointer shrink-0" style={{ ...gInset, background: "var(--g-accent)", color: "var(--g-accent-ink)" }}>
            {saving ? (isAr ? "جارٍ الإرسال…" : "Sending…") : (isAr ? "اعتماد" : "Sign off")}
          </button>
        </div>
        {error && <p role="alert" className="text-[12px]" style={{ color: "var(--g-text)" }}>{error}</p>}
      </form> : <p className="text-[12px]" style={{ color: "var(--g-text-muted)" }}>{isAr ? "يمكن إرسال الملاحظات من رابط الدليل المنشور." : "Notes can be submitted from the published guideline link."}</p>}
    </div>
  );
}
