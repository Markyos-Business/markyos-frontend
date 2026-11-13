import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';
import { browserOnlyBrandSeed, browserOnlyContext, brandRoleFixture } from './fixtures/browserOnlyBrand.mjs';
const base=process.env.SWEEP_BASE??'http://localhost:3212';
const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL??'chrome'});
const results=[];
try {
 const seed=await browserOnlyBrandSeed(browser,base);
 for(const type of ['company','studio','freelancer']) for(const lang of ['en','ar']) for(const width of [962,375]) {
  const {state,workspace}=brandRoleFixture(seed,'owner',lang);
  state.accounts.find(a=>a.id===state.session.accountId).accountType=type;
  workspace.name='Markyos';workspace.initials='MA';workspace.primaryLocale=lang;workspace.published=null;
  Object.values(workspace.logo).forEach(s=>s.phase='empty');workspace.colors=[];
  workspace.strategy.purpose='';workspace.strategy.purposeAr='';
  const context=await browserOnlyContext(browser,{viewport:{width,height:666},reducedMotion:'reduce'});
  await context.addInitScript(({state,lang})=>{if(!sessionStorage.getItem('audit-seeded')) {localStorage.setItem('markyos:v1',JSON.stringify(state));localStorage.setItem('markyos.lang',lang);sessionStorage.setItem('audit-seeded','1');}},{state,lang});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${base}/w/nadeen-studio/overview?lang=${lang}`,{waitUntil:'networkidle'});
  assert.equal(await page.locator('a[href="/w/nadeen-studio/visual-identity?tab=logo"]').count(),1);
  assert.equal(await page.locator('a[href="/w/nadeen-studio/strategy?tab=purpose"]').count(),1);
  let fonts=[];
  if(lang==='ar') {
   await page.evaluate(()=>document.fonts.ready);
   const cdp=await context.newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');
   const {root}=await cdp.send('DOM.getDocument');const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector:'h1'});
   if(nodeId) fonts=(await cdp.send('CSS.getPlatformFontsForNode',{nodeId})).fonts;
   // The title contains a Latin brand name; inspect a checklist's actual Arabic glyphs too.
   const {nodeId:arabic}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector:'a[href="/w/nadeen-studio/visual-identity?tab=logo"]'});
   const arabicFonts=(await cdp.send('CSS.getPlatformFontsForNode',{nodeId:arabic})).fonts;
   assert(arabicFonts.some(f=>/Plex.*Arabic/i.test(f.familyName)&&f.isCustomFont),JSON.stringify(arabicFonts));fonts.push(...arabicFonts);
  }
  for(const [route,label,arLabel,last] of [['visual-identity','Visual identity','الهوية البصرية','icons'],['strategy','Strategy','الاستراتيجية','tone']]) {
   await page.goto(`${base}/w/nadeen-studio/${route}?lang=${lang}&tab=${route==='strategy'?'purpose':'logo'}`,{waitUntil:'networkidle'});
   const tabs=page.getByRole('tablist',{name:lang==='ar'?arLabel:label,exact:true});
   const selected=tabs.locator('[aria-selected="true"]');await selected.press('End');
   await page.waitForURL(u=>u.searchParams.get('tab')===last);
   const id=await selected.getAttribute('id'),panel=await selected.getAttribute('aria-controls');
   assert.equal(await page.locator(`[id="${panel}"]`).getAttribute('aria-labelledby'),id);
   await page.reload({waitUntil:'networkidle'});assert.equal(new URL(page.url()).searchParams.get('tab'),last);
   await page.goBack({waitUntil:'networkidle'});
   assert.notEqual(new URL(page.url()).searchParams.get('tab'),last);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${route} overflow ${width} ${lang}`);
  }
  await page.goto(`${base}/account?tab=billing&lang=${lang}`,{waitUntil:'networkidle'});
  assert(await page.getByText(lang==='ar'?/الخطط المدفوعة تخص كل علامة/:/Paid plans apply per brand/).count());
  assert.equal(errors.length,0,errors.join('\n'));results.push({type,lang,width,fonts});await context.close();
 }
 for(const lang of ['en','ar']) {
  const context=await browserOnlyContext(browser,{viewport:{width:375,height:666}});
  await context.addInitScript(lang=>localStorage.setItem('markyos.lang',lang),lang);
  const page=await context.newPage();
  await page.goto(`${base}/login?lang=${lang}`,{waitUntil:'networkidle'});
  const email=page.locator('input[type="email"]'),password=page.locator('input[type="password"]');
  assert(!/[•●]/.test(await password.getAttribute('placeholder')??''));
  await email.focus();await page.keyboard.press('Tab');assert(await password.evaluate(e=>e===document.activeElement));
  await page.locator('button[type="submit"]').click();
  await page.getByText(lang==='ar'?'أدخل بريدك الإلكتروني.':'Enter your email.',{exact:true}).waitFor();
  await page.goto(`${base}/signup?lang=${lang}`,{waitUntil:'networkidle'});
  const types=page.getByRole('radiogroup',{name:lang==='ar'?'لمن هذا الحساب؟':'Who is this account for?',exact:true});
  assert.equal(await types.getByRole('radio').count(),3);
  await types.getByRole('radio').first().check();await page.locator('button[type="submit"]').click();
  await page.locator('input[type="password"]').waitFor();
  assert.equal(await page.locator('input[type="password"]').count(),1);
  results.push({auth:lang});await context.close();
 }
 fs.writeFileSync(process.env.SWEEP_OUTPUT??'/tmp/markyos-november-audit.json',JSON.stringify(results,null,2));
 console.log(`${results.length} account/language/viewport scenarios passed`);
} finally {await browser.close();}
