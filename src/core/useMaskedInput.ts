import { useCallback, useEffect, useState } from "react"
import { Formatter } from "./Formatter.types"

export type UseMaskedInputOptions<TValue> = {
  formatter: Formatter<TValue>
  initialValue?: TValue | null
}

export type UseMaskedInputResult<TValue> = {
  value: TValue | null
  text: string
  rawValue: string
  error: string | null
  handleChangeText: (text: string) => void
  setValue: (value: TValue | null) => void
}

export function useMaskedInput<TValue>(
  options: UseMaskedInputOptions<TValue>
): UseMaskedInputResult<TValue> {
  const { formatter, initialValue = null } = options

  const initialFormatted = formatter.format(initialValue)

  const [value, setValueState] = useState<TValue | null>(initialValue)
  const [text, setText] = useState<string>(initialFormatted.text)
  const [rawValue, setRawValue] = useState<string>(initialFormatted.rawValue)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const formatted = formatter.format(value)
    setText(formatted.text)
    setRawValue(formatted.rawValue)
  }, [value, formatter])

  const handleChangeText = useCallback(
    (inputText: string) => {
      const parsed = formatter.parse(inputText)
      setValueState(parsed.value)
      setRawValue(parsed.rawValue)
      setError(parsed.error ?? null)
      const formatted = formatter.format(parsed.value)
      setText(formatted.text)
    },
    [formatter]
  )

  const setValue = useCallback(
    (next: TValue | null) => {
      setValueState(next)
      const formatted = formatter.format(next)
      setText(formatted.text)
      setRawValue(formatted.rawValue)
      setError(null)
    },
    [formatter]
  )

  return {
    value,
    text,
    rawValue,
    error,
    handleChangeText,
    setValue,
  }
}
