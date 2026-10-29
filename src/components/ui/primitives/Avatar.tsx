type AvatarTone = "muted" | "accent";
type AvatarPresence = "online" | "busy" | "away" | "offline";

const tones: Record<AvatarTone, string> = {
  muted: "bg-surface-2 text-text-muted",
  accent: "bg-accent text-accent-ink",
};

// The spec's presence colours (§6.8), with the card-coloured halo (§2).
const presences: Record<AvatarPresence, string> = {
  online: "bg-success",
  busy: "bg-danger-fill",
  away: "bg-warning",
  offline: "bg-text-disabled",
};

type AvatarProps = {
  initials: string;
  /** A photo; the initials show while it loads or if it fails. */
  src?: string | null;
  /** Diameter in pixels; the initials scale with it. Default 30. */
  size?: number;
  tone?: AvatarTone;
  /** A presence dot on the bottom end edge. */
  presence?: AvatarPresence;
  /** Names the presence for screen readers, e.g. "Online". */
  presenceLabel?: string;
  className?: string;
};

/** A person: their photo, or their initials on a tinted circle, with optional presence. */
const Avatar = ({ initials, src, size = 30, tone = "muted", presence, presenceLabel, className = "" }: AvatarProps) => (
  <span className={`relative inline-grid shrink-0 ${className}`} style={{ width: size, height: size }}>
    <span
      className={`grid place-items-center overflow-hidden rounded-full font-medium ${tones[tone]}`}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.36)) }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote avatars of any size; no layout shift to save
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        initials
      )}
    </span>
    {presence && (
      <span
        role={presenceLabel ? "img" : undefined}
        aria-label={presenceLabel}
        aria-hidden={presenceLabel ? undefined : true}
        className={`absolute bottom-0 end-0 size-2.5 rounded-full shadow-ring-status ${presences[presence]}`}
      />
    )}
  </span>
);

export { Avatar };
export type { AvatarPresence, AvatarProps, AvatarTone };
