import {
  CodedException,
  type ErrorCode,
  type ExceptionCategoryType,
} from './coded-exception.js'

type DetailArgs = [] | [unknown]

type FactoryArgs<T extends DetailArgs> = T extends [infer Details]
  ? [Details]
  : []

type ExceptionFactory<Details extends Record<string, DetailArgs>> = {
  [Key in keyof Details]: (...args: FactoryArgs<Details[Key]>) => CodedException
}

export function prepareErrorFactories<
  Details extends Record<string, DetailArgs>,
  Codes extends Record<keyof Details, string> = Record<keyof Details, string>,
  Categories extends { [Key in keyof Details]: ExceptionCategoryType } = {
    [Key in keyof Details]: ExceptionCategoryType
  },
>(
  origin: string,
  errorCodes: Codes,
  exceptionCategories: Categories,
): {
  codes: Codes
  ExceptionFactory: ExceptionFactory<Details>
} {
  const ExceptionFactory = Object.fromEntries(
    (Object.keys(errorCodes) as (keyof Details & string)[]).map((key) => [
      key,
      (...args: FactoryArgs<Details[typeof key]>) => {
        const details = args[0]
        const code: ErrorCode =
          details === undefined
            ? { origin, code: errorCodes[key] }
            : { origin, code: errorCodes[key], details }
        return new CodedException(exceptionCategories[key], code)
      },
    ]),
  ) as ExceptionFactory<Details>

  return {
    codes: errorCodes,
    ExceptionFactory,
  }
}
