import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { pageTitle, routePageName } from "./pageTitles";

const routes = readdirSync("src/app", { recursive: true }).map(String).filter(p => p.endsWith("page.tsx"))
  .map(p => "/" + p.split("/").filter(s => !s.startsWith("(") && s !== "page.tsx").map(s => s.startsWith("[") ? "example" : s).join("/"));
describe("page titles", () => {
  it.each(routes)("names the current route %s in both languages", route => {
    const names = routePageName(route);
    expect(names[0]).not.toBe("Page");
    expect(names[1]).not.toBe("صفحة");
    expect(pageTitle(route,"en")).toContain(`${names[0]} · Markyos`);
    expect(pageTitle(route,"ar")).toContain(`${names[1]} · Markyos`);
  });
  it("includes authorized brand context only on workspace routes", () => {
    expect(pageTitle("/w/example/settings","en","Acme")).toBe("Settings · Acme · Markyos");
    expect(pageTitle("/v/private-token","en","Secret client")).toBe("Published guideline · Markyos");
    expect(pageTitle("/a/private-token","en","Secret client")).toBe("Shared analysis · Markyos");
    expect(pageTitle("/admin/users/private-email","en")).toBe("User details · Markyos");
  });
  it("handles trailing slashes and unknown paths without leaking identifiers", () => {
    expect(pageTitle("/login/","en")).toBe("Log in · Markyos");
    expect(pageTitle("/unknown/private-token","ar")).toBe("صفحة · Markyos");
  });
});
