import { NextResponse } from 'next/server';
import crypto from 'crypto';

const VNP_TMN_CODE = process.env.VNP_TMN_CODE || '';
const VNP_HASH_SECRET = process.env.VNP_HASH_SECRET || '';
const VNP_URL = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

interface VNPayParams {
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
  vnp_CreateDate: string;
  vnp_SecureHash?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, orderInfo } = body;

    const date = new Date();
    const createDate = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const orderId = `ORDER_${Date.now()}`;
    const orderType = 'billpayment';
    const locale = 'vn';

    const vnpParams: VNPayParams = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: VNP_TMN_CODE,
      vnp_Locale: locale,
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: orderType,
      vnp_Amount: Math.round(amount * 100), // Convert to VND (1 VND = 100 đồng)
      vnp_ReturnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/payment-result`,
      vnp_CreateDate: createDate,
    };

    const sortedParams = Object.keys(vnpParams)
      .sort()
      .reduce((acc: Record<string, string | number>, key) => {
        const value = vnpParams[key as keyof VNPayParams];
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

    const signData = Object.entries(sortedParams)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    const hmac = crypto.createHmac('sha512', VNP_HASH_SECRET);
    const signature = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    vnpParams.vnp_SecureHash = signature;

    const paymentUrl = `${VNP_URL}?${Object.entries(vnpParams)
      .map(([key, value]) => `${key}=${encodeURIComponent(value?.toString() || '')}`)
      .join('&')}`;

    console.log('VNPay Params:', vnpParams);
    console.log('Sign Data:', signData);
    console.log('Signature:', signature);
    console.log('Payment URL:', paymentUrl);

    return NextResponse.json({ paymentUrl });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
} 