import { randomUUID } from 'node:crypto'
import { type INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { UserIdentityService } from '@mediconcen_coding_test/backend-application-service'
import {
  CurrentActorProvider,
  RedisService,
} from '@mediconcen_coding_test/backend-common'
import {
  USER_IDENTITY_REPOSITORY,
  type IUserIdentityRepository,
} from '@mediconcen_coding_test/contracts'
import { DatabaseError } from '@mediconcen_coding_test/database-repository'
import type { UserIdentity } from '@mediconcen_coding_test/schemas'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { UserIdentityController } from './user-identity.controller.js'

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function pairKey(id1: string, id2: string): string {
  return `${id1}\0${id2}`
}

function identity(partial: {
  id1: string
  id2: string
  userId: string
  createdBy?: string
}): UserIdentity {
  const now = new Date()
  return {
    id: randomUUID(),
    id1: partial.id1,
    id2: partial.id2,
    userId: partial.userId,
    createdAt: now,
    updatedAt: now,
    createdBy: partial.createdBy ?? 'actor-id',
    updatedBy: partial.createdBy ?? 'actor-id',
  }
}

function createInMemoryRepository(
  seed: UserIdentity[] = [],
): IUserIdentityRepository & { createCount: number } {
  const rows = new Map(seed.map((row) => [pairKey(row.id1, row.id2), row]))
  const repository = {
    createCount: 0,
    async getByIdPair(filter: { id1: string; id2: string }) {
      return rows.get(pairKey(filter.id1, filter.id2)) ?? null
    },
    async create(
      actorId: string,
      data: { id1: string; id2: string; userId: string },
    ) {
      const key = pairKey(data.id1, data.id2)
      if (rows.has(key)) {
        throw DatabaseError.ExceptionFactory.uniqueConstraintViolated({
          target: ['id1', 'id2'],
        })
      }

      repository.createCount += 1
      await new Promise((resolve) => {
        setTimeout(resolve, 20)
      })

      if (rows.has(key)) {
        throw DatabaseError.ExceptionFactory.uniqueConstraintViolated({
          target: ['id1', 'id2'],
        })
      }

      const row = identity({ ...data, createdBy: actorId })
      rows.set(key, row)
      return row
    },
  }

  return repository
}

function createInMemoryRedis(): RedisService {
  const locks = new Map<string, string>()

  return {
    isAvailable() {
      return true
    },
    async ping() {
      return true
    },
    async tryLock(key: string) {
      if (locks.has(key)) {
        return null
      }
      const token = randomUUID()
      locks.set(key, token)
      return token
    },
    async releaseLock(key: string, token: string) {
      if (locks.get(key) === token) {
        locks.delete(key)
      }
    },
  } as unknown as RedisService
}

async function createApp(
  repository: IUserIdentityRepository,
  redis: RedisService = createInMemoryRedis(),
): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: [UserIdentityController],
    providers: [
      UserIdentityService,
      { provide: USER_IDENTITY_REPOSITORY, useValue: repository },
      {
        provide: CurrentActorProvider,
        useValue: { getId: () => 'actor-id' },
      },
      { provide: RedisService, useValue: redis },
    ],
  }).compile()

  const app = moduleRef.createNestApplication({ logger: false })
  await app.init()
  return app
}

describe('POST /user-identities', () => {
  let app: INestApplication
  let repository: IUserIdentityRepository & { createCount: number }

  afterEach(async () => {
    await app.close()
  })

  describe('new id1 + id2', () => {
    beforeEach(async () => {
      repository = createInMemoryRepository()
      app = await createApp(repository)
    })

    it('creates a userID and returns 200', async () => {
      const response = await request(app.getHttpServer())
        .post('/user-identities')
        .send({ id1: 'ABC123', id2: 'XYZ456' })

      expect(response.status).toBe(200)
      expect(response.body.userID).toMatch(UUID_V4)
      expect(repository.createCount).toBe(1)
    })
  })

  describe('existing id1 + id2', () => {
    const existing = identity({
      id1: 'ABC123',
      id2: 'XYZ456',
      userId: '550e8400-e29b-41d4-a716-446655440000',
    })

    beforeEach(async () => {
      repository = createInMemoryRepository([existing])
      app = await createApp(repository)
    })

    it('returns the stored userID without creating a new row', async () => {
      const response = await request(app.getHttpServer())
        .post('/user-identities')
        .send({ id1: 'ABC123', id2: 'XYZ456' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ userID: existing.userId })
      expect(repository.createCount).toBe(0)
    })
  })

  describe('invalid input', () => {
    beforeEach(async () => {
      repository = createInMemoryRepository()
      app = await createApp(repository)
    })

    it.each([
      { name: 'missing id1', body: { id2: 'XYZ456' } },
      { name: 'missing id2', body: { id1: 'ABC123' } },
      { name: 'empty id1', body: { id1: '  ', id2: 'XYZ456' } },
      { name: 'empty id2', body: { id1: 'ABC123', id2: '' } },
      { name: 'empty body', body: {} },
    ])('returns 400 for $name', async ({ body }) => {
      const response = await request(app.getHttpServer())
        .post('/user-identities')
        .send(body)

      expect(response.status).toBe(400)
      expect(repository.createCount).toBe(0)
    })
  })

  describe('error scenarios', () => {
    it('creates only one record when concurrent requests share a pair', async () => {
      repository = createInMemoryRepository()
      app = await createApp(repository)

      const responses = await Promise.all(
        Array.from({ length: 8 }, () =>
          request(app.getHttpServer())
            .post('/user-identities')
            .send({ id1: 'ABC123', id2: 'XYZ456' }),
        ),
      )

      const userIds = responses.map((response) => {
        expect(response.status).toBe(200)
        return response.body.userID as string
      })

      expect(new Set(userIds).size).toBe(1)
      expect(repository.createCount).toBe(1)
    })

    it('returns the winner userID after a unique-constraint race', async () => {
      const winner = identity({
        id1: 'ABC123',
        id2: 'XYZ456',
        userId: '11111111-1111-4111-8111-111111111111',
      })
      let lookups = 0
      const racingRepository: IUserIdentityRepository = {
        async getByIdPair() {
          lookups += 1
          return lookups === 1 ? null : winner
        },
        async create() {
          throw DatabaseError.ExceptionFactory.uniqueConstraintViolated({
            target: ['id1', 'id2'],
          })
        },
      }
      app = await createApp(racingRepository)

      const response = await request(app.getHttpServer())
        .post('/user-identities')
        .send({ id1: 'ABC123', id2: 'XYZ456' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ userID: winner.userId })
    })

    it('returns 500 when the database create fails', async () => {
      const failingRepository: IUserIdentityRepository = {
        async getByIdPair() {
          return null
        },
        async create() {
          throw new Error('db down')
        },
      }
      app = await createApp(failingRepository)

      const response = await request(app.getHttpServer())
        .post('/user-identities')
        .send({ id1: 'ABC123', id2: 'XYZ456' })

      expect(response.status).toBe(500)
    })
  })
})
