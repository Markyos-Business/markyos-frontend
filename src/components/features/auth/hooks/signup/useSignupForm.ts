"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/components/ui";
import type { AccountType } from "@/types";
import { ACCOUNT_TYPE_KEYS } from "@/constants/accountTypes";
import { EMAIL_RE } from "../../constants";
import { API_ENABLED } from "@/lib/api/client";
import type { PasswordSetup } from "../../types";
import { normaliseEmail } from "../../utils/email";
import { scorePassword } from "../../utils/password";
import { useAuthLang } from "../shared/useAuthLang";

type SignupErrors = {
  accountType?: string;
  name?: string;
  email?: string;
  password?: string;
  form?: string;
};

/** The sign-up form: its fields, checks, the account it creates, and where it goes next. */
export function useSignupForm() {
  const { c } = useAuthLang();
  const { signup, state, hydrated } = useApp();
  const { showToast } = useToast();
  const router = useRouter();
  // The website's sign-up buttons say who the account is for (/start?type=studio,
  // forwarded here): that choice arrives already made, and stays changeable.
  const fromSite = useSearchParams().get("type");
  const presetType = ACCOUNT_TYPE_KEYS.find((k) => k === fromSite) ?? null;

  const [accountType, setAccountType] = useState<AccountType | null>(presetType);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<SignupErrors>({});
  const [busy, setBusy] = useState(false);
  // Two steps: who the account is for, then the person's details.
  const [step, setStep] = useState<"type" | "details">("type");
  /*
   * Set the instant registration succeeds, and checked by the redirect below.
   *
   * Registering creates the session, which immediately satisfies "already
   * signed in, go to the gallery" — so the effect fired and replaced the
   * push to /brands/new that had just been issued. The result was that
   * finishing registration dropped people on an empty gallery instead of the
   * screen that helps them make their first brand.
   *
   * A ref, not state: it must be true for the effect that runs after this same
   * commit, and a state update wouldn't have landed yet.
   */
  const justRegistered = useRef(false);
  // The new account, waiting for its "set your password" email.
  const [setup, setSetup] = useState<PasswordSetup | null>(null);

  useEffect(() => {
    if (justRegistered.current) return;
    if (hydrated && state.session) router.replace("/brands");
  }, [hydrated, state.session, router]);

  /*
   * The duplicate check runs on blur as well as on submit.
   *
   * Finding out the email is taken only after filling in a password and a
   * confirmation, and then being bounced, is the worst version of this. The
   * store checks again on submit — this one is a courtesy, not the guard.
   */
  function checkEmailTaken() {
    const clean = normaliseEmail(email);
    if (!clean || !EMAIL_RE.test(clean)) return;
    const taken = state.accounts.some((a) => normaliseEmail(a.email) === clean);
    setErrors((e) => ({
      ...e,
      email: taken ? c.errors.emailTaken : undefined,
    }));
  }

  function chooseAccountType(value: AccountType) {
    setAccountType(value);
    if (errors.accountType) setErrors((x) => ({ ...x, accountType: undefined }));
  }

  /** Step one done: on to name, email and password, once a type is chosen. */
  function toDetails(e?: FormEvent) {
    e?.preventDefault();
    if (!accountType) {
      setErrors((x) => ({ ...x, accountType: c.errors.accountType }));
      return;
    }
    setStep("details");
  }

  function changeEmail(value: string) {
    setEmail(value);
    if (errors.email) setErrors((x) => ({ ...x, email: undefined }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;

    const field: SignupErrors = {};
    // Asked first and never preselected: it decides the plans, limits and
    // wording the account gets, so it has to be a choice, not a default.
    if (!accountType) field.accountType = c.errors.accountType;
    if (!name.trim()) field.name = c.errors.name;
    if (!email.trim()) field.email = c.errors.emailRequired;
    else if (!EMAIL_RE.test(email.trim())) field.email = c.errors.email;
    // With the backend the password is set from the emailed link; only the
    // browser-only build, which has no inbox, asks for it here.
    if (!API_ENABLED) {
      if (password.length < 8) field.password = c.errors.short;
      else if (scorePassword(password).score === 0) {
        field.password = c.errors.guessable;
      }
    }
    setErrors(field);
    if (Object.keys(field).length > 0) return;

    setBusy(true);
    justRegistered.current = true;
    const out = await signup(name, email, password, accountType!);
    setBusy(false);
    const failed = out.error;
    if (failed) justRegistered.current = false;

    if (failed) {
      // The email clash is the one failure that belongs to a field.
      if (/email/i.test(failed)) setErrors({ email: failed });
      else setErrors({ form: failed });
      return;
    }

    // With the backend, the account waits for its "set your password" link.
    if (out.setup) {
      setSetup(out.setup);
      return;
    }
    showToast(
      accountType === "company" ? c.signup.createdCompany : c.signup.created,
      "success"
    );
    router.push("/brands/new");
  }

  return {
    step,
    toDetails,
    toType: () => setStep("type"),
    setup,
    clearSetup: () => {
      justRegistered.current = false;
      setSetup(null);
    },
    accountType,
    chooseAccountType,
    name,
    setName,
    email,
    changeEmail,
    checkEmailTaken,
    password,
    setPassword,
    errors,
    busy,
    submit,
  };
}

export type SignupFormState = ReturnType<typeof useSignupForm>;
