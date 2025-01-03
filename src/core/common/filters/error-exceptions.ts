import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  MethodNotAllowedException,
  UnprocessableEntityException,
  UnauthorizedException,
} from "@nestjs/common";

export class ForbiddenErrorException extends ForbiddenException {
  constructor(
    message = "You are not authorized to perform this action",
    error = undefined,
  ) {
    super({
      status: "error",
      message,
      data: error,
    });
  }
}

export class UnauthorizedErrorException extends UnauthorizedException {
  constructor(
    message = "You are not authorized to perform this action",
    error = undefined,
  ) {
    super({
      status: "error",
      message,
      data: error,
    });
  }
}

export class BadRequestErrorException extends BadRequestException {
  constructor(message: string, error = undefined) {
    super({
      status: "error",
      message,
      data: error,
    });
  }
}

export class ConflictErrorException extends ConflictException {
  constructor(message: string, error = undefined) {
    super({
      status: "error",
      message,
      data: error,
    });
  }
}

export class IServerErrorException extends InternalServerErrorException {
  constructor(error = undefined) {
    super({
      status: "error",
      message: "Oops! Something went wrong while processing this request!",
      data: error,
    });
  }
}

export class NotFoundErrorException extends NotFoundException {
  constructor(
    message = "The requested resource could not be found ",
    error = undefined,
  ) {
    super({
      status: "error",
      message,
      data: error,
    });
  }
}

export class MethodNotAllowedErrorException extends MethodNotAllowedException {
  constructor(
    message = "The requested resource could not be found ",
    error = undefined,
  ) {
    super({
      status: "error",
      message,
      data: error,
    });
  }
}

export class UnprocessableEntityErrorException extends UnprocessableEntityException {
  constructor(
    message = "The request was well-formed but was unable to be followed due to semantic errors",
    error = undefined,
  ) {
    super({
      status: "error",
      message,
      data: error,
    });
  }
}
