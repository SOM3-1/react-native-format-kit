import React, { useEffect } from "react"
import { Text, TextInput, TextInputProps, View, ViewStyle, TextStyle } from "react-native"
import { StyleProp } from "react-native"
import { CurrencyFormatterMode } from "../core/currency"
import { useCurrencyInput } from "../hooks/useCurrencyInput"

export type CurrencyInputProps = Omit<
  TextInputProps,
  "value" | "onChangeText" | "keyboardType"
> & {
  value: number | null
  onChangeValue: (value: number | null) => void
  onChangeText?: (formatted: string) => void
  onChangeRawText?: (rawDigits: string) => void
  currency: string
  locale?: string
  fractionDigits?: number
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  minimumValue?: number
  maximumValue?: number
  allowNegative?: boolean
  maxDigits?: number
  mask?: CurrencyFormatterMode
  validate?: (value: number | null) => string | null
  containerStyle?: StyleProp<ViewStyle>
  inputStyle?: StyleProp<TextStyle>
  error?: string | null
  onValidationError?: (error: string | null) => void
  showErrorText?: boolean
  errorTextStyle?: StyleProp<TextStyle>
  errorContainerStyle?: StyleProp<ViewStyle>
  keyboardType?: TextInputProps["keyboardType"]
}

export function CurrencyInput(props: CurrencyInputProps) {
  const {
    value,
    onChangeValue,
    onChangeText,
    onChangeRawText,
    currency,
    locale,
    fractionDigits,
    minimumFractionDigits,
    maximumFractionDigits,
    minimumValue,
    maximumValue,
    allowNegative,
    maxDigits,
    mask,
    validate,
    containerStyle,
    inputStyle,
    error: errorProp,
    onValidationError,
    showErrorText,
    errorTextStyle,
    errorContainerStyle,
    keyboardType,
    ...textInputProps
  } = props

  const {
    value: nextValue,
    text,
    rawDigits,
    error,
    handleChangeText,
  } = useCurrencyInput({
    value,
    currency,
    locale,
    fractionDigits,
    minimumFractionDigits,
    maximumFractionDigits,
    minimumValue,
    maximumValue,
    allowNegative,
    maxDigits,
    mask,
    validate,
  })

  useEffect(() => {
    onChangeValue(nextValue)
  }, [nextValue, onChangeValue])

  useEffect(() => {
    if (onChangeText) {
      onChangeText(text)
    }
  }, [text, onChangeText])

  useEffect(() => {
    if (onChangeRawText) {
      onChangeRawText(rawDigits)
    }
  }, [rawDigits, onChangeRawText])

  const effectiveError = errorProp ?? error

  useEffect(() => {
    if (onValidationError) {
      onValidationError(effectiveError ?? null)
    }
  }, [effectiveError, onValidationError])

  return (
    <View style={containerStyle}>
      <TextInput
        {...textInputProps}
        value={text}
        onChangeText={handleChangeText}
        keyboardType={keyboardType || "numeric"}
        style={inputStyle}
      />
      {showErrorText && effectiveError ? (
        <View style={errorContainerStyle}>
          <Text style={errorTextStyle}>{effectiveError}</Text>
        </View>
      ) : null}
    </View>
  )
}
