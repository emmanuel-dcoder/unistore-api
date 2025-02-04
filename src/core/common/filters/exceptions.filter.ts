import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import * as dotenv from 'dotenv';
// import * as sentry from '@sentry/node';
import { isArray } from 'class-validator';

dotenv.config();

@Catch(HttpException)
export class ExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status !== HttpStatus.INTERNAL_SERVER_ERROR) {
      const errException: any = exception;

      if (!errException.response['status']) {
        return response
          .status(status)
          .json(sanitizeValidationError(errException.response));
      }
      return response.status(status).json(errException.response);
    }

    response
      .status(status)
      .json(this.isInternalServerError(exception, request));
  }

  isInternalServerError(exception: unknown, request: any) {
    if (process.env.NODE_ENV === 'production') {
      // sentry.captureException(
      //   JSON.stringify({ exception, path: request.path }),
      // );
    }

    return {
      status: 'error',
      message: 'Oops! Something seems not to be write. We are looking at it',
    };
  }
}

const sanitizeValidationError = (response: {
  message: string | string[];
  error: string;
}) => {
  return {
    status: 'error',
    message: isArray(response.message) ? response.message[0] : response.message,
    data: response.message,
  };
};
