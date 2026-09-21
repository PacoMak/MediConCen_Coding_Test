import { z } from 'zod'

export const redisEnvSchema = z.object({
  redis: z.object({
    host: z.string(),
    port: z.coerce.number().int().positive().default(6379),
    password: z.string().optional(),
  }),
})

export type RedisEnv = z.infer<typeof redisEnvSchema>
