import type { ReactNode } from "react";

/**
 * A settings section only the brand's owner can change: access (password,
 * subdomain, custom domain), branding and developer settings. The server keeps
 * the stored values when anyone else saves, so for an editor the section stays
 * readable but takes no input — `disabled` for native controls, `inert` for
 * the kit's custom ones — rather than accepting edits that would be dropped.
 */
export function OwnerOnly({ locked, children }: { locked: boolean; children: ReactNode }) {
  if (!locked) return <>{children}</>;
  return (
    <fieldset disabled inert className="contents" data-owner-only>
      {children}
    </fieldset>
  );
}
