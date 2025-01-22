import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class UserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Check if user_type is 'user'
    if (
      (request.user.user_type === 'user' && request.user.user_type.is_active) ||
      request.user.school !== null
    ) {
      return true;
    }
    throw new UnauthorizedException(
      'Access denied. this route is for user(must be active) and not merchant.',
    );
  }
}
