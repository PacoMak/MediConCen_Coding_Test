import { userIdentityRoutes } from '@mediconcen_coding_test/api-defs'
import { UserIdentityService } from '@mediconcen_coding_test/backend-application-service'
import type { z } from 'zod'
import {
  ApiController,
  ApiEndpoint,
  EndpointBody,
} from '../../http/api-endpoint.decorator.js'

@ApiController(userIdentityRoutes)
export class UserIdentityController {
  constructor(private readonly userIdentityService: UserIdentityService) {}

  @ApiEndpoint(userIdentityRoutes.endpoints.getAndCreateIfNotExist)
  getAndCreateIfNotExist(
    @EndpointBody(userIdentityRoutes.endpoints.getAndCreateIfNotExist)
    body: z.infer<
      typeof userIdentityRoutes.endpoints.getAndCreateIfNotExist.schemas.body
    >,
  ): Promise<
    z.infer<
      typeof userIdentityRoutes.endpoints.getAndCreateIfNotExist.schemas.response
    >
  > {
    return this.userIdentityService.ensureUserId(body.id1, body.id2)
  }
}
