# react-native-format-kit [![npm version](https://img.shields.io/npm/v/react-native-format-kit.svg)](https://www.npmjs.com/package/react-native-format-kit)

Currency input utilities for React Native with controlled formatting, masking, validation, display helpers, and styling hooks built on `Intl.NumberFormat`. No external deps beyond React/React Native.

> **Intl note**: On older Android versions you may need an `Intl` polyfill (e.g. `@formatjs/intl-numberformat`).

## Installation

```bash
npm install react-native-format-kit
```

## API Overview

- Components: `CurrencyInput` (editable), `CurrencyText` (display-only)
- Hook: `useCurrencyInput`
- Utilities: `formatCurrency`, `parseCurrencyFromDigits`, `stripToDigits`, `getDecimalSeparator`

## CurrencyInput

A controlled `TextInput` that formats on every change and keeps the caret at the end.

**Props**

| Prop | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `currency` | `string` | Yes | — | ISO currency code |
| `value` | `number \| null` | Yes | — | Controlled value |
| `onChangeValue` | `(value: number \| null) => void` | Yes | — | Fired on parsed value change |
| `locale` | `string` | No | device/runtime | Locale for `Intl.NumberFormat` |
| `fractionDigits` | `number` | No | 2 | Legacy single min/max fraction setting |
| `minimumFractionDigits` | `number` | No | `fractionDigits` or 2 | Formatting only |
| `maximumFractionDigits` | `number` | No | `fractionDigits` or 2 | Formatting and parsing scale |
| `mask` | `"currency" \| "none"` | No | `"currency"` | `currency` shows formatted value; `none` shows raw digits with locale decimal |
| `minimumValue` | `number` | No | — | Clamp lower bound |
| `maximumValue` | `number` | No | — | Clamp upper bound |
| `maxDigits` | `number` | No | — | Caps **integer** digits; extras ignored and raise error |
| `allowNegative` | `boolean` | No | `false` | `-` toggles sign when true; otherwise ignored/clamped |
| `validate` | `(value: number \| null) => string \| null` | No | — | Custom validation message |
| `error` | `string \| null` | No | — | External error overrides internal/custom |
| `onValidationError` | `(message: string \| null) => void` | No | — | Fires when effective error changes |
| `showErrorText` | `boolean` | No | `false` | Renders inline error |
| `onChangeText` | `(formatted: string) => void` | No | — | Formatted string change |
| `onChangeRawText` | `(rawDigits: string) => void` | No | — | Digits-only change |
| `keyboardType` | `TextInputProps["keyboardType"]` | No | `"numeric"` | Override if needed |
| `testID`, `accessibilityLabel` | `string` | No | — | Passed through |
| Other `TextInputProps` | — | No | — | Forwarded except `value`, `onChangeText`, `keyboardType` |

**Styling props**

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `defaultBorderColor` | `string` | `#ccc` | Idle border |
| `focusBorderColor` | `string` | `#2d7ff9` | Focused border |
| `errorBorderColor` | `string` | `#d14343` | Error border |
| `containerStyle` | `StyleProp<ViewStyle>` | — | Outer wrapper |
| `inputContainerStyle` | `StyleProp<ViewStyle>` | — | Border container |
| `inputContainerFocusedStyle` | `StyleProp<ViewStyle>` | — | Applied on focus |
| `inputContainerErrorStyle` | `StyleProp<ViewStyle>` | — | Applied on error |
| `inputStyle` | `StyleProp<TextStyle>` | — | TextInput styling |
| `label` | `string` | — | Shown as placeholder; floats on focus/value |
| `floatingLabel` | `boolean` | `true` | Toggle floating behavior |
| `labelStyle` | `StyleProp<TextStyle>` | — | Label text styling |
| `labelContainerStyle` | `StyleProp<ViewStyle>` | — | Label wrapper styling |
| `labelBackgroundColor` | `string` | `white` | Background behind floated label |
| `errorTextStyle` | `StyleProp<TextStyle>` | — | Inline error text; default color `#d14343`, fontSize 14 |
| `errorContainerStyle` | `StyleProp<ViewStyle>` | — | Inline error container; default marginTop 6 |

**Behavior highlights**
- Digits-only parsing; non-digits ignored. `-` toggles sign only when `allowNegative` is true.
- Clearing input sets `value` to `null`.
- `mask="currency"` shows `Intl`-formatted currency. `mask="none"` shows raw digits with locale decimal separator (no symbol/grouping).
- `minimumFractionDigits`/`maximumFractionDigits` control formatting; parsing uses `maximumFractionDigits`.

### Usage

```tsx
<CurrencyInput
  currency="USD"
  locale="en-US"
  value={value}
  onChangeValue={setValue}
  onChangeText={(t) => console.log("formatted", t)}
  onChangeRawText={(d) => console.log("digits", d)}
  allowNegative
  maxDigits={6}
  minimumFractionDigits={0}
  maximumFractionDigits={2}
  showErrorText
  label="Amount"
  defaultBorderColor="#ddd"
  focusBorderColor="#2d7ff9"
  errorBorderColor="#e55353"
  inputContainerStyle={{ backgroundColor: "#fafafa" }}
  labelStyle={{ color: "#444" }}
/>
```

## CurrencyText

Display-only formatter for currency values.

- `value: number | null` (required)
- `currency: string` (required)
- `locale?: string`
- `fractionDigits?`, `minimumFractionDigits?`, `maximumFractionDigits?`
- `placeholder?: string`
- Plus all `TextProps`

```tsx
<CurrencyText value={value} currency="EUR" locale="de-DE" placeholder="-" />
```

## Hook: useCurrencyInput

Logic-only hook for parsing/formatting/validation/masking.

**Options**
- Required: `currency: string`
- Optional: `value?: number | null`, `locale?`, `fractionDigits?`, `minimumFractionDigits?`, `maximumFractionDigits?`, `minimumValue?`, `maximumValue?`, `allowNegative?`, `maxDigits?`, `mask?`, `validate?`

**Returns**
- `value: number | null`
- `text: string`
- `rawDigits: string`
- `error: string | null`
- `handleChangeText(text: string)`
- `setValue(value: number | null)`

```tsx
const { text, value, rawDigits, error, handleChangeText, setValue } = useCurrencyInput({
  currency: "USD",
  locale: "en-US",
  allowNegative: true,
  maximumFractionDigits: 2,
  maxDigits: 6,
})
```

## Utilities

```ts
import {
  formatCurrency,
  parseCurrencyFromDigits,
  stripToDigits,
  getDecimalSeparator,
} from "react-native-format-kit"

formatCurrency(12.34, { currency: "USD", locale: "en-US", minimumFractionDigits: 2, maximumFractionDigits: 2 })

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

## Validation rules

- `maxDigits` caps integer digits; extra integer digits are ignored and trigger "Maximum digits is X".
- `allowNegative=false` clamps negatives to min (default 0); `-` is ignored.
- `minimumValue` / `maximumValue` clamp the value; internal errors reflect bounds.
- `validate(value)` can return a custom error string; `error` prop overrides internal/custom.
- `onValidationError` fires whenever the effective error message changes.
