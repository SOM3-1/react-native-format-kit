import React from "react"
import { Text, TextProps } from "react-native"
import { DEFAULT_FRACTION_DIGITS, formatCurrency } from "../core/currency"

export type CurrencyTextProps = TextProps & {
  value: number | null
  placeholder?: string
  currency: string
  locale?: string
  fractionDigits?: number
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

export function CurrencyText(props: CurrencyTextProps) {
  const {
    value,
    placeholder = "",
    currency,
    locale,
    fractionDigits,
    minimumFractionDigits,
    maximumFractionDigits,
    ...textProps
  } = props

  const fraction = typeof fractionDigits === "number" ? fractionDigits : DEFAULT_FRACTION_DIGITS
  const formatted = formatCurrency(value, {
    currency,
    locale,
    fractionDigits: fraction,
    minimumFractionDigits,
    maximumFractionDigits,
  })

  return <Text {...textProps}>{formatted || placeholder}</Text>
}
