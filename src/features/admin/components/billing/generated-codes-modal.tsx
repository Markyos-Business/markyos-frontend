"use client";

import { Button, DataTable, Icon, Modal } from "@/components/ui";
import type { DataColumn } from "@/components/ui";
import type { PromoActions } from "../../hooks/billing/use-promo-actions";
import { useAdminPromoLang } from "../../hooks/shared/use-admin-lang";

type NewCode = { id: string; code: string };

/**
 * The codes a Generate just made, to hand out: copy one from its ⋯, copy
 * them all, or download the batch as the server's CSV. They stay in the list.
 */
export function GeneratedCodesModal({ actions, onShowBatch }: { actions: PromoActions; onShowBatch: (batchId: string) => void }) {
  const { p, isAr } = useAdminPromoLang();
  const r = p.result;
  const result = actions.result;
  if (!result) return null;
  const close = () => actions.setResult(null);
  const codes = result.codes;
  const columns: DataColumn<NewCode>[] = [
    {
      key: "code",
      header: p.table.code,
      cell: (row) => (
        <span dir="ltr" className="font-mono font-medium text-text">
          {row.code}
        </span>
      ),
    },
  ];

  return (
    <Modal
      onClose={close}
      title={r.title(codes.length)}
      description={r.description}
      size="sm"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={() => {
              onShowBatch(result.batch.id);
              close();
            }}
          >
            {r.viewBatch}
          </Button>
          <Button variant="primary" onClick={close}>
            {r.done}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-space-5" data-generated-codes>
        <div className="flex flex-wrap gap-ctl-row">
          <Button
            variant="secondary"
            size="sm"
            icon={<Icon name="copy" size={16} />}
            onClick={() => void actions.copy(codes.map((c) => c.code).join("\n"), codes.length > 1)}
          >
            {r.copyAll(codes.length)}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Icon name="download" size={16} />}
            onClick={() => void actions.csv(result.batch.id)}
            loading={actions.downloading === result.batch.id}
          >
            {r.csv}
          </Button>
        </div>
        <DataTable
          label={r.label}
          itemLabel={p.table.itemLabel}
          dir={isAr ? "rtl" : "ltr"}
          columns={columns}
          rows={codes}
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.code}
          rowActions={(row) => [{ label: p.actions.copy, icon: "copy", onSelect: () => void actions.copy(row.code) }]}
          stickyHeader={false}
          mobileCard={{ primary: "code" }}
        />
      </div>
    </Modal>
  );
}
