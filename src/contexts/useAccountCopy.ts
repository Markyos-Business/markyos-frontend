"use client";

import { useCurrentAccount } from "./AppContext";
import { accountTypeOf } from "@/constants/accountTypes";
import { accountExperience } from "@/lib/data/accountExperience";

export function useAccountCopy(isAr: boolean) {
  return accountExperience(accountTypeOf(useCurrentAccount()), isAr ? "ar" : "en");
}
