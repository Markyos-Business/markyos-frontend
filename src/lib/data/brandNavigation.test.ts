import { describe, expect, it } from "vitest";
import { buildInitialWorkspaces } from "./mockData";
import { canOpenBrandPage, publishedGuidelineHref } from "./brandNavigation";

const slug = "review-brand";
const internal = ["discovery", "discovery/calls/note-a/edit", "forms", "forms/form-a/answers", "analysis", "brief"];

describe("brand navigation", () => {
  it.each(["owner", "editor", "viewer", "client"] as const)("matches internal-data access for %s", (role) => {
    for (const section of internal) expect(canOpenBrandPage(role, `/w/${slug}/${section}`, slug)).toBe(role !== "client");
  });

  it("keeps permitted brand review destinations available to clients", () => {
    for (const section of ["", "/overview", "/strategy", "/visual-identity", "/moodboard/board-a", "/departments", "/team"])
      expect(canOpenBrandPage("client", `/w/${slug}${section}`, slug)).toBe(true);
  });

  it("does not infer membership or match a different brand's path", () => {
    expect(canOpenBrandPage(null, `/w/${slug}/overview`, slug)).toBe(false);
    expect(canOpenBrandPage("client", `/w/${slug}-other/overview`, slug)).toBe(false);
    expect(canOpenBrandPage("owner", `/w/other/overview`, slug)).toBe(false);
  });
});

describe("guideline review shortcut", () => {
  it.each(["pass", "subscription"] as const)("offers a published guideline on a %s plan", (plan) => {
    const [workspace] = buildInitialWorkspaces();
    expect(workspace.published).not.toBeNull();
    expect(publishedGuidelineHref({ ...workspace, billing: { plan } })).toBe(`/v/${workspace.slug}`);
  });

  it("does not send clients to unpublished or unpaid guidelines", () => {
    const [workspace] = buildInitialWorkspaces();
    expect(publishedGuidelineHref({ ...workspace, published: null })).toBeNull();
    expect(publishedGuidelineHref({ ...workspace, billing: { plan: "free" } })).toBeNull();
  });
});
