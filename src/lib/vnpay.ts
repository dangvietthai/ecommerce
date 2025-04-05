import crypto from 'crypto';

export const VNPAY_CONFIG = {
  vnp_TmnCode: process.env.VNPAY_TMN_CODE || '',
  vnp_HashSecret: process.env.VNPAY_HASH_SECRET || '',
  vnp_Url: process.env.VNPAY_URL || '',
  vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || '',
};

export interface VNPayTransactionParams {
  vnp_Version: string;
  vnp_Command: string;
  vnp_TmnCode: string;
  vnp_Locale: string;
  vnp_CurrCode: string;
  vnp_TxnRef: string;
  vnp_OrderInfo: string;
  vnp_OrderType: string;
  vnp_Amount: number;
  vnp_ReturnUrl: string;
  vnp_IpAddr: string;
  vnp_CreateDate: string;
  [key: string]: string | number; // Allow both string and number types
}

export function createVNPayUrl(params: VNPayTransactionParams): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc: { [key: string]: string }, key) => {
      acc[key] = String(params[key]);
      return acc;
    }, {});

  const signData = Object.entries(sortedParams)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');

  const hmac = crypto.createHmac('sha512', VNPAY_CONFIG.vnp_HashSecret);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  const vnpParams = new URLSearchParams({
    ...sortedParams,
    vnp_SecureHash: signed,
  } as Record<string, string>);

  return `${VNPAY_CONFIG.vnp_Url}?${vnpParams.toString()}`;
}

export function verifyVNPayResponse(params: { [key: string]: string }): boolean {
  const secureHash = params['vnp_SecureHash'];
  delete params['vnp_SecureHash'];
  delete params['vnp_SecureHashType'];

  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc: { [key: string]: string }, key) => {
      acc[key] = params[key];
      return acc;
    }, {});

  const signData = Object.entries(sortedParams)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');

  const hmac = crypto.createHmac('sha512', VNPAY_CONFIG.vnp_HashSecret);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  return secureHash === signed;
} 