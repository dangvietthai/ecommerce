import { NextResponse } from 'next/server';
import { createVNPayUrl } from '@/lib/vnpay';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, amount } = body;

    // Get order details from database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const date = new Date();
    const createDate = date.getTime().toString();

    const vnpParams = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: process.env.VNPAY_TMN_CODE || '',
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan don hang ${order.order_number}`,
      vnp_OrderType: 'other',
      vnp_Amount: amount * 100, // Convert to VND
      vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payment/vnpay-return',
      vnp_CreateDate: createDate,
      vnp_IpAddr: '127.0.0.1'
    };

    // Create VNPay URL
    const paymentUrl = createVNPayUrl(vnpParams);

    // Create VNPay transaction record
    const { error: transactionError } = await supabase
      .from('vnpay_transactions')
      .insert({
        order_id: orderId,
        vnp_txn_ref: orderId,
        vnp_amount: amount,
        vnp_command: 'pay',
        vnp_create_date: createDate,
        vnp_curr_code: 'VND',
        vnp_ip_addr: '127.0.0.1',
        vnp_locale: 'vn',
        vnp_order_info: `Thanh toan don hang ${order.order_number}`,
        vnp_order_type: 'other',
        vnp_return_url: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payment/vnpay-return',
        vnp_tmn_code: process.env.VNPAY_TMN_CODE || '',
        vnp_version: '2.1.0',
        vnp_hash_secret: process.env.VNPAY_HASH_SECRET || '',
        vnp_url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
        status: 'pending'
      });

    if (transactionError) {
      console.error('Error creating VNPay transaction:', transactionError);
      return NextResponse.json(
        { error: 'Failed to create transaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({ paymentUrl });
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 