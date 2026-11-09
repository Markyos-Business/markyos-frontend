import { Button } from "@/components/ui";

type PlanCardProps = {
  name: string;
  price: string;
  period: string;
  description: string;
  active: boolean;
  loading: boolean;
  onSelect: () => void;
  isAr: boolean;
};

/** One plan: its price, what it unlocks, and choosing it. */
export function PlanCard({ name, price, period, description, active, loading, onSelect, isAr }: PlanCardProps) {
  return (
    <div className={`flex flex-col gap-3 rounded-xl bg-surface-2 p-4 ${active ? "shadow-[inset_0_0_0_1px_rgba(0,153,255,.5)]" : ""}`}>
      <div>
        <div className="text-[14px] font-semibold">{name}</div>
        <div className="font-display text-[20px] font-semibold">
          {price}
          <span className="text-[12px] font-normal text-text-muted"> {period}</span>
        </div>
      </div>
      <p className="flex-1 text-[12px] text-text-muted">{description}</p>
      <Button variant={active ? "outline" : "primary"} size="sm" onClick={onSelect} disabled={active || loading}>
        {active ? (isAr ? "مفعّلة" : "Active") : loading ? (isAr ? "جارٍ التحويل…" : "Redirecting…") : isAr ? "اختر الخطة" : "Choose plan"}
      </Button>
    </div>
  );
}
