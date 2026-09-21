import { RequestMethod } from '@nestjs/common'
import {
  HTTP_CODE_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants'
import {
  userIdentityRoutes,
  type Endpoint,
} from '@mediconcen_coding_test/api-defs'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { ApiController, ApiEndpoint } from './api-endpoint.decorator.js'

const getEndpoint = {
  method: 'GET',
  path: '/status',
  httpCode: 200,
  summary: 'status',
  schemas: {
    params: z.object({}),
    query: z.object({}),
    body: z.object({}),
    response: z.object({}),
  },
} as const satisfies Endpoint

describe('ApiController', () => {
  @ApiController(userIdentityRoutes)
  class TestController {}

  it('applies the controller path from the routes basePath', () => {
    expect(Reflect.getMetadata(PATH_METADATA, TestController)).toBe(
      userIdentityRoutes.basePath,
    )
  })
})

describe('ApiEndpoint', () => {
  class TestController {
    @ApiEndpoint(userIdentityRoutes.endpoints.getAndCreateIfNotExist)
    handler(this: void) {}
  }

  it('applies method, path, and http code from the endpoint', () => {
    const target = TestController.prototype.handler

    expect(Reflect.getMetadata(METHOD_METADATA, target)).toBe(
      RequestMethod.POST,
    )
    expect(Reflect.getMetadata(PATH_METADATA, target)).toBe(
      userIdentityRoutes.endpoints.getAndCreateIfNotExist.path,
    )
    expect(Reflect.getMetadata(HTTP_CODE_METADATA, target)).toBe(
      userIdentityRoutes.endpoints.getAndCreateIfNotExist.httpCode,
    )
  })
})

describe('ApiEndpoint GET', () => {
  class TestController {
    @ApiEndpoint(getEndpoint)
    handler(this: void) {}
  }

  it('applies method, path, and http code from a GET endpoint', () => {
    const target = TestController.prototype.handler

    expect(Reflect.getMetadata(METHOD_METADATA, target)).toBe(RequestMethod.GET)
    expect(Reflect.getMetadata(PATH_METADATA, target)).toBe(getEndpoint.path)
    expect(Reflect.getMetadata(HTTP_CODE_METADATA, target)).toBe(
      getEndpoint.httpCode,
    )
  })
})
