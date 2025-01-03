import { Injectable, NestMiddleware } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { ForbiddenErrorException } from '../filters/error-exceptions';

dotenv.config();

export const verifyTokens = ({
  secret,
  token,
}: {
  secret: string;
  token: string;
}) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, function (err: Error, decoded: any) {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
};

interface CustomRequest extends Request {
  user?: { id: string };
}

@Injectable()
export class VerifyRefreshTokenMiddleware implements NestMiddleware {
  use(req: CustomRequest, res: Response, next: NextFunction) {
    const refreshToken = req.headers['x-refresh-token'] as string;

    const secret = process.env.REFRESH_TOKEN_KEY as string;

    verifyTokens({
      token: refreshToken,
      secret,
    })
      .then((decoded) => {
        const user = {
          id: decoded['id'],
        };
        req.user = user;
        next();
      })
      .catch(() => {
        res
          .status(401)
          .json(
            new ForbiddenErrorException(
              'Your refresh token is either expired or invalid',
            ).getResponse(),
          );
      });
  }
}
