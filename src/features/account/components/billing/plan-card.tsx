import type { ReactNode } from "react";

type PlanCardProps = {
  name: string;
  price: string;
  period: string;
  description: string;
  /** How to take the plan: PayPal's checkout, opened from here. */
  action: ReactNode;
};

/** One plan: its price (the server's), what it is, and how to take it. */
export function PlanCard({ name, price, period, description, action }: PlanCardProps) {
  return (
    <div className="flex flex-col gap-space-4 rounded-card bg-surface-2 p-space-6">
      <div>
        <div className="text-body font-medium text-text">{name}</div>
        <div className="text-h3 font-medium text-text">
          {price}
          <span className="text-caption font-normal text-text-muted"> {period}</span>
        </div>
      </div>
      <p className="flex-1 text-caption text-text-muted">{description}</p>
      {action}
    </div>
  );
}
