export type AccountTab = "profile" | "billing" | "organisation";

/** Field errors on the change-password form. */
export type PasswordErrors = { current?: string; next?: string; confirm?: string };

/** A link the account menu shows on phones, where the top bar has no room. */
export type MenuLink = { href: string; label: string; arLabel: string; icon: string };
