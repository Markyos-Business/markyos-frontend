import { Icon } from "@/components/ui";
import { StudioStylePreviewCard, TemplatePreviewCard } from "@/components/features/guideline-site";
import type { GuidelineTemplate, StudioStyle, Workspace } from "@/types";
import { STUDIO_STYLE_META, STYLE_META, TEMPLATE_SETS, type Template } from "../../templates";

type TemplateTabProps = {
  ws: Workspace;
  isAr: boolean;
  onSelectStyle: (style: GuidelineTemplate) => void;
  onSelectStudioStyle: (style: StudioStyle) => void;
  onApplyTemplate: (t: Template) => void;
};

/** The client site's template, Studio's three looks, and the starter sections written for the chosen one. */
export function TemplateTab({ ws, isAr, onSelectStyle, onSelectStudioStyle, onApplyTemplate }: TemplateTabProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="px-1 text-[11.5px] text-text-faint">
        {isAr
          ? "قالب موقع الدليل الذي يراه العميل. لكل قالب نظام تصميمه الخاص، والألوان والشعار والخطوط تُقرأ من هذا المشروع في جميعها."
          : "The template the client's guideline site is built in. Each one is its own design system; colors, logo and type read from this workspace in all of them."}
      </p>

      {(Object.keys(STYLE_META) as GuidelineTemplate[]).map((kind) => (
        <TemplatePreviewCard
          key={kind}
          kind={kind}
          name={isAr ? STYLE_META[kind].arName : STYLE_META[kind].name}
          description={isAr ? STYLE_META[kind].arDescription : STYLE_META[kind].description}
          active={ws.guidelineTemplate === kind}
          ws={ws}
          onSelect={() => onSelectStyle(kind)}
        />
      ))}

      {ws.guidelineTemplate === "studio" && (
        <div className={`mt-1 flex flex-col gap-1.5 ps-3 ${isAr ? "shadow-[inset_-1px_0_0_var(--hairline)]" : "shadow-[inset_1px_0_0_var(--hairline)]"}`}>
          <p className="px-1 pb-0.5 text-[11px] text-text-faint">{isAr ? "اختر أحد أنماط Studio الثلاثة" : "Pick one of the 3 Studio looks"}</p>
          {(Object.keys(STUDIO_STYLE_META) as StudioStyle[]).map((style) => (
            <StudioStylePreviewCard
              key={style}
              style={style}
              name={isAr ? STUDIO_STYLE_META[style].arName : STUDIO_STYLE_META[style].name}
              description={isAr ? STUDIO_STYLE_META[style].arDescription : STUDIO_STYLE_META[style].description}
              active={ws.studioStyle === style}
              ws={ws}
              onSelect={() => onSelectStudioStyle(style)}
            />
          ))}
        </div>
      )}

      {/* The starter sections belong with the template: they are written for
          whichever template is selected, and choosing one is the moment you
          want them. */}
      <div className="mx-1 mt-2 h-px bg-hairline" />
      <span className="px-1 pt-1 text-[10.5px] font-semibold tracking-[0.08em] text-text-faint uppercase">{isAr ? "أقسام جاهزة" : "Starter sections"}</span>
      <p className="-mt-1.5 px-1 text-[11px] text-text-faint">
        {isAr
          ? `مكتوبة لأسلوب ${STYLE_META[ws.guidelineTemplate].arName} — وكل عنصر يُضاف يبقى قابلًا للتعديل أو الحذف.`
          : `Written for the ${STYLE_META[ws.guidelineTemplate].name} template — everything added stays editable or deletable.`}
      </p>
      {TEMPLATE_SETS[ws.guidelineTemplate].map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onApplyTemplate(t)}
          className={`mk-card flex cursor-pointer items-start gap-2.5 rounded-xl p-2.5 text-start ${
            t.featured ? "bg-accent-soft shadow-edge-primary" : "bg-surface-1 shadow-[inset_0_0_0_1px_transparent]"
          }`}
        >
          <Icon name={t.icon} size={16} className="mt-0.5 shrink-0 text-accent-text" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[12.5px] font-medium">{isAr ? t.arLabel : t.label}</span>
              {t.featured && (
                // Solid rather than accent: at 9px, accent-ink on accent (6.6:1)
                // is under the bar; `--solid` is the opposite of the ground.
                <span className="shrink-0 rounded-full bg-solid px-1.5 py-[2px] text-[9px] font-semibold text-solid-ink">{isAr ? "صفحة كاملة" : "FULL PAGE"}</span>
              )}
            </div>
            {/* A step up from faint on the featured card: the accent tint lifts
                its ground, and faint is solved against plain surfaces. */}
            <div className={`mt-0.5 text-[11px] ${t.featured ? "text-text-muted" : "text-text-faint"}`}>{isAr ? t.arHint : t.hint}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
