import { Prisma } from '@mediconcen_coding_test/backend-common'
import type { CreatePayload } from '@mediconcen_coding_test/contracts'

export function toPrismaCreate(
  data: CreatePayload,
  actorId: string,
): Prisma.UserIdentityCreateInput {
  return {
    id1: data.id1,
    id2: data.id2,
    userId: data.userId,
    createdBy: actorId,
    updatedBy: actorId,
  }
}
