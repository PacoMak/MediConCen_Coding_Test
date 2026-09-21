import { describe, expect, it } from 'vitest'
import { requestIdFromHeader } from './request-id.ts'

describe('requestIdFromHeader', () => {
  it('returns a non-empty string header', () => {
    expect(requestIdFromHeader('abc')).toBe('abc')
  })

  it('returns the first non-empty array value', () => {
    expect(requestIdFromHeader(['abc', 'def'])).toBe('abc')
  })

  it('returns undefined for missing or empty values', () => {
    expect(requestIdFromHeader(undefined)).toBeUndefined()
    expect(requestIdFromHeader('')).toBeUndefined()
    expect(requestIdFromHeader([])).toBeUndefined()
    expect(requestIdFromHeader([''])).toBeUndefined()
  })
})
