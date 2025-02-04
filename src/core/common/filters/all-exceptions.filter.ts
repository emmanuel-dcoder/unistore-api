import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: any, host: ArgumentsHost): void {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;
    console.log(exception);
    const ctx = host.switchToHttp();
    let httpStatus: number;
    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus() || HttpStatus.INTERNAL_SERVER_ERROR;
    } else if (exception instanceof TypeError) {
      httpStatus = HttpStatus.BAD_REQUEST;
    } else {
      httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    }
    const responseBody = {
      success: false,
      message:
        exception?.response?.message ??
        exception.response ??
        'Something went wrong',
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
