"use client";

import { useState } from "react";
import { z } from "zod";
import { Button, EmptyState, ErrorState, FormDialog, FormSheet, Icon, useDialog, useToast, useZodForm } from "@/components/ui";
import { InputField } from "@/components/form";
import type { StyleGuideCopy } from "../../constants";
import { Demo, GuideSection } from "./GuideParts";

const FeedbackSection = ({ c, isAr }: { c: StyleGuideCopy; isAr: boolean }) => {
  const { showToast } = useToast();
  const { confirm } = useDialog();
  const [open, setOpen] = useState<"dialog" | "sheet" | null>(null);
  const form = useZodForm(z.object({ email: z.email(c.emailError) }), { email: "" });

  const close = () => {
    setOpen(null);
    form.reset();
  };

  const submit = async () => {
    const parsed = form.submit();
    if (!parsed) return false;
    await new Promise((r) => setTimeout(r, 600));
    showToast(`${c.invited} ${parsed.email}`, "success");
  };

  const fields = (
    <InputField
      label={c.emailLabel}
      type="email"
      dir="ltr"
      placeholder="omar@wadirum.coffee"
      value={form.values.email}
      error={form.errors.email}
      onChange={(e) => form.set("email", e.target.value)}
    />
  );
  const Overlay = open === "sheet" ? FormSheet : FormDialog;

  return (
    <GuideSection id="feedback" title={c.sections.feedback}>
      <Demo name="FormDialog · FormSheet · confirm · Toast" className="flex flex-wrap gap-space-4">
        <Button variant="primary" icon={<Icon name="user-plus" size={18} />} onClick={() => setOpen("dialog")}>
          {c.form}
        </Button>
        <Button variant="outline" onClick={() => setOpen("sheet")}>
          {c.formSheet}
        </Button>
        <Button
          variant="danger"
          onClick={async () => {
            const ok = await confirm({
              title: c.confirmTitle,
              body: c.confirmBody,
              tone: "danger",
              confirmLabel: c.confirm,
              confirmPhrase: c.confirmPhrase,
              isAr,
            });
            if (ok) showToast(c.confirmTitle, "danger");
          }}
        >
          {c.confirm}
        </Button>
        <Button variant="ghost" onClick={() => showToast(c.toastMessage, "success")}>
          {c.toast}
        </Button>
      </Demo>

      <Demo name="Button · disabledReason" className="flex flex-wrap gap-space-4">
        <Button variant="danger" icon={<Icon name="trash" size={18} />} disabledReason={c.table.lastAdmin}>
          {c.confirm}
        </Button>
        <Button variant="outline" disabledReason={c.table.lastAdmin}>
          {c.table.deactivate}
        </Button>
      </Demo>

      <div className="grid gap-5 lg:grid-cols-2">
        <Demo name="EmptyState">
          <EmptyState icon="search" title={c.emptyTitle} description={c.emptyBody} />
        </Demo>
        <Demo name="ErrorState">
          <ErrorState message={c.tableError} onRetry={() => showToast(c.states.loading)} />
        </Demo>
      </div>

      {open && (
        <Overlay open title={c.form} submitLabel={c.invite} onClose={close} onSubmit={submit}>
          {fields}
        </Overlay>
      )}
    </GuideSection>
  );
};

export { FeedbackSection };
