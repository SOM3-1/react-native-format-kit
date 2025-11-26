import { Formatter, FormatResult, ParseResult } from "../../core/Formatter.types"
import {
  CurrencyFormatterMode,
  CurrencyParsingOptions,
  applyMaxDigits,
  digitsFromValue,
  formatRawDigits,
  parseCurrencyFromDigits,
  stripToDigits,
  resolveFractionDigits,
} from "../../core/currency"

export type CurrencyFormatterOptions = CurrencyParsingOptions & {
  mask?: CurrencyFormatterMode
  validate?: (value: number | null) => string | null
}

export function createCurrencyFormatter(
  options: CurrencyFormatterOptions
): Formatter<number> {
  const {
    currency,
    locale,
    fractionDigits,
    minimumFractionDigits,
    maximumFractionDigits,
    minimumValue,
    maximumValue,
    allowNegative = false,
    maxDigits,
    mask = "currency",
    validate,
  } = options

  const { minFractionDigits, maxFractionDigits } = resolveFractionDigits({
    currency,
    locale,
    fractionDigits,
    minimumFractionDigits,
    maximumFractionDigits,
  })

  const format = (value: number | null): FormatResult => {
    const safeValue = clampValue(value, {
      allowNegative,
      minimumValue,
      maximumValue,
    })
    const { digits, isNegative } = digitsFromValue(safeValue, maxFractionDigits)
    return formatRawDigits(digits, options, mask, allowNegative && isNegative)
  }

  const parse = (inputText: string): ParseResult<number> => {
    const minusCount = allowNegative ? (inputText.match(/-/g) || []).length : 0
    const isNegative = allowNegative ? minusCount % 2 === 1 : false
    const rawDigits = stripToDigits(inputText)

    const limited = applyMaxDigits(rawDigits, maxFractionDigits, maxDigits)
    const digits = limited.digits
    const hitMaxDigits = limited.hitMaxDigits

    if (!digits) {
      return { value: null, rawValue: "" }
    }

    const value = parseCurrencyFromDigits(digits, {
      currency,
      locale,
      fractionDigits: maxFractionDigits,
      minimumFractionDigits: minFractionDigits,
      maximumFractionDigits: maxFractionDigits,
      minimumValue,
      maximumValue,
      allowNegative,
      maxDigits,
      isNegative,
    })

    const error = buildFormatterError({
      value,
      isNegative,
      allowNegative,
      minimumValue,
      maximumValue,
      maxDigits,
      hitMaxDigits,
      validate,
    })

    return { value, rawValue: digits, error }
  }

  return {
    format,
    parse,
  }
}

function buildFormatterError(options: {
  value: number | null
  isNegative: boolean
  allowNegative: boolean
  minimumValue?: number
  maximumValue?: number
  maxDigits?: number
  hitMaxDigits: boolean
  validate?: (value: number | null) => string | null
}) {
  const {
    value,
    isNegative,
    allowNegative,
    minimumValue,
    maximumValue,
    maxDigits,
    hitMaxDigits,
    validate,
  } = options

  const messages: string[] = []

  if (hitMaxDigits && maxDigits) {
    messages.push(`Maximum digits is ${maxDigits}`)
  }

  if (!allowNegative && isNegative) {
    messages.push("Negative values are not allowed")
  }

  if (typeof minimumValue === "number" && value != null && value < minimumValue) {
    messages.push(`Value must be >= ${minimumValue}`)
  }

  if (typeof maximumValue === "number" && value != null && value > maximumValue) {
    messages.push(`Value must be <= ${maximumValue}`)
  }

  const custom = validate?.(value)
  if (custom) return custom

  return messages[0] ?? null
}

function clampValue(
  incoming: number | null,
  options: {
    allowNegative: boolean
    minimumValue?: number
    maximumValue?: number
  }
) {
  const { allowNegative, minimumValue, maximumValue } = options
  if (incoming == null || Number.isNaN(incoming)) return null

  let value = incoming

  if (!allowNegative && value < 0) {
    const min = typeof minimumValue === "number" ? minimumValue : 0
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
