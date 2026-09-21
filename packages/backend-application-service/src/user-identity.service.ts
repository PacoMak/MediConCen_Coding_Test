import { randomUUID } from 'node:crypto'
import { Inject, Injectable, Logger } from '@nestjs/common'
import {
  CurrentActorProvider,
  RedisService,
} from '@mediconcen_coding_test/backend-common'
import {
  USER_IDENTITY_REPOSITORY,
  type IUserIdentityRepository,
} from '@mediconcen_coding_test/contracts'
import { DatabaseError } from '@mediconcen_coding_test/database-repository'
import { CodedException } from '@mediconcen_coding_test/exceptions'

export type EnsureUserIdResult = {
  userID: string
}

const LOCK_TTL_MS = 5000
const LOCK_RETRY_INTERVAL_MS = 50

@Injectable()
export class UserIdentityService {
  private readonly logger = new Logger(UserIdentityService.name)

  constructor(
    @Inject(USER_IDENTITY_REPOSITORY)
    private readonly userIdentityRepository: IUserIdentityRepository,
    private readonly currentActorProvider: CurrentActorProvider,
    private readonly redis: RedisService,
  ) {}

  async ensureUserId(id1: string, id2: string): Promise<EnsureUserIdResult> {
    const cacheKey = UserIdentityService.cacheKey(id1, id2)
    const cached = await this.redis.get(cacheKey)
    if (cached !== null) {
      return { userID: cached }
    }

    const lockKey = UserIdentityService.lockKey(id1, id2)
    const lockToken = await this.waitForLock(lockKey)

    if (lockToken === null) {
      // Redis is unavailable, or the lock could not be acquired before its
      // TTL elapsed. The unique index on (id1, id2) plus the re-read in
      // loadOrCreate keeps this path correct.
      return this.loadOrCreate(id1, id2, cacheKey)
    }

    try {
      return await this.loadOrCreate(id1, id2, cacheKey)
    } finally {
      await this.redis.releaseLock(lockKey, lockToken)
    }
  }

  private async waitForLock(lockKey: string): Promise<string | null> {
    const deadline = Date.now() + LOCK_TTL_MS

    while (true) {
      const token = await this.redis.tryLock(lockKey, LOCK_TTL_MS)
      if (token !== null) {
        return token
      }
      if (!this.redis.isAvailable()) {
        return null
      }
      if (Date.now() >= deadline) {
        return null
      }
      await sleep(LOCK_RETRY_INTERVAL_MS)
    }
  }

  private async loadOrCreate(
    id1: string,
    id2: string,
    cacheKey: string,
  ): Promise<EnsureUserIdResult> {
    const existing = await this.userIdentityRepository.getByIdPair({
      id1,
      id2,
    })
    if (existing !== null) {
      await this.redis.set(cacheKey, existing.userId)
      return { userID: existing.userId }
    }

    const actorId = this.currentActorProvider.getId()
    const userId = randomUUID()

    try {
      const created = await this.userIdentityRepository.create(actorId, {
        id1,
        id2,
        userId,
      })
      await this.redis.set(cacheKey, created.userId)
      return { userID: created.userId }
    } catch (error) {
      if (
        error instanceof CodedException &&
        error.code.code === DatabaseError.codes.uniqueConstraintViolated
      ) {
        const raced = await this.userIdentityRepository.getByIdPair({
          id1,
          id2,
        })
        if (raced === null) {
          this.logger.error(
            'UserIdentity unique conflict but row was not found',
          )
          throw error
        }
        await this.redis.set(cacheKey, raced.userId)
        return { userID: raced.userId }
      }
      throw error
    }
  }

  static cacheKey(id1: string, id2: string): string {
    return `user-identity:${encodeComponent(id1)}:${encodeComponent(id2)}`
  }

  static lockKey(id1: string, id2: string): string {
    return `user-identity-lock:${encodeComponent(id1)}:${encodeComponent(id2)}`
  }
}

// `:` is the key delimiter, so encode it (and any other reserved character) to
// stop distinct pairs such as ("a:b", "c") and ("a", "b:c") colliding.
function encodeComponent(value: string): string {
  return encodeURIComponent(value)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
