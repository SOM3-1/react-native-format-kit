import { formatCurrency, parseCurrencyFromDigits } from "../src/core/currency"

describe("parseCurrencyFromDigits", () => {
  it("returns null for empty digits", () => {
    expect(parseCurrencyFromDigits("", { currency: "USD" })).toBeNull()
  })

  it("parses positive values with fraction digits", () => {
    const value = parseCurrencyFromDigits("1234", { currency: "USD", fractionDigits: 2 })
    expect(value).toBeCloseTo(12.34)
  })

  it("ignores negative intent when negatives are not allowed", () => {
    const value = parseCurrencyFromDigits("100", { currency: "USD", isNegative: true })
    expect(value).toBe(1)
  })

  it("applies min and max bounds", () => {
    const minClamped = parseCurrencyFromDigits("50", {
      currency: "USD",
      fractionDigits: 2,
      minimumValue: 1,
      isNegative: true,
      allowNegative: true,
    })
    expect(minClamped).toBe(1)

    const maxClamped = parseCurrencyFromDigits("100000", {
      currency: "USD",
      fractionDigits: 2,
      maximumValue: 500,
    })
    expect(maxClamped).toBe(500)
  })

  it("respects negative values when allowed", () => {
    const value = parseCurrencyFromDigits("123", {
      currency: "USD",
      fractionDigits: 2,
      allowNegative: true,
      isNegative: true,
    })

    expect(value).toBeCloseTo(-1.23)
  })

  it("respects maxDigits by trimming the input", () => {
    const value = parseCurrencyFromDigits("1234567", {
      currency: "USD",
      fractionDigits: 2,
      maxDigits: 4,
    })
    expect(value).toBeCloseTo(2345.67)
  })
})

describe("formatCurrency", () => {
  it("returns an empty string for null values", () => {
    expect(formatCurrency(null, { currency: "USD" })).toBe("")
  })

  it("formats numeric values with the given locale", () => {
    const result = formatCurrency(12.34, { currency: "USD", locale: "en-US" })
    expect(result).toContain("12.34")
  })
})
