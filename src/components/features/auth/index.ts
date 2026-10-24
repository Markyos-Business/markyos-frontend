// Public API of the auth feature. Code outside features/auth/
// imports from "@/features/auth", never from a file inside it.
export { AuthShell } from "./components/AuthShell";
export { PasswordField } from "./components/PasswordField";
export { PasswordMatch } from "./components/PasswordMatch";
export { SocialSignIn } from "./components/SocialSignIn";
export { EMAIL_RE, isPlaintext, normaliseEmail, scorePassword } from "./model/auth";
