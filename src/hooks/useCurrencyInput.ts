import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  CurrencyFormatterMode,
  CurrencyParsingOptions,
  applyMaxDigits,
  digitsFromValue,
  formatRawDigits,
  parseCurrencyFromDigits,
  stripToDigits,
  resolveFractionDigits,
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
    (nextValue: number | null, digits: string, negative: boolean, hitMaxDigits: boolean) => {
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
      const normalised = normaliseValue(next, parsingOptions, fractionDigits)
      applyFormattedState(normalised.value, normalised.digits, normalised.isNegative, normalised.hitMaxDigits)
    },
    [applyFormattedState, parsingOptions, fractionDigits]
  )

  useEffect(() => {
    if (areValuesEqual(valueProp, valueRef.current, fractionDigits)) return
    setValue(valueProp)
  }, [valueProp, fractionDigits, setValue])

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
      const digitsOnly = stripToDigits(inputText)

      const limited = applyMaxDigits(digitsOnly, maxFractionDigits, maxDigits)
      if (limited.hitMaxDigits && limited.digits !== digitsOnly) {
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

      if (!digitsOnly) {
        applyFormattedState(null, "", false, false)
        return
      }

      const parsedValue = parseCurrencyFromDigits(limited.digits, {
        ...parsingOptions,
        isNegative: nextNegative,
        fractionDigits: maxFractionDigits,
      })

      const effectiveNegative = allowNegative && nextNegative
      applyFormattedState(parsedValue, limited.digits, effectiveNegative, limited.hitMaxDigits)
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
