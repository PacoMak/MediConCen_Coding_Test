import { userIdentitySchema } from '@mediconcen_coding_test/schemas'
import { z } from 'zod'

export const userIdentityDtoSchemas = {
  getAndCreateIfNotExistRequest: userIdentitySchema
    .pick({ id1: true, id2: true })
    .extend({
      id1: z.string().trim().min(1),
      id2: z.string().trim().min(1),
    }),
  getAndCreateIfNotExistResponse: z.object({
    userID: z.uuidv4(),
  }),
}

export type UserIdentityDtos = {
  getAndCreateIfNotExistRequest: z.input<
    (typeof userIdentityDtoSchemas)['getAndCreateIfNotExistRequest']
  >
  getAndCreateIfNotExistResponse: z.infer<
    (typeof userIdentityDtoSchemas)['getAndCreateIfNotExistResponse']
  >
}
