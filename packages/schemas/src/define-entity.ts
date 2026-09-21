import { z, type ZodRawShape } from 'zod'
import { baseEntityFields } from './base.js'
import { primaryKey } from './primary-key.js'

export function defineEntity<T extends ZodRawShape>(fields: T) {
  return z.object({
    id: primaryKey,
    ...fields,
    ...baseEntityFields,
  })
}
