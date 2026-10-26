import { Button, EmptyHint, Icon, IconButton } from "@/components/ui";
import { ChipPicker, TextArea, TextInput } from "@/components/form";
import { formatBytes, uid } from "@/lib/utils";
import type { PageBlock, SocialLink, Workspace } from "@/types";
import { FILE_ASSET_TYPES } from "../templates";
import { ImagePicker } from "./ImagePicker";
import { Segments } from "./Segments";

/** The content settings of an authored block, by kind. Design settings are the `DesignInspector`'s. */
export function BlockInspector({
  block,
  ws,
  isAr,
  onChange,
}: {
  block: PageBlock;
  ws: Workspace;
  isAr: boolean;
  onChange: (patch: Partial<PageBlock>) => void;
}) {
  const pickableFiles = ws.assets.filter((a) => FILE_ASSET_TYPES.includes(a.type));
  const ids = block.assetIds || [];
  const links = block.socialLinks || [];

  function updateLink(id: string, patch: Partial<SocialLink>) {
    onChange({ socialLinks: links.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  }

  return (
    <div className="flex flex-col gap-4">
      <span className="text-[11px] font-medium tracking-[.08em] text-text-faint uppercase">
        {isAr ? "إعدادات العنصر" : "Block settings"}
      </span>

      {(block.kind === "brandLogo" || block.kind === "brandColors" || block.kind === "brandType" || block.kind === "brandIcons") && (
        <>
          <TextInput size="sm" fill="surface-1" label={isAr ? "عنوان القسم (إنجليزي)" : "Section title (English)"} value={block.title || ""} onChange={(e) => onChange({ title: e.target.value })} />
          <TextInput size="sm" fill="surface-1" label={isAr ? "عنوان القسم (عربي)" : "Section title (Arabic)"} value={block.arTitle || ""} onChange={(e) => onChange({ arTitle: e.target.value })} dir="rtl" />
          <span className="text-[11px] text-text-faint">
            {isAr
              ? "هذا عرض حي — لا يوجد محتوى لتعديله هنا. غيّر الشعار أو الألوان أو الخطوط أو الأيقونات من صفحاتها الخاصة وسيتحدث هذا القسم تلقائيًا."
              : "This is a live view — there's no content to edit here. Change the logo, colors, typography, or icons from their own pages and this section updates automatically."}
          </span>
        </>
      )}

      {block.kind === "files" && (
        <>
          <TextInput size="sm" fill="surface-1" label={isAr ? "عنوان القسم (اختياري)" : "Section title (optional)"} value={block.title || ""} onChange={(e) => onChange({ title: e.target.value })} />
          <span className="text-[11px] text-text-faint">
            {isAr ? "اختر الملفات القابلة للتحميل" : "Pick downloadable files"}
          </span>
          {pickableFiles.length === 0 ? (
            <EmptyHint>{isAr ? "ارفع ملفات PDF أو خطوطًا أو ملفات تصدير في صفحة الأصول أولاً." : "Upload PDFs, fonts, or exports in Assets first."}</EmptyHint>
          ) : (
            <div className="flex flex-col gap-1.5">
              {pickableFiles.map((a) => {
                const active = ids.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => onChange({ assetIds: active ? ids.filter((x) => x !== a.id) : [...ids, a.id] })}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-lg bg-surface-1 px-3 py-2.5 text-start ${
                      active ? "shadow-[inset_0_0_0_2px_var(--accent)]" : "shadow-[inset_0_0_0_1px_transparent]"
                    }`}
                  >
                    <Icon name="file-alt" size={14} className="shrink-0 text-accent-text" />
                    <span className="flex-1 min-w-0 truncate text-[12px]">{a.fileName}</span>
                    <span className="shrink-0 text-[10.5px] text-text-faint">{formatBytes(a.sizeKB)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {block.kind === "text" && (
        <>
          <TextInput size="sm" fill="surface-1" label={isAr ? "العنوان (إنجليزي)" : "Title (English)"} value={block.title || ""} onChange={(e) => onChange({ title: e.target.value })} />
          <TextInput size="sm" fill="surface-1" label={isAr ? "العنوان (عربي)" : "Title (Arabic)"} value={block.arTitle || ""} onChange={(e) => onChange({ arTitle: e.target.value })} dir="rtl" />
          <TextArea label={isAr ? "النص (إنجليزي)" : "Body (English)"} value={block.text || ""} onChange={(e) => onChange({ text: e.target.value })} rows={4} />
          <TextArea label={isAr ? "النص (عربي)" : "Body (Arabic)"} value={block.arText || ""} onChange={(e) => onChange({ arText: e.target.value })} dir="rtl" rows={4} />
        </>
      )}

      {block.kind === "quote" && (
        <>
          <TextArea label={isAr ? "الاقتباس (إنجليزي)" : "Quote (English)"} value={block.text || ""} onChange={(e) => onChange({ text: e.target.value })} rows={3} />
          <TextArea label={isAr ? "الاقتباس (عربي)" : "Quote (Arabic)"} value={block.arText || ""} onChange={(e) => onChange({ arText: e.target.value })} dir="rtl" rows={3} />
          <TextInput size="sm" fill="surface-1" label={isAr ? "المصدر" : "Attribution"} value={block.attribution || ""} onChange={(e) => onChange({ attribution: e.target.value })} />
        </>
      )}

      {(block.kind === "image" || block.kind === "gallery") && (
        <>
          <TextInput size="sm" fill="surface-1" label={isAr ? "تسمية (إنجليزي)" : "Caption (English)"} value={block.title || ""} onChange={(e) => onChange({ title: e.target.value })} />
          <TextInput size="sm" fill="surface-1" label={isAr ? "تسمية (عربي)" : "Caption (Arabic)"} value={block.arTitle || ""} onChange={(e) => onChange({ arTitle: e.target.value })} dir="rtl" />
          <ImagePicker
            ws={ws}
            isAr={isAr}
            multiple={block.kind === "gallery"}
            selectedIds={ids}
            onChange={(next) => onChange({ assetIds: next })}
          />
        </>
      )}

      {block.kind === "video" && (
        <>
          <TextInput size="sm" fill="surface-1"
            label={isAr ? "رابط الفيديو" : "Video URL"}
            value={block.videoUrl || ""}
            onChange={(e) => onChange({ videoUrl: e.target.value })}
            dir="ltr"
            placeholder="https://youtube.com/watch?v=..."
          />
          <TextInput size="sm" fill="surface-1" label={isAr ? "العنوان (اختياري)" : "Heading (optional)"} value={block.title || ""} onChange={(e) => onChange({ title: e.target.value })} />
          <span className="text-[11px] text-text-faint">
            {isAr ? "يدعم روابط YouTube وVimeo." : "Supports YouTube and Vimeo links."}
          </span>
        </>
      )}

      {block.kind === "button" && (
        <>
          <TextInput size="sm" fill="surface-1" label={isAr ? "التسمية (إنجليزي)" : "Label (English)"} value={block.title || ""} onChange={(e) => onChange({ title: e.target.value })} />
          <TextInput size="sm" fill="surface-1" label={isAr ? "التسمية (عربي)" : "Label (Arabic)"} value={block.arTitle || ""} onChange={(e) => onChange({ arTitle: e.target.value })} dir="rtl" />
          <TextInput size="sm" fill="surface-1" label={isAr ? "الرابط" : "Link URL"} value={block.linkUrl || ""} onChange={(e) => onChange({ linkUrl: e.target.value })} dir="ltr" placeholder="https://" />
        </>
      )}

      {block.kind === "stat" && (
        <>
          <TextInput size="sm" fill="surface-1" label={isAr ? "الرقم (إنجليزي)" : "Value (English)"} value={block.title || ""} onChange={(e) => onChange({ title: e.target.value })} />
          <TextInput size="sm" fill="surface-1" label={isAr ? "الرقم (عربي)" : "Value (Arabic)"} value={block.arTitle || ""} onChange={(e) => onChange({ arTitle: e.target.value })} dir="rtl" />
          <TextInput size="sm" fill="surface-1" label={isAr ? "الوصف (إنجليزي)" : "Caption (English)"} value={block.text || ""} onChange={(e) => onChange({ text: e.target.value })} />
          <TextInput size="sm" fill="surface-1" label={isAr ? "الوصف (عربي)" : "Caption (Arabic)"} value={block.arText || ""} onChange={(e) => onChange({ arText: e.target.value })} dir="rtl" />
        </>
      )}

      {block.kind === "faq" && (
        <>
          <TextInput size="sm" fill="surface-1" label={isAr ? "السؤال (إنجليزي)" : "Question (English)"} value={block.title || ""} onChange={(e) => onChange({ title: e.target.value })} />
          <TextInput size="sm" fill="surface-1" label={isAr ? "السؤال (عربي)" : "Question (Arabic)"} value={block.arTitle || ""} onChange={(e) => onChange({ arTitle: e.target.value })} dir="rtl" />
          <TextArea label={isAr ? "الإجابة (إنجليزي)" : "Answer (English)"} value={block.text || ""} onChange={(e) => onChange({ text: e.target.value })} rows={3} />
          <TextArea label={isAr ? "الإجابة (عربي)" : "Answer (Arabic)"} value={block.arText || ""} onChange={(e) => onChange({ arText: e.target.value })} dir="rtl" rows={3} />
        </>
      )}

      {block.kind === "socialLinks" && (
        <>
          <div className="flex flex-col gap-2">
            {links.map((l) => (
              <div key={l.id} className="flex items-center gap-1.5">
                <TextInput
                  size="sm"
                  fill="surface-1"
                  value={l.platform}
                  onChange={(e) => updateLink(l.id, { platform: e.target.value })}
                  placeholder={isAr ? "المنصة" : "Platform"}
                  className="w-[90px] shrink-0"
                />
                <TextInput
                  size="sm"
                  fill="surface-1"
                  dir="ltr"
                  value={l.url}
                  onChange={(e) => updateLink(l.id, { url: e.target.value })}
                  placeholder="https://"
                  className="min-w-0 flex-1"
                />
                <IconButton
                  icon="times"
                  label="Remove link"
                  onClick={() => onChange({ socialLinks: links.filter((x) => x.id !== l.id) })}
                  className="shrink-0 cursor-pointer text-text-faint"
                />
              </div>
            ))}
          </div>
          <Button variant="link" onClick={() => onChange({ socialLinks: [...links, { id: uid(), platform: "", url: "" }] })} className="self-start text-[12px] font-semibold">
            {isAr ? "+ إضافة رابط" : "+ Add link"}
          </Button>
        </>
      )}

      {block.kind === "form" && (
        <>
          <TextInput size="sm" fill="surface-1" label={isAr ? "العنوان (إنجليزي)" : "Heading (English)"} value={block.title || ""} onChange={(e) => onChange({ title: e.target.value })} />
          <TextInput size="sm" fill="surface-1" label={isAr ? "العنوان (عربي)" : "Heading (Arabic)"} value={block.arTitle || ""} onChange={(e) => onChange({ arTitle: e.target.value })} dir="rtl" />
          <TextInput size="sm" fill="surface-1" label={isAr ? "الوصف (إنجليزي)" : "Description (English)"} value={block.text || ""} onChange={(e) => onChange({ text: e.target.value })} />
          <TextInput size="sm" fill="surface-1" label={isAr ? "الوصف (عربي)" : "Description (Arabic)"} value={block.arText || ""} onChange={(e) => onChange({ arText: e.target.value })} dir="rtl" />
          <TextInput size="sm" fill="surface-1"
            label={isAr ? "البريد المستقبِل" : "Receiving email"}
            value={block.linkUrl || ""}
            onChange={(e) => onChange({ linkUrl: e.target.value })}
            dir="ltr"
            placeholder="hello@studio.com"
          />
          <span className="text-[11px] text-text-faint">
            {isAr
              ? "عند الإرسال، يفتح الزائر تطبيق البريد الخاص به — لا يوجد خادم خلفي."
              : "On submit, this opens the visitor's own email client — there's no backend involved."}
          </span>
        </>
      )}

      {block.kind === "spacer" && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium text-text-faint">{isAr ? "الحجم" : "Size"}</span>
          <ChipPicker
            tone="accent"
            options={(["sm", "md", "lg"] as const).map((s) => ({ value: s, label: s.toUpperCase() }))}
            value={block.size || "md"}
            onChange={(s) => onChange({ size: s })}
          />
        </div>
      )}

      {block.kind === "embed" && (
        <>
          <span className="text-[11px] text-warning">
            {isAr
              ? "يتم عرض هذا الكود كما هو على موقع الدليل. يمكنك لصق كود تضمين حقيقي من Calendly أو Typeform أو Mailchimp أو غيرها."
              : "Rendered as-is on the guideline site. Paste a real embed snippet from Calendly, Typeform, Mailchimp, Google Forms, etc."}
          </span>
          <TextArea
            dir="ltr"
            value={block.embedHtml || ""}
            onChange={(e) => onChange({ embedHtml: e.target.value })}
            rows={12}
            placeholder="<div>Your HTML here</div>"
            className="font-mono text-[11.5px]"
          />
        </>
      )}

      {block.kind === "columns" && (
        <>
          <span className="text-[11px] font-semibold tracking-[.08em] text-text-faint uppercase">
            {isAr ? "عدد الأعمدة" : "Columns"}
          </span>
          <Segments
            options={[2, 3].map((n) => ({ value: n, label: String(n) }))}
            value={block.columnCount ?? 2}
            onChange={(n) => onChange({ columnCount: n })}
            textClass="text-[12px]"
          />
          <EmptyHint>
            {isAr
              ? "اضغط «أضف عنصرًا» داخل أي عمود على الصفحة لإضافة محتوى إليه."
              : "Use the “Add a block” slot inside a column on the page to fill it."}
          </EmptyHint>
        </>
      )}

      {block.kind === "divider" && (
        <EmptyHint>{isAr ? "فاصل بصري بسيط — لا يوجد ما يمكن إعداده." : "A plain visual break — nothing to configure."}</EmptyHint>
      )}
    </div>
  );
}
