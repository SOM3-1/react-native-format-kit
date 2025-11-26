import React, { useEffect } from "react"
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

  const [focused, setFocused] = React.useState(false)
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
            <Text style={[defaultStyles.floatingLabelText, labelStyle]}>{label}</Text>
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
        <View style={errorContainerStyle}>
          <Text style={errorTextStyle}>{effectiveError}</Text>
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
