export const ExceptionCategory = {
  badRequest: 'bad-request',
  unauthorized: 'unauthorized',
  forbidden: 'forbidden',
  notFound: 'not-found',
  concurrency: 'concurrency',
  internalError: 'internal-error',
  notImplemented: 'not-implemented',
} as const

export type ExceptionCategoryType =
  (typeof ExceptionCategory)[keyof typeof ExceptionCategory]

export type ErrorCode = {
  origin: string
  code: string
  details?: unknown
}

export class CodedException extends Error {
  readonly category: ExceptionCategoryType
  readonly code: ErrorCode

  constructor(category: ExceptionCategoryType, code: ErrorCode) {
    super(code.code)
    this.name = 'CodedException'
    this.category = category
    this.code = code
  }
}
