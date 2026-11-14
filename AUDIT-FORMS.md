# Form Inputs audit — inventory checkpoint

Date: 14 November 2026. Initial baseline: `ce9c58e` (`release/staging-v1`).

**Step 1 only. No component, gallery, registry, dependency or public API changes have
been made by this audit.** During inspection, unrelated/concurrent colour-input
edits appeared in the working tree, including a rename to `hex-color-input.tsx`.
They were preserved. The colour rows distinguish current source from baseline
findings; baseline tests below predate those concurrent edits. This document records source inspection and existing-test results;
it is not a declaration that browser, accessibility or react-hook-form acceptance
has passed. The request ends at `One complete "New…` in Step 5; the missing ending
is needed before the proof/demo scope can be finalized.

Concurrent-edit boundary: additional Select, Rating, LocalePicker, MarketPicker and
AddressFields edits/moves appeared as this report was finalized. Their rows and
line references describe the inspected baseline, and some links may now point to
moved files. Those changing implementations have not been re-audited or retested;
reconcile them before applying the findings. This audit did not edit those files.

## Findings at a glance

- All requested functional families are present. All seven Step 4 additions already
  exist, including a dedicated MarketPicker; none should be rebuilt.
- Existing names often differ from the brief. For example InputField/TextInput,
  TextareaField/Textarea, BilingualField/BilingualInput, and HexColorField/HexColorInput
  are public exports. Aliases of one implementation share a row below; the concurrently added HexColorInput and compatibility wrapper are separate rows.
- The inventory covers **66 implementations/wrappers/helpers**: the requested inputs,
  the distinct Switch and ToggleField, and directly related public building blocks.
  Lower-level legacy Listbox/SelectField adapters remain separate Select-family work.
- The existing forms matrix covers 13 rows and omits many shared states. It is not
  a complete RHF form or an exhaustive component/state verification page.
- Several components advertise state support they do not enforce. Highest-priority
  examples are editable locked rich text and the editable swatch on a locked hex field.
- Native/ref-as-prop support is inconsistent. React 19 makes ref-as-prop viable for
  some native wrappers, but the literal forwardRef requirement is not satisfied
  across this family. Missing focus refs/onBlur/name/defaultValue are separate gaps.

## Evidence and notation

All table entries describe **source evidence (S)**, not a browser pass. Keyboard and
screen-reader columns remain **runtime unverified** unless explicitly stated.
No manual VoiceOver/NVDA session or RHF integration run was performed in this checkpoint.

- **N**: native input/textarea states supplied by the DOM API: placeholder, filled,
  disabled, readOnly, required, native editing/focus. This is not proof of styling,
  reset or registration behavior.
- **W**: Field wrapper props: hint/error/success/warning, validating + aria-busy,
  locked/readOnly, optional/required marker, loading-as-skeleton, label/info/notes.
  Bare mode and composite forwarding defects can prevent the promised behavior.
- **R19**: React 19 native ref-as-prop path exists; register is plausible from source,
  but integration/focus/reset/touched behavior still requires a real test.
- **R!**: source demonstrates that an incoming registration ref is overwritten.
- **C~**: controlled value callback is usable with a Controller adapter, but one or
  more of focus ref, name, blur/touched or uncontrolled/defaultValue is absent.
- **Adapter**: domain-specific callback (onFiles, onCommit, etc.); not drop-in register.
- **N/A**: the capability does not apply to a layout/view/action helper, rather than
  pretending it is implemented. C01–C07 are shared gaps; F01–F22 are specific findings.

Files below are relative to `src/components/ui/`. “Matrix” means some states have a
row, not that every state passes. A combined registry label is identified explicitly.

## Inventory

