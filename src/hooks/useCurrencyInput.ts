import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  CurrencyFormatterMode,
  CurrencyParsingOptions,
  applyMaxDigits,
  digitsFromValue,
  formatRawDigits,
  formatCurrency,
  parseCurrencyFromDigits,
  stripToDigits,
  resolveFractionDigits,
  getDecimalSeparator,
} from "../core/currency"

export type UseCurrencyInputOptions = CurrencyParsingOptions & {
  value?: number | null
  mask?: CurrencyFormatterMode
  validate?: (value: number | null) => string | null
}

export type UseCurrencyInputResult = {
  value: number | null
  text: string
  rawDigits: string
  error: string | null
  handleChangeText: (text: string) => void
  setValue: (value: number | null) => void
}

const MIN_ZERO = 0

function areValuesEqual(a: number | null, b: number | null, fractionDigits: number) {
  if (a == null && b == null) return true
  if (a == null || b == null) return false

  const factor = Math.pow(10, fractionDigits)
  return Math.round(a * factor) === Math.round(b * factor)
}

function clampIncomingValue(
  incoming: number | null,
  options: {
    allowNegative: boolean
    minimumValue?: number
    maximumValue?: number
  }
) {
  const { allowNegative, minimumValue, maximumValue } = options

  if (incoming == null || Number.isNaN(incoming)) return null

  let next = incoming

  if (!allowNegative && next < 0) {
    const min = typeof minimumValue === "number" ? minimumValue : MIN_ZERO
    next = min
  }

  if (typeof minimumValue === "number" && next < minimumValue) {
    next = minimumValue
  }

  if (typeof maximumValue === "number" && next > maximumValue) {
    next = maximumValue
  }

  return next
}

