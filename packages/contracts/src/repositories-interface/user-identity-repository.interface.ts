import {
  UserIdentity,
  userIdentitySchema,
} from '@mediconcen_coding_test/schemas'
import { z } from 'zod'

export const USER_IDENTITY_REPOSITORY = Symbol('USER_IDENTITY_REPOSITORY')

export const getByIdPairFilter = userIdentitySchema.pick({
  id1: true,
  id2: true,
})

export type GetByIdPairFilter = z.input<typeof getByIdPairFilter>

export const createPayload = userIdentitySchema.pick({
  id1: true,
  id2: true,
  userId: true,
})
export type CreatePayload = z.input<typeof createPayload>

export interface IUserIdentityRepository {
  getByIdPair(filter: GetByIdPairFilter): Promise<UserIdentity | null>
  create(actorId: string, data: CreatePayload): Promise<UserIdentity>
}
