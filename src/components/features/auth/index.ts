// Public API of the auth feature. Code outside features/auth/
// imports from "@/features/auth", never from a file inside it.

// Screens: what the (auth) pages render.
export { ConfirmEmailView } from "./components/confirm-email/ConfirmEmailView";
export { LoginView } from "./components/login/LoginView";
export { ResetView } from "./components/reset/ResetView";
export { SignupView } from "./components/signup/SignupView";

// Pieces other features reuse.
export { AuthShell } from "./components/shared/AuthShell";
export { PasswordField } from "./components/shared/PasswordField";
export { PasswordMatch } from "./components/shared/PasswordMatch";
export { SocialSignIn } from "./components/shared/SocialSignIn";

export { EMAIL_RE } from "./constants";
export { toAccount } from "./services/authService";
export type { ApiAccount } from "./types";
export { normaliseEmail } from "./utils/email";
export { isPlaintext, scorePassword } from "./utils/password";
