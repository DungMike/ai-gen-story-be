import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (request.user) {
      return request.user;
    }

    // For WebSocket connections
    const client = ctx.switchToWs().getClient();
    return client.data?.user;
  },
); 