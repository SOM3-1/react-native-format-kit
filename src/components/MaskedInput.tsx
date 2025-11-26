import React, { useEffect } from "react"
import { Text, TextInput, TextInputProps, View, ViewStyle, TextStyle } from "react-native"
import { StyleProp } from "react-native"
import { Formatter } from "../core/Formatter.types"
import { useMaskedInput } from "../core/useMaskedInput"

export type MaskedInputProps<TValue> = Omit<
  TextInputProps,
  "value" | "onChangeText"
> & {
  value: TValue | null
  onChangeValue: (value: TValue | null) => void
  formatter: Formatter<TValue>
  containerStyle?: StyleProp<ViewStyle>
  inputStyle?: StyleProp<TextStyle>
  error?: string | null
  onValidationError?: (error: string | null) => void
  showErrorText?: boolean
  errorTextStyle?: StyleProp<TextStyle>
  errorContainerStyle?: StyleProp<ViewStyle>
  onChangeRawText?: (rawDigits: string) => void
  onChangeRawValue?: (rawValue: string) => void
}

export function MaskedInput<TValue>(props: MaskedInputProps<TValue>) {
  const {
    value: valueProp,
    onChangeValue,
    formatter,
    containerStyle,
    inputStyle,
    error: errorProp,
    onValidationError,
    showErrorText,
    errorTextStyle,
    errorContainerStyle,
    onChangeRawText,
    onChangeRawValue,
    keyboardType,
    ...textInputProps
  } = props

  const { value, text, rawValue, error, handleChangeText, setValue } =
    useMaskedInput<TValue>({
      formatter,
      initialValue: valueProp,
    })

  useEffect(() => {
    if (valueProp !== value) {
      setValue(valueProp)
    }
  }, [valueProp, value, setValue])

  useEffect(() => {
    onChangeValue(value)
  }, [value, onChangeValue])

  useEffect(() => {
    if (onValidationError) {
      onValidationError(error)
    }
  }, [error, onValidationError])

  useEffect(() => {
    if (onChangeRawText) {
      onChangeRawText(rawValue)
    }
    if (onChangeRawValue) {
      onChangeRawValue(rawValue)
    }
  }, [rawValue, onChangeRawText, onChangeRawValue])

  const effectiveError = errorProp ?? error

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
