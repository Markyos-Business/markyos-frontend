"use client";

import { createContext, FormEvent, useContext, useMemo, useState, ReactNode } from "react";
import { Icon } from "@/components/ui";
import { BrandMark } from "@/components/ui/media/BrandMark/BrandMark";
import { ColorGrid, IconGrid, LogoGrid, TypeSpecimen } from "@/components/features/guideline-site/components/Content";
import { BlockShell, EditableText, useLiveEdit } from "@/components/features/guideline-site/components/LiveEdit";
import { formatBytes } from "@/lib/utils";
import { getBrandTheme } from "@/components/features/guideline-site/model/theme";
import { Asset, PageBlock, SlotKind, Workspace } from "@/types";

const SPACER_HEIGHT: Record<string, number> = { sm: 24, md: 56, lg: 112 };

/** YouTube/Vimeo watch links resolved to an embeddable iframe src — a real,
 *  working embed, not a placeholder. Unrecognized URLs fall back to null so
 *  the block shows its "add a link" empty state instead of a broken iframe. */
function videoEmbedSrc(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v") || u.pathname.split("/embed/")[1];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Every block on the current page or custom page, including the ones nested
 * inside layout containers. The block list stays flat, so a container resolves
 * its own children from here rather than owning them — which is what lets the
 * existing add/update/remove/reorder actions treat a nested block exactly like
 * a top-level one.
 */
const BlockScopeContext = createContext<PageBlock[]>([]);

export function BlockScopeProvider({ blocks, children }: { blocks: PageBlock[]; children: ReactNode }) {
  return <BlockScopeContext.Provider value={blocks}>{children}</BlockScopeContext.Provider>;
}

/** Direct children of a container, grouped by column and in render order. */
export function columnChildren(all: PageBlock[], parentId: string, columnIndex: number): PageBlock[] {
  return all
    .filter((b) => b.parentId === parentId && (b.columnIndex ?? 0) === columnIndex)
    .sort((a, b) => a.order - b.order);
}

export function resolveBlockAssets(ws: Workspace, ids: string[] | undefined): Asset[] {
  if (!ids || ids.length === 0) return [];
  return ids
    .map((id) => ws.assets.find((a) => a.id === id))
    .filter((a): a is Asset => !!a);
}

/**
 * A non-photo .svg (a logo mark, icon, or vector export) is drawn as a black
 * shape on a transparent background for print — the same assumption the
 * Logo and Icons sections already make when they invert these for the dark
 * canvas. Cropping one with object-fit:cover like a photograph chops the
 * mark; it needs to be shown whole, centered, and inverted instead.
 */
export function isVectorMark(asset: Asset): boolean {
  if (asset.type === "photo") return false;
  // Seed/mock assets are plain file paths ending in .svg; uploaded assets
  // are data: URLs (so a filename check alone would miss them) and carry
  // their MIME type right in the URL instead.
  return asset.fileName.toLowerCase().endsWith(".svg") || asset.url.toLowerCase().includes("image/svg+xml");
}

function AssetThumb({ asset, alt, onDark }: { asset: Asset; alt: string; onDark: boolean }) {
  const vector = isVectorMark(asset);
  return (
    <BrandMark
      src={asset.url}
      alt={alt}
      onDark={onDark}
      fallbackIcon="image"
      fallbackSize={22}
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        objectFit: vector ? "contain" : "cover",
        padding: vector ? "18%" : 0,
      }}
    />
  );
}

/**
 * Renders a single custom block. Shared by the builder canvas (so what the
 * studio arranges is what the client sees) and the client-facing guideline
 * page itself.
 */
export function BlockRenderer(props: { block: PageBlock; ws: Workspace; isAr: boolean }) {
  /*
   * A block that carries its own background needs the same accent treatment a
   * section does. It reads the brand's accent from the workspace rather than
   * from the section it happens to sit in — good enough, because a block
   * nested inside an already-re-grounded section inherits that section's
   * tuned accent through CSS and only overrides it when it has a background
   * of its own, which is the case this covers.
   */
  const accent = props.block.style?.background ? getBrandTheme(props.ws).accent : undefined;
  return (
    <BlockShell blockId={props.block.id} style={props.block.style} accent={accent}>
      <BlockBody {...props} />
    </BlockShell>
  );
}

