import {
  BadRequestErrorException,
  ConflictErrorException,
  ForbiddenErrorException,
  IServerErrorException,
  NotFoundErrorException,
  UnauthorizedErrorException,
} from "../common";

export function httpErrorHndler(error: any) {
  const message =
    error?.response?.data?.message ?? error?.message ?? "An error occurred";
  const status = error?.response?.status ?? 500;

  switch (status) {
    case 400:
      throw new BadRequestErrorException(message);
    case 401:
      throw new UnauthorizedErrorException(message);
    case 403:
      throw new ForbiddenErrorException(message);
    case 404:
      throw new NotFoundErrorException(message);
    case 409:
      throw new ConflictErrorException(message);
    default:
      throw new IServerErrorException(message);
  }
}
