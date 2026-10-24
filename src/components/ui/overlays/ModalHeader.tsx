import { SOFT_VARIANT_CLASSES, type BadgeTone } from "../badges/variants";
import { IconButton } from "../buttons/IconButton";
import { Icon } from "../primitives/Icon";

type ModalHeaderProps = {
  title: string;
  description?: string;
  /** An icon name from the icon set, shown on a tinted tile. */
  icon: string;
  tone?: BadgeTone;
  /** Shows the close button; also what Escape and the scrim should call. */
  onClose?: () => void;
  closeLabel?: string;
};

/** The top of a feature modal: icon, title, a line under it, and close. */
const ModalHeader = ({ title, description, icon, tone = "neutral", onClose, closeLabel = "Close dialog" }: ModalHeaderProps) => (
  <div className="flex items-start justify-between gap-space-5 px-space-8 py-space-6 shadow-rule-b">
    <div className="flex items-start gap-space-5">
      {/* The spec's icon tile: 46px, an 8px radius, the tone's tint. */}
      <span className={`flex size-control shrink-0 items-center justify-center rounded-lg ${SOFT_VARIANT_CLASSES[tone]}`}>
        <Icon name={icon} size={22} />
      </span>
      <div>
        <h3 className="text-h4 font-medium text-text">{title}</h3>
        {description && <p className="mt-space-1 text-body text-text-muted">{description}</p>}
      </div>
    </div>
    {onClose && <IconButton icon="times" iconSize={18} label={closeLabel} onClick={onClose} className="size-9 text-text-muted hover:text-text" />}
  </div>
);

export { ModalHeader };
export type { ModalHeaderProps };