| component | file | exported from @/components/ui | in registry.ts | gallery demo | states supported | RTL | keyboard | screen reader | react-hook-form | issues found |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Field | [field/field.tsx](src/components/ui/field/field.tsx) | Yes | Yes | Indirect + wrapper examples | W; prefix/suffix/actions; count; V/H layout | S: logical layout, boxDir | S: native child + info button | S: label, note/counter IDs, live note; bare trailing chrome gap | Wrapper; consumer supplies actual control | C01–C05; F03; bare mode skips validating/lock chrome |
| Fieldset | [field/field.tsx](src/components/ui/field/field.tsx) | Yes | No own row; Field notes | Direct | Disabled; legend/description; 1–3 columns | S: logical grid | S: native fieldset descendants | S: fieldset/legend | N/A container; no ref/name forwarding | C01; C02; registry identity missing |
| FieldGroup | [field/field.tsx](src/components/ui/field/field.tsx) | Yes | No own row; Field notes | Direct | 2–3 columns; other control states N/A | S: logical grid | N/A container | N/A layout-only | N/A container; no ref forwarding | C01; registry identity missing |
| Input — InputField / TextInput | [field/input-field.tsx](src/components/ui/field/input-field.tsx) | Yes | Yes, InputField (TextInput) | Direct + matrix | N + W + counter/maxLength | S: inherits direction; boxDir | S: native editing | S: label, merged descriptions, invalid/busy | R19: ref/name/change/blur/defaultValue reach input | C01–C05; no literal Input alias (existing names work) |
| Textarea — TextareaField / Textarea | [field/textarea-field.tsx](src/components/ui/field/textarea-field.tsx) | Yes | Yes | Direct + matrix | N + W + counter; auto-grow | S: dir passed to textarea | S: native editing | S: label, merged descriptions | R19: merges local and caller ref; uncontrolled supported | C01–C05; lacks the same prefix/suffix/action/layout options as InputField |
| Email — EmailField / EmailInput | [field/email-field.tsx](src/components/ui/field/email-field.tsx) | Yes | Yes | Direct + matrix | N + W; browser address check | S: dir=ltr default | S: native editing, validates on blur | S: Field + native email validity | R19 via InputField; uncontrolled supported | C01–C05; browser/RHF behavior NV |
| Password — PasswordField / PasswordInput | [field/password-field.tsx](src/components/ui/field/password-field.tsx) | Yes | Yes | Direct + matrix | N + W; reveal, strength, caps lock | S: inherited; mixed Latin value needs RTL verification | S: native + reveal button | S: meter description, show/hide names | R19 via InputField; uncontrolled supported | F19; C01–C05; meter uses duration-base |
| Phone — PhoneInput | [field/phone-field.tsx](src/components/ui/field/phone-field.tsx) | Yes | Yes, shared PhoneField row | Direct + matrix | W; +966 default; code picker; AsYouType; E.164-shaped output | S: number/box ltr | S: tel input + Listbox handlers | S: Field name/notes; code name from strings | C~: value/change/blur; no public focus ref/name/defaultValue | F02; C01–C05; external reset and required/native submission need integration tests |
| URL — UrlField / UrlInput | [field/url-field.tsx](src/components/ui/field/url-field.tsx) | Yes | Yes | Direct + matrix | W; protocol prefix, domain validation | S: box/value ltr | S: native editing | S: Field + descriptions | C + R19 focus/name/blur; controlled only | F12; C01–C05 |
| Search — SearchField / SearchInput | [field/search-field.tsx](src/components/ui/field/search-field.tsx) | Yes | Yes | Direct | N; clear, Escape, shortcut, debounce; not W | S: logical icon sides; value follows page | S: Escape/Ctrl+K handlers | S: implicit label; clear name; no shared note/status contract | C~: native value/change/blur; public ref absent; debounce overrides onChange | F10; C01–C05; 15px compact icon violates requested sizes |
| OTP — OtpField / OtpInput | [field/otp-field.tsx](src/components/ui/field/otp-field.tsx) | Yes | Yes | Direct | Value, required marker, error; paste/advance/backspace | S: fixed ltr code | S: key/paste handlers; positional gap risk | S: legend/digit names/error group description; native required missing | C~: value/change only; no ref/name/blur/defaultValue | F09; C01–C05 |
| Slug — SlugField / SlugInput | [field/slug-field.tsx](src/components/ui/field/slug-field.tsx) | Yes | Yes | Direct | W; prefix; from/name slugify; async availability | S: value/box ltr | S: native editing, blur tidy | S: checking/busy + status notes | C + R19 focus/name/blur; controlled only | F08; C01–C05 |
| Number — NumberField / NumberInput | [field/number-field.tsx](src/components/ui/field/number-field.tsx) | Yes | Yes | Direct | W; min/max/step; number/null value; numeric parsing | S: value/box ltr | S: arrows, Shift, Home/End, steppers | S: spinbutton values/limits; Field descriptions | C + R19 focus/name/blur; controlled only | F13; C01–C05 |
| Currency — CurrencyField / CurrencyInput | [field/number-field.tsx](src/components/ui/field/number-field.tsx) | Yes | Yes | Direct + matrix | Number states; grouping, currency prefix (SAR default) | S: value/box ltr | S: number editing/keyboard | S: spinbutton + Field; prefix speech NV | C + R19 focus/name/blur; controlled only | F13; C01–C05; SAR/AED/EGP accepted as currency strings |
| Percentage — PercentageField / PercentageInput | [field/number-field.tsx](src/components/ui/field/number-field.tsx) | Yes | Yes | Direct | Number states; default 0–100, % suffix | S: value/box ltr | S: number keyboard | S: spinbutton + Field | C + R19 focus/name/blur; controlled only | F13; C01–C05 |
| Slider — SliderField / Slider | [field/slider-field.tsx](src/components/ui/field/slider-field.tsx) | Yes | Yes | Direct | Controlled value, disabled, marks/hint/value text; not W | S: native direction + logical marks | S: native range keys | S: label/valuetext/hint | C~: value/change; no ref/name/blur/defaultValue | C01–C05; zero-width min=max needs guard; shared validation/lock/skeleton gaps |
| RangeSlider | [special/range-slider.tsx](src/components/ui/special/range-slider.tsx) | Yes | Yes | Direct | Two values, disabled, minGap, hint; not W | S: logical fill; native range direction | S: two native ranges | S: named min/max with value text | C~: tuple/change; no ref/name/blur/defaultValue | C01–C05; min=max division and impossible minGap need validation |
| Checkbox — CheckboxField / Checkbox | [field/checkbox-field.tsx](src/components/ui/field/checkbox-field.tsx) | Yes | Yes | Direct + matrix | Native checked/defaultChecked; disabled, required, error/success, mixed; no W | S: logical label row | S: native Space | S: implicit name, mixed state, note; readonly semantics absent | R!: CheckboxInput replaces incoming ref | F01; C01–C05; native readOnly prop does not prevent checkbox changes |
| CheckboxGroup | [choice/checkbox-group.tsx](src/components/ui/choice/checkbox-group.tsx) | Yes | Yes | Direct | Controlled list, disabled, required marker, error/success/hint, min/max, select-all | S: logical option rows | S: native checkboxes | S: legend + group note; minimum is checked after group blur | C~: value/change; own blur not exposed, ref/name/defaultValue absent | C01–C05; required is only a marker without form-level validation |
| Radio — RadioField / RadioGroup | [field/radio-field.tsx](src/components/ui/field/radio-field.tsx) | Yes | Yes | Direct | Controlled value, disabled/required, error/success/hint | S: native radios + logical rows | S: native arrows | S: legend/native required/group note | C~: value/change/name; no ref/onBlur/defaultValue | C01–C05; shared warning/validating/lock/skeleton gaps |
| RadioCards — RadioCardGroup | [choice/radio-card-group.tsx](src/components/ui/choice/radio-card-group.tsx) | Yes | Yes | Direct | Controlled selection, error; compact/columns; no disabled option API | S: logical cards + shared navigation | S: roving arrows/Home/End | S: radiogroup/radio names; error not tied by describedby | C~: value/change; no ref/name/blur/defaultValue | C01–C05; option/group disabled, readOnly and remaining W states absent |
| Switch | [section-ui.tsx](src/components/ui/section-ui.tsx) | Yes | Yes, shared ToggleField / Switch row | Direct | Checked/onToggle, disabled, loading/busy | S: logical switch drawing | S: native button activation | S: role=switch/name/checked/busy | Adapter: checked/onToggle, not value/onChange; no ref/name/blur | C01–C05; separate registry identity absent; 24px target |
| Toggle — ToggleField | [field/toggle-field.tsx](src/components/ui/field/toggle-field.tsx) | Yes | Yes, shared Switch row | Direct + partial matrix | Checked, disabled, loading/busy, error, description | S: logical label/switch sides | S: native checkbox/switch | S: implicit name/checked/busy/error note | C~: checked/change; no ref/name/blur/defaultChecked | C01–C05; warning/success/readOnly/lock/skeleton missing |
| SegmentedControl | [choice/segmented-control.tsx](src/components/ui/choice/segmented-control.tsx) | Yes | Yes | Direct | Controlled selected, per-option disabled; sm/md/fullWidth | S: shared RTL navigation | S: roving radio arrows/Home/End | S: radiogroup + radio state | C~: value/change only | C01–C05; group readOnly/disabled/validation/lock/skeleton absent |
| ChipSelector | [choice/chip-selector.tsx](src/components/ui/choice/chip-selector.tsx) | Yes | Yes | Direct | Single/multiple selected, option disabled, count | S: shared RTL navigation/logical chips | S: arrows single; native activation multiple | S: radio or pressed states + group name | C~: value/change only | C01–C05; no group validation/blur/ref/name/defaultValue |
| Calendar | [date/calendar.tsx](src/components/ui/date/calendar.tsx) | Yes | Yes | Indirect via date pickers | Selected/range/today/disabled days; min/max; weekStart 0/1/6; Hijri/digits | S: mirrored keys/global directional icons | S with defect: disabled stop/navigation | S: grid/selected/day names/live month | Adapter: selected/onPick; no native form contract | F05; C01–C05/C07; selected prop does not synchronize local viewed month/focused day |
| DatePicker | [date/date-picker.tsx](src/components/ui/date/date-picker.tsx) | Yes | Yes | Direct + matrix | W; typed/picked ISO; range restrictions; Hijri/digits | S: logical field/calendar; localized display | S: Enter/blur commit; calendar inherits F05 | S: Field + calendar action; native required | C~: value/change/blur; no ref/name/defaultValue | F05; C01–C05/C07; date/validation resets require browser tests |
| DateRangePicker | [date/date-range-picker.tsx](src/components/ui/date/date-range-picker.tsx) | Yes | Yes | Direct | Controlled range, disabled, error/hint; presets/Apply/Clear; not W | S: logical popover/buttons; calendar inherits RTL | S: buttons/calendar; no typed range entry | Partial: label via popover; error/hint not described/live | C~: value/change; no focus ref/name/blur/defaultValue | F06; C01–C05/C07 |
| TimePicker | [date/time-picker.tsx](src/components/ui/date/time-picker.tsx) | Yes | Yes | Direct + matrix | W advertised; HH:mm, 12/24h, segment step | S: value/box ltr | S with defect: segment wrap/partial input | Partial: segment names omit parent label; required/busy not fully forwarded | C~: value/change only | F07/F15; C01–C05/C07 |
| DateTimePicker | [date/date-time-picker.tsx](src/components/ui/date/date-time-picker.tsx) | Yes | Yes | Direct | W distributed to date/time; composite ISO value | S: logical responsive grid; time ltr | S: date/time inherited handlers | S: legend, child names; time validation shares incomplete wiring | C~: value/change only; no focus ref/name/blur/defaultValue | F07/F15; C01–C05/C07; time disabled without a date despite conflicting comment |
| Duration — DurationInput | [date/duration-input.tsx](src/components/ui/date/duration-input.tsx) | Yes | Yes | Direct | W advertised; total minutes, maxHours, minuteStep | Partial: segments ltr; outer unit order follows page | S with segment defects | Partial: segment names omit parent label; required/busy incomplete | C~: value/change only | F07/F15; C01–C05/C07 |
| FileDropzone | [upload/file-dropzone.tsx](src/components/ui/upload/file-dropzone.tsx) | Yes | Yes | Direct | Empty/dragging/disabled/required; accept/size/count rejections; not W | S: logical zone/text | S: native file picker focus | S: labels, rejection alert/describedby | Adapter: onFiles/onReject; no ref/name/onBlur | C01–C05; no shared readOnly/locked/validation/skeleton contract |
| UploadList | [upload/upload-list.tsx](src/components/ui/upload/upload-list.tsx) | Yes | Yes | Direct | Queued/uploading/progress/done/failed; retry/cancel/remove callbacks | S: logical rows; sizes ltr | S: action buttons | S: list, progress, live summary with retry gap | N/A display/action list, not a field | F18; strings provider-only; no global disabled action state |
| ImageUpload | [upload/image-upload.tsx](src/components/ui/upload/image-upload.tsx) | Yes | Yes | Direct; crop via dialog | Empty/preview/crop/replace/remove, disabled/error; accept/size | S: logical chrome; crop area intentionally ltr | S: buttons + cropper keys | Partial: preview name; error not tied to picker/action | C~ adapter: URL/null change, no ref/name/blur/defaultValue | F14; C01–C05; no common W states |
| AvatarUpload | [upload/image-upload.tsx](src/components/ui/upload/image-upload.tsx) | Yes | Yes | Direct; crop via dialog | Empty/preview/circular crop/drop/replace/remove; disabled/error/rejection | S: logical chrome; crop area ltr | S: picker/buttons + cropper | S: action names, error alert; association NV | C~ adapter: URL/null change; no ref/name/blur/defaultValue | C01–C05; async crop/disabled transition/error handling NV |
| Cropper — ImageCropper | [upload/image-cropper.tsx](src/components/ui/upload/image-cropper.tsx) | Yes | Yes | Indirect in upload dialog | Image position/zoom; shape/aspect; no disabled/readOnly/error states | Intentional ltr image-coordinate geometry | S: arrows + Shift, zoom slider | S: focusable group + instructions + zoom; updates announcement NV | Adapter: view/onViewChange; no ref/name/blur | C01–C05; image decode/load failure presentation absent |
| RichTextEditor | [rich-text/rich-text.tsx](src/components/ui/rich-text/rich-text.tsx) | Yes | No own row; RichTextField registered | Indirect through RichTextField | HTML value callback; placeholder/toolbar; no disabled/readOnly/loading | S: paragraphs dir=auto; toolbar translations via isAr | S: toolbar, contenteditable, dialogs | Partial: standalone label required through editorProps; no disabled/readonly semantics | C~: value/change/blur; no external focus ref/name | F03/F17; C01–C05; toolbar labels hardcoded en/ar rather than per-string props |
| BilingualInput / BilingualField | [field/bilingual-field.tsx](src/components/ui/field/bilingual-field.tsx) | Yes | Yes, BilingualField | Direct | W partly inherited; per-language errors/count; needs-Arabic warning; side/tabs | S: AR dir=rtl/lang=ar; EN ltr | S: native fields + segmented layout toggle | S: fieldset/labels; shared error and warning wiring partial | C~: object value/change/blur; no ref/name/defaultValue | C01–C05; aggregate error not applied to sides; tab switch unmounts side; EN/AR toggle labels fixed |
| TagInput | [field/tag-input.tsx](src/components/ui/field/tag-input.tsx) | Yes | Yes | Direct + matrix | W except readonly; tokens/max/duplicate/refusal/limit | S: tags dir=auto/logical removal | S: Enter/comma/paste/Backspace; full-limit focus concern | S: label, warning/hint; lock/validating chrome skipped in bare Field | C~: array/change/blur; no ref/name/defaultValue | F16; C01–C05 |
| Mentions — MentionTextarea | [special/people-picker.tsx](src/components/ui/special/people-picker.tsx) | Yes | Yes | Direct | Textarea W inherited in type; suggestion list, avatars; no presence indicator | S: logical list; email ltr | S: Up/Down/Enter/Tab/Escape; composition/caret cases NV | S: combobox/listbox/active-descendant; caller callbacks lost | C~: ref accepted but overwritten; name passes; onBlur overwritten | F11; C01–C05; defaultValue advertised through textarea but value required |
| PeoplePicker | [special/people-picker.tsx](src/components/ui/special/people-picker.tsx) | Yes | Yes | Direct | Select-common states, max selections; avatars/presence | S: MultiSelect behavior inherited | S: cmdk/popover via MultiSelect | S: option names/avatar/presence; exact announcements NV | C~: value/change/name/blur; no focus ref/defaultValue | C01–C05; warning/validating/locked/skeleton missing; Select work remains separate |
| CountryPicker | [special/region-pickers.tsx](src/components/ui/special/region-pickers.tsx) | Yes | Yes, shared MarketPicker row | Direct + partial matrix | Select-common states; searchable country/region groups | S: inherited direction + localized names | S: Combobox | S: select labels/descriptions | C~: controlled value/change/name/blur; no ref/defaultValue | C01–C05; matrix incorrectly omits supported readOnly state |
| TimezonePicker | [special/region-pickers.tsx](src/components/ui/special/region-pickers.tsx) | Yes | Yes | Direct | Select-common states; zone/city/offset groups; default Riyadh | S: inherited logical Combobox | S: Combobox | S: labels + zone/offset content | C~: value/change/name/blur; no ref/defaultValue | C01–C05; labels partly provider-only; offsets captured on language-based memo |
| Select | [select/select.tsx](src/components/ui/select/select.tsx) | Yes | Yes | Direct in table-select gallery | Selected/placeholder/disabled/readOnly/required/error/success; native touch | S: direction from trigger/prop | S: Radix; browser verification separate | S: Radix names + notes | C~: controlled/uncontrolled, name/blur; no focus ref/register contract | Present; inventory only for separate Select prompt; lacks full W states |
| Combobox | [select/combobox.tsx](src/components/ui/select/combobox.tsx) | Yes | Yes | Direct in table-select gallery | Select states + search/create/empty/error variants | S: Popover direction | S: cmdk/search behavior | S: combobox/listbox; verification separate | C~: value/onValueChange/defaultValue/name/blur; no focus ref | Present; do not rebuild in this task |
| MultiSelect | [select/multi-select.tsx](src/components/ui/select/multi-select.tsx) | Yes | Yes | Direct in table-select gallery | Select states + multiple/chips/max/overflow/create | S: logical chips/direction | S: cmdk + remove buttons | S: selected counts/option names; verification separate | C~: array/onValueChange/defaultValue/name/blur; no focus ref | Present; do not rebuild in this task |
| AsyncSelect | [select/async-select.tsx](src/components/ui/select/async-select.tsx) | Yes | Yes | Direct in table-select gallery | Select states + loading/retry/error/abort/cache/debounce | S: SearchSelect/native touch | S: inherited search selection | S: loading/error strings; verification separate | C~: value/onValueChange/defaultValue/name/blur; no focus ref | Present; do not rebuild in this task |
| HexColorInput | [field/hex-color-input.tsx](src/components/ui/field/hex-color-input.tsx) | Yes | No own row; HexColorField registered | Indirect; existing gallery uses compatibility wrapper | W; swatch, normalization/paste, controlled and uncontrolled input events | S: hex/box ltr | S: native text/paste/blur; optional picker | S: Field notes; focus ref merged | R19: name/ref/blur/defaultValue; native onChange plus onValueChange | Concurrent edit: source guards disabled/readOnly/locked picker; runtime NV; F04 baseline, C01–C05 |
| HexColorField (compatibility wrapper) | [field/hex-color-input.tsx](src/components/ui/field/hex-color-input.tsx) | Yes | Yes; registry file path is stale | Direct through existing HexColorField name | W; picker-enabled wrapper; prior string callback retained | S: hex/box ltr | S: inherited HexColorInput behavior | S: Field notes and named swatch | C + R19 focus/name/blur; controlled hex string callback | Concurrent edit: wrapper preserved; F04 source addressed, F22 registry rename gap; runtime NV |
| ColorPicker | [color-picker/color-picker.tsx](src/components/ui/color-picker/color-picker.tsx) | Yes | Yes, recent-colours entry | Indirect from Hex swatch / ColorField | HSV/HEX/RGB/HSL/CMYK, palette, supplied recent; no W | Intentional ltr colour axes; logical surrounding controls | S: arrows/Shift/hue Home/End, swatches | S: slider labels/value text; two-axis model NV | C~: value/change only | C01–C05; recent persistence comes from ColorPopover, not standalone picker |
| Rating | [special/rating.tsx](src/components/ui/special/rating.tsx) | Yes | Yes | Direct | Selected/clearable/disabled/readOnly; no W | S: shared radio navigation | S: roving arrows + clear | S: radiogroup/star names, readOnly image | C~: value/change only; no ref/name/blur/defaultValue | C01–C05; unchecked stars use text-disabled; contrast NV |
| LocalePicker | [special/region-pickers.tsx](src/components/ui/special/region-pickers.tsx) | Yes | Yes | Direct | Select-common states; locale codes/names; no flags | S: localized labels/inherited Select direction | S: Select | S: language + region + code | C~: controlled value/change/name/blur; no ref/defaultValue | C01–C05; exists, do not duplicate |
| MarketPicker | [special/region-pickers.tsx](src/components/ui/special/region-pickers.tsx) | Yes | Yes, shared CountryPicker row | Direct | Multi-country selected/max; Select-common states | S: logical MultiSelect | S: MultiSelect | S: country names/selection counts | C~: array/change/name/blur; no ref/defaultValue | Exists as dedicated multi-country picker; CountryPicker is single-country; C01–C05 |
| AddressFields | [special/address-fields.tsx](src/components/ui/special/address-fields.tsx) | Yes | Yes | Direct | Controlled country-specific SA/AE/EG/general fields; required/disabled/errors | S: logical responsive fields; numeric SA/EG entries ltr | S: native text + country/region pickers | S: fieldset/legend, child names and errors | C~: object/change; no focus ref/name/onBlur/defaultValue | F20; C01–C05; local errors persist across country/value resets |
| ConfirmByTyping | [special/confirm-by-typing.tsx](src/components/ui/special/confirm-by-typing.tsx) | Yes | Yes | Direct | Unmatched/matched/error; caller-driven busy disables action | S: isolated target name + logical layout | S: Enter/native form submit | S: input label/error; busy not announced as busy | N/A action guard; name means target phrase, not form registration | F21; C01–C05; async rejection/re-entry handled only by caller |
| FieldLabel | [field/input-field.tsx](src/components/ui/field/input-field.tsx) | Yes | No own row | Indirect | Required marker; other field states N/A | S: logical marker | N/A label forwards native focus | S: label/htmlFor when provided | N/A wrapper | C01; no literal forwardRef |
| FieldNote | [field/input-field.tsx](src/components/ui/field/input-field.tsx) | Yes | No own row | Indirect | Hint/error only | S: logical inset | N/A text | S: error role=alert; hint no live region | N/A text | Does not support success/warning standalone; not a replacement for Field note |
| CheckboxInput | [field/checkbox-field.tsx](src/components/ui/field/checkbox-field.tsx) | Yes | No own row | Indirect mixed checkbox demo | Native checked/required/disabled + mixed/error/success ring | S: logical overlay | S: native Space | S: native mixed through indeterminate | R!: overwrites supplied ref to set indeterminate | F01; C01–C05 |
| PhoneField | [field/phone-field.tsx](src/components/ui/field/phone-field.tsx) | Yes | Yes, shared PhoneInput row | Indirect via PhoneInput | W; controlled code + national-number pair | S: box/value ltr | S: tel + code Listbox | S: labels and native required | Adapter: two values/two setters; blur; no ref/name | C01–C05; use PhoneInput for one-value Controller integration |
| RichTextField | [field/rich-text-field.tsx](src/components/ui/field/rich-text-field.tsx) | Yes | Yes | Direct | W advertised + text count, but protection not enforced | S: inherits editor per-paragraph direction | S: editor/toolbar | S: label and note IDs supplied; busy only wrapper | C~: HTML/change/blur; no ref/name/defaultValue | F03/F17; disabled/locked still editable; maxLength counts but does not limit |
| NativeSelect | [select/native-select.tsx](src/components/ui/select/native-select.tsx) | Yes | Yes | Direct in table-select gallery | Controlled/uncontrolled; native states, error/success | S: native direction | S: native select | S: native + select frame | C~: name/blur/defaultValue/onValueChange; no focus ref | Present; Select-family scope; readOnly change event guard needs separate verification |
| ColorField | [color-picker/color-field.tsx](src/components/ui/color-picker/color-field.tsx) | Yes | No own row | Elsewhere/indirect; no direct forms demo | Controlled hex/picker, hint/error, size; no W | S: hex ltr/logical label | S: popover controls | Partial: note rendered but field-to-note association needs check | C~: value/change only | C01–C05; separate older field API |
| ColorPopover | [color-picker/color-field.tsx](src/components/ui/color-picker/color-field.tsx) | Yes | No own row | Indirect Hex swatch | Open/closed; palette/recent persistence; no disabled/readOnly | S: logical placement, picker axes ltr | S: Escape/focus handling, picker keys | S: dialog/name; full focus-return pass NV | N/A popup helper; no form value/ref/name contract | F04; C01–C05; role is helper, not missing ColorPicker |
| FileField | [field/file-field.tsx](src/components/ui/field/file-field.tsx) | Yes | No own row | Main UI gallery (older API) | Empty/file/uploading/progress/disabled/required; type/size validation | S: logical layouts/file content | S: native picker/buttons | S: label + alerts/toasts; association NV | Adapter: file/onFileChange/onRemove; no focus ref/name/blur | C01–C05; overlapping older file API should remain compatible |
| InlineTextField | [field/inline-text-field.tsx](src/components/ui/field/inline-text-field.tsx) | Yes | No own row | No direct forms demo | View/edit/disabled; trim/maxLength; commit only | S: logical pen/value layout | S: Enter/blur save; Escape cancel | S: edit button/input name | Adapter: value/onCommit; no ref/name/onBlur/defaultValue | C01–C05; not a standard onChange input |
| RepeaterField | [field/repeater-field.tsx](src/components/ui/field/repeater-field.tsx) | Yes | No own row | Main UI gallery (older API) | Rows/add/remove/minRows/per-cell errors; no W | S: logical responsive columns | S: native fields/action buttons | S: labels; dynamic row announcements NV | Adapter: rows/onChange; no ref/name/onBlur/defaultValue | C01–C05; keep old API when extending |

