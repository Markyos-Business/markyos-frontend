import type { AdminStats } from "../../types";
import type { Lang } from "@/types/lang";

/** New accounts per day, as bars. Each bar names its day and count on hover. */
export function SignupsChart({ signups, lang }: { signups: AdminStats["signups"]; lang: Lang }) {
  const isAr = lang === "ar";
  const max = Math.max(1, ...signups.map((d) => d.count));
  const total = signups.reduce((n, d) => n + d.count, 0);
  const label = (iso: string) =>
    // Western digits in Arabic too (spec §8).
    new Date(`${iso}T00:00:00`).toLocaleDateString(isAr ? "ar-u-nu-latn" : "en", { month: "short", day: "numeric" });

  return (
    <section className="mk-surface flex flex-col gap-4 rounded-card bg-surface-1 p-space-8">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-h5 font-medium">{isAr ? "التسجيلات" : "Signups"}</h2>
        <span className="text-caption text-text-faint">
          {isAr ? `${total} خلال آخر ${signups.length} يومًا` : `${total} in the last ${signups.length} days`}
        </span>
      </div>
      <div
        role="img"
        aria-label={isAr ? `${total} تسجيلًا خلال آخر ${signups.length} يومًا` : `${total} signups in the last ${signups.length} days`}
        // Time runs left to right in Arabic too: a time axis never mirrors (spec §8).
        dir="ltr"
        className="flex h-[140px] items-end gap-[3px]"
      >
        {signups.map((d) => (
          <div
            key={d.date}
            title={`${label(d.date)}: ${d.count}`}
            // Charts emit light (spec §6.15): a bar fades from the accent down
            // to the deep blue; an empty day is a stub of the neutral tint.
            className={`flex-1 rounded-t-sm ${d.count ? "bg-linear-to-t from-accent-deep to-accent" : "bg-ink-soft"}`}
            style={{ height: `${Math.max(3, (d.count / max) * 100)}%` }}
          />
        ))}
      </div>
      {signups.length > 0 && (
        <div dir="ltr" className="flex justify-between text-caption text-text-faint">
          <span>{label(signups[0].date)}</span>
          <span>{label(signups[signups.length - 1].date)}</span>
        </div>
      )}
    </section>
  );
}
