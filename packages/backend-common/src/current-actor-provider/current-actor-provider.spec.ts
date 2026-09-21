import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CurrentActorProvider } from './current-actor-provider.ts'

describe('CurrentActorProvider', () => {
  const cls = {
    getId: vi.fn(),
  }
  let currentActorProvider: CurrentActorProvider

  beforeEach(() => {
    vi.clearAllMocks()
    currentActorProvider = new CurrentActorProvider(cls as never)
  })

  it('returns the CLS request id', () => {
    cls.getId.mockReturnValue('req-id')
    expect(currentActorProvider.getId()).toBe('req-id')
  })

  it('throws when the CLS request id is missing', () => {
    cls.getId.mockReturnValue(undefined)
    expect(() => currentActorProvider.getId()).toThrow(
      'Request context id is not set',
    )
  })
})
