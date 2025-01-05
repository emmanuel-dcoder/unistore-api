import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class MerchantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Check if user_type is 'merchant'
    if (
      request.user.user_type === 'merchant' &&
      request.user.user_type.is_active
    ) {
      return true;
    }
    throw new UnauthorizedException(
      'Access denied. User is not a merchant(must be active).',
    );
  }
}
