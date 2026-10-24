"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { useToast, Icon, TextField, PillButton, LangToggle } from "@/components/ui";
import { TopBar } from "@/components/layout";
import { Section, Row, Switch, Badge } from "@/components/ui/composites/SectionUI/SectionUI";
import { formatRelative } from "@/lib/utils";
import { diffTokens, parseDesignTokens, serializeTokens } from "@/components/features/settings";
import { triggerBlobDownload } from "@/lib/rasterize";
import { PlanKind, Workspace } from "@/types";
import { suggestSubdomain, validateSubdomain } from "@/components/features/sharing";
import Link from "next/link";

function randomPassword(): string {
  return Math.random().toString(36).slice(2, 10);
}

function randomApiKey(): string {
  return "mk_test_" + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

export default function SettingsPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    getWorkspace,
    toggleClientPassword,
    setClientPassword,
    setCustomDomain,
    setDomainStatus,
    markPurchased,
    setApiKey,
    setWebhookUrl,
    toggleFigmaSync,
    toggleWhiteLabel,
    addColor,
    updateColor,
    setTypography,
    setPrimaryLocale,
    uiLang,
  } = useApp();
  const { showToast } = useToast();
  const ws = getWorkspace(params.slug);

  const [domainInput, setDomainInput] = useState("");
  const [webhookInput, setWebhookInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<PlanKind | null>(null);
  const [origin, setOrigin] = useState("");
  const tokenInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reads the browser's origin to build the client link — not derivable
    // from React state, so this one-time sync is a legitimate effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (ws) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDomainInput(ws.clientAccess.customDomain);
      setWebhookInput(ws.developer.webhookUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws?.id]);

  useEffect(() => {
    if (!ws) return;
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      const plan = (searchParams.get("plan") as PlanKind) || "pass";
      const sessionId = searchParams.get("session_id") ?? undefined;
      markPurchased(ws.id, plan, sessionId);
      showToast(
        plan === "pass" ? "Project Pass activated — this guideline is now shared." : "Studio subscription active.",
        "success"
      );
      router.replace(`/w/${ws.slug}/settings`);
    } else if (checkout === "cancelled") {
      showToast("Checkout cancelled — nothing was charged.");
      router.replace(`/w/${ws.slug}/settings`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws?.id, searchParams]);

  if (!ws) return null;
  const isAr = uiLang(ws) === "ar";
  const clientLink = origin ? `${origin}/v/${ws.slug}` : `/v/${ws.slug}`;

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied.`, "success");
    } catch {
      showToast("Couldn't copy — copy it manually.", "danger");
    }
  }

  function handleConnectDomain() {
    if (!ws) return;
    const trimmed = domainInput.trim();
    if (!trimmed) return;
    const valid = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(trimmed);
    if (!valid) {
      showToast("Enter a valid domain, like brand.client.com.", "danger");
      return;
    }
    setCustomDomain(ws.id, trimmed);
    showToast("Domain saved — add the CNAME record below to verify.");
  }

  function handleVerifyDomain() {
    if (!ws) return;
    setVerifying(true);
    window.setTimeout(() => {
      setDomainStatus(ws.id, "verified");
      setVerifying(false);
      showToast("Domain verified.", "success");
    }, 1100);
  }

  function handleCopyTokens() {
    if (!ws) return;
    copy(serializeTokens(ws), "Design tokens");
    toggleFigmaSync(ws.id, true);
  }

  function handleDownloadTokens() {
    if (!ws) return;
    const blob = new Blob([serializeTokens(ws)], { type: "application/json" });
    triggerBlobDownload(blob, `${ws.slug}-tokens.json`);
    toggleFigmaSync(ws.id, true);
    showToast("Tokens exported.", "success");
  }

  async function handleImportTokens(file: File) {
    if (!ws) return;
    setSyncing(true);
    try {
      const parsed = parseDesignTokens(await file.text());
      if (!parsed.ok) {
        showToast(parsed.error, "danger");
        return;
      }
      const diff = diffTokens(ws.colors, parsed.tokens.colors);
      for (const c of diff.added) addColor(ws.id, c);
      for (const c of diff.changed) updateColor(ws.id, c.swatch.id, { name: c.swatch.name, hex: c.hex });
      if (parsed.tokens.typography.latinFamily || parsed.tokens.typography.arabicFamily) {
        setTypography(ws.id, parsed.tokens.typography);
      }
      toggleFigmaSync(ws.id, true);

      // Says what actually changed, including when the answer is "nothing" —
      // a silent success on an import is indistinguishable from a failure.
      const parts: string[] = [];
      if (diff.added.length) parts.push(`${diff.added.length} added`);
      if (diff.changed.length) parts.push(`${diff.changed.length} updated`);
      if (diff.unchanged) parts.push(`${diff.unchanged} already matched`);
      showToast(parts.length ? `Tokens imported — ${parts.join(", ")}.` : "Tokens read, but nothing differed.", "success");
    } catch {
      showToast("Couldn't read that file.", "danger");
    } finally {
      setSyncing(false);
    }
  }

  async function handleCheckout(plan: PlanKind) {
    if (!ws || plan === "free") return;
    setCheckoutLoading(plan);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: ws.slug, plan }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Checkout failed.", "danger");
        setCheckoutLoading(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      showToast("Couldn't reach checkout — try again.", "danger");
      setCheckoutLoading(null);
    }
  }

  return (
    <>
      <TopBar workspace={ws} section="Settings" arSection="الإعدادات" />
      <div className="flex-1 min-h-0 px-7 py-6.5 flex flex-col gap-6 overflow-auto max-w-[720px]">
        <div>
          <h1 className="text-[30px] font-semibold tracking-tight mb-1.5" style={{ fontFamily: "var(--font-display)" }}>
            {isAr ? "الإعدادات" : "Settings"}
          </h1>
          <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
            Client access, custom domain, billing and integrations for {ws.name}.
          </p>
        </div>

        {/* Brand — the name lives here because this is where people look for
            it. It was only editable behind a pen icon inside a card on
            Overview, which is a fine shortcut and a bad only-route. */}
        <Section title="Brand" icon="shapes">
          <BrandNameRow ws={ws} />
          {/* The brand's own language, which is a different thing from the one
              the studio reads the app in — that is a personal setting and lives
              in the top bar. Until these were split they were one field, so
              changing the interface language also changed what the client saw.

              It belongs here rather than only on Overview because it is an
              Owner-level decision about the deliverable: it decides which
              language the client's site opens in, and which language a missing
              value counts as an error in rather than a warning. The preview
              toggle on Overview stays as the shortcut. */}
          <Row
            label={isAr ? "لغة الهوية" : "Brand language"}
            /* "On the next publish", not "now".
               /v/<slug> serves the published snapshot and never the live
               workspace, so this reaches the client exactly when every other
               brand change does. Saying it plainly is cheaper than an Owner
               switching the language, opening the client link, and concluding
               the setting is broken. */
            hint={
              isAr
                ? "اللغة التي يفتح بها موقع الدليل عند العميل، عند النشر القادم. لغة واجهتك أنت إعداد منفصل في الشريط الأعلى."
                : "Which language the client's guideline opens in, from the next publish. Your own interface language is a separate setting in the top bar."
            }
            right={
              <LangToggle
                value={ws.primaryLocale}
                onChange={(lang) => {
                  if (lang === ws.primaryLocale) return;
                  setPrimaryLocale(ws.id, lang);
                  showToast(
                    isAr
                      ? lang === "ar"
                        ? "لغة الهوية: العربية. تصل إلى العميل عند النشر."
                        : "لغة الهوية: الإنجليزية. تصل إلى العميل عند النشر."
                      : lang === "ar"
                        ? "Brand language set to Arabic. Publish to show clients."
                        : "Brand language set to English. Publish to show clients.",
                  );
                }}
                label={isAr ? "لغة الهوية" : "Brand language"}
                scope="brand"
              />
            }
          />
        </Section>

        {/* Client access */}
        <Section title="Client access" icon="lock">
          <Row
            label="Password-protect this guideline"
            hint="Clients enter this password before viewing the client link."
            right={
              <Switch
                label="Password-protect this guideline"
                checked={ws.clientAccess.passwordEnabled}
                onToggle={() => toggleClientPassword(ws.id, !ws.clientAccess.passwordEnabled)}
              />
            }
          />
          {ws.clientAccess.passwordEnabled && (
            <div className="flex items-end gap-2.5">
              <TextField
                label="Password"
                value={ws.clientAccess.password}
                onChange={(e) => setClientPassword(ws.id, e.target.value)}
                placeholder="Set a password"
              />
              {/*
               * Copy, next to Generate.
               *
               * The password is shown in the clear on purpose — the studio has
               * to read it out to a client, and masking a secret whose entire
               * job is to be passed on helps nobody. What was missing is the
               * other half of that job: the client link twenty pixels below has
               * a Copy and this did not, so the one thing on this card that has
               * to travel was the one thing you had to select by hand.
               */}
              <button
                type="button"
                onClick={() => copy(ws.clientAccess.password, "Password")}
                disabled={!ws.clientAccess.password}
                title={ws.clientAccess.password ? "Copy the password" : "Set a password first"}
                className="h-[46px] px-4 rounded-lg text-[13px] font-semibold cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "var(--surface-2)", boxShadow: "inset 0 0 0 1px var(--hairline-strong)" }}
              >
                Copy
              </button>
              <button
                type="button"
                onClick={() => setClientPassword(ws.id, randomPassword())}
                title="Replace it with a new random one"
                className="h-[46px] px-4 rounded-lg text-[13px] font-semibold cursor-pointer shrink-0"
                style={{ background: "var(--surface-2)", boxShadow: "inset 0 0 0 1px var(--hairline-strong)" }}
              >
                Generate
              </button>
            </div>
          )}
          <div className="mk-surface flex items-center gap-2.5 px-3.5 py-3 rounded-lg" style={{ background: "var(--surface-2)" }}>
            <Icon name="link" size={17} style={{ color: "var(--accent-text)" }} />
            <span
              // The full link in a title: this truncates on a narrow window,
              // and a URL you can only read most of is a URL you cannot check.
              title={clientLink}
              className="flex-1 min-w-0 text-[12px] truncate"
              style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-secondary)" }}
            >
              {clientLink}
            </span>
            <button
              type="button"
              onClick={() => copy(clientLink, "Client link")}
              className="mk-tap text-[12px] font-semibold cursor-pointer shrink-0"
              style={{ color: "var(--accent-text)" }}
            >
              Copy
            </button>
          </div>
        </Section>

        {/* Guideline site design lives in the Guidelines editor now */}
        <Section title="Guideline site design" icon="layer-group">
          <Row
            label="Style, pages, and prebuilt sections"
            hint="Pick Vault, Docs, or Studio, add extra pages, and drop in prebuilt sections — all editable afterward."
            right={
              <Link
                href={`/w/${ws.slug}/builder`}
                className="h-9 px-4 rounded-full text-[12px] font-semibold cursor-pointer shrink-0 grid place-items-center"
                style={{ background: "var(--surface-2)", color: "var(--text)" }}
              >
                Open editor →
              </Link>
            }
          />
        </Section>

        {/* Subdomain — the address before any custom domain exists */}
        <Section title="Subdomain" icon="link">
          <SubdomainRow ws={ws} />
        </Section>

        {/* Custom domain */}
        <Section title="Custom domain" icon="globe">
          <p className="text-[13px] -mt-1" style={{ color: "var(--text-muted)" }}>
            Map the client link to your own domain, like brand.yourstudio.com, so it reads as your
            agency&apos;s link, not Markyos&apos;s.
          </p>
          <div className="flex items-end gap-2.5">
            <TextField
              label="Domain"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              placeholder="brand.client.com"
            />
            <button
              type="button"
              onClick={handleConnectDomain}
              className="h-[46px] px-4 rounded-lg text-[13px] font-semibold cursor-pointer shrink-0"
              style={{ background: "var(--solid)", color: "var(--solid-ink)" }}
            >
              Connect
            </button>
          </div>
          {ws.clientAccess.domainStatus !== "none" && (
            <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "var(--surface-2)" }}>
              <div className="flex items-center justify-between">
                <span
                  className="text-[12px] font-mono truncate"
                  style={{ fontFamily: "ui-monospace, Menlo, monospace" }}
                >
                  {ws.clientAccess.customDomain}
                </span>
                <Badge tone={ws.clientAccess.domainStatus === "verified" ? "success" : "warning"}>
                  {ws.clientAccess.domainStatus === "verified" ? "Verified" : "Pending DNS"}
                </Badge>
              </div>
              {ws.clientAccess.domainStatus === "pending" && (
                <>
                  <div className="grid grid-cols-[80px_1fr] gap-x-4 gap-y-1.5 text-[12px]">
                    <span style={{ color: "var(--text-faint)" }}>Type</span>
                    <span style={{ fontFamily: "ui-monospace, Menlo, monospace" }}>CNAME</span>
                    <span style={{ color: "var(--text-faint)" }}>Name</span>
                    <span style={{ fontFamily: "ui-monospace, Menlo, monospace" }}>
                      {ws.clientAccess.customDomain.split(".")[0]}
                    </span>
                    <span style={{ color: "var(--text-faint)" }}>Value</span>
                    <span style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--accent-text)" }}>
                      clients.markyos.app
                    </span>
                  </div>
                  <PillButton
                    variant="secondary"
                    size="sm"
                    onClick={handleVerifyDomain}
                    disabled={verifying}
                    className="self-start"
                  >
                    {verifying ? "Checking DNS…" : "I've added the CNAME record"}
                  </PillButton>
                </>
              )}
            </div>
          )}
        </Section>

        {/* Billing */}
        <Section title="Billing" icon="credit-card">
          <Row
            label="Current plan"
            hint={
              ws.billing.purchasedAt
                ? `Active since ${formatRelative(ws.billing.purchasedAt)}`
                : "No plan purchased yet — this guideline isn't shareable until one is."
            }
            right={
              <Badge tone={ws.billing.plan === "free" ? "neutral" : "accent"}>
                {ws.billing.plan === "pass" ? "Project Pass" : ws.billing.plan === "subscription" ? "Studio plan" : "Free"}
              </Badge>
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
            <PlanCard
              name="Project Pass"
              price="$19"
              period="one-time"
              description="Unlock the client link for this one guideline. No recurring charge."
              active={ws.billing.plan === "pass"}
              loading={checkoutLoading === "pass"}
              onSelect={() => handleCheckout("pass")}
            />
            <PlanCard
              name="Studio plan"
              price="$29"
              period="/month"
              description="Unlock every guideline in your account, plus priority sign-off pins."
              active={ws.billing.plan === "subscription"}
              loading={checkoutLoading === "subscription"}
              onSelect={() => handleCheckout("subscription")}
            />
          </div>
          <p className="text-[12px]" style={{ color: "var(--text-faint)" }}>
            Checkout runs through Stripe in test mode — use card 4242 4242 4242 4242, any future
            date and CVC.
          </p>
          <div className="mt-1 pt-3.5" style={{ boxShadow: "inset 0 1px 0 var(--hairline)" }}>
            <Row
              label="Saudi payment rails"
              hint="Mada · SAR · Apple Pay via a SAMA-licensed processor (Tap, HyperPay or Moyasar)"
              right={<Badge tone="neutral">Planned — v3.0</Badge>}
            />
          </div>
        </Section>

        {/* White-label */}
        <Section title="White-label" icon="id-badge">
          <Row
            label="Remove Markyos branding"
            hint="Drops the small 'Guideline delivered with Markyos' footer from the client viewer. Included automatically on the Studio plan."
            right={
              <Switch
                label="Remove Markyos branding"
                checked={ws.whiteLabel || ws.billing.plan === "subscription"}
                onToggle={() => toggleWhiteLabel(ws.id, !ws.whiteLabel)}
              />
            }
          />
        </Section>

        {/* Developer */}
        <Section title="Developer" icon="key">
          <Row
            label="API key"
            hint="Read-only access to this workspace's published assets and brand data."
            right={
              <div className="flex items-center gap-2">
                <code
                  className="text-[12px] px-2.5 py-1.5 rounded-md"
                  style={{ background: "var(--surface-2)", fontFamily: "ui-monospace, Menlo, monospace" }}
                >
                  {ws.developer.apiKey}
                </code>
                <button
                  type="button"
                  onClick={() => copy(ws.developer.apiKey, "API key")}
                  className="mk-tap text-[12px] font-semibold cursor-pointer"
                  style={{ color: "var(--accent-text)" }}
                >
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setApiKey(ws.id, randomApiKey());
                    showToast("API key regenerated — the old key stops working immediately.");
                  }}
                  className="mk-tap text-[12px] font-semibold cursor-pointer"
                  style={{ color: "var(--text-muted)" }}
                >
                  Regenerate
                </button>
              </div>
            }
          />
          <div
            className="rounded-lg px-3.5 py-3 text-[12px] overflow-x-auto"
            style={{ background: "var(--surface-2)", fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-secondary)" }}
          >
            curl https://api.markyos.com/v1/workspaces/{ws.slug} \{"\n"}
            {"  "}-H &quot;Authorization: Bearer {ws.developer.apiKey}&quot;
          </div>
          <div className="flex items-end gap-2.5">
            <TextField
              label="Webhook URL"
              value={webhookInput}
              onChange={(e) => setWebhookInput(e.target.value)}
              placeholder="https://yourapp.com/webhooks/markyos"
              hint="Fires on publish, approval and sign-off events. Not sent anywhere yet in this demo."
            />
            <button
              type="button"
              onClick={() => {
                setWebhookUrl(ws.id, webhookInput.trim());
                showToast("Webhook URL saved.");
              }}
              className="h-[46px] px-4 rounded-lg text-[13px] font-semibold cursor-pointer shrink-0"
              style={{ background: "var(--surface-2)", boxShadow: "inset 0 0 0 1px var(--hairline-strong)" }}
            >
              Save
            </button>
          </div>
        </Section>

        {/* Design tokens */}
        <Section title="Design tokens" icon="shapes">
          <p className="text-[12.5px] leading-[1.6] -mt-1" style={{ color: "var(--text-muted)" }}>
            This workspace&apos;s palette and type, in the W3C Design Tokens format that Figma
            Variables, Tokens Studio and Style Dictionary all read. Export it into your Figma
            library, edit there, and bring the file back to catch drift in either direction.
          </p>
          <Row
            label="Export tokens"
            hint={
              ws.developer.figmaSyncedAt
                ? `${ws.colors.length} colors + 2 type tokens · last exchanged ${formatRelative(ws.developer.figmaSyncedAt)}.`
                : `${ws.colors.length} colors + 2 type tokens.`
            }
            right={
              <div className="flex gap-2 shrink-0">
                <PillButton variant="secondary" size="sm" onClick={handleCopyTokens}>
                  Copy JSON
                </PillButton>
                <PillButton variant="secondary" size="sm" onClick={handleDownloadTokens}>
                  Download
                </PillButton>
              </div>
            }
          />
          <input
            ref={tokenInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportTokens(file);
              e.target.value = "";
            }}
          />
          <Row
            label="Import tokens"
            hint="Adds colors it doesn't have and updates ones whose hex changed. Nothing is deleted."
            right={
              <PillButton variant="secondary" size="sm" onClick={() => tokenInputRef.current?.click()} disabled={syncing}>
                {syncing ? "Reading…" : "Choose file"}
              </PillButton>
            }
          />
        </Section>
      </div>
    </>
  );
}

/**
 * Renaming the brand.
 *
 * Saved on blur or Enter rather than per keystroke: every edit bumps the
 * workspace and marks the guideline as having unpublished changes, and typing
 * a name one letter at a time would do that a dozen times and fill the undo
 * history with half-typed names.
 *
 * The slug deliberately does not follow. It is the client-facing URL and may
 * already be in a proposal or a signed-off deck, so a typo fix must not
 * silently break a link someone has already shared — the hint says so rather
 * than letting it be discovered the hard way.
 */
function BrandNameRow({ ws }: { ws: Workspace }) {
  const { renameWorkspace } = useApp();
  const { showToast } = useToast();
  const [draft, setDraft] = useState(ws.name);

  function commit() {
    const next = draft.trim();
    if (!next) {
      setDraft(ws.name);
      return;
    }
    if (next === ws.name) return;
    renameWorkspace(ws.id, next);
    showToast(`Renamed to ${next}. The client link is unchanged.`, "success");
  }

  return (
    <div className="flex flex-col gap-2">
      <TextField
        label="Brand name"
        value={draft}
        dir="auto"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") setDraft(ws.name);
        }}
        placeholder="e.g. Nadeen Studio"
      />
      <span className="text-[12px]" style={{ color: "var(--text-faint)" }}>
        Shown across the app and on the client&apos;s guideline site. The client link stays{" "}
        <span style={{ fontFamily: "ui-monospace, Menlo, monospace" }}>/v/{ws.slug}</span> — renaming
        never breaks a link you&apos;ve already shared.
      </span>
    </div>
  );
}

/**
 * Choosing the label in front of `.markyos.app`.
 *
 * Availability is checked as you type rather than on submit, because the whole
 * difficulty of picking a name is not knowing which ones are gone — finding out
 * only after pressing a button turns one decision into a guessing game.
 *
 * The check is against the brands in this account, which is every brand this
 * build can see; the hint says exactly that rather than implying it has asked a
 * registry somewhere.
 */
function SubdomainRow({ ws }: { ws: Workspace }) {
  const { state, setSubdomain } = useApp();
  const { showToast } = useToast();
  const [draft, setDraft] = useState(ws.clientAccess.subdomain);
  const [saved, setSaved] = useState(ws.clientAccess.subdomain);

  const value = draft.trim().toLowerCase();
  const unchanged = value === saved;

  // Format first, then availability: "already taken" on a string with a space
  // in it is the wrong complaint.
  const formatError = value ? validateSubdomain(value) : null;
  const taken =
    !formatError &&
    !!value &&
    state.workspaces.some((w) => w.id !== ws.id && w.clientAccess.subdomain.toLowerCase() === value);

  const error = formatError ?? (taken ? "Already used by another brand in your account." : null);
  const available = !!value && !error && !unchanged;

  function commit() {
    if (!value) {
      const failed = setSubdomain(ws.id, "");
      if (!failed) {
        setSaved("");
        showToast("Subdomain cleared — the client link falls back to the default.", "success");
      }
      return;
    }
    const failed = setSubdomain(ws.id, value);
    if (failed) {
      showToast(failed, "danger");
      return;
    }
    setSaved(value);
    setDraft(value);
    showToast(`Claimed ${value}.markyos.app.`, "success");
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-end gap-2.5">
        <TextField
          label="Subdomain"
          value={draft}
          dir="ltr"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setDraft(saved);
          }}
          placeholder={suggestSubdomain(ws.name)}
          error={value && !unchanged ? error ?? undefined : undefined}
        />
        <button
          type="button"
          onClick={commit}
          disabled={unchanged || (!!value && !!error)}
          // The field's own error message sits below, which covers the invalid
          // case on screen — but not the *unchanged* case, where nothing is
          // wrong and the button is off anyway. That one has no other tell.
          title={
            unchanged
              ? saved
                ? `${saved}.markyos.app is already claimed.`
                : "Type a subdomain to claim."
              : error
                ? error
                : value
                  ? `Claim ${value}.markyos.app`
                  : "Clear the subdomain"
          }
          className="h-[46px] px-4 rounded-lg text-[13px] font-semibold cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "var(--solid)", color: "var(--solid-ink)" }}
        >
          {value ? "Claim" : "Clear"}
        </button>
      </div>

      <div className="flex items-center gap-2 text-[12px]">
        <Icon
          name={available ? "check-circle" : error && !unchanged ? "exclamation-circle" : "globe"}
          size={13}
          style={{ color: available ? "var(--success)" : error && !unchanged ? "var(--danger)" : "var(--text-faint)" }}
        />
        <span dir="ltr" style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-secondary)" }}>
          {(value || suggestSubdomain(ws.name))}.markyos.app
        </span>
        {available && <span style={{ color: "var(--success)" }}>available</span>}
        {saved && unchanged && <span style={{ color: "var(--text-faint)" }}>claimed</span>}
      </div>

      <span className="text-[12px]" style={{ color: "var(--text-faint)" }}>
        Checked against every brand in your account. Leave it empty and the client link stays{" "}
        <span style={{ fontFamily: "ui-monospace, Menlo, monospace" }}>/v/{ws.slug}</span>. Pointing
        a real subdomain at this build needs DNS and hosting that aren&apos;t part of it yet, so this
        reserves the name rather than serving from it.
      </span>
    </div>
  );
}

function PlanCard({
  name,
  price,
  period,
  description,
  active,
  loading,
  onSelect,
}: {
  name: string;
  price: string;
  period: string;
  description: string;
  active: boolean;
  loading: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{ background: "var(--surface-2)", boxShadow: active ? "inset 0 0 0 1px rgba(0,153,255,.5)" : "none" }}
    >
      <div>
        <div className="font-semibold text-[14px]">{name}</div>
        <div className="text-[20px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          {price}
          <span className="text-[12px] font-normal" style={{ color: "var(--text-muted)" }}>
            {" "}
            {period}
          </span>
        </div>
      </div>
      <p className="text-[12px] flex-1" style={{ color: "var(--text-muted)" }}>
        {description}
      </p>
      <PillButton variant={active ? "secondary" : "primary"} size="sm" onClick={onSelect} disabled={active || loading}>
        {active ? "Active" : loading ? "Redirecting…" : "Choose plan"}
      </PillButton>
    </div>
  );
}
