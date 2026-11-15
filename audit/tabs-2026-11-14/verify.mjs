import {chromium, expect} from '@playwright/test';
import {strict as assert} from 'node:assert';
import {writeFile} from 'node:fs/promises';
const output=new URL('./',import.meta.url).pathname;
const browser=await chromium.launch({channel:process.env.TABS_CHROME?undefined:'chrome',executablePath:process.env.TABS_CHROME,headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1100}});
const page=await context.newPage();
const errors=[];page.on('pageerror',error=>errors.push(error.message));
// The gallery is independent of authentication; do not call the developer's API.
await page.route('**/auth/token/refresh/',route=>route.fulfill({status:401,body:'{}',headers:{'Access-Control-Allow-Origin':new URL(process.env.TABS_GALLERY_URL??'http://127.0.0.1:3106').origin,'Access-Control-Allow-Credentials':'true'}}));
const checks=[];const pass=name=>{checks.push(name);console.log(`PASS ${name}`);};
const example=name=>page.locator(`[data-example="${name}"]`);
const tab=(scope,name)=>scope.getByRole('tab',{name:new RegExp(`^${name}( |$)`) });
try {
 await page.goto(process.env.TABS_GALLERY_URL??'http://127.0.0.1:3106/design-system/tabs',{waitUntil:'networkidle'});
 const gallery=page.locator('#tabs-family');await gallery.waitFor();
 await page.evaluate(()=>{document.documentElement.dir='ltr';document.documentElement.lang='en';});
 const auto=example('underline');const details=tab(auto,'Details');const rights=tab(auto,'Rights');
 await expect(details).toHaveAttribute('aria-selected','true');
 const controls=await details.getAttribute('aria-controls');const triggerId=await details.getAttribute('id');
 await expect(page.locator(`[id="${controls}"]`)).toHaveAttribute('aria-labelledby',triggerId);
 await details.focus();await page.keyboard.press('ArrowRight');await expect(rights).toHaveAttribute('aria-selected','true');
 await page.keyboard.press('End');await expect(tab(auto,'Activity')).toBeFocused();
 await page.keyboard.press('Home');await expect(details).toBeFocused();
 pass('Compound/data-driven tabs link panels and support automatic arrows, Home/End');
 const manual=example('manual');await tab(manual,'Details').focus();await page.keyboard.press('ArrowRight');await expect(tab(manual,'Rights')).toBeFocused();await expect(tab(manual,'Details')).toHaveAttribute('aria-selected','true');await page.keyboard.press('Enter');await expect(tab(manual,'Rights')).toHaveAttribute('aria-selected','true');await page.keyboard.press('ArrowRight');await expect(tab(manual,'Versions')).toBeFocused();await page.keyboard.press('Space');await expect(tab(manual,'Versions')).toHaveAttribute('aria-selected','true');
 pass('Manual mode moves focus without selection until Enter/Space');
 const vertical=example('vertical');await tab(vertical,'Profile').focus();await page.keyboard.press('ArrowDown');await expect(tab(vertical,'Team')).toHaveAttribute('aria-selected','true');await page.keyboard.press('ArrowUp');await expect(tab(vertical,'Profile')).toHaveAttribute('aria-selected','true');
 pass('Vertical settings use Up/Down');
 await details.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');await expect(details).toBeFocused();
 pass('Tab re-entry lands on the selected tab');
 const state=example('states');const disabled=tab(state,'Disabled');await disabled.focus();await page.keyboard.press('Enter');await expect(disabled).toHaveAttribute('aria-selected','false');assert(await disabled.getAttribute('aria-describedby'));await expect(tab(state,'Selected')).toHaveAttribute('aria-selected','true');
 const namedRights=await rights.getAttribute('aria-label');void namedRights;
 const tree=await auto.ariaSnapshot();assert.match(tree,/Rights 2 items Needs attention 2 of 4/);
 pass('Disabled reasons stay reachable; names include count, status and position');
 const guard=example('guard');await tab(guard,'Rights').click();const dialog=page.getByRole('dialog');await dialog.waitFor();await dialog.getByRole('button',{name:'Keep editing',exact:true}).last().click();await expect(tab(guard,'Details')).toHaveAttribute('aria-selected','true');await tab(guard,'Rights').click();await dialog.waitFor();await dialog.getByRole('button',{name:'Leave tab',exact:true}).click();await expect(tab(guard,'Rights')).toHaveAttribute('aria-selected','true');
 pass('Asynchronous unsaved guard can refuse or allow without duplicate dialogs');
 const lazy=example('lazy');await tab(lazy,'History').click();await expect(lazy.locator('[role=status][aria-busy=true]')).toContainText('Loading content');const note=lazy.getByRole('textbox',{name:'Version note'});await note.fill('Retained note');await tab(lazy,'Summary').click();await tab(lazy,'History').click();await expect(note).toHaveValue('Retained note');await tab(lazy,'Versions').click();await expect(lazy.getByText('No versions',{exact:true})).toBeVisible();await tab(lazy,'Failed').click();await expect(lazy.getByRole('alert')).toContainText('Could not load content');await expect(lazy.getByRole('button',{name:'Try again',exact:true})).toBeVisible();await tab(lazy,'Summary').click();
 pass('Lazy loading, keepMounted form state, empty panel and retryable error render');
 const language=example('language');await tab(language,'AR').click();await expect(language.getByRole('tabpanel')).toHaveAttribute('dir','rtl');await expect(tab(language,'AR')).toContainText('Needs Arabic');
 pass('Language preset warns about missing Arabic and gives its panel RTL');
 const steps=example('stepper');await tab(steps,'Assets').focus();await page.keyboard.press('Enter');await expect(tab(steps,'Brief')).toHaveAttribute('aria-selected','true');await steps.getByRole('button',{name:'Complete brief',exact:true}).click();await tab(steps,'Assets').click();await expect(tab(steps,'Assets')).toHaveAttribute('aria-selected','true');await tab(steps,'Review').focus();await page.keyboard.press('Enter');await expect(tab(steps,'Assets')).toHaveAttribute('aria-selected','true');
 pass('Linear campaign steps block ahead until prerequisites complete');
 const route=example('router');await expect(route.getByRole('link',{name:'Tabs',exact:true})).toHaveAttribute('aria-current','page');assert.equal(await route.getByRole('tab').count(),0);assert.equal(await route.locator('[aria-current=page]').count(),1);
 pass('Router tabs use real links and one most-specific current route');
 const edit=example('editable');const original=(await edit.getByRole('tab').allTextContents()).map(x=>x.trim());await tab(edit,'Logo').focus();await page.keyboard.press('Alt+ArrowRight');await expect(edit.getByRole('tab').nth(1)).toContainText('Logo');await expect(edit.locator('[aria-selected=true]')).toContainText('Logo');await page.keyboard.press('Delete');await expect(edit.getByRole('tab')).toHaveCount(2);await edit.getByRole('button',{name:'Add tab',exact:true}).click();await expect(edit.getByRole('tab')).toHaveCount(3);assert.equal(original.length,3);
 pass('Alt+arrows reorder with selection retained; Delete closes; add creates a tab');
 const handles=edit.getByRole('button',{name:/^Drag tab:/});const firstBox=await handles.nth(0).boundingBox();const lastBox=await handles.nth(2).boundingBox();const beforeDrag=await edit.getByRole('tab').allTextContents();
 await handles.nth(0).scrollIntoViewIfNeeded();const first=await handles.nth(0).boundingBox();const last=await handles.nth(2).boundingBox();assert(firstBox&&lastBox&&first&&last);await page.mouse.move(first.x+first.width/2,first.y+first.height/2);await page.mouse.down();await page.mouse.move(last.x+last.width/2,last.y+last.height/2,{steps:12});await page.waitForTimeout(100);await page.mouse.up();await expect.poll(()=>edit.getByRole('tab').allTextContents()).not.toEqual(beforeDrag);
 pass('dnd-kit pointer handles reorder tabs');
 await writeFile(`${output}accessibility.yml`,await gallery.ariaSnapshot());
 await page.setViewportSize({width:390,height:844});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
 const overflow=example('overflow');const more=overflow.getByRole('button',{name:'More',exact:true});await expect(more).toBeVisible();await more.click();await page.getByRole('menuitem',{name:'Metadata',exact:true}).click();await expect(tab(overflow,'Metadata')).toHaveAttribute('aria-selected','true');await expect(overflow.getByRole('tabpanel')).toContainText('Metadata');
 pass('ResizeObserver moves overflow to More and pins the selected result');
 const scroll=example('scroll');const scrollList=scroll.getByRole('tablist');await scroll.getByRole('button',{name:'Next tabs',exact:true}).click();assert(await scrollList.evaluate(el=>Math.abs(el.scrollLeft)>0));await tab(scroll,'Metadata').click();const visible=await tab(scroll,'Metadata').evaluate(el=>{const a=el.getBoundingClientRect(),b=el.closest('[role=tablist]').getBoundingClientRect();return a.left>=b.left-1&&a.right<=b.right+1;});assert(visible);
 pass('Scroll arrows work and active tabs scroll into view');
 const mobile=example('mobile');const select=mobile.getByRole('combobox',{name:'Mobile sections'});await select.selectOption('rights');await expect(mobile.getByRole('tabpanel')).toContainText('licences');
 pass('Below 640px mobileAs select switches list and selects its panel');
 await page.setViewportSize({width:1440,height:1100});await page.locator('[data-tabs-language]').click();await tab(auto,'التفاصيل').focus();await page.keyboard.press('ArrowLeft');await expect(tab(auto,'الحقوق')).toHaveAttribute('aria-selected','true');
 pass('Inherited Arabic direction mirrors automatic arrow navigation');
 await page.emulateMedia({reducedMotion:'reduce'});assert(await auto.locator('.mk-tabs-underline').evaluate(el=>getComputedStyle(el).transitionDuration.split(',').every(value=>parseFloat(value)<.001))); await page.emulateMedia({reducedMotion:'no-preference'});
 pass('Reduced motion removes colour and underline transitions');
 await page.addStyleTag({content:'nextjs-portal{display:none!important}html{scroll-behavior:auto!important}'});
 for(const theme of ['light','dark']){await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);await page.waitForTimeout(200);await page.screenshot({path:`${output}${theme}-ar.png`,fullPage:true});}
 await page.locator('[data-tabs-language]').click();
 for(const theme of ['light','dark']){await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);await page.waitForTimeout(200);await page.screenshot({path:`${output}${theme}-en.png`,fullPage:true});}
 for(const variant of ['underline','segmented','boxed','vertical']) { const selected=example(variant).locator('[role=tab][aria-selected=true]'); await selected.hover(); assert.equal(await selected.evaluate(el=>getComputedStyle(el).backgroundImage),'none'); }
 pass('Selected tab hover avoids the inherited contrast-reducing veil');
 const contrasts=[];
 for(const theme of ['light','dark']){await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);await page.waitForTimeout(150);const samples=await gallery.locator('[role=tab]:visible:not([data-skeleton])').evaluateAll(tabs=>tabs.map(el=>{const parse=s=>{const n=s.match(/[\d.]+/g)?.map(Number)??[];return n.length>=3?[...n.slice(0,3),n[3]??1]:[0,0,0,0];};let bg=[0,0,0];const chain=[];for(let e=el;e;e=e.parentElement)chain.unshift(e);for(const e of chain){const c=parse(getComputedStyle(e).backgroundColor);bg=bg.map((v,i)=>v*(1-c[3])+c[i]*c[3]);}const c=parse(getComputedStyle(el).color);return {label:el.textContent.trim(),bg,fg:c.slice(0,3).map((v,i)=>v*c[3]+bg[i]*(1-c[3]))};}));const lum=rgb=>rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);for(const s of samples){const a=lum(s.fg),b=lum(s.bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);contrasts.push({theme,label:s.label,ratio});assert(ratio>=4.5,`${theme} ${s.label} ${ratio}`);}}
 pass('Tab text in both themes clears 4.5:1');
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(300);await expect.poll(()=>tab(scroll,'Metadata').evaluate(el=>{const a=el.getBoundingClientRect(),b=el.closest('[role=tablist]').getBoundingClientRect();return a.left>=b.left-1&&a.right<=b.right+1;})).toBe(true);await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`${output}mobile-en.png`,fullPage:true});await page.locator('[data-tabs-language]').click();await page.waitForTimeout(150);await page.screenshot({path:`${output}mobile-ar.png`,fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);
 pass('390px English and Arabic layouts fit without page overflow');
 assert.deepEqual(errors,[]);pass('No browser runtime errors');
 await writeFile(`${output}results.json`,JSON.stringify({checks,contrasts,errors},null,2));
} catch(error) { await writeFile(`${output}failure.txt`,await page.locator('body').ariaSnapshot()); await page.screenshot({path:`${output}failure.png`,fullPage:true}); throw error; } finally {await browser.close();}
