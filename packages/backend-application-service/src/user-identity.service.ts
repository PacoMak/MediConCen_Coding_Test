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
    const lockKey = UserIdentityService.lockKey(id1, id2)
    const lockToken = await this.waitForLock(lockKey)

    try {
      return await this.loadOrCreate(id1, id2)
    } finally {
      await this.redis.releaseLock(lockKey, lockToken)
    }
  }

  private async waitForLock(lockKey: string): Promise<string> {
    while (true) {
      const token = await this.redis.tryLock(lockKey, LOCK_TTL_MS)
      if (token !== null) {
        return token
      }
      if (!this.redis.isAvailable()) {
        throw new Error('Redis lock unavailable')
      }
      await sleep(LOCK_RETRY_INTERVAL_MS)
    }
  }

  private async loadOrCreate(
    id1: string,
    id2: string,
  ): Promise<EnsureUserIdResult> {
    const existing = await this.userIdentityRepository.getByIdPair({
      id1,
      id2,
    })
    if (existing !== null) {
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
        return { userID: raced.userId }
      }
      throw error
    }
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
