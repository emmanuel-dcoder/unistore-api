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
    if (request.user.user_type === 'merchant') {
      return true;
    }
    throw new UnauthorizedException('Access denied. User is not a merchant.');
  }
}
