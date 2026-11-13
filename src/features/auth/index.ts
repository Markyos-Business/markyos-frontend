// Public API of the auth feature. Code outside features/auth/
// imports from "@/features/auth", never from a file inside it.

// Screens: what the (auth) pages render.
export { ConfirmEmailView } from "./components/confirm-email/confirm-email-view";
export { LoginView } from "./components/login/login-view";
export { ResetView } from "./components/reset/reset-view";
export { SignupView } from "./components/signup/signup-view";

// Pieces other features reuse.
export { AuthShell } from "./components/shared/auth-shell";
export { PasswordField } from "./components/shared/password-field";
export { PasswordMatch } from "./components/shared/password-match";
export { SocialSignIn } from "./components/shared/social-sign-in";

export { EMAIL_RE } from "./constants";
export { toAccount } from "./api/auth.api";
export type { ApiAccount } from "./types";
export { normaliseEmail } from "./utils/email";
export { isPlaintext, scorePassword } from "./utils/password";
