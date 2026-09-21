import { databaseEnvSchema } from '@mediconcen_coding_test/backend-common'
import camelcase from 'camelcase'
import { unflatten } from 'flat'
import { z } from 'zod'

export const environmentSchema = z.object({
  port: z.coerce.number().default(3000),
  env: z.enum(['LOCAL', 'DEV', 'PROD']),
  ...databaseEnvSchema.shape,
})

export type Environment = z.infer<typeof environmentSchema>

export function parseEnv(config: Record<string, unknown>) {
  return unflatten(config, {
    delimiter: '__',
    object: true,
    transformKey: (key) => camelcase(key),
  })
}
