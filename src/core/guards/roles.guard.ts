// guards/merchant-roles.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// import { ROLES_KEY } from '../decorators/roles.decorator';
// import { UserType } from '../enums/user-type.enum';
import { CustomRequest, ForbiddenErrorException } from '../common';
import { User } from 'src/user/entities/user.entity';
import { UserType } from '../types/types';
import { ROLES_KEY } from '../decorators/roles.decorators';

@Injectable()
export class MerchantRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Retrieve roles metadata
    const requiredRoles = this.reflector.getAllAndOverride<UserType[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are required, allow access
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<CustomRequest>();
    const userId = request.user?.id;

    // Retrieve user from the database
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    // Handle cases where the user is not found
    if (!user) {
      throw new ForbiddenErrorException('User not found. Access denied.');
    }

    // Check if the user has the "merchant" role explicitly
    if (user.user_type === UserType.MERCHANT) {
      return true;
    }

    // Check if the user's role matches any of the required roles
    const isAuthorized = requiredRoles.some((role) => user.user_type === role);

    if (!isAuthorized) {
      throw new ForbiddenErrorException(
        'You are not authorized to access this resource.',
      );
    }

    return isAuthorized;
  }
}
