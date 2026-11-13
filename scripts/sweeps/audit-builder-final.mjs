import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { browserOnlyBrandSeed, browserOnlyContext, brandRoleFixture } from "./fixtures/browserOnlyBrand.mjs";
import { discoveryFixture, mockDiscovery } from "./fixtures/browserOnlyDiscovery.mjs";

const round=process.env.AUDIT_ROUND,base=process.env.SWEEP_BASE??"http://localhost:3212";
const output=path.resolve(process.env.SWEEP_OUTPUT??`.visual/${round}`);fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{}),results=[];
try {
 const seed=await browserOnlyBrandSeed(browser,base);
 const variants=round==="A4"?["vault","docs","manual","mosaic","deck","studio:prism","studio:atlas","studio:signal"]:["draft","sent","submitted"];
 for(const variant of variants) for(const lang of ["en","ar"]) for(const theme of ["light","dark"]) for(const width of [1440,375]) {
  const {state,workspace}=brandRoleFixture(seed,"owner",lang);
  if(round==="A4"){
   const [template,style]=variant.split(":");workspace.guidelineTemplate=template;if(style)workspace.studioStyle=style;
   workspace.customBlocks=["text","text","quote","image","gallery","video","stat","faq"].map((kind,order)=>({id:`audit-${order}`,kind,order,title:order===0?"Heading":kind==="faq"?"Question":kind==="stat"?"42":"",arTitle:order===0?"عنوان":kind==="faq"?"سؤال":kind==="stat"?"٤٢":"",text:order===0?"Body":"",arText:order===0?"نص":"",assetIds:[]}));
   workspace.hiddenSections=[];
  }
  const context=await browserOnlyContext(browser,{viewport:{width,height:1000},colorScheme:theme,reducedMotion:"reduce"});
  await context.addInitScript(({state,lang,theme})=>{localStorage.setItem("markyos:v1",JSON.stringify(state));localStorage.setItem("markyos.lang",lang);localStorage.setItem("markyos:theme",theme);},{state,lang,theme});
  const fixture=round==="A5"?await mockDiscovery(context,discoveryFixture(workspace,variant)):null;
  const page=await context.newPage(),errors=[];page.on("pageerror",e=>errors.push(e.message));
  let detail;
  if(round==="A4"){
   await page.goto(`${base}/w/nadeen-studio/builder?lang=${lang}`,{waitUntil:"networkidle"});
   await page.locator('[contenteditable="true"][role="textbox"]').first().waitFor();
   await page.locator('details').evaluateAll(els=>els.forEach(el=>el.open=true));
   const editors=page.locator('[contenteditable="true"][role="textbox"]');
   const names=await editors.evaluateAll(els=>els.map(el=>({name:el.getAttribute("aria-label"),multiline:el.getAttribute("aria-multiline"),empty:!el.textContent.trim()})));
   assert(names.length>=10,`${variant}: ${names.length} editors`);assert(names.every(e=>e.name?.trim()&&["true","false"].includes(e.multiline)));
   assert(names.some(e=>e.empty)&&names.some(e=>!e.empty));
   assert(names.every(e=>lang==="ar"?/[\u0600-\u06ff]/.test(e.name):/[A-Za-z]/.test(e.name)));
   assert.equal(await page.getByRole("heading",{level:1}).count(),1);
   await page.addScriptTag({path:path.resolve("node_modules/axe-core/axe.min.js")});const violations=await page.evaluate(async()=>(await window.axe.run(document,{runOnly:{type:"rule",values:["aria-input-field-name"]}})).violations);assert.deepEqual(violations,[]);
   const first=editors.first();await first.fill("Keyboard audit edit");await first.press("Tab");
   await page.waitForFunction(()=>localStorage.getItem("markyos:v1").includes("Keyboard audit edit"));
   detail={editors:names.length,empty:names.filter(e=>e.empty).length,allNamed:true,violations,editPersisted:true};
  } else if(round==="A5"){
   await page.goto(`${base}/w/nadeen-studio/forms/audit-form/edit?lang=${lang}`,{waitUntil:"networkidle"});
   const row=page.getByRole("tablist",{name:lang==="ar"?"الأقسام":"Sections",exact:true}),tabs=row.getByRole("tab");await tabs.first().waitFor();
   assert.equal(await row.locator('button:not([role="tab"])').count(),0);
   const check=async()=>{const selected=row.locator('[aria-selected="true"]');assert.equal(await selected.count(),1);assert.equal(await row.locator('[tabindex="0"]').count(),1);const id=await selected.getAttribute('id'),controls=await selected.getAttribute('aria-controls');assert(await page.evaluate(({id,controls})=>{const p=document.getElementById(controls);return p?.getAttribute('role')==='tabpanel'&&p.getAttribute('aria-labelledby')===id;},{id,controls}));};
   await tabs.first().focus();await tabs.first().press("End");await check();assert.equal(await tabs.nth(1).getAttribute('aria-selected'),'true');
   await tabs.nth(1).press(lang==="ar"?"ArrowLeft":"ArrowRight");await check();assert.equal(await tabs.first().getAttribute('aria-selected'),'true');
   if(variant==="draft"){
    await page.getByRole('button',{name:lang==="ar"?"قسم":"Section",exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('[role="tablist"][aria-label="Sections"] [role="tab"], [role="tablist"][aria-label="الأقسام"] [role="tab"]').length===3);await check();
    await page.getByRole('button',{name:lang==="ar"?"حذف القسم":"Delete section",exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:lang==="ar"?"حذف القسم":"Delete section",exact:true}).click();
    await page.waitForFunction(()=>document.querySelectorAll('[role="tablist"][aria-label="Sections"] [role="tab"], [role="tablist"][aria-label="الأقسام"] [role="tab"]').length===2);await check();
    const source=page.locator('[draggable="true"]').first(),transfer=await page.evaluateHandle(()=>new DataTransfer());
    await source.dispatchEvent('dragstart',{dataTransfer:transfer});await tabs.nth(1).dispatchEvent('dragover',{dataTransfer:transfer});const saved=page.waitForResponse(r=>r.url().includes('questions/reorder/')&&r.status()===200);await tabs.nth(1).dispatchEvent('drop',{dataTransfer:transfer});await saved;
    assert.equal(fixture.current().sections[0].questions.length,0);assert.equal(fixture.current().sections[1].questions.length,2);
   }else{
    assert.equal(await page.getByRole('button',{name:lang==="ar"?"حذف القسم":"Delete section",exact:true}).isDisabled(),true);
    if(variant==="submitted")assert.equal(await page.getByRole('button',{name:lang==="ar"?"قسم":"Section",exact:true}).isDisabled(),true);
   }
   await page.addScriptTag({path:path.resolve("node_modules/axe-core/axe.min.js")});const violations=await page.evaluate(async()=>(await window.axe.run(document,{runOnly:{type:"rule",values:["aria-required-children","aria-required-parent","aria-valid-attr-value"]}})).violations);assert.deepEqual(violations,[]);
   detail={validChildren:true,panelLinks:true,keyboard:true,operations:fixture.operations,violations};
  }else throw Error(round);
  assert.deepEqual(errors,[]);results.push({variant,lang,theme,width,detail,pageErrors:errors});fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));
  if(theme==='dark'&&width===375)await page.screenshot({path:path.join(output,`${variant.replace(':','-')}-${lang}.png`),animations:'disabled'});
  await context.close();
 }
 console.log(`${round}: ${results.length} configurations passed. Only disposable browser/HTTP fixtures mutated.`);
}finally{await browser.close();}