## Shared gaps to address after this checkpoint

| ID | Checklist | Inventory finding / required proof |
| --- | --- | --- |
| C01 | Ref and form contract | None of the inspected form implementations uses a consistent explicit forwardRef contract. Some native wrappers correctly support React 19 ref-as-prop, but many composites expose no ref/name/onBlur or uncontrolled/defaultValue. Do not confuse these cases or remove working register paths. Define the focus target and serialization of composites, then prove register, Controller, setFocus, reset, touched and submit behavior. |
| C02 | State parity | W is implemented only by part of the library. Choices, sliders, file controls and Select-based advanced inputs expose different subsets. A native readOnly attribute is ineffective for checkbox/radio; composite blocking must be explicit. Required markers do not substitute for native/group validation. |
| C03 | Gallery coverage | `forms-gallery.tsx` has a 13-row state matrix: CountryPicker, DatePicker, TimePicker, CheckboxField, ToggleField, TagInput, InputField, TextareaField, EmailField, PasswordField, PhoneInput, CurrencyField, UrlField. Columns are default/filled/error/success/warning/validating/disabled/readOnly/locked/loading. There is no focus column; loading draws skeleton only for controls that implement it; many cells are deliberately blank. Other components have examples, not matrix coverage. |
| C04 | Copy contract | English defaults and Arabic chrome exist through UiStringsProvider. This is useful existing infrastructure, but it is not equivalent to a per-component override for every string. Rich-text tooltips, calendar labels, address labels and picker group labels include fixed EN/AR/provider strings. Inventory custom override gaps before extending props. |
| C05 | Visual proof | Existing tokens, global focus styles, global autofill selectors and reduced-motion handling are present. Form-specific 120/180ms parity and per-state text contrast have not been measured. Current default motion tokens are 100/150/200ms, and individual controls use duration-base or spinning icons. Token/RTL/icon-name scripts do not enforce icon size, every animation duration or every state’s contrast. SearchField has a 15px compact icon. The three colour-input implementations are exempted from the raw-colour gate: distinguish legitimate colour/image content geometry from raw chrome colours rather than treating this as a blanket pass. |
| C06 | Registry | Fieldset, FieldGroup, RichTextEditor and the additional helpers below have no distinct registry rows; some are mentioned in other entries’ notes. Existing registered entries are in-review, wave 2. Preserve that status; do not infer approval from the registry. |
| C07 | Date API / localization | Current date controls use UiStringsProvider lang plus an explicit digits prop. They do not expose locale="ar"; Arabic still defaults to Western digits unless digits="arab" is passed. Week starts, min/max, disabled predicates, typed single dates and Hijri display already exist. Decide how to add the requested locale behavior compatibly. Range picker does not support typed entry. |

