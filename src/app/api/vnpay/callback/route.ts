import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vnpParams = Object.fromEntries(searchParams.entries());
    
    // Verify signature
    const secureHash = vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    const sortedParams = Object.keys(vnpParams)
      .sort()
      .reduce((acc: any, key) => {
        acc[key] = vnpParams[key];
        return acc;
      }, {});

    const signData = Object.entries(sortedParams)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    const hmac = crypto
      .createHmac('sha512', process.env.VNPAY_HASH_SECRET || '')
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    if (secureHash !== hmac) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const orderId = vnpParams['vnp_TxnRef'];
    const rspCode = vnpParams['vnp_ResponseCode'];
    const paymentStatus = rspCode === '00' ? 'paid' : 'failed';

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        status: paymentStatus === 'paid' ? 'processing' : 'pending'
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order:', updateError);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    // Redirect to success/failure page
    const redirectUrl = paymentStatus === 'paid'
      ? `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?orderId=${orderId}`
      : `${process.env.NEXT_PUBLIC_APP_URL}/checkout/failure?orderId=${orderId}`;

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Error processing VNPay callback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 