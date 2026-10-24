type AvatarTone = "muted" | "accent";

const tones: Record<AvatarTone, string> = {
  muted: "bg-surface-2 text-text-muted",
  accent: "bg-accent text-accent-ink",
};

type AvatarProps = {
  initials: string;
  /** Diameter in pixels; the initials scale with it. */
  size?: number;
  tone?: AvatarTone;
};

const Avatar = ({ initials, size = 30, tone = "muted" }: AvatarProps) => (
  <div
    className={`grid shrink-0 place-items-center rounded-full font-semibold ${tones[tone]}`}
    style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.36)) }}
  >
    {initials}
  </div>
);

export { Avatar };
export type { AvatarProps, AvatarTone };
