import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Check if user_type is 'user'
    if (request.user.user_type === 'admin') {
      return true;
    }
    throw new UnauthorizedException('Access denied. this route is for admin.');
  }
}
