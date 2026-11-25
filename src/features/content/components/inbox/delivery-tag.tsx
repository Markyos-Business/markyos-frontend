"use client";

import { Icon, Tag, Tooltip } from "@/components/ui";
import { useContentLang } from "../../hooks/use-content-lang";
import type { ContactMessage } from "../../types";

/** Whether the team was emailed about a message; the reason it wasn't, on hover and focus. */
export function DeliveryTag({ message }: { message: Pick<ContactMessage, "emailed" | "emailError"> }) {
  const { c } = useContentLang();
  const t = c.messages;
  if (message.emailed) return <Tag tone="success" icon={<Icon name="check" size={16} />}>{t.emailed}</Tag>;
  const tag = <Tag tone="warning" icon={<Icon name="exclamation-circle" size={16} />}>{t.notEmailed}</Tag>;
  return message.emailError ? (
    <Tooltip content={message.emailError} side="start">
      {/* Focusable so the reason reaches the keyboard too; the detail page shows it in full. */}
      <span tabIndex={0} className="mk-shaped inline-flex rounded-lg">{tag}</span>
    </Tooltip>
  ) : (
    tag
  );
}
