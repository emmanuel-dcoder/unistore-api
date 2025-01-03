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
export class VerifyTokenMiddleware implements NestMiddleware {
  use(req: CustomRequest, res: Response, next: NextFunction) {
    const accessToken = req.headers['x-access-token'] as string;

    verifyTokens({
      token: accessToken,
      secret: process.env.SECRET_KEY as string,
    })
      .then((decoded) => {
        const user = {
          id: decoded['id'],
          user_type: decoded['user_type'],
          school: decoded['school'],
        };
        req.user = user;
        next();
      })
      .catch(() => {
        res
          .status(401)
          .json(
            new ForbiddenErrorException(
              'Your access token is either expired or invalid',
            ).getResponse(),
          );
      });
  }
}
