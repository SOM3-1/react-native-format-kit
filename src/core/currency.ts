import { FormatResult } from "./Formatter.types"

export type CurrencyFormatterMode = "currency" | "none"

export type CurrencyCommonOptions = {
  currency: string
  locale?: string
  fractionDigits?: number
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

export type CurrencyValidationOptions = {
  minimumValue?: number
  maximumValue?: number
  allowNegative?: boolean
  maxDigits?: number
}

export type CurrencyFormattingOptions = CurrencyCommonOptions

export type CurrencyParsingOptions = CurrencyCommonOptions &
  CurrencyValidationOptions & {
    isNegative?: boolean
  }

export const DEFAULT_FRACTION_DIGITS = 2

const MIN_ZERO = 0

const DECIMAL_PART = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})
  .formatToParts(0.1)
  .find((part) => part.type === "decimal")?.value

const DEFAULT_DECIMAL_SEPARATOR = DECIMAL_PART ?? "."

export function stripToDigits(input: string): string {
  return input.replace(/\D/g, "")
}

export function applyMaxDigits(
  digits: string,
  fractionDigits: number,
  maxDigits?: number
): { digits: string; hitMaxDigits: boolean } {
  if (!maxDigits) return { digits, hitMaxDigits: false }

  const integerDigits = Math.max(0, digits.length - fractionDigits)
  if (integerDigits <= maxDigits) {
    return { digits, hitMaxDigits: false }
  }

  const totalAllowed = maxDigits + fractionDigits
  const limited = digits.slice(digits.length - totalAllowed)
  return { digits: limited, hitMaxDigits: true }
}

export function formatCurrency(
  value: number | null,
  options: CurrencyFormattingOptions
): string {
  const { currency, locale } = options
  const { minFractionDigits, maxFractionDigits } = resolveFractionDigits(options)
  if (value == null || Number.isNaN(value)) return ""

  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: minFractionDigits,
    maximumFractionDigits: maxFractionDigits,
  })

  return formatter.format(value)
}

export function parseCurrencyFromDigits(
  digits: string,
  options: CurrencyParsingOptions
): number | null {
  const {
    fractionDigits = DEFAULT_FRACTION_DIGITS,
    minimumValue,
    maximumValue,
    allowNegative = false,
    maxDigits,
    isNegative,
  } = options

  const { maxFractionDigits } = resolveFractionDigits(options)
  const sanitized = stripToDigits(digits)

  if (!sanitized) return null

  const limited = applyMaxDigits(sanitized, maxFractionDigits, maxDigits).digits

  const factor = Math.pow(10, maxFractionDigits)
  let value = Number(limited) / factor

  if (isNegative && allowNegative) {
    value = -value
  }

  if (!allowNegative && value < 0) {
    const min = typeof minimumValue === "number" ? minimumValue : MIN_ZERO
    value = min
  }

  if (typeof minimumValue === "number" && value < minimumValue) {
    value = minimumValue
  }

  if (typeof maximumValue === "number" && value > maximumValue) {
    value = maximumValue
  }

  return value
}

export function digitsFromValue(
  value: number | null,
  fractionDigits: number
): { digits: string; isNegative: boolean } {
  if (value == null || Number.isNaN(value)) return { digits: "", isNegative: false }

  const isNegative = value < 0
  const factor = Math.pow(10, fractionDigits)
  const digits = Math.round(Math.abs(value) * factor).toString()

  return { digits, isNegative }
}

export function formatRawDigits(
  digits: string,
  options: CurrencyParsingOptions,
  mask: CurrencyFormatterMode,
  isNegative: boolean
): FormatResult {
  const { currency, locale } = options
  const { minFractionDigits, maxFractionDigits } = resolveFractionDigits(options)

  const value = parseCurrencyFromDigits(digits, {
    ...options,
    fractionDigits: maxFractionDigits,
    isNegative,
  })

  if (mask === "currency") {
    return {
      text: formatCurrency(value, {
        currency,
        locale,
        minimumFractionDigits: minFractionDigits,
        maximumFractionDigits: maxFractionDigits,
      }),
      rawValue: digits,
    }
  }

  if (!digits) {
    return { text: "", rawValue: "" }
  }

  const padded = digits.padStart(maxFractionDigits + 1, "0")
  const integerPart = padded.slice(0, padded.length - maxFractionDigits)
  const decimalPart = maxFractionDigits > 0 ? padded.slice(-maxFractionDigits) : ""
  const decimalSeparator = getDecimalSeparator(locale)

  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, "") || "0"
  const text =
    maxFractionDigits === 0
      ? `${isNegative ? "-" : ""}${normalizedInteger}`
      : `${isNegative ? "-" : ""}${normalizedInteger}${decimalSeparator}${decimalPart}`

  return { text, rawValue: digits }
}

export function getDecimalSeparator(locale?: string): string {
  try {
    const parts = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).formatToParts(1.1)

    return parts.find((part) => part.type === "decimal")?.value ?? DEFAULT_DECIMAL_SEPARATOR
  } catch (error) {
    return DEFAULT_DECIMAL_SEPARATOR
  }
}

export function resolveFractionDigits(options: CurrencyCommonOptions) {
  const base = typeof options.fractionDigits === "number" ? options.fractionDigits : DEFAULT_FRACTION_DIGITS
  const minFractionDigits =
    typeof options.minimumFractionDigits === "number" ? options.minimumFractionDigits : base
  const maxFractionDigits =
    typeof options.maximumFractionDigits === "number" ? options.maximumFractionDigits : base

  const min = Math.max(0, minFractionDigits)
  const max = Math.max(min, maxFractionDigits)

  return { minFractionDigits: min, maxFractionDigits: max }
}
