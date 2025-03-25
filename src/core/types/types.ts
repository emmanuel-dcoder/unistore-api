export type ObjectLiteral = { [key: string]: any };

export enum UserType {
  ADMIN = 'admin',
  BUYER = 'user',
  MERCHANT = 'merchant',
}

export enum UserStatus {
  STUDENT = 'student',
  STAFF = 'staff',
  OTHER = 'other',
}

export type EmailContext = {
  [key: string]: any;
};
