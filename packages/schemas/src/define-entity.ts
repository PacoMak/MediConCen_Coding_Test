import { z, type ZodRawShape } from 'zod'
import { baseEntityFields } from './base.ts'
import { primaryKey } from './primary-key.ts'

export function defineEntity<T extends ZodRawShape>(fields: T) {
  return z.object({
    id: primaryKey,
    ...fields,
    ...baseEntityFields,
  })
}
