import {
  CurrentActorProvider,
  RedisService,
} from '@mediconcen_coding_test/backend-common'
import type { IUserIdentityRepository } from '@mediconcen_coding_test/contracts'
import { DatabaseError } from '@mediconcen_coding_test/database-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UserIdentityService } from './user-identity.service.ts'

describe('UserIdentityService', () => {
  const repository = {
    getByIdPair: vi.fn(),
    create: vi.fn(),
  }
  const redis = {
    tryLock: vi.fn(),
    releaseLock: vi.fn(),
    isAvailable: vi.fn(() => true),
  }
  const currentActorProvider = {
    getId: vi.fn(() => 'actor-id'),
  }

  let service: UserIdentityService

  beforeEach(() => {
    vi.clearAllMocks()
    redis.tryLock.mockResolvedValue('lock-token')
    redis.releaseLock.mockResolvedValue(undefined)
    redis.isAvailable.mockReturnValue(true)
    service = new UserIdentityService(
      repository as unknown as IUserIdentityRepository,
      currentActorProvider as unknown as CurrentActorProvider,
      redis as unknown as RedisService,
    )
  })

  it('locks, then reads the database, then releases the lock', async () => {
    const order: string[] = []
    redis.tryLock.mockImplementation(async () => {
      order.push('lock')
      return 'lock-token'
    })
    repository.getByIdPair.mockImplementation(async () => {
      order.push('db')
      return { userId: 'existing-user' }
    })
    redis.releaseLock.mockImplementation(async () => {
      order.push('unlock')
    })

    await expect(service.ensureUserId('ABC123', 'XYZ456')).resolves.toEqual({
      userID: 'existing-user',
    })
    expect(order).toEqual(['lock', 'db', 'unlock'])
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('first request acquires the lock, then releases it in finally', async () => {
    repository.getByIdPair.mockResolvedValue({
      userId: 'existing-user',
    })

    await expect(service.ensureUserId('ABC123', 'XYZ456')).resolves.toEqual({
      userID: 'existing-user',
    })
    expect(redis.tryLock).toHaveBeenCalledWith(
      'user-identity-lock:ABC123:XYZ456',
      5000,
    )
    expect(redis.releaseLock).toHaveBeenCalledWith(
      'user-identity-lock:ABC123:XYZ456',
      'lock-token',
    )
  })

  it('creates an identity only while holding the lock', async () => {
    repository.getByIdPair.mockResolvedValue(null)
    repository.create.mockImplementation(
      async (_actorId: string, data: { userId: string }) => ({
        userId: data.userId,
      }),
    )

    const result = await service.ensureUserId('ABC123', 'XYZ456')

    expect(result.userID).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
    expect(repository.create).toHaveBeenCalledWith('actor-id', {
      id1: 'ABC123',
      id2: 'XYZ456',
      userId: result.userID,
    })
    expect(redis.releaseLock).toHaveBeenCalledWith(
      'user-identity-lock:ABC123:XYZ456',
      'lock-token',
    )
  })

  it('later requests wait for the lock, then read the row the first request created', async () => {
    redis.tryLock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('lock-token')
    repository.getByIdPair.mockResolvedValue({ userId: 'from-first-request' })

    await expect(service.ensureUserId('ABC123', 'XYZ456')).resolves.toEqual({
      userID: 'from-first-request',
    })
    expect(redis.tryLock).toHaveBeenCalledTimes(2)
    expect(repository.create).not.toHaveBeenCalled()
    expect(redis.releaseLock).toHaveBeenCalledWith(
      'user-identity-lock:ABC123:XYZ456',
      'lock-token',
    )
  })

  it('releases the lock in finally when create fails', async () => {
    repository.getByIdPair.mockResolvedValue(null)
    repository.create.mockRejectedValue(new Error('db down'))

    await expect(service.ensureUserId('ABC123', 'XYZ456')).rejects.toThrow(
      'db down',
    )
    expect(redis.releaseLock).toHaveBeenCalledWith(
      'user-identity-lock:ABC123:XYZ456',
      'lock-token',
    )
  })

  it('does not read the database until the lock is acquired', async () => {
    redis.tryLock.mockResolvedValue(null)
    redis.isAvailable.mockReturnValue(false)

    await expect(service.ensureUserId('ABC123', 'XYZ456')).rejects.toThrow(
      'Redis lock unavailable',
    )
    expect(repository.getByIdPair).not.toHaveBeenCalled()
    expect(repository.create).not.toHaveBeenCalled()
    expect(redis.releaseLock).not.toHaveBeenCalled()
  })

  it('re-reads after a unique constraint race', async () => {
    repository.getByIdPair
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ userId: 'winner' })
    repository.create.mockRejectedValue(
      DatabaseError.ExceptionFactory.uniqueConstraintViolated({
        target: ['id1', 'id2'],
      }),
    )

    await expect(service.ensureUserId('ABC123', 'XYZ456')).resolves.toEqual({
      userID: 'winner',
    })
    expect(redis.releaseLock).toHaveBeenCalledWith(
      'user-identity-lock:ABC123:XYZ456',
      'lock-token',
    )
  })

  it('builds collision-safe lock keys', () => {
    expect(UserIdentityService.lockKey('a:b', 'c')).not.toBe(
      UserIdentityService.lockKey('a', 'b:c'),
    )
    expect(UserIdentityService.lockKey('ABC123', 'XYZ456')).toBe(
      'user-identity-lock:ABC123:XYZ456',
    )
  })
})
