/**
 * Address shapes and checks, with no React: AddressFields uses them, and a
 * zod schema or a server can run the same rules.
 */

type Address = {
  /** ISO code: "SA", "AE", "EG"… */
  country: string;
  /** Building number (SA: 4 digits) or name. */
  building?: string;
  street?: string;
  /** District (SA, EG) or area (AE). */
  district?: string;
  city?: string;
  /** Emirate (AE), governorate (EG) or region elsewhere. */
  region?: string;
  postalCode?: string;
  /** Saudi National Address: the 4-digit additional number. */
  additional?: string;
};

type AddressKey = Exclude<keyof Address, "country">;

/** Which label a line takes; AddressFields turns it into words. */
type LineLabel = "buildingNumber" | "street" | "district" | "area" | "city" | "emirate" | "governorate" | "region" | "postalCode" | "additionalNumber";

type Line = { key: AddressKey; label: LineLabel; optional?: boolean; digits?: number; autoComplete?: string };

/**
 * The lines each country uses, in its own order:
 * SA, the Saudi National Address: building number, street, district, city,
 *   postal code, additional number.
 * AE: emirate, area, street, building.
 * EG: governorate, city, district, street, building.
 * Elsewhere: street, building, city, region, postal code.
 */
const LAYOUTS: Record<string, readonly Line[]> = {
  SA: [
    { key: "building", label: "buildingNumber", digits: 4 },
    { key: "street", label: "street", autoComplete: "address-line1" },
    { key: "district", label: "district" },
    { key: "city", label: "city", autoComplete: "address-level2" },
    { key: "postalCode", label: "postalCode", digits: 5, autoComplete: "postal-code" },
    { key: "additional", label: "additionalNumber", digits: 4 },
  ],
  AE: [
    { key: "region", label: "emirate", autoComplete: "address-level1" },
    { key: "district", label: "area", autoComplete: "address-level3" },
    { key: "street", label: "street", autoComplete: "address-line1" },
    { key: "building", label: "buildingNumber", autoComplete: "address-line2" },
  ],
  EG: [
    { key: "region", label: "governorate", autoComplete: "address-level1" },
    { key: "city", label: "city", autoComplete: "address-level2" },
    { key: "district", label: "district", autoComplete: "address-level3" },
    { key: "street", label: "street", autoComplete: "address-line1" },
    { key: "building", label: "buildingNumber", autoComplete: "address-line2" },
  ],
};

const GENERAL: readonly Line[] = [
  { key: "street", label: "street", autoComplete: "address-line1" },
  { key: "building", label: "buildingNumber", optional: true, autoComplete: "address-line2" },
  { key: "city", label: "city", autoComplete: "address-level2" },
  { key: "region", label: "region", optional: true, autoComplete: "address-level1" },
  { key: "postalCode", label: "postalCode", optional: true, autoComplete: "postal-code" },
];

const linesFor = (country: string): readonly Line[] => LAYOUTS[country] ?? GENERAL;

type AddressIssue = { code: "required" } | { code: "digits"; digits: number };

/** Arabic-Indic digits as Western ones; anything not a digit dropped. */
const digitsOnly = (text: string) => text.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660)).replace(/\D/g, "");

/**
 * What's wrong with an address for its country, line by line: a missing
 * line (when `required`) or a number of the wrong length (always, when given).
 */
function addressIssues(address: Address, { required = true }: { required?: boolean } = {}): Partial<Record<keyof Address, AddressIssue>> {
  const issues: Partial<Record<keyof Address, AddressIssue>> = {};
  if (required && !address.country) issues.country = { code: "required" };
  for (const line of linesFor(address.country)) {
    const v = (address[line.key] ?? "").trim();
    if (!v) {
      if (required && !line.optional) issues[line.key] = { code: "required" };
    } else if (line.digits && v.length !== line.digits) issues[line.key] = { code: "digits", digits: line.digits };
  }
  return issues;
}

export { GENERAL, LAYOUTS, addressIssues, digitsOnly, linesFor };
export type { Address, AddressIssue, AddressKey, Line, LineLabel };
