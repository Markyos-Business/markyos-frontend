// Public API of the auth feature. Code outside features/auth/
// imports from "@/features/auth", never from a file inside it.
export { AuthShell } from "./components/AuthShell";
export { LoginView } from "./components/LoginView";
export { PasswordField } from "./components/PasswordField";
export { PasswordMatch } from "./components/PasswordMatch";
export { ResetView } from "./components/ResetView";
export { SignupForm } from "./components/SignupForm";
export { SocialSignIn } from "./components/SocialSignIn";
export { useSignupForm } from "./hooks/useSignupForm";
export { EMAIL_RE, isPlaintext, normaliseEmail, scorePassword } from "./model/auth";
