import { HttpStatus } from '@nestjs/common';

export const successResponse = <T>({
  message,
  code = HttpStatus.OK,
  data,
  count,
  status = 'success',
}: {
  status?: string;
  message: string;
  code?: number;
  count?:any
  data?: T;
}) => {
  return { status, message, data, count };
};

export const errorResponse = ({
  message,
  code,
  error,
}: {
  message: string;
  code: number;
  error: any;
}) => {
  return { message, code, error };
};

export interface CustomRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

export interface SuccessResponseType {
  status: string;
  message: string;
  data: any;
}
