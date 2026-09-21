import { z } from 'zod'

export const baseEntityFields = {
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string(),
}
