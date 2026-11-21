import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
const base=process.env.SWEEP_BASE??"http://localhost:3212";
assert(["localhost","127.0.0.1"].includes(new URL(base).hostname));
const browser=await chromium.launch({channel:"chrome"});
try {
 for(const lang of ["en","ar"]) for(const width of [1440,390]) {
  const t=(en,ar)=>lang==="ar"?ar:en;const c=await browser.newContext({viewport:{width,height:900},reducedMotion:"reduce"});
  await c.route("**/*",r=>["GET","HEAD"].includes(r.request().method())?r.continue():r.abort());
  const p=await c.newPage();const errors=[];p.on("pageerror",e=>errors.push(e.message));
  await p.goto(base+"/design-system/form-structure",{waitUntil:"networkidle"});if(lang==="ar")await p.getByRole("radio",{name:"العربية",exact:true}).click();
  const opener=p.getByRole("button",{name:t("Invite teammate","دعوة زميل"),exact:true});await opener.click();
  const dialog=p.getByRole("dialog",{name:t("Invite teammate","دعوة زميل"),exact:true});await expect(dialog).toBeVisible();
  const email=dialog.getByRole("textbox",{name:t("Email","البريد"),exact:true});await email.fill("popup-test@example.test");assert(await email.evaluate(el=>!!el.form&&el.form.contains(el)));
  await dialog.getByRole("combobox",{name:t("Role","الدور"),exact:true}).click();await p.getByRole("option",{name:t("Editor","محرر"),exact:true}).click();
  await email.press("Enter");await expect(dialog).toHaveAttribute("aria-busy","true");await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();await opener.click();await expect(email).toHaveValue("");await email.fill("dirty@example.test");await p.keyboard.press("Escape");
  const confirm=p.getByRole("dialog",{name:t("Discard changes?","تجاهل التغييرات؟"),exact:true});await expect(confirm).toBeVisible();await p.keyboard.press("Escape");await expect(dialog).toBeVisible();await expect(email).toHaveValue("dirty@example.test");
  await p.keyboard.press("Escape");await expect(confirm).toBeVisible();await confirm.getByRole("button",{name:t("Discard","تجاهل"),exact:true}).click();await expect(dialog).not.toBeVisible();assert.equal(errors.length,0,errors.join("\n"));await c.close();
 }
 console.log("React Hook Form popup: 4 language/viewport scenarios passed; native form ownership, Enter submit, busy, focus, fresh reopening and nested discard flow.");
}finally{await browser.close();}
