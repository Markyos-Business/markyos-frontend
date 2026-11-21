import { describe, expect, it } from "vitest";
import { notificationHref, notificationText } from "./copy";
import type { NotificationItem } from "./types";
const item:NotificationItem={id:"one",kind:"discovery.submitted",data:{form:"Brand discovery",client:"Nour"},targetUrl:"/brands",createdAt:"2026-11-16T00:00:00Z",readAt:null};
describe("notification content",()=>{
  it("keeps user-provided names as data while translating event labels",()=>{
    expect(notificationText(item,false)).toEqual({title:"New questionnaire answers are ready",body:"Brand discovery · Nour"});
    expect(notificationText(item,true).title).toBe("إجابات جديدة للاستبيان جاهزة");
  });
  it("says a nameless client in the reader's language",()=>{
    expect(notificationText({...item,data:{form:"Brief",client:"client"}},true).body).toBe("Brief · العميل");
  });
  it("handles unknown event kinds without losing the inbox",()=>{
    expect(notificationText({...item,kind:"future.event",data:{}},false).title).toBe("Account update");
  });
  it.each(["https://evil.test","//evil.test","/\\evil.test","javascript:alert(1)","/brands\n"])("rejects unsafe destination %s",value=>expect(notificationHref(value)).toBe("/brands"));
  it("preserves internal destinations and their query parameters",()=>expect(notificationHref("/account?tab=profile")).toBe("/account?tab=profile"));
});
