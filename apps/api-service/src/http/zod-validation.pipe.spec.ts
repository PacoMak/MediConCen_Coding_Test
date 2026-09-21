import { BadRequestException } from '@nestjs/common'
import { userIdentityRoutes } from '@mediconcen_coding_test/api-defs'
import { describe, expect, it } from 'vitest'
import { ZodValidationPipe } from './zod-validation.pipe.js'

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(
    userIdentityRoutes.endpoints.getAndCreateIfNotExist.schemas.body,
  )

  it('accepts id1 and id2', () => {
    expect(pipe.transform({ id1: 'ABC123', id2: 'XYZ456' })).toEqual({
      id1: 'ABC123',
      id2: 'XYZ456',
    })
  })

  it('rejects missing id1', () => {
    expect(() => pipe.transform({ id2: 'XYZ456' })).toThrow(BadRequestException)
  })

  it('rejects missing id2', () => {
    expect(() => pipe.transform({ id1: 'ABC123' })).toThrow(BadRequestException)
  })

  it('rejects empty strings', () => {
    expect(() => pipe.transform({ id1: '  ', id2: 'XYZ456' })).toThrow(
      BadRequestException,
    )
  })
})