export function useCurrencyInput(options: UseCurrencyInputOptions): UseCurrencyInputResult {
  const {
    value: valueProp = null,
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

  const parsingOptions: CurrencyParsingOptions = useMemo(
    () => ({
      currency,
      locale,
      fractionDigits,
      minimumFractionDigits,
      maximumFractionDigits,
      minimumValue,
      maximumValue,
      allowNegative,
      maxDigits,
    }),
    [
      currency,
      locale,
      fractionDigits,
      minimumFractionDigits,
      maximumFractionDigits,
      minimumValue,
      maximumValue,
      allowNegative,
      maxDigits,
    ]
  )

  const { minFractionDigits, maxFractionDigits } = useMemo(
    () =>
      resolveFractionDigits({
        currency,
        locale,
        fractionDigits,
        minimumFractionDigits,
        maximumFractionDigits,
      }),
    [currency, locale, fractionDigits, minimumFractionDigits, maximumFractionDigits]
  )

  const { value: initialValue, digits: initialDigits, isNegative: initialNegative, hitMaxDigits: initialHitMax } =
    useMemo(() => {
      return normaliseValue(valueProp, parsingOptions, maxFractionDigits)
    }, [valueProp, parsingOptions, maxFractionDigits])

  const initialFormatted = useMemo(
    () => formatRawDigits(initialDigits, parsingOptions, mask, initialNegative),
    [initialDigits, parsingOptions, mask, initialNegative]
  )

  const [value, setValueState] = useState<number | null>(initialValue)
  const [rawDigits, setRawDigits] = useState<string>(initialFormatted.rawValue)
  const [text, setText] = useState<string>(initialFormatted.text)
  const [isNegative, setIsNegative] = useState<boolean>(initialNegative)
  const [error, setError] = useState<string | null>(() =>
    buildError({
      value: initialValue,
      isNegative: initialNegative,
      maxDigits,
      hitMaxDigits: initialHitMax,
      minimumValue,
      maximumValue,
      allowNegative,
      validate,
    })
  )

  const rawDigitsRef = useRef(rawDigits)
  const textRef = useRef(text)
  const valueRef = useRef(value)
  const negativeRef = useRef(isNegative)

  useEffect(() => {
    rawDigitsRef.current = rawDigits
    textRef.current = text
    valueRef.current = value
    negativeRef.current = isNegative
  }, [rawDigits, text, value, isNegative])

  const applyFormattedState = useCallback(
    (
      nextValue: number | null,
      digits: string,
      negative: boolean,
      hitMaxDigits: boolean,
      textOverride?: string
    ) => {
      if (textOverride !== undefined) {
        setValueState(nextValue)
        setRawDigits(digits)
        setText(textOverride)
        setIsNegative(negative)
        setError(
          buildError({
            value: nextValue,
            isNegative: negative,
            maxDigits,
            hitMaxDigits,
            minimumValue,
            maximumValue,
            allowNegative,
            validate,
          })
        )
        return
      }

      const formatted = formatRawDigits(digits, parsingOptions, mask, negative)
      setValueState(nextValue)
      setRawDigits(formatted.rawValue)
      setText(formatted.text)
      setIsNegative(negative)
      setError(
        buildError({
          value: nextValue,
          isNegative: negative,
          maxDigits,
          hitMaxDigits,
          minimumValue,
          maximumValue,
          allowNegative,
          validate,
        })
      )
    },
    [
      parsingOptions,
      mask,
      maxDigits,
      minimumValue,
      maximumValue,
      allowNegative,
      validate,
    ]
  )

  const setValue = useCallback(
    (next: number | null) => {
      const normalised = normaliseValue(next, parsingOptions, maxFractionDigits)
      applyFormattedState(normalised.value, normalised.digits, normalised.isNegative, normalised.hitMaxDigits)
    },
    [applyFormattedState, parsingOptions, maxFractionDigits]
  )

  useEffect(() => {
    if (areValuesEqual(valueProp, valueRef.current, maxFractionDigits)) return
    setValue(valueProp)
  }, [valueProp, maxFractionDigits, setValue])

  useEffect(() => {
    setValue(valueRef.current)
  }, [setValue, parsingOptions, mask])

  const handleChangeText = useCallback(
    (inputText: string) => {
      if (!inputText) {
        applyFormattedState(null, "", false, false)
        return
      }

      const minusCount = allowNegative ? (inputText.match(/-/g) || []).length : 0
      const nextNegative = allowNegative ? minusCount % 2 === 1 : false

      if (mask === "none") {
        const decimalSeparator = getDecimalSeparator(locale)
        const escapedSeparator = decimalSeparator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const cleaned = inputText.replace(new RegExp(`[^0-9${escapedSeparator}-]`, "g"), "")
        const unsigned = cleaned.replace(/-/g, "")
        const hasSeparator = cleaned.includes(decimalSeparator)
        const endsWithSeparator = cleaned.endsWith(decimalSeparator)
        const parts = unsigned.split(decimalSeparator)
        const intPartRaw = parts[0] ?? ""
        const fracPartRaw = parts.slice(1).join("")

        if (maxDigits && intPartRaw.length > maxDigits) {
          setError(
            buildError({
              value: valueRef.current,
              isNegative: negativeRef.current,
              maxDigits,
              hitMaxDigits: true,
              minimumValue,
              maximumValue,
              allowNegative,
              validate,
            })
          )
          return
        }

        const digitsOnly = `${intPartRaw}${fracPartRaw}`.replace(/\D/g, "")

        if (!digitsOnly) {
          applyFormattedState(null, "", false, false)
          return
        }

        const normalizedInt = intPartRaw.replace(/^0+(?=\d)/, "") || "0"
        const fractionLength = fracPartRaw.length
        const fractionValue =
          fractionLength > 0 ? Number(fracPartRaw) / Math.pow(10, fractionLength) : 0
        let numeric = Number(normalizedInt) + fractionValue

        if (allowNegative && nextNegative) {
          numeric = -numeric
        }

        const parsedValue = clampIncomingValue(numeric, {
          allowNegative,
          minimumValue,
          maximumValue,
        })

        const textValue = `${allowNegative && nextNegative ? "-" : ""}${normalizedInt}${
          hasSeparator || endsWithSeparator ? decimalSeparator : ""
        }${fracPartRaw}`

        applyFormattedState(parsedValue, digitsOnly, allowNegative && nextNegative, false, textValue)
        return
      }

      // currency mask: natural left-to-right typing with optional decimal separator
      const decimalSeparator = getDecimalSeparator(locale)
      const escapedSeparator = decimalSeparator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      const allowFraction = maxFractionDigits > 0
      const cleaned = inputText.replace(
        new RegExp(`[^0-9${allowFraction ? escapedSeparator : ""}-]`, "g"),
        ""
      )
      const unsigned = cleaned.replace(/-/g, "")
      const parts = allowFraction ? unsigned.split(decimalSeparator) : [unsigned]
      const intPartRaw = parts[0] ?? ""
      const fracPartRaw = allowFraction ? parts.slice(1).join("") : ""

      if (maxDigits && intPartRaw.length > maxDigits) {
        setError(
          buildError({
            value: valueRef.current,
            isNegative: negativeRef.current,
            maxDigits,
            hitMaxDigits: true,
            minimumValue,
            maximumValue,
            allowNegative,
            validate,
          })
        )
        return
      }

      const fractionLimited = allowFraction ? fracPartRaw.slice(0, maxFractionDigits) : ""
      const digitsOnly = `${intPartRaw}${fractionLimited}`.replace(/\D/g, "")

      if (!digitsOnly) {
        if (allowFraction && cleaned === decimalSeparator) {
          const base = formatCurrency(allowNegative && nextNegative ? -0 : 0, {
            currency,
            locale,
            minimumFractionDigits: 0,
            maximumFractionDigits: maxFractionDigits,
          })
          const textValue = `${base}${decimalSeparator}`
          applyFormattedState(0, "0", allowNegative && nextNegative, false, textValue)
          return
        }
        applyFormattedState(null, "", false, false)
        return
      }

      const normalizedInt = intPartRaw.replace(/^0+(?=\d)/, "") || "0"
      let numeric = Number(normalizedInt)
      if (fractionLimited.length > 0) {
        numeric += Number(fractionLimited) / Math.pow(10, fractionLimited.length)
      }

      if (allowNegative && nextNegative) {
        numeric = -numeric
      }

      const clamped = clampIncomingValue(numeric, {
        allowNegative,
        minimumValue,
        maximumValue,
      })

      const formattedText = (() => {
        if (!allowFraction) {
          return formatCurrency(clamped, {
            currency,
            locale,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })
        }

        const endsWithSeparator = allowFraction && cleaned.endsWith(decimalSeparator)
        const minFrac = fractionLimited.length > 0 ? fractionLimited.length : 0
        const base = formatCurrency(clamped, {
          currency,
          locale,
          minimumFractionDigits: minFrac,
          maximumFractionDigits: maxFractionDigits,
        })

        if (endsWithSeparator) {
          return `${base}${decimalSeparator}`
        }

        return base
      })()

      applyFormattedState(clamped, digitsOnly, allowNegative && nextNegative, false, formattedText)
    },
    [
      allowNegative,
      maxDigits,
      parsingOptions,
      applyFormattedState,
      minimumValue,
      maximumValue,
      validate,
      maxFractionDigits,
      mask,
      locale,
      currency,
      minFractionDigits,
    ]
  )

  return {
    value,
    text,
    rawDigits,
    error,
    handleChangeText,
    setValue,
  }
}

function normaliseValue(
  incoming: number | null,
  options: CurrencyParsingOptions,
  fractionDigits: number
) {
  const { allowNegative = false, maxDigits } = options
  const clampedValue = clampIncomingValue(incoming, {
    allowNegative,
    minimumValue: options.minimumValue,
    maximumValue: options.maximumValue,
  })
  const { digits, isNegative } = digitsFromValue(clampedValue, fractionDigits)
  const limited = applyMaxDigits(digits, fractionDigits, maxDigits)
  const effectiveDigits = limited.digits
  const parsedValue = parseCurrencyFromDigits(effectiveDigits, {
    ...options,
    isNegative,
    fractionDigits,
  })

  return {
    value: parsedValue,
    digits: effectiveDigits,
    isNegative: allowNegative && isNegative,
    hitMaxDigits: limited.hitMaxDigits,
  }
}

function buildError(options: {
  value: number | null
  isNegative: boolean
  maxDigits?: number
  hitMaxDigits: boolean
  minimumValue?: number
  maximumValue?: number
  allowNegative: boolean
  validate?: (value: number | null) => string | null
}) {
  const {
    value,
    isNegative,
    maxDigits,
    hitMaxDigits,
    minimumValue,
    maximumValue,
    allowNegative,
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
