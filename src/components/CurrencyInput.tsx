import React, { useEffect, useState } from "react"
import {
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  TextStyle,
  StyleProp,
  StyleSheet,
} from "react-native"
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
  label?: string
  floatingLabel?: boolean
  labelStyle?: StyleProp<TextStyle>
  labelContainerStyle?: StyleProp<ViewStyle>
  inputContainerStyle?: StyleProp<ViewStyle>
  inputContainerFocusedStyle?: StyleProp<ViewStyle>
  inputContainerErrorStyle?: StyleProp<ViewStyle>
  defaultBorderColor?: string
  focusBorderColor?: string
  errorBorderColor?: string
  labelBackgroundColor?: string
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
    label,
    floatingLabel = true,
    labelStyle,
    labelContainerStyle,
    inputContainerStyle,
    inputContainerFocusedStyle,
    inputContainerErrorStyle,
    defaultBorderColor = "#ccc",
    focusBorderColor = "#4c6fff",
    errorBorderColor = "#d14343",
    labelBackgroundColor = "white",
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

  const [focused, setFocused] = useState(false)
  const shouldFloat = floatingLabel && (focused || (text?.length ?? 0) > 0)
  const containerBorderColor = effectiveError
    ? errorBorderColor
    : focused
      ? focusBorderColor
      : defaultBorderColor

  const effectivePlaceholder = textInputProps.placeholder ?? label
  const effectivePlaceholderColor =
    textInputProps.placeholderTextColor ?? (shouldFloat ? "#999" : "#b0b0b0")

  return (
    <View style={containerStyle}>
      <View
        style={[
          defaultStyles.inputContainer,
          shouldFloat && label ? defaultStyles.withFloatingLabel : null,
          { borderColor: containerBorderColor },
          focused ? inputContainerFocusedStyle : null,
          effectiveError ? inputContainerErrorStyle : null,
          inputContainerStyle,
        ]}
      >
        {label && shouldFloat ? (
          <View
            style={[
              defaultStyles.floatingLabelContainer,
              labelContainerStyle,
              labelBackgroundColor ? { backgroundColor: labelBackgroundColor } : null,
            ]}
          >
            <Text
              style={[
                defaultStyles.floatingLabelText,
                labelStyle,
              ]}
            >
              {label}
            </Text>
          </View>
        ) : null}
        <TextInput
          {...textInputProps}
          placeholder={effectivePlaceholder}
          placeholderTextColor={effectivePlaceholderColor}
          value={text}
          onChangeText={handleChangeText}
          keyboardType={keyboardType || "numeric"}
          style={[
            defaultStyles.input,
            floatingLabel ? defaultStyles.inputWithFloatingLabel : null,
            inputStyle,
          ]}
          onFocus={(e) => {
            setFocused(true)
            textInputProps.onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            textInputProps.onBlur?.(e)
          }}
        />
      </View>
      {showErrorText && effectiveError ? (
        <View style={[defaultStyles.errorContainer, errorContainerStyle]}>
          <Text style={[defaultStyles.errorText, errorTextStyle]}>{effectiveError}</Text>
        </View>
      ) : null}
    </View>
  )
}

const defaultStyles = StyleSheet.create({
  inputContainer: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
  },
  withFloatingLabel: {
    paddingTop: 16,
  },
  floatingLabelContainer: {
    position: "absolute",
    top: -10,
    left: 12,
    paddingHorizontal: 6,
  },
  floatingLabelText: {
    fontSize: 14,
    color: "#444",
    fontWeight: "600",
  },
  input: {
    fontSize: 16,
    padding: 0,
    margin: 0,
  },
  inputWithFloatingLabel: {
    paddingTop: 6,
  },
  errorContainer: {
    marginTop: 6,
  },
  errorText: {
    color: "#d14343",
    fontSize: 14,
  },
})
