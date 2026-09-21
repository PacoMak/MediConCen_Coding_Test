import { UserIdentityService } from '@mediconcen_coding_test/backend-application-service'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UserIdentityController } from './user-identity.controller.js'

describe('UserIdentityController', () => {
  const userIdentityService = {
    ensureUserId: vi.fn(),
  }

  let controller: UserIdentityController

  beforeEach(() => {
    vi.clearAllMocks()
    controller = new UserIdentityController(
      userIdentityService as unknown as UserIdentityService,
    )
  })

  it('returns the userID from the application service', async () => {
    userIdentityService.ensureUserId.mockResolvedValue({
      userID: '550e8400-e29b-41d4-a716-446655440000',
    })

    await expect(
      controller.getAndCreateIfNotExist({ id1: 'ABC123', id2: 'XYZ456' }),
    ).resolves.toEqual({
      userID: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(userIdentityService.ensureUserId).toHaveBeenCalledWith(
      'ABC123',
      'XYZ456',
    )
  })
})
