"use client";

import { Button, Icon, Modal, useUiStrings } from "@/components/ui";
import { formatMoney } from "@/lib/i18n/format";
import { useSession } from "@/contexts/AppContext";
import { roleOn } from "@/lib/data/access";
import type { Workspace } from "@/types";
import { billingCopy } from "../copy";
import { usePlans } from "../hooks/use-plans";
import type { UpgradeReason } from "../types";
import { CheckoutFlow } from "./checkout-flow";

/**
 * The one upgrade modal (billing epic 2.4): every paywall moment opens it
 * with the reason, which only changes the words. The price is the server's
 * for the owner's account type; only the brand's owner can subscribe.
 */
export function UpgradeModal({
  ws,
  reason,
  count = 1,
  onClose,
  onDone,
}: {
  ws: Workspace;
  reason: UpgradeReason;
  count?: number;
  onClose: () => void;
  onDone?: () => void;
}) {
  const { isAr } = useUiStrings();
  const copy = billingCopy(isAr);
  const plans = usePlans();
  const words = copy.reason[reason];
  const owner = roleOn(ws, useSession()) === "owner";
  const type = ws.ownerAccountType ? plans?.types[ws.ownerAccountType] : undefined;
  const subscribed = ws.billing?.plan === "subscription";

  const done = () => {
    onClose();
    onDone?.();
  };
  const includes = [copy.includes.publish, copy.includes.badge, copy.includes.editors, copy.includes.brands];

  return (
    <Modal
      onClose={onClose}
      title={words.title}
      description={reason === "brand_limit" && count > 1 ? copy.manyFree(count, ws.name) : words.body(ws.name)}
      size="sm"
      footer={
        subscribed ? (
          <Button onClick={done}>{words.done}</Button>
        ) : (
          <Button variant="secondary" onClick={onClose}>{copy.close}</Button>
        )
      }
    >
      <div className="flex flex-col gap-space-6">
        {type && plans && (
          <div className="flex flex-col gap-space-2">
            <p className="text-title text-text">{copy.price(formatMoney(type.monthly / 100, plans.currency.toUpperCase(), isAr ? "ar" : "en"))}</p>
            <p className="text-caption text-text-muted">{copy.terms}</p>
          </div>
        )}
        <div className="flex flex-col gap-space-3">
          <p className="text-label text-text-muted">{copy.includes.title}</p>
          <ul className="flex flex-col gap-space-2">
            {includes.map((line) => (
              <li key={line} className="flex items-center gap-space-3 text-body text-text">
                <Icon name="check" size={16} className="shrink-0 text-success" />
                {line}
              </li>
            ))}
          </ul>
        </div>
        {!owner ? (
          <p className="text-body text-text-muted">{copy.notOwner}</p>
        ) : (
          <CheckoutFlow ws={ws} isAr={isAr} copy={copy} />
        )}
      </div>
    </Modal>
  );
}