function BlockBody({ block, ws, isAr }: { block: PageBlock; ws: Workspace; isAr: boolean }) {
  const { enabled, update, addInColumn } = useLiveEdit();
  // Blocks are drawn on the brand's ground, not the app's, so whether a
  // single-tone mark needs reversing is a question about the workspace's own
  // palette.
  const onDark = !useMemo(() => getBrandTheme(ws).isLight, [ws]);
  const scope = useContext(BlockScopeContext);
  const title = (isAr && block.arTitle) || block.title;
  const body = (isAr && block.arText) || block.text;
  // In Arabic the editor writes the Arabic field, so a studio translating a
  // block never overwrites the Latin copy it was working from.
  const commitTitle = (next: string) => update(block.id, isAr ? { arTitle: next } : { title: next });
  const commitBody = (next: string) => update(block.id, isAr ? { arText: next } : { text: next });

  if (block.kind === "columns") {
    const count = Math.min(Math.max(block.columnCount ?? 2, 2), 3);
    return (
      <div
        className="grid gap-6 items-start"
        style={{
          gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
          // Selection chrome, not content: without an inset the children cover
          // the container edge to edge, leaving nowhere to click to select the
          // container itself. The published page renders with no padding.
          padding: enabled ? 10 : undefined,
        }}
      >
        {Array.from({ length: count }, (_, col) => {
          const children = columnChildren(scope, block.id, col);
          return (
            <div key={col} className="flex flex-col gap-5 min-w-0">
              {children.map((child) => (
                <BlockRenderer key={child.id} block={child} ws={ws} isAr={isAr} />
              ))}
              {enabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    addInColumn(block.id, col);
                  }}
                  className="h-16 rounded-lg text-[12px] font-medium cursor-pointer"
                  style={{
                    border: "1px dashed var(--g-hairline-strong, rgba(255,255,255,.22))",
                    color: "var(--g-text-faint, var(--text-faint))",
                  }}
                >
                  {children.length === 0
                    ? isAr
                      ? "+ أضف عنصرًا"
                      : "+ Add a block"
                    : isAr
                      ? "+ أضف"
                      : "+ Add"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (block.kind === "text") {
    return (
      <div className="flex flex-col gap-3">
        {(title || enabled) && (
          <EditableText
            as="h3"
            value={title || ""}
            onCommit={commitTitle}
            placeholder={isAr ? "أضف عنوانًا" : "Add a heading"}
            className="text-[20px] font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          />
        )}
        {(body || enabled) && (
          <EditableText
            as="p"
            multiline
            value={body || ""}
            onCommit={commitBody}
            placeholder={isAr ? "اكتب النص هنا" : "Write the body text"}
            className="text-[15px] leading-[1.7]"
            style={{ color: "var(--text-secondary)" }}
          />
        )}
        {!title && !body && !enabled && (
          <span className="text-[12px]" style={{ color: "var(--text-faint)" }}>
            {isAr ? "لم تتم إضافة محتوى بعد." : "No content added yet."}
          </span>
        )}
      </div>
    );
  }

  if (block.kind === "quote") {
    return (
      <blockquote
        className="rounded-2xl px-6 py-5 flex flex-col gap-2.5"
        style={{ background: "var(--surface-1)", boxShadow: "inset 2px 0 0 var(--accent)" }}
      >
        {enabled ? (
          <EditableText
            as="p"
            multiline
            value={body || ""}
            onCommit={commitBody}
            placeholder={isAr ? "اكتب الاقتباس" : "Write the quote"}
            className="text-[17px] leading-[1.6]"
            style={{ color: "var(--text)" }}
          />
        ) : (
          <p className="text-[17px] leading-[1.6]" style={{ color: "var(--text)" }}>
            {body || (isAr ? "لم تتم إضافة اقتباس بعد." : "No quote added yet.")}
          </p>
        )}
        {block.attribution && (
          <span className="text-[12px] font-medium" style={{ color: "var(--text-faint)" }}>
            — {block.attribution}
          </span>
        )}
      </blockquote>
    );
  }

  if (block.kind === "image") {
    const asset = resolveBlockAssets(ws, block.assetIds)[0];
    return (
      <div className="flex flex-col gap-2.5">
        {asset ? (
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface-1)", height: 320 }}>
            <AssetThumb asset={asset} alt={title || asset.fileName} onDark={onDark} />
          </div>
        ) : (
          <div
            className="rounded-2xl h-[160px] grid place-items-center gap-1.5 text-[12px]"
            style={{ background: "var(--surface-1)", color: "var(--text-faint)" }}
          >
            <Icon name="image" size={20} />
            {enabled
              ? isAr
                ? "اضغط هنا ثم اختر صورة من اللوحة على اليسار — رفع، صور مجانية، أو رابط."
                : "Click here, then add an image from the panel — upload, stock, or a link."
              : isAr
                ? "لم يتم اختيار صورة."
                : "No image selected."}
          </div>
        )}
        {(title || enabled) && (
          <EditableText
            value={title || ""}
            onCommit={commitTitle}
            placeholder={isAr ? "أضف تسمية" : "Add a caption"}
            className="text-[12px]"
            style={{ color: "var(--text-faint)" }}
          />
        )}
        {asset && <AssetCreditLine asset={asset} />}
      </div>
    );
  }

  if (block.kind === "gallery") {
    const assets = resolveBlockAssets(ws, block.assetIds);
    return (
      <div className="flex flex-col gap-2.5">
        {(title || enabled) && (
          <EditableText
            value={title || ""}
            onCommit={commitTitle}
            placeholder={isAr ? "أضف تسمية" : "Add a caption"}
            className="text-[12px]"
            style={{ color: "var(--text-faint)" }}
          />
        )}
        {assets.length === 0 ? (
          <div
            className="rounded-2xl h-[120px] grid place-items-center gap-1.5 text-[12px]"
            style={{ background: "var(--surface-1)", color: "var(--text-faint)" }}
          >
            <Icon name="image" size={20} />
            {enabled
              ? isAr
                ? "اضغط هنا ثم أضف صورًا من اللوحة على اليسار."
                : "Click here, then add images from the panel."
              : isAr
                ? "لم يتم اختيار صور."
                : "No images selected."}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              {assets.map((a) => (
                <div key={a.id} className="rounded-xl overflow-hidden h-[130px]" style={{ background: "var(--surface-1)" }}>
                  <AssetThumb asset={a} alt={a.fileName} onDark={onDark} />
                </div>
              ))}
            </div>
            {assets.some((a) => a.credit) && (
              <div className="flex flex-col gap-0.5">
                {assets.filter((a) => a.credit).map((a) => (
                  <AssetCreditLine key={a.id} asset={a} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  if (block.kind === "embed") {
    return block.embedHtml ? (
      <div dir="ltr" dangerouslySetInnerHTML={{ __html: block.embedHtml }} />
    ) : (
      <div className="rounded-2xl h-[100px] grid place-items-center text-[12px]" style={{ background: "var(--surface-1)", color: "var(--text-faint)" }}>
        {isAr ? "لم تتم إضافة كود HTML بعد." : "No HTML added yet."}
      </div>
    );
  }

  if (block.kind === "spacer") {
    return <div style={{ height: SPACER_HEIGHT[block.size || "md"] }} />;
  }

  if (block.kind === "video") {
    const src = videoEmbedSrc(block.videoUrl);
    return (
      <div className="flex flex-col gap-2.5">
        {(title || enabled) && (
          <EditableText
            as="h3"
            value={title || ""}
            onCommit={commitTitle}
            placeholder={isAr ? "أضف عنوانًا" : "Add a heading"}
            className="text-[20px] font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          />
        )}
        {src ? (
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface-1)", aspectRatio: "16/9" }}>
            <iframe src={src} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen style={{ width: "100%", height: "100%", border: 0 }} />
          </div>
        ) : (
          <div className="rounded-2xl h-[160px] grid place-items-center text-[12px]" style={{ background: "var(--surface-1)", color: "var(--text-faint)" }}>
            {isAr ? "لم يتم إضافة رابط فيديو (YouTube أو Vimeo)." : "No video link added yet (YouTube or Vimeo)."}
          </div>
        )}
      </div>
    );
  }

  if (block.kind === "button") {
    const label = title || (isAr ? "زر بلا تسمية" : "Untitled button");
    return block.linkUrl ? (
      <a
        href={block.linkUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 h-11 px-6 rounded-full text-[13px] font-semibold w-fit"
        style={{ background: "var(--accent)", color: "#fff" }}
      >
        {label}
      </a>
    ) : (
      <span
        className="inline-flex items-center gap-2 h-11 px-6 rounded-full text-[13px] font-semibold w-fit"
        style={{ background: "var(--surface-1)", color: "var(--text-faint)" }}
      >
        {label} — {isAr ? "أضف رابطًا" : "add a link"}
      </span>
    );
  }

  if (block.kind === "stat") {
    return (
      <div className="rounded-2xl p-6 flex flex-col gap-1.5" style={{ background: "var(--surface-1)" }}>
        {enabled ? (
          <EditableText
            value={title || ""}
            onCommit={commitTitle}
            placeholder="100%"
            className="text-[40px] font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--accent-text)" }}
          />
        ) : (
          <span className="text-[40px] font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--accent-text)" }}>
            {title || "—"}
          </span>
        )}
        {(body || enabled) && (
          <EditableText
            value={body || ""}
            onCommit={commitBody}
            placeholder={isAr ? "وصف الرقم" : "What it measures"}
            className="text-[13px]"
            style={{ color: "var(--text-secondary)" }}
          />
        )}
      </div>
    );
  }

  if (block.kind === "faq") {
    return (
      <details className="rounded-2xl px-5 py-4 group" style={{ background: "var(--surface-1)" }}>
        <summary className="text-[14px] font-medium cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center justify-between gap-3">
          {title || (isAr ? "سؤال بلا نص" : "Untitled question")}
          <Icon name="angle-down" size={14} style={{ color: "var(--text-faint)", flexShrink: 0 }} />
        </summary>
        {(body || enabled) && (
          <EditableText
            as="p"
            multiline
            value={body || ""}
            onCommit={commitBody}
            placeholder={isAr ? "اكتب الإجابة" : "Write the answer"}
            className="text-[13px] mt-2.5 leading-[1.6]"
            style={{ color: "var(--text-secondary)" }}
          />
        )}
      </details>
    );
  }

  if (block.kind === "socialLinks") {
    const links = (block.socialLinks || []).filter((l) => l.platform);
    return links.length === 0 ? (
      <div className="rounded-2xl h-[64px] grid place-items-center text-[12px]" style={{ background: "var(--surface-1)", color: "var(--text-faint)" }}>
        {isAr ? "لم تتم إضافة روابط بعد." : "No links added yet."}
      </div>
    ) : (
      <div className="flex items-center gap-2.5 flex-wrap">
        {links.map((l) =>
          l.url ? (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 h-9 px-3.5 rounded-full text-[12.5px] font-medium"
              style={{ background: "var(--surface-1)", color: "var(--text)" }}
            >
              <Icon name="globe" size={13} style={{ color: "var(--accent-text)" }} />
              {l.platform}
            </a>
          ) : (
            <span
              key={l.id}
              className="flex items-center gap-2 h-9 px-3.5 rounded-full text-[12.5px] font-medium"
              style={{ background: "var(--surface-1)", color: "var(--text-faint)" }}
            >
              <Icon name="globe" size={13} />
              {l.platform}
            </span>
          )
        )}
      </div>
    );
  }

  if (block.kind === "form") {
    return <ContactFormBlock title={title} body={body} mailto={block.linkUrl} isAr={isAr} />;
  }

  if (block.kind === "brandLogo") {
    const attachedSlots = (Object.keys(ws.logo) as SlotKind[]).filter((k) => ws.logo[k].phase === "attached");
    return attachedSlots.length === 0 ? (
      <EmptyBlockState text={isAr ? "لم يتم رفع شعار بعد — أضفه من صفحة الشعار." : "No logo uploaded yet — add one from the Logo page."} />
    ) : (
      <LogoGrid ws={ws} attachedSlots={attachedSlots} onDark={onDark} />
    );
  }

  if (block.kind === "brandColors") {
    return ws.colors.length === 0 ? (
      <EmptyBlockState text={isAr ? "لم تتم إضافة ألوان بعد." : "No colors added yet."} />
    ) : (
      <ColorGrid ws={ws} isAr={isAr} />
    );
  }

  if (block.kind === "brandType") {
    return <TypeSpecimen ws={ws} isAr={isAr} />;
  }

  if (block.kind === "brandIcons") {
    const iconAssets = ws.assets.filter((a) => a.type === "icon");
    return iconAssets.length === 0 ? (
      <EmptyBlockState text={isAr ? "لم يتم رفع أيقونات بعد." : "No icons uploaded yet."} />
    ) : (
      <IconGrid assets={iconAssets} onDark={onDark} />
    );
  }

  if (block.kind === "files") {
    const files = resolveBlockAssets(ws, block.assetIds);
    return files.length === 0 ? (
      <EmptyBlockState text={isAr ? "لم يتم اختيار ملفات بعد." : "No files selected yet."} />
    ) : (
      <div className="flex flex-col gap-2">
        {files.map((f) => (
          <a
            key={f.id}
            href={f.url}
            download={f.fileName}
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: "var(--surface-1)" }}
          >
            <Icon name="file-alt" size={16} style={{ color: "var(--accent-text)", flexShrink: 0 }} />
            <span className="flex-1 min-w-0 truncate text-[13px]" style={{ color: "var(--text)" }}>{f.fileName}</span>
            <span className="text-[11px] shrink-0" style={{ color: "var(--text-faint)" }}>{formatBytes(f.sizeKB)}</span>
            <Icon name="download" size={14} style={{ color: "var(--text-faint)", flexShrink: 0 }} />
          </a>
        ))}
      </div>
    );
  }

  // divider
  return <div style={{ height: 1, background: "var(--hairline-strong)" }} />;
}

/**
 * The photographer credit for a stock image.
 *
 * This is not decoration: most Creative Commons licenses that permit
 * commercial use still *require* attribution wherever the work appears, so the
 * credit has to be rendered on the published guideline — not merely recorded
 * in the asset library where no reader sees it. An uploaded file carries no
 * credit and renders nothing here.
 */
function AssetCreditLine({ asset }: { asset: Asset }) {
  const c = asset.credit;
  if (!c) return null;
  return (
    <span dir="auto" className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>
      <a href={c.sourceUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>
        {c.author}
      </a>
      {" · "}
      {c.licenseUrl ? (
        <a href={c.licenseUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>
          {c.license}
        </a>
      ) : (
        c.license
      )}
      {` · ${c.source}`}
    </span>
  );
}

function EmptyBlockState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl h-[80px] grid place-items-center text-[12px]" style={{ background: "var(--surface-1)", color: "var(--text-faint)" }}>
      {text}
    </div>
  );
}

function ContactFormBlock({
  title,
  body,
  mailto,
  isAr,
}: {
  title?: string;
  body?: string;
  mailto?: string;
  isAr: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!mailto) return;
    const subject = encodeURIComponent(`Message from ${name || "the guideline site"}`);
    const bodyText = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    window.location.href = `mailto:${mailto}?subject=${subject}&body=${bodyText}`;
  }

  return (
    <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: "var(--surface-1)" }}>
      {(title || body) && (
        <div className="flex flex-col gap-1">
          {title && <h3 className="text-[18px] font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>{title}</h3>}
          {body && <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>{body}</p>}
        </div>
      )}
      {!mailto ? (
        <span className="text-[12px]" style={{ color: "var(--text-faint)" }}>
          {isAr ? "لم يتم تعيين بريد إلكتروني للاستقبال بعد." : "No receiving email set yet."}
        </span>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-2.5 max-w-[420px]">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isAr ? "الاسم" : "Name"}
            className="h-10 px-3.5 rounded-lg outline-none text-[13px]"
            style={{ background: "var(--surface-2)", color: "var(--text)" }}
          />
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={isAr ? "البريد الإلكتروني" : "Email"}
            className="h-10 px-3.5 rounded-lg outline-none text-[13px]"
            style={{ background: "var(--surface-2)", color: "var(--text)" }}
          />
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isAr ? "رسالتك" : "Your message"}
            rows={3}
            className="px-3.5 py-2.5 rounded-lg outline-none text-[13px] resize-none"
            style={{ background: "var(--surface-2)", color: "var(--text)" }}
          />
          <button
            type="submit"
            className="h-10 px-5 rounded-full text-[12.5px] font-semibold cursor-pointer self-start"
            style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
          >
            {isAr ? "إرسال" : "Send"}
          </button>
        </form>
      )}
    </div>
  );
}
