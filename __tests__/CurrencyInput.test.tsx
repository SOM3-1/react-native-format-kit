import React from "react"
import { fireEvent, render, waitFor } from "@testing-library/react-native"
import { CurrencyInput } from "../src/components/CurrencyInput"
import { formatCurrency } from "../src/core/currency"

describe("CurrencyInput", () => {
  it("formats currency text and emits callbacks", async () => {
    const onChangeValue = jest.fn()
    const onChangeText = jest.fn()
    const onChangeRawText = jest.fn()

    const { getByTestId } = render(
      <CurrencyInput
        currency="USD"
        value={null}
        mask="currency"
        onChangeValue={onChangeValue}
        onChangeText={onChangeText}
        onChangeRawText={onChangeRawText}
        testID="currency-input"
      />
    )

    fireEvent.changeText(getByTestId("currency-input"), "1234")

    await waitFor(() => expect(onChangeValue).toHaveBeenLastCalledWith(1234))

    expect(onChangeText).toHaveBeenLastCalledWith("$1,234")
    expect(onChangeRawText).toHaveBeenLastCalledWith("1234")
  })

  it("shows whole numbers without forced decimals", async () => {
    const onChangeText = jest.fn()
    const { getByTestId } = render(
      <CurrencyInput
        currency="USD"
        value={null}
        onChangeValue={() => {}}
        onChangeText={onChangeText}
        testID="currency-input"
      />
    )

    fireEvent.changeText(getByTestId("currency-input"), "1")
    await waitFor(() => expect(onChangeText).toHaveBeenLastCalledWith("$1"))
  })

  it("toggles negative sign when '-' is typed", async () => {
    const onChangeValue = jest.fn()

    const { getByTestId } = render(
      <CurrencyInput
        currency="USD"
        value={null}
        allowNegative
        onChangeValue={onChangeValue}
        testID="currency-input"
      />
    )

    fireEvent.changeText(getByTestId("currency-input"), "-123")
    await waitFor(() => expect(onChangeValue).toHaveBeenLastCalledWith(-123))

    fireEvent.changeText(getByTestId("currency-input"), "-123-")
    await waitFor(() => expect(onChangeValue).toHaveBeenLastCalledWith(123))
  })

  it("ignores extra digits once maxDigits is reached and reports validation", async () => {
    const onChangeValue = jest.fn()
    const onValidationError = jest.fn()

    const { getByTestId } = render(
      <CurrencyInput
        currency="USD"
        value={null}
        maxDigits={2}
        onChangeValue={onChangeValue}
        onValidationError={onValidationError}
        testID="currency-input"
      />
    )

    const input = getByTestId("currency-input")
    fireEvent.changeText(input, "1234")
    expect(onChangeValue).toHaveBeenLastCalledWith(null)

    fireEvent.changeText(input, "123456")
    await waitFor(() => expect(onValidationError).toHaveBeenLastCalledWith("Maximum digits is 2"))
    expect(onChangeValue).toHaveBeenLastCalledWith(null)
  })

  it("respects mask='none' and clears to null", async () => {
    const onChangeValue = jest.fn()
    const onChangeText = jest.fn()

    const { getByTestId } = render(
      <CurrencyInput
        currency="EUR"
        locale="en-US"
        mask="none"
        value={null}
        onChangeValue={onChangeValue}
        onChangeText={onChangeText}
        fractionDigits={2}
        testID="currency-input"
      />
    )

    const input = getByTestId("currency-input")
    fireEvent.changeText(input, "99")
    await waitFor(() => expect(onChangeValue).toHaveBeenLastCalledWith(99))
    expect(onChangeText).toHaveBeenLastCalledWith("99")

    fireEvent.changeText(input, "")
    await waitFor(() => expect(onChangeValue).toHaveBeenLastCalledWith(null))
  })

  it("formats naturally left-to-right in currency mask", async () => {
    const onChangeValue = jest.fn()
    const onChangeText = jest.fn()

    const { getByTestId } = render(
      <CurrencyInput
        currency="USD"
        locale="en-US"
        value={null}
        allowNegative
        onChangeValue={onChangeValue}
        onChangeText={onChangeText}
        maximumFractionDigits={2}
        testID="currency-input"
      />
    )

    const input = getByTestId("currency-input")
    fireEvent.changeText(input, "12")
    await waitFor(() => expect(onChangeValue).toHaveBeenLastCalledWith(12))

    fireEvent.changeText(input, "12.3")
    await waitFor(() => expect(onChangeValue).toHaveBeenLastCalledWith(12.3))

    fireEvent.changeText(input, "12.")
    await waitFor(() => expect(onChangeValue).toHaveBeenLastCalledWith(12))

    fireEvent.changeText(input, "-12.")
    await waitFor(() => expect(onChangeValue).toHaveBeenLastCalledWith(-12))

    expect(onChangeText).toHaveBeenLastCalledWith(expect.stringContaining("12"))
  })

  it("allows starting with a decimal and shows 0.", async () => {
    const onChangeValue = jest.fn()
    const onChangeText = jest.fn()

    const { getByTestId } = render(
      <CurrencyInput
        currency="USD"
        locale="en-US"
        value={null}
        onChangeValue={onChangeValue}
        onChangeText={onChangeText}
        maximumFractionDigits={2}
        testID="currency-input"
      />
    )

    const input = getByTestId("currency-input")
    fireEvent.changeText(input, ".")
    await waitFor(() => expect(onChangeValue).toHaveBeenLastCalledWith(0))
    expect(onChangeText).toHaveBeenLastCalledWith("$0.")
  })
})
