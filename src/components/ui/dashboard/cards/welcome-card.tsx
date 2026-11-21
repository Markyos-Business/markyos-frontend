"use client";

import type { ReactNode } from "react";
import { AppDate } from "../../app-date/app-date";
import { Button } from "../../button/button";
import { useDashboardLocale } from "../shared/locale";
import DashboardCard from "./dashboard-card";

export interface WelcomeAction {
  /** Verb + object: "Manage users", "Open media". */
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
  /** Draw it as the primary button. Leave off where the page already has one. */
  primary?: boolean;
}

export interface WelcomeCardProps {
  /** The person's full name; the greeting uses the first word. */
  name: string;
  /** A new account: "Welcome to Markyos" instead of "Welcome back". */
  firstVisit?: boolean;
  /** One sentence on what this screen is for, or what needs them today. */
  message?: ReactNode;
  /** Up to three shortcuts. */
  actions?: WelcomeAction[];
  /** The date shown under the greeting ("16 Nov 2026"). Default: today. */
  date?: Date | string;
  className?: string;
}

/** Outlined shortcuts; one marked `primary` is filled. */
function Shortcuts({ actions }: { actions: WelcomeAction[] }) {
  return actions.slice(0, 3).map((a) => (
    <Button key={a.label} href={a.href} onClick={a.onClick} icon={a.icon} size="sm" variant={a.primary ? "primary" : "secondary"}>
      {a.label}
    </Button>
  ));
}

/** "Welcome back, Nour": first name, or the whole name when it is one word. */
export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";

/**
 * The greeting at the top of a home screen: who is signed in, today's date,
 * one line of context and a few shortcuts. Built on DashboardCard, so it sits
 * in a dashboard grid like any other card and mirrors in Arabic.
 */
export default function WelcomeCard({ name, firstVisit = false, message, actions = [], date, className }: WelcomeCardProps) {
  const { t, lang } = useDashboardLocale();
  const first = firstName(name);
  const greeting = firstVisit
    ? first
      ? t(`Welcome to Markyos, ${first}`, `مرحبًا بك في ماركيوس، ${first}`)
      : t("Welcome to Markyos", "مرحبًا بك في ماركيوس")
    : first
      ? t(`Welcome back, ${first}`, `مرحبًا بعودتك، ${first}`)
      : t("Welcome back", "مرحبًا بعودتك");

  return (
    <DashboardCard
      title={<span dir="auto">{greeting}</span>}
      subtitle={<AppDate value={date ?? new Date()} format="short" locale={lang === "ar" ? "ar" : "en-GB"} />}
      actions={
        actions.length > 0 ? (
          // On a phone the shortcuts drop under the message instead.
          <div className="hidden flex-wrap items-center gap-2 sm:flex">
            <Shortcuts actions={actions} />
          </div>
        ) : undefined
      }
      className={className}
    >
      {message && <p className="text-body text-text-muted">{message}</p>}
      {actions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 sm:hidden">
          <Shortcuts actions={actions} />
        </div>
      )}
    </DashboardCard>
  );
}
