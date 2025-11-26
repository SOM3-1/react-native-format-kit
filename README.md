# react-native-format-kit

Currency input utilities for React Native with controlled formatting, masking, validation, and display helpers built on `Intl.NumberFormat`. No external dependencies beyond React/React Native.

> **Intl note**: On older Android versions you may need an `Intl` polyfill (e.g. `@formatjs/intl-numberformat`).

## Installation

```bash
npm install react-native-format-kit
```

## Quick start

```tsx
import { CurrencyInput } from "react-native-format-kit"

function PriceField() {
  const [value, setValue] = useState<number | null>(null)

  return (
    <CurrencyInput
      currency="USD"
      locale="en-US"
      value={value}
      onChangeValue={setValue}
      mask="currency" // default; use "none" to show raw digits with locale decimal separator
      minimumValue={0}
      maximumValue={10000}
      maxDigits={7}
      showErrorText
      testID="price-input"
    />
  )
}
```

## Components & Hook

### `<CurrencyInput />`

Controlled `TextInput` that formats on every change and keeps the caret at the end.

| Prop | Type | Required | Default / Notes |
| --- | --- | --- | --- |
| `currency` | `string` | Yes | ISO currency code |
| `value` | `number \| null` | Yes | Controlled value |
| `onChangeValue` | `(value: number \| null) => void` | Yes | Fired on parsed value change |
| `locale` | `string` | No | Device/runtime locale |
| `fractionDigits` | `number` | No | Legacy; sets both min/max fraction digits (default 2) |
| `minimumFractionDigits` | `number` | No | Defaults to `fractionDigits` or 2 |
| `maximumFractionDigits` | `number` | No | Defaults to `fractionDigits` or 2; used for scaling |
| `mask` | `"currency" \| "none"` | No | `"currency"` |
| `minimumValue` | `number` | No | Lower bound; clamps value |
| `maximumValue` | `number` | No | Upper bound; clamps value |
| `maxDigits` | `number` | No | Caps integer digits only; extra digits ignored with error |
| `allowNegative` | `boolean` | No | `false`; `-` toggles sign when true |
| `validate` | `(value: number \| null) => string \| null` | No | Custom validation message |
| `error` | `string \| null` | No | External error overrides internal |
| `onValidationError` | `(message: string \| null) => void` | No | Fires when error changes |
| `showErrorText` | `boolean` | No | Renders inline error text |
| `onChangeText` | `(formatted: string) => void` | No | Formatted string change |
| `onChangeRawText` | `(rawDigits: string) => void` | No | Digits-only change |
| `containerStyle` | `StyleProp<ViewStyle>` | No | Wrap container styling |
| `inputStyle` | `StyleProp<TextStyle>` | No | TextInput styling |
| `errorTextStyle` | `StyleProp<TextStyle>` | No | Inline error text styling |
| `errorContainerStyle` | `StyleProp<ViewStyle>` | No | Inline error container styling |
| `keyboardType` | `TextInputProps["keyboardType"]` | No | `"numeric"` default |
| `testID` / `accessibilityLabel` | `string` | No | Passed through |
| Other `TextInputProps` | — | No | Forwarded except `value`, `onChangeText`, `keyboardType` |

Behavior highlights:
- Digits-only parsing; non-digits ignored. `-` toggles sign only when `allowNegative` is true.
- Clearing input → `value = null`, empty string displayed.
- Mask `"currency"`: always `Intl`-formatted currency string. Mask `"none"`: shows raw digits with locale decimal separator, no symbol/grouping.
- `maxDigits` counts integer digits (before the decimal). Extra integer digits are ignored and raise the "Maximum digits is X" error.
- `minimumFractionDigits`/`maximumFractionDigits` are applied to formatting; parsing uses `maximumFractionDigits` for scaling.

### `<CurrencyText />`

Display-only formatter.

- **Required**: `currency`, `value`
- **Optional**: `placeholder` (string), `locale`, `fractionDigits`, `minimumFractionDigits`, `maximumFractionDigits`, plus `TextProps`.
- Renders empty string or `placeholder` when `value` is `null`/`NaN`.

### `useCurrencyInput(options)`

Hook that encapsulates parsing/formatting/validation/masking.

**Options (required)**:
- `currency: string`

**Options (optional)**:
- `value?: number | null` (initial value; controlled updates via `setValue`)
- `locale?: string`
- `fractionDigits?: number`
- `minimumFractionDigits?: number`
- `maximumFractionDigits?: number`
- `minimumValue?: number`
- `maximumValue?: number`
- `allowNegative?: boolean`
- `maxDigits?: number`
- `mask?: "currency" | "none"` (default: `"currency"`)
- `validate?: (value: number | null) => string | null`

**Returns**:
- `value: number | null`
- `text: string` (formatted per mask)
- `rawDigits: string` (digits-only, sign tracked separately)
- `error: string | null`
- `handleChangeText(text: string)` (wire to `TextInput.onChangeText`)
- `setValue(value: number | null)` (update from outside)

## Utilities

```ts
import {
  formatCurrency,
  parseCurrencyFromDigits,
  stripToDigits,
  getDecimalSeparator,
} from "react-native-format-kit"

formatCurrency(12.34, {
  currency: "USD",
  locale: "en-US",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

parseCurrencyFromDigits("1234", {
  currency: "USD",
  maximumFractionDigits: 2,
  allowNegative: true,
  isNegative: true,
  minimumValue: 0,
  maximumValue: 100,
  maxDigits: 5,
})

stripToDigits("€1,234.56") // "123456"
getDecimalSeparator("de-DE") // ","
```

Utility notes:
- `parseCurrencyFromDigits` strips non-digits, scales by `maximumFractionDigits` (or `fractionDigits` fallback), applies optional negative sign, and clamps to `minimumValue`/`maximumValue`/`maxDigits`.
- `formatCurrency` uses `minimumFractionDigits`/`maximumFractionDigits` when provided; falls back to `fractionDigits` or 2.

## Validation logic

- `maxDigits`: caps integer digits; extra integer digits are ignored and trigger the "Maximum digits is X" error.
- `allowNegative=false`: any negative input is clamped to `min` (default 0). Typing `-` is ignored.
- `minimumValue` / `maximumValue`: values are clamped; internal error messages reflect bounds.
- `validate(value)`: return a string to surface a custom error; returning `null` means no custom error.
- `error` prop on `CurrencyInput` always overrides internal/custom validation output.
- `onValidationError` fires whenever the effective error message changes.

## Examples

### Raw mask with custom validation

```tsx
<CurrencyInput
  currency="EUR"
  locale="de-DE"
  value={amount}
  onChangeValue={setAmount}
  mask="none"
  maximumFractionDigits={2}
  validate={(v) => (v != null && v % 1 !== 0 ? "No cents allowed" : null)}
  showErrorText
/>
```

### Display-only with locale detection

```tsx
const locale = Intl.NumberFormat().resolvedOptions().locale
<CurrencyText value={1999} currency="GBP" locale={locale} placeholder="-" />
```
