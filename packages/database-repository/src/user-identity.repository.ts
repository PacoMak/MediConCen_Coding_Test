import { Injectable } from '@nestjs/common'
import { Prisma, PrismaService } from '@mediconcen_coding_test/backend-common'
import type {
  CreatePayload,
  GetByIdPairFilter,
  IUserIdentityRepository,
} from '@mediconcen_coding_test/contracts'
import { DatabaseError } from './database.error.ts'
import { toPrismaCreate } from './user-identity.converter.ts'

@Injectable()
export class UserIdentityRepository implements IUserIdentityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getByIdPair(filter: GetByIdPairFilter) {
    return this.prisma.userIdentity.findUnique({
      where: { id1_id2: { id1: filter.id1, id2: filter.id2 } },
    })
  }

  async create(actorId: string, data: CreatePayload) {
    try {
      return await this.prisma.userIdentity.create({
        data: toPrismaCreate(data, actorId),
      })
    } catch (error) {
      this.rethrowMapped(error)
    }
  }

  private rethrowMapped(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw DatabaseError.ExceptionFactory.uniqueConstraintViolated({
        target: error.meta?.target,
      })
    }

    throw error
  }
}
