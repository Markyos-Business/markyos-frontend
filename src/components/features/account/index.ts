// Public API of the account feature. Code outside features/account/
// imports from "@/features/account", never from a file inside it.

// Screen: what the account page renders.
export { AccountView } from "./components/AccountView";

// The avatar menu every top bar shows.
export { AccountMenu } from "./components/menu/AccountMenu";
