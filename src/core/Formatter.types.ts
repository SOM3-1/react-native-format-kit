export type FormatResult = {
  text: string
  rawValue: string
}

export type ParseResult<TValue> = {
  value: TValue | null
  rawValue: string
  error?: string | null
}

export interface Formatter<TValue> {
  format(value: TValue | null): FormatResult
  parse(inputText: string): ParseResult<TValue>
}
