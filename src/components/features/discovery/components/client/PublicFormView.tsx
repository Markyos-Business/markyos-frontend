"use client";

import { Icon } from "@/components/ui";
import type { Lang } from "@/types";
import { usePublicForm, type PublicFormProblem } from "../../hooks/usePublicForm";
import { formPalette, paletteVars } from "../../model/theme";
import type { FormTheme } from "../../types";
import { ClientForm } from "./ClientForm";

const NOTICES: Record<PublicFormProblem, { icon: string; en: [string, string]; ar: [string, string] }> = {
  missing: {
    icon: "unlink",
    en: ["This link doesn't work", "It may have been mistyped, or the form hasn't been sent yet. Ask whoever sent it for the link again."],
    ar: ["هذا الرابط لا يعمل", "ربما كُتب بشكل خاطئ، أو لم يُرسَل النموذج بعد. اطلب الرابط مجددًا ممن أرسله."],
  },
  revoked: {
    icon: "lock",
    en: ["This link was switched off", "The studio turned it off. Ask them for a new one if you still need it."],
    ar: ["أُوقف هذا الرابط", "أوقفه الاستوديو. اطلب منهم رابطًا جديدًا إن كنت ما زلت بحاجة إليه."],
  },
  closed: {
    icon: "clock",
    en: ["This form has closed", "It stopped taking answers on its closing date. Ask the studio if you'd like it reopened."],
    ar: ["أُغلق هذا النموذج", "توقّف عن استقبال الإجابات في موعد إغلاقه. تواصل مع الاستوديو إن رغبت في إعادة فتحه."],
  },
  offline: {
    icon: "sync",
    en: ["Can't reach the form", "Check your connection, then reload this page."],
    ar: ["تعذّر الوصول إلى النموذج", "تحقّق من الاتصال، ثم أعد تحميل الصفحة."],
  },
  error: {
    icon: "exclamation-circle",
    en: ["Something went wrong", "Reload the page in a minute. Your saved answers are safe."],
    ar: ["حدث خطأ ما", "أعد تحميل الصفحة بعد دقيقة. إجاباتك المحفوظة في أمان."],
  },
};

const NEUTRAL: Pick<FormTheme, "accent" | "background"> = { accent: null, background: "light" };

/** One line of why, on the studio's palette when there is one. */
function Notice({ problem, lang, theme }: { problem: PublicFormProblem; lang: Lang; theme: Pick<FormTheme, "accent" | "background"> }) {
  const { palette } = formPalette(theme);
  const notice = NOTICES[problem];
  const [title, body] = notice[lang];
  const isAr = lang === "ar";
  return (
    <main
      dir={isAr ? "rtl" : "ltr"}
      lang={lang}
      style={paletteVars(palette)}
      className={`grid min-h-screen place-items-center bg-[var(--f-background)] px-space-6 text-[var(--f-text)] ${isAr ? "font-arabic" : ""}`}
    >
      <div className="flex max-w-120 flex-col items-center gap-space-4 text-center">
        <span className="grid size-control place-items-center rounded-lg bg-[var(--f-raised)] text-[var(--f-muted)]">
          <Icon name={notice.icon} size={22} />
        </span>
        <h1 className={`text-h4 font-medium ${isAr ? "leading-[1.3]" : ""}`}>{title}</h1>
        <p className={`text-body text-[var(--f-muted)] ${isAr ? "leading-[1.7]" : ""}`}>{body}</p>
      </div>
    </main>
  );
}

/** The client's link: loads the form, saves as they go, and says plainly when it can't be filled in. */
export function PublicFormView({ token }: { token: string }) {
  const { form, problem, answers, files, lang, setLang, submitted, saveState, answer, upload, submit } = usePublicForm(token);

  if (problem && !(problem === "closed" && submitted)) {
    return <Notice problem={problem} lang={lang} theme={form?.theme ?? NEUTRAL} />;
  }
  if (!form) return <div aria-busy="true" className="min-h-screen" />;

  return (
    <ClientForm
      form={form}
      answers={answers}
      onAnswer={answer}
      saveState={saveState}
      onSubmit={submit}
      submitted={submitted}
      onUpload={upload}
      files={files}
      lang={lang}
      onLang={setLang}
    />
  );
}
