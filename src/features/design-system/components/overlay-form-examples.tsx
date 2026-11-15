"use client";

import { useState } from "react";
import {
  Button,
  DialogForm,
  DrawerForm,
  Icon,
  InlineEdit,
} from "@/components/ui";
import {
  AssetFields,
  InviteFields,
  assetSchema,
  inviteSchema,
} from "./overlay-form-fields";

type Tr = (en: string, ar: string) => string;
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** "Invite teammate": a DialogForm. */
const InviteDialog = ({ t }: { t: Tr }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="primary"
        icon={<Icon name="user-plus" size={18} />}
        onClick={() => setOpen(true)}
      >
        {t("Invite teammate", "دعوة زميل")}
      </Button>
      <DialogForm
        open={open}
        onClose={() => setOpen(false)}
        title={t("Invite teammate", "دعوة زميل")}
        description={t(
          "They'll get an email to join Nadeen Studio.",
          "سيصلهم بريد للانضمام إلى استوديو نادين.",
        )}
        submitLabel={t("Send invite", "إرسال الدعوة")}
        successToast={t("Invite sent.", "أُرسلت الدعوة.")}
        schema={inviteSchema(t)}
        defaultValues={{ email: "", role: "", message: "" }}
        onSubmit={async (v) => {
          await wait(700);
          if (v.email.endsWith("@nadeen.sa"))
            return {
              fields: {
                email: t(
                  "They're already in this workspace.",
                  "هذا الشخص في مساحة العمل بالفعل.",
                ),
              },
            };
        }}
      >
        <InviteFields t={t} />
      </DialogForm>
    </>
  );
};

/** "Asset details": a DrawerForm whose title is an InlineEdit that saves on its own. */
const AssetDrawer = ({ t }: { t: Tr }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Ramadan hero banner");
  const rename = async (next: string) => {
    await wait(700);
    if (next.includes("!")) throw new Error("refused");
    setName(next);
  };
  return (
    <>
      <div className="flex items-center gap-space-5 rounded-card bg-surface-2 p-space-5 shadow-edge">
        <span
          aria-hidden
          className="grid size-14 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent-on-soft"
        >
          <Icon name="image" size={22} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-space-1">
          <span dir="auto" className="truncate text-body font-medium text-text">
            {name}
          </span>
          <span className="text-caption text-text-muted">
            1080 × 1350 · PNG · 2.4 MB
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={<Icon name="pen" size={16} />}
          onClick={() => setOpen(true)}
        >
          {t("Edit details", "تعديل التفاصيل")}
        </Button>
      </div>
      <DrawerForm
        open={open}
        onClose={() => setOpen(false)}
        label={t("Asset details", "تفاصيل الملف")}
        title={
          <InlineEdit
            value={name}
            onCommit={rename}
            label={t("Asset name", "اسم الملف")}
            textClassName="text-h5 font-medium"
            strings={{
              failed: t(
                "Couldn't rename it. Names can't contain “!”.",
                "تعذّرت إعادة التسمية. لا يمكن أن يحتوي الاسم على «!».",
              ),
            }}
          />
        }
        description={t(
          "Click the name to rename it; it saves on its own.",
          "انقر الاسم لإعادة تسميته؛ يُحفظ وحده.",
        )}
        submitLabel={t("Save details", "حفظ التفاصيل")}
        destructive={{
          label: t("Archive", "أرشفة"),
          icon: "trash",
          onClick: () => setOpen(false),
        }}
        schema={assetSchema(t)}
        defaultValues={{
          alt: "Lanterns over a Riyadh street at dusk",
          usage: "social",
          expires: "2027-04-30",
          tags: ["Ramadan", "Riyadh"],
          notes: "",
        }}
        onSubmit={() => wait(700)}
      >
        <AssetFields t={t} />
      </DrawerForm>
    </>
  );
};

/** A dialog form and a drawer form with inline edit, side by side. */
const OverlayFormExamples = ({ t }: { t: Tr }) => (
  <div className="flex flex-col gap-space-6">
    <div>
      <InviteDialog t={t} />
    </div>
    <AssetDrawer t={t} />
  </div>
);

export { OverlayFormExamples };