### Field wrapper checklist

Source-implemented: real input label association, required asterisk, Optional,
info tooltip, hint/error/success/warning notes, count/limit colouring, prefix/suffix,
action slot, horizontal/vertical layout, describedby note/counter IDs, busy and
readonly attributes, skeleton rendering. InputField merges a caller’s describedby.
Textarea exposes a narrower slot API. Required/disabled/readOnly are supplied to the
child render prop; each composite must actually forward them.

The bare branch calls children directly and omits trailing content, so validating
and lock icons, prefixes/suffixes and actions do not appear there. A bare child
can also ignore the returned readonly/disabled/busy values. Shared wrapper support
is therefore not evidence that every wrapped control supports the state.

### react-hook-form acceptance still required

For every applicable control, the later proof should exercise:

1. Native register and Controller usage without changing existing callbacks.
2. `setFocus` / focus-first-error on a useful real control.
3. Programmatic `reset` / `setValue`, including clearing values and changing country.
4. Blur/touched, required validation and actual submit serialization by name.
5. Controlled and uncontrolled/default-value behavior, including checkbox checked
   semantics and array/object/File values with documented adapters.
6. Disabled/read-only/locked inputs cannot emit mutations through auxiliary buttons.

No RHF integration form exists in the current FormsGallery. Passing helper tests
and a ref-shaped TypeScript property do not establish this acceptance.

