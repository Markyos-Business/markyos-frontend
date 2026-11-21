import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium, expect } from "@playwright/test";
const base=process.env.SWEEP_BASE??"http://localhost:3212";
assert(["localhost","127.0.0.1"].includes(new URL(base).hostname));
const output=path.resolve(process.env.SWEEP_OUTPUT??".visual/popups");fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL??"chrome"});const results=[];
try {
 for(const lang of ["en","ar"]) for(const theme of ["light","dark"]) for(const width of [1440,390]) {
  const t=(en,ar)=>lang==="ar"?ar:en;const context=await browser.newContext({viewport:{width,height:900},reducedMotion:"reduce",colorScheme:theme});
  await context.route("**/*",route=>["GET","HEAD"].includes(route.request().method())?route.continue():route.abort());
  await context.addInitScript(theme=>localStorage.setItem("markyos:theme",theme),theme);
  const page=await context.newPage();const errors=[];page.on("pageerror",error=>errors.push(error.message));
  await page.goto(base+"/design-system/popups",{waitUntil:"networkidle"});if(lang==="ar")await page.locator("[data-popup-language]").click();
  const opener=page.getByRole("button",{name:t("Open popup","فتح النافذة"),exact:true});await opener.focus();await opener.press("Enter");
  let dialog=page.getByRole("dialog",{name:t("Brand details","تفاصيل العلامة"),exact:true});await expect(dialog).toBeVisible();
  assert.equal(await dialog.evaluate(el=>el.parentElement.parentElement===document.body),true);
  assert.equal(await dialog.evaluate(el=>getComputedStyle(el).direction),lang==="ar"?"rtl":"ltr");
  assert.equal(await page.evaluate(()=>document.body.style.overflow),"hidden");
  await expect(dialog.getByRole("textbox",{name:t("Brand name","اسم العلامة"),exact:true})).toBeFocused();
  const described=await dialog.getAttribute("aria-describedby");assert(described);assert(await page.locator(`[id="${described}"]`).textContent());
  const city=dialog.getByRole("combobox",{name:t("City","المدينة"),exact:true});await city.click();await expect(page.getByRole("option",{name:t("Riyadh","الرياض"),exact:true})).toBeVisible();await page.keyboard.press("Escape");await expect(dialog).toBeVisible();
  await dialog.getByRole("combobox",{name:t("Legacy city","المدينة بالقائمة القديمة"),exact:true}).click();await page.keyboard.press("Escape");await expect(dialog).toBeVisible();
  await dialog.getByRole("button",{name:t("Open nested popup","فتح نافذة متداخلة"),exact:true}).click();await expect(page.getByRole("dialog",{name:t("Nested details","تفاصيل متداخلة"),exact:true})).toBeVisible();await page.keyboard.press("Escape");await expect(dialog).toBeVisible();await expect(dialog.getByRole("button",{name:t("Open nested popup","فتح نافذة متداخلة"),exact:true})).toBeFocused();
  await dialog.getByRole("button",{name:t("Open confirmation","فتح التأكيد"),exact:true}).click();await expect(page.getByRole("dialog",{name:t("Discard changes?","تجاهل التغييرات؟"),exact:true})).toBeVisible();await page.keyboard.press("Escape");await expect(dialog).toBeVisible();
  await expect(page.locator("[data-popup-root]")).toHaveCount(1);await expect(page.locator("[data-popup-portal]")).toHaveCount(0);
  const close=dialog.getByRole("button",{name:t("Close popup","إغلاق النافذة"),exact:true});await close.focus();await page.keyboard.press("Tab");assert(await dialog.evaluate(el=>el.contains(document.activeElement)));await page.keyboard.press("Shift+Tab");await expect(close).toBeFocused();
  assert(await dialog.evaluate(el=>el.getBoundingClientRect().width<=innerWidth));await page.screenshot({path:path.join(output,`${lang}-${theme}-${width}-center.png`)});
  await close.click();await expect(page.locator("[data-popup-root]")).toHaveCount(0);await expect(opener).toBeFocused();assert.equal(await page.evaluate(()=>document.body.style.overflow),"");
  await page.getByRole("button",{name:t("Open sheet","فتح اللوحة الجانبية"),exact:true}).click();dialog=page.getByRole("dialog",{name:t("Brand activity","نشاط العلامة"),exact:true});await expect(dialog).toBeVisible();await expect.poll(async()=>{const rect=await dialog.boundingBox();return !!rect&&rect.x>=-1&&rect.x+rect.width<=width+1&&(width!==1440||(lang==="ar"?rect.x<1:rect.x>900));}).toBe(true);
  await page.screenshot({path:path.join(output,`${lang}-${theme}-${width}-sheet.png`)});await page.keyboard.press("Escape");await expect(page.locator("[data-popup-root]")).toHaveCount(0);
  await page.getByRole("button",{name:t("Open form","فتح النموذج"),exact:true}).click();dialog=page.getByRole("dialog",{name:t("Save brand","حفظ العلامة"),exact:true});await expect(dialog).toBeVisible();await dialog.getByRole("button",{name:t("Fail next save","إظهار خطأ الحفظ التالي"),exact:true}).click();await dialog.getByRole("textbox",{name:t("Brand name","اسم العلامة"),exact:true}).press("Enter");await expect(dialog).toHaveAttribute("aria-busy","true");await page.keyboard.press("Escape");await page.mouse.click(1,1);await expect(dialog).toBeVisible();await expect(dialog.getByRole("alert")).toBeVisible();await page.screenshot({path:path.join(output,`${lang}-${theme}-${width}-error.png`)});
  await dialog.getByRole("button",{name:t("Save brand","حفظ العلامة"),exact:true}).click();await expect(page.locator("[data-popup-root]")).toHaveCount(0);assert.equal(errors.length,0,errors.join("\n"));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  results.push({lang,theme,width,checks:"portal, labels, RTL, nested Escape, select portals, focus trap/return, scroll lock, responsive sheet, native form submit, busy dismissal, error recovery"});await context.close();
 }
 fs.writeFileSync(path.join(output,"results.json"),JSON.stringify(results,null,2));console.log(`Popup: ${results.length} language/theme/viewport scenarios passed.`);
}finally{await browser.close();}
