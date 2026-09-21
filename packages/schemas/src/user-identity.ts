import { z } from 'zod'
import { defineEntity } from './define-entity.js'

export const userIdentitySchema = defineEntity({
  id1: z.string(),
  id2: z.string(),
  userId: z.string(),
})

export type UserIdentity = z.infer<typeof userIdentitySchema>
