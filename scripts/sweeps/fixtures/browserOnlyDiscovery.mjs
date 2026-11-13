import assert from "node:assert/strict";

/** Synthetic HTTP contract only. Never forwards any form request to a server. */
export function discoveryFixture(workspace, status = "draft") {
  const title = (en, ar) => ({ en, ar });
  const question = n => ({ id:`q${n}`,order:0,sourceLibraryQuestionId:null,type:"text",title:title(`Question ${n}`,`السؤال ${n}`),help:title("",""),required:false,config:{multiline:false},visibility:null,analysisTarget:"" });
  return { id:"audit-form",workspaceId:workspace.id,workspaceName:workspace.name,workspaceSlug:workspace.slug,templateKey:"audit",name:"Audit bilingual discovery",languages:["en","ar"],primaryLanguage:"en",status,
    theme:{logoAssetId:null,accent:null,background:"light",welcome:title("Welcome","مرحبًا"),showMarkyosBadge:true},settings:{closesAt:null,remindAfterDays:null,allowSaveAndResume:true,notifyOnSection:false},
    publicToken:null,linkRevoked:false,recipientName:"",recipientEmail:"",sentAt:null,firstAnswerAt:null,submittedAt:null,createdAt:"2026-11-12T00:00:00Z",updatedAt:"2026-11-12T00:00:00Z",
    sections:[{id:"s1",order:0,title:title("First section","القسم الأول"),questions:[question(1)]},{id:"s2",order:1,title:title("Second section","القسم الثاني"),questions:[question(2)]}] };
}
export async function mockDiscovery(context, initial) {
  let form=structuredClone(initial),serial=2;
  const operations=[];
  await context.route("**/discovery/library/**",route=>route.fulfill({json:{count:0,next:null,previous:null,results:[]}}));
  await context.route("**/discovery/forms/**",async route=>{
    const request=route.request(),url=new URL(request.url());
    assert(["localhost","127.0.0.1"].includes(url.hostname));
    const suffix=url.pathname.split(`/discovery/forms/${form.id}/`)[1];
    if(suffix===undefined)return route.fulfill({status:404,json:{detail:"Synthetic fixture not found"}});
    const method=request.method(),body=request.postDataJSON();
    if(method!=="GET")operations.push({method,suffix});
    if(method==="POST"&&suffix==="sections/")form.sections.push({id:`s${++serial}`,order:form.sections.length,title:body.title,questions:[]});
    else if(method==="DELETE"&&/^sections\/[^/]+\/$/.test(suffix))form.sections=form.sections.filter(s=>s.id!==suffix.split("/")[1]);
    else if(method==="PATCH"&&/^sections\/[^/]+\/$/.test(suffix))Object.assign(form.sections.find(s=>s.id===suffix.split("/")[1]),body);
    else if(method==="POST"&&suffix==="questions/reorder/"){
      const all=form.sections.flatMap(s=>s.questions);
      for(const section of form.sections)section.questions=body.items.filter(i=>i.sectionId===section.id).map((item,order)=>({...all.find(q=>q.id===item.id),order}));
    } else if(method!=="GET")return route.fulfill({status:400,json:{detail:"Unsupported synthetic operation"}});
    await route.fulfill({json:form});
  });
  return {current:()=>structuredClone(form),operations};
}
