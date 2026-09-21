import { describe, expect, it } from 'vitest'
import { CodedException, ExceptionCategory } from './coded-exception.ts'
import { prepareErrorFactories } from './error-factories.ts'

const SampleError = prepareErrorFactories<{
  noDetails: []
  withDetails: [{ id: string }]
}>(
  'sample',
  {
    noDetails: 'no-details',
    withDetails: 'with-details',
  },
  {
    noDetails: ExceptionCategory.internalError,
    withDetails: ExceptionCategory.notFound,
  },
)

describe('prepareErrorFactories', () => {
  it('builds a CodedException with origin, code, and category', () => {
    const error = SampleError.ExceptionFactory.noDetails()

    expect(error).toBeInstanceOf(CodedException)
    expect(error).toBeInstanceOf(Error)
    expect(error.category).toBe(ExceptionCategory.internalError)
    expect(error.code).toEqual({ origin: 'sample', code: 'no-details' })
    expect(error.message).toBe('no-details')
    expect(error.name).toBe('CodedException')
  })

  it('attaches details when the factory is given a payload', () => {
    const error = SampleError.ExceptionFactory.withDetails({ id: 'abc' })

    expect(error.category).toBe(ExceptionCategory.notFound)
    expect(error.code).toEqual({
      origin: 'sample',
      code: 'with-details',
      details: { id: 'abc' },
    })
    expect(error.message).toBe('with-details')
  })

  it('exposes kebab codes for catch-site comparisons', () => {
    expect(SampleError.codes.withDetails).toBe('with-details')
    expect(SampleError.codes.noDetails).toBe('no-details')
  })
})
