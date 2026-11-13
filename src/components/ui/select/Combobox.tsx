"use client";
import { useState } from "react";
import { NativeSelect } from "./NativeSelect";
import { useNativeTouch } from "./SelectParts";
import { SearchSelect } from "./SearchSelect";
import type { ComboboxProps } from "./types";
export function Combobox(props: ComboboxProps) {
  const [own, setOwn] = useState(props.defaultValue ?? ""); const value = props.value ?? own;
  const native = useNativeTouch(props.useNative);
  const change = (next: string) => { setOwn(next); props.onValueChange?.(next); };
  if (native) return <NativeSelect {...props} value={value} onValueChange={change} />;
  return <SearchSelect {...props} values={value ? [value] : []} onValuesChange={values => change(values[0] ?? "")} />;
}
