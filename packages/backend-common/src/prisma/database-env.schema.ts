import { z } from 'zod'

export const databaseEnvSchema = z.object({
  database: z.object({
    server: z.string(),
    user: z.string(),
    database: z.string(),
    password: z.string(),
    port: z.coerce.number().int().positive().default(3306),
  }),
})

export type DatabaseEnv = z.infer<typeof databaseEnvSchema>
