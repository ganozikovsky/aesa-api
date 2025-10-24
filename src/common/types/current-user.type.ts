import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// common/types/current-user.type.ts
export type CurrentUserPayload = {
  userId: string;
  username: string;
  role: 'OWNER' | 'ADMIN' | 'EMP';
};

// En el decorator:
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as CurrentUserPayload;
  },
);
