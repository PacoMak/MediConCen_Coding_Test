import { z } from 'zod'

export const healthComponentStatusSchema = z.enum(['ok', 'error'])

export const healthResponseSchema = z.object({
  env: z.enum(['LOCAL', 'DEV', 'PROD']),
  status: z.enum(['ok', 'error']),
  database: healthComponentStatusSchema,
  redis: healthComponentStatusSchema,
})

export type HealthComponentStatus = z.infer<typeof healthComponentStatusSchema>
export type HealthResponse = z.infer<typeof healthResponseSchema>
