// Public API of the auth feature. Code outside features/auth/
// imports from "@/features/auth", never from a file inside it.
export { AuthShell, FormError } from "./components/AuthShell";
export { PasswordField } from "./components/PasswordField";
export { EMAIL_RE, isPlaintext, normaliseEmail, scorePassword } from "./model/auth";
