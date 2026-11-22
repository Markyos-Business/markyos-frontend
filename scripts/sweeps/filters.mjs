import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';
const base=process.env.SWEEP_BASE??'http://localhost:3212';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const output=path.resolve(process.env.SWEEP_OUTPUT??'.visual/filters');fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome'});const results=[];
try {for(const lang of ['en','ar'])for(const theme of ['light','dark'])for(const width of [390,768,1440]){
 const t=(en,ar)=>lang==='ar'?ar:en;
 const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce',colorScheme:theme});
 await context.route('**/*',r=>['GET','HEAD'].includes(r.request().method())?r.continue():r.abort());
 await context.addInitScript(v=>localStorage.setItem('markyos:theme',v),theme);
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/design-system/filters',{waitUntil:'networkidle'});if(lang==='ar')await page.locator('[data-filter-language]').click();
 const bar=page.locator('[data-filter-bar]');const mobile=width<640;const open=bar.getByRole('button',{name:t('Filters','عوامل التصفية'),exact:true});
 await page.screenshot({path:path.join(output,`${lang}-${theme}-${width}-default.png`)});
 if(mobile){await expect(page.locator('[data-filter-controls]')).toBeHidden();await open.click();await expect(page.getByRole('dialog')).toBeVisible();}
 else {const sizes=await page.locator('[data-filter-controls] > div').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().width));assert(Math.abs(sizes[0]-sizes[1])<2);if(width===1440)assert(sizes.every(s=>Math.abs(s-sizes[0])<2));else assert(sizes[4]>sizes[0]*1.9);}
 const scope=mobile?page.getByRole('dialog'):bar;
 const heights=await scope.getByRole('combobox').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height));assert(heights.every(h=>h>=39),JSON.stringify(heights));
 for(const [label,ar,choice,arChoice] of [['Role','الدور','Content manager','مدير المحتوى'],['Status','الحالة','Active','نشط'],['Account type','نوع الحساب','Company','شركة'],['Language','اللغة','العربية','العربية']]){
  await scope.getByRole('combobox',{name:t(label,ar),exact:true}).click();await page.getByRole('option',{name:t(choice,arChoice),exact:true}).click();
 }
 await scope.getByRole('button',{name:t('Last active','آخر نشاط'),exact:true}).click();
 await page.locator('[data-day]:visible').nth(10).click();await page.getByRole('button',{name:t('Apply','تطبيق'),exact:true}).click();await expect(page.locator('[data-day]:visible')).toHaveCount(0);
 const values=JSON.parse(await page.locator('[data-filter-values]').textContent());assert.equal(values.role,'content');assert.equal(values.status,'active');assert.equal(values.type,'company');assert.equal(values.lang,'ar');assert(values.from);
 assert.equal(await scope.locator('[data-filter-control][data-active=true]').count(),5);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.screenshot({path:path.join(output,`${lang}-${theme}-${width}-active.png`)});
 if(mobile){await scope.getByRole('button',{name:t('Show results','عرض النتائج'),exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await expect(bar.getByRole('button',{name:new RegExp(t('Filters','عوامل التصفية')+'\\s*5')})).toBeVisible();await bar.getByRole('button',{name:new RegExp('^'+t('Filters','عوامل التصفية')+'\\s*5$')}).click();}
 await scope.getByRole('button',{name:t('Clear filters','مسح عوامل التصفية'),exact:true}).click();
 assert(Object.values(JSON.parse(await page.locator('[data-filter-values]').textContent())).every(v=>v===''));
 await scope.getByRole('button',{name:t('Last active','آخر نشاط'),exact:true}).click();await expect(page.getByRole('button',{name:t('Apply','تطبيق'),exact:true})).toBeDisabled();await page.keyboard.press('Escape');
 if(mobile){await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await expect(open).toBeFocused();}
 assert.equal(errors.length,0,errors.join('\n'));results.push({lang,theme,width,passed:true});await context.close();
}fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));console.log(`Filters: ${results.length} scenarios passed.`);}finally{await browser.close();}
