import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
const round=process.env.AUDIT_ROUND, base=process.env.SWEEP_BASE??"http://localhost:3213";
const output=path.resolve(process.env.SWEEP_OUTPUT??`.visual/${round}`);fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{});const results=[];
try {
 for(const lang of ["en","ar"]) for(const theme of ["light","dark"]) for(const width of [1440,375]) {
  const context=await browser.newContext({viewport:{width,height:1000},colorScheme:theme,reducedMotion:"reduce"});
  const page=await context.newPage();const errors=[];page.on("pageerror",e=>errors.push(e.message));
  const routes=round==="A11"?["/","/pricing","/solutions/brand-voice"]:round==="A12"?["/solutions/brand-voice","/solutions/client-handoff"]:["/"];
  for(const route of routes) {
   const response=await page.goto(`${base}/${lang}${route==="/"?"":route}`,{waitUntil:"networkidle"});assert.equal(response.status(),200);
   let detail,rule;
   if(round==="A11") {
    const marks=page.locator('a[aria-label="Markyos"] > span[aria-hidden="true"]');assert.equal(await marks.count(),2);
    detail=await marks.evaluateAll(els=>els.map(el=>({role:el.getAttribute("role"),label:el.parentElement.getAttribute("aria-label"),hidden:el.getAttribute("aria-hidden")})));
    assert(detail.every(x=>!x.role&&x.label&&x.hidden==="true"));rule="role-img-alt";
   } else if(round==="A12") { rule="color-contrast";detail={}; }
   else if(round==="A13") {
    const region=page.getByRole("region",{name:lang==="ar"?"مقارنة أدوات العمل":"Workflow tools comparison",exact:true});await region.scrollIntoViewIfNeeded();await region.focus();await page.keyboard.press("Shift+Tab");await page.keyboard.press("Tab");
    detail=await region.evaluate(el=>({focused:document.activeElement===el,visible:el.matches(":focus-visible"),outline:getComputedStyle(el).outlineStyle,overflow:el.scrollWidth>el.clientWidth,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth}));assert(detail.focused&&detail.visible&&detail.outline!=="none");
    if(width===375){assert(detail.overflow);await region.evaluate(el=>{el.scrollLeft=0;});await region.press(lang==="ar"?"ArrowLeft":"ArrowRight");await page.waitForFunction(label=>Math.abs(document.querySelector(`[aria-label="${label}"]`).scrollLeft)>0,lang==="ar"?"مقارنة أدوات العمل":"Workflow tools comparison");}
    await region.press("Tab");assert.equal(await region.evaluate(el=>document.activeElement===el),false);rule="scrollable-region-focusable";
   } else throw Error(round);
   await page.addScriptTag({path:path.resolve("node_modules/axe-core/axe.min.js")});const violations=await page.evaluate(async rule=>(await window.axe.run(document,{runOnly:{type:"rule",values:[rule]}})).violations,rule);assert.deepEqual(violations,[]);
   assert.deepEqual(errors,[]);results.push({lang,theme,width,route,detail,violations,pageErrors:errors});fs.writeFileSync(path.join(output,"results.json"),JSON.stringify(results,null,2));
  }
  await page.screenshot({path:path.join(output,`${lang}-${theme}-${width}.png`),animations:"disabled"});await context.close();
 }
 console.log(`${round}: ${results.length} configurations passed.`);
}finally{await browser.close();}