## Specific issues found in source

These are source-level findings with concrete failure paths, not claims that a
browser reproduction or assistive-technology session was performed in Step 1.
The fixes should get targeted interaction tests in the next phase.

### F01 — P2: Checkbox registration ref is overwritten

CheckboxInput spreads its incoming props, then supplies its own ref callback solely to set indeterminate. A caller’s register/focus ref is lost, even though the native change/blur props can survive. The native-attribute type also does not expose a ref prop. Merge the refs when fixing; preserve mixed-state behavior.

Evidence: [src/components/ui/field/checkbox-field.tsx:30](src/components/ui/field/checkbox-field.tsx#L30).

### F02 — P1: PhoneInput does not reflect external value/reset changes

The dial-code and national-number state are initialized from value and never synchronized after it changes. A Controller reset or switching records can leave the old phone on screen while the form owns a different value. AsYouType and the +966 default are already present; the component must be corrected rather than replaced.

Evidence: [src/components/ui/field/phone-field.tsx:121](src/components/ui/field/phone-field.tsx#L121).

### F03 — P1: Rich text remains editable when disabled or locked

RichTextField accepts FieldState but never sends disabled/readOnly/locked to RichTextEditor, which always sets contentEditable and leaves toolbar actions enabled. The Field bare branch does not enforce these states. maxLength only supplies a counter and does not prevent longer content.

Evidence: [src/components/ui/field/rich-text-field.tsx:45](src/components/ui/field/rich-text-field.tsx#L45).

### F04 — Baseline P1; current source addressed, runtime unverified: Hex swatch protection changed during inventory

At ce9c58e, HexColorField passed an unguarded ColorPopover into the prefix, so disabled/read-only/locked inputs could still emit a change through the swatch. Concurrent work renamed the module to hex-color-input.tsx, added a native-event HexColorInput, retained the HexColorField string-callback wrapper and gates the picker with !disabled && !readOnly && !locked. Do not reapply this fix or rebuild the component. Re-test current protection, resets, blur and RHF behavior after that work settles.

Evidence: [src/components/ui/field/hex-color-input.tsx:143](src/components/ui/field/hex-color-input.tsx#L143).

### F05 — P1: Calendar can have no enabled keyboard entry point

The grid’s only tabIndex=0 is selected from focused/start-of-month without checking blocked(day). If that day is disabled by min/max or a predicate, all enabled days remain tabIndex=-1. Arrow navigation can also try to focus a disabled day and leave focus behind. The enabled-day search and month synchronization need tests.

Evidence: [src/components/ui/date/calendar.tsx:95](src/components/ui/date/calendar.tsx#L95).

### F06 — P1: Date-range presets and draft can bypass constraints or external updates

Preset selection writes presetRange directly; Apply emits draft without checking min/max/isDisabled. The Calendar’s restrictions do not constrain the preset path. Draft is initialized from value once, so resetting/changing a controlled range can reopen a stale draft. The error/hint text is also not linked to the trigger with describedby.

Evidence: [src/components/ui/date/date-range-picker.tsx:82](src/components/ui/date/date-range-picker.tsx#L82).

### F07 — P1: Segment stepping can emit minutes outside 0–59

SegmentInput uses span = max - min + step for wrapping. For min=0, max=59, step=5, ArrowUp from 55 emits 60 because the computed span is 64. TimePicker can emit an invalid HH:60. Partial typing can also emit values below min before a segment completes. Test boundaries for TimePicker and DurationInput.

Evidence: [src/components/ui/date/segment-input.tsx:37](src/components/ui/date/segment-input.tsx#L37).

### F08 — P2: Failed slug checks are presented as availability success

The availability rejection handler sets free:true, so a network/server failure makes the field announce the slug as available. Keep unknown/error separate from a confirmed available answer. Existing request sequencing should be retained and checked for unmount, callback changes and clearing.

Evidence: [src/components/ui/field/slug-field.tsx:69](src/components/ui/field/slug-field.tsx#L69).

### F09 — P2: OTP positional editing and API are incomplete

commit joins boxes into a compact string, so deleting a middle box shifts later digits on rerender. Backspace does not prevent native deletion after its own update. The component exposes no disabled/readOnly/blur/ref/name/defaultValue, and required is only drawn in the legend, not applied to its inputs. Paste currently strips Arabic-Indic digits rather than normalizing them.

Evidence: [src/components/ui/field/otp-field.tsx:33](src/components/ui/field/otp-field.tsx#L33).

### F10 — P2: Search lacks shared states and an external focus ref

SearchField owns a private ref and does not accept/merge a caller ref. Its clear action remains enabled when the search input is disabled or readOnly; debounce mode replaces the passed onChange. It does not expose Field validation/lock/skeleton states. The compact icon is 15px.

Evidence: [src/components/ui/field/search-field.tsx:110](src/components/ui/field/search-field.tsx#L110).

### F11 — P2: Mentions overwrite integration callbacks and focus ref

MentionTextarea always replaces the supplied ref with area and replaces onBlur/onKeyDown/onClick with internal handlers. A Controller’s touched callback is not invoked. PeoplePicker renders presence, but mention options render avatar/name/email without the provided person presence. Composition, empty-result and caret-change behavior still need browser tests.

Evidence: [src/components/ui/special/people-picker.tsx:135](src/components/ui/special/people-picker.tsx#L135).

### F12 — P2: URL prefix can disagree with a programmatically changed value

UrlField initializes protocol from value only once. If an external reset changes https:// to http://, the input body changes but the prefix remains old; subsequent edits re-emit the stale scheme. Preserve the existing string callback and protocol-paste behavior when synchronizing it.

Evidence: [src/components/ui/field/url-field.tsx:35](src/components/ui/field/url-field.tsx#L35).

### F13 — P2: Number controls replace onFocus and emit on blur even when protected

NumberField replaces a caller’s onFocus with its private focus flag. Its onBlur always clamps/emits through set(), without the canChange guard used for steppers and arrow keys, so focusing and blurring an out-of-range read-only/locked value can mutate it. External changes while focused are not displayed until another synchronization event. Currency and Percentage inherit this.

Evidence: [src/components/ui/field/number-field.tsx:127](src/components/ui/field/number-field.tsx#L127).

### F14 — P2: Replacement-image rejection is silent

With an existing image, the replacement file input only checks accepted.length and drops refused files without showing type/size reasons. Empty ImageUpload uses FileDropzone, and AvatarUpload has explicit rejection text, so behavior differs by path. ImageUpload error text is not associated with the picker/action.

Evidence: [src/components/ui/upload/image-upload.tsx:118](src/components/ui/upload/image-upload.tsx#L118).

### F15 — P2: Composite required/validating semantics are only partly forwarded

TimePicker and DurationInput do not pass Field required or busy into SegmentInput, which has no required/onBlur/name API. Segment names do not include the parent field name. CheckboxGroup required draws an asterisk but does not automatically enforce at least one choice. DateTimePicker’s comment says a time can be retained before choosing a date, but the time control is disabled without a date.

Evidence: [src/components/ui/date/time-picker.tsx:48](src/components/ui/date/time-picker.tsx#L48).

### F16 — P2: Tag input cannot provide the requested read-only contract

TagInput explicitly omits readOnly. A full tag list visually hides the editing input with sr-only while leaving an interactive focus path, and the bare Field branch omits its validating/lock icons. Disabled/locked currently disable the input rather than keeping a reason-reachable readonly target. Verify Enter/comma/paste/composition, max and removal rather than relying only on the pure addTags tests.

Evidence: [src/components/ui/field/tag-input.tsx:33](src/components/ui/field/tag-input.tsx#L33).

### F17 — P1: Rich-text controlled resets do not update the editor DOM

RichTextEditor deliberately writes value only in its attach callback, whose dependencies exclude value. External form reset/setValue changes can leave old content visible; subsequent input emits stale DOM HTML. A reset-aware update must avoid replacing the DOM for ordinary local typing and preserve selection.

Evidence: [src/components/ui/rich-text/rich-text.tsx:155](src/components/ui/rich-text/rich-text.tsx#L155).

### F18 — P2: Repeated failed uploads may not be announced

UploadList excludes uploading transitions from changed and does not always update seen when an existing item begins another upload. After failed → uploading → failed, seen can still equal failed and the new failure is not announced. Status tracking should update even when a transition intentionally makes no announcement.

Evidence: [src/components/ui/upload/upload-list.tsx:55](src/components/ui/upload/upload-list.tsx#L55).

### F19 — P2: Uncontrolled password strength ignores the initial defaultValue

PasswordField initializes typed to an empty string rather than defaultValue. With strength enabled on an uncontrolled prefilled field, no strength appears until a change occurs. Reveal and caps-lock handlers already exist; keep their callbacks/ref behavior.

Evidence: [src/components/ui/field/password-field.tsx:45](src/components/ui/field/password-field.tsx#L45).

### F20 — P2: Address validation state survives country/record resets

AddressFields keeps local lengthErrors keyed only by field name. Changing country or the controlled address does not clear/recompute them, so a Saudi building-number error can carry into another country or a valid reset. Country changes currently emit only {country}, discarding all other address fields; confirm that this destructive reset is intended before changing compatibility.

Evidence: [src/components/ui/special/address-fields.tsx:59](src/components/ui/special/address-fields.tsx#L59).

### F21 — P2: Confirmation async states are caller-only and not fully announced

ConfirmByTyping invokes void onConfirm without its own pending/error handling. A promise rejection is not presented, repeat protection depends on the caller setting busy, and busy is represented by a disabled button/spinning glyph without aria-busy. It renders its own form, which cannot be nested in the eventual complete input-demo form.

Evidence: [src/components/ui/special/confirm-by-typing.tsx:40](src/components/ui/special/confirm-by-typing.tsx#L40).

### F22 — P2: Concurrent hex-module rename leaves stale registry metadata

The registry still points at `src/components/ui/field/hex-color-field.tsx`, which is
now renamed in the working tree. Its recorded file path needs to follow
`field/hex-color-input.tsx`, and the distinct new input implementation should have
an appropriate registry identity. This is current working-tree evidence; the
baseline registry path was correct before the rename.

## What already exists — Step 4 disposition

| Requested addition | Existing implementation | Disposition |
| --- | --- | --- |
| HexColorInput | Current HexColorInput + HexColorField compatibility wrapper | Keep concurrent work; picker protection is now guarded in source. Native-event API/ref/defaultValue were added; verify them at runtime. Legacy string callback remains in HexColorField. |
| ColorPicker | ColorPicker + ColorPopover + useRecentColours | Keep; palette, hex/other notations and recent swatches are present. ColorPopover persists recents; standalone ColorPicker accepts a recent prop. |
| Rating | special/rating.tsx | Keep; add applicable shared/form states and proof. |
| LocalePicker | special/region-pickers.tsx | Keep; locale code + display name, without flags. |
| MarketPicker | special/region-pickers.tsx | Keep the distinct multi-country component. CountryPicker is single-country, and MarketPicker uses MultiSelect with optional max. |
| AddressFields | special/address-fields.tsx | Keep SA/AE/EG/general layouts and repair reset/integration gaps. |
| ConfirmByTyping | special/confirm-by-typing.tsx | Keep the matching-name guard and harden async/accessibility behavior. |

The Select, Combobox, MultiSelect and AsyncSelect implementations are all present,
publicly exported, registered and demonstrated in `/design-system/table-select`.
They are inventory-only here, per the separate Select prompt. Changes to advanced
wrappers must not silently expand into a Select-family rebuild.

## Baseline checks executed without audit changes to component code

| Check | Result | What it does not establish |
| --- | --- | --- |
| Existing Vitest suite | 53 files passed; 656 tests passed, 2 skipped | Primarily helpers/data and some state models; not exhaustive mounted form inputs. |
| npm run lint:tokens | Pass | Exempts colour-content modules; does not measure rendered contrast or enforce per-state accessibility. |
| node scripts/icon-names.mjs | Pass | Verifies names, not icon size (Search’s 15px still passes). |
| node scripts/no-physical-props.mjs | Pass | Existing geometry exceptions remain; not a browser RTL/layout pass. |
| node scripts/rtl-audit.mjs | Pass | Static audit, not keyboard/caret/portal evidence. |
| node scripts/radius-audit.mjs | Pass | Radius scale only. |

These results were captured before the concurrent colour changes and are not validation of those changes.

Not run in this report-first checkpoint: new component tests, browser/keyboard
sweeps, screen-reader sessions, RHF integration/submit/reset proof, the new complete
form demo, per-state contrast measurements or a new production build. Earlier
Button/Tabs evidence does not count as Form Inputs verification.

Existing form-related tests include field/text-fields.test.ts (number/slug/hex/URL
helpers and password scoring), field/tag-input.test.ts (split/add helpers),
date/date-utils.test.ts, upload/file-rules.test.ts and special/regions.test.ts.
None proves the source-level interaction gaps above fixed.

## Proposed execution after this inventory is reviewed

1. Preserve working APIs/aliases; establish and test the shared form/ref/blur/reset
   and protected-state contracts before changing every wrapper.
2. Repair the outstanding F01–F22 findings with regression tests; do not duplicate the concurrent F04 fix. Tests must exercise actual DOM behavior and RHF.
   Address data/protection, calendar entry and invalid time values first.
3. Fill applicable state/copy/ref gaps by extending existing components. Preserve
   old props and add deprecation warnings only if an old prop actually must change.
4. Expand the gallery from 13 matrix rows to all applicable controls. Include focus,
   filled, error, success, warning, validating, disabled, readOnly, locked and skeleton
   in light/dark and English/Arabic; document genuinely inapplicable cells.
5. Add the complete form and proof requirements once the missing Step 5 ending is
   supplied. Include native register, Controller, focus-first-error, async validation,
   reset and submit payloads, and keep ConfirmByTyping outside a parent form.
6. Update dedicated registry identities/notes, keep in-review/wave 2, regenerate
   status, and collect browser/keyboard/ARIA, contrast and 390px evidence.

## Assumptions and unresolved points

- This checkout is Next 16 / React 19, with tokens entered through app/tailwind.css
  and tailwind configuration, rather than the older Next 15 / globals.css paths.
- React 19 ref-as-prop can preserve register compatibility even without literal
  forwardRef. The user’s requested forwardRef API still needs a consistent decision;
  the report flags both syntax parity and actual lost/missing refs separately.
- “Skeleton” currently means Field loading; this should remain compatible if a
  skeleton alias is added. Array/object/file and purely presentational controls
  need an explicit, documented interpretation of uncontrolled/name/register support.
- Provider-based EN/AR is existing behavior. New per-string props should retain it
  as a fallback rather than remove working localization.
- Date locale="ar" / Arabic-Indic defaults differ from the existing explicit digits
  opt-in. Add compatible overrides rather than breaking current displays.
- Palette/image data and coordinate geometry intentionally remain in an LTR content
  space; chrome must still use semantic tokens and logical layout.
- Motion requirements in this brief (120/180ms) differ from current default tokens.
  No token values or UI behavior have been changed during inventory.
- Step 5 is truncated after “One complete ‘New…’”. This report does not invent the
  form’s fields, validation backend, persistence/submission target or missing criteria.
