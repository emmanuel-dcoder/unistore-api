import { CustomRequest } from '../common';

export function isObjectOwner(obj: any, req: CustomRequest) {
  return obj.user.id === req.user.id;
}

export function hasSameIDAsIDParsed(id: string, req: CustomRequest) {
  return id === req.user.id;
}

export function isMerchantOwner(obj: any, req: CustomRequest) {
  return obj.merchant.id === req.user.id;
}
