import { expect, it } from "vitest";
import { safeNextPath } from "./safe-next";
it.each([null,"","https://evil.test","//evil.test","javascript:alert(1)","data:text/html,x","/\\evil.test","/%2fevil.test","/%5cevil.test","/\nevil.test","/%0aevil","/%zz"])("rejects unsafe authentication destination %s",value=>expect(safeNextPath(value)).toBeNull());
it("preserves internal destinations with query and hash",()=>expect(safeNextPath("/w/acme/forms?tab=answers#latest")).toBe("/w/acme/forms?tab=answers#latest"));
