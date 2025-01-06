import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

import config, {
  AccessTokenMaxAge,
  RefreshTokenMaxAge,
} from '../../../config/index';

type TokenKeys = {
  user_refresh_key: string;
  user_access_key: string;
};

type TokenKey = keyof typeof tokenKeys;

const tokenKeys: TokenKeys = {
  user_access_key: config.config().keys.ACCESS_KEY,
  user_refresh_key: config.config().keys.REFRESH_KEY,
};

export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string) => {
  return await bcrypt.compare(password, hash);
};

export const generateAccessToken = (
  payload: {
    id: any;
    first_name: string;
    last_name: string;
    user_type: string;
    is_active: boolean;
    is_merchant_verified?: boolean;
    school?: any;
    profile_picture?: string;
    identification?: string;
    user_status?: string;
  },
  domain: TokenKey = 'user_access_key',
) => {
  const { id } = payload;
  return jwt.sign({ ...payload, id }, tokenKeys[domain], {
    expiresIn: AccessTokenMaxAge / 1000,
  });
};

export const generateAccessTokenForSignUp = (
  data: {},
  domain: TokenKey = 'user_access_key',
) => {
  return jwt.sign(data, tokenKeys[domain], {
    expiresIn: AccessTokenMaxAge / 1000,
  });
};

export const verifySignUpToken = async (token: string) => {
  const resp = verifyJWT(token, config.config().keys.ACCESS_KEY);
  if (resp) {
    return resp;
  }
  return false;
};

export const generateRefreshToken = (
  id: string,
  domain: TokenKey = 'user_refresh_key',
) => {
  return jwt.sign({ id }, tokenKeys[domain], {
    expiresIn: RefreshTokenMaxAge / 1000,
  });
};

export const verifyJWT = (token: string, key: string): any | boolean => {
  try {
    const resp: any = jwt.verify(token, key);
    return resp;
  } catch {
    return false;
  }
};

export const verifyAccessToken = (token: string) => {
  const resp = verifyJWT(token, config.config().keys.ACCESS_KEY);
  if (resp) {
    return resp;
  }
  return false;
};

export const verifyRefreshToken = (
  token: string,
  domain: TokenKey = 'user_refresh_key',
) => {
  const resp = verifyJWT(token, tokenKeys[domain]);
  if (resp) {
    return resp;
  }
  return false;
};

export const generatePasswordResetToken = () => {
  return crypto.randomBytes(16).toString('hex');
};

export const RandomFourDigits = (): string => {
  let result = '';
  for (let i = 0; i < 4; i++) {
    const randomNum = Math.floor(Math.random() * 10); // Generate a random integer between 0 and 9
    result += randomNum;
  }

  if (result[0] === '0') {
    // Check if the first digit is zero
    result = '1' + result.slice(1); // Replace the first digit with 1
  }

  return result;
};

export const RandomSevenDigits = (): string => {
  let result = '';
  for (let i = 0; i < 7; i++) {
    const randomNum = Math.floor(Math.random() * 10); // Generate a random integer between 0 and 9
    result += randomNum;
  }

  if (result[0] === '0') {
    // Check if the first digit is zero
    result = '1' + result.slice(1); // Replace the first digit with 1
  }

  return result;
};
