import { NextResponse, NextRequest } from 'next/server';
import { verifyVNPayResponse } from '@/lib/vnpay';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams.entries());

    // Verify VNPay response
    const isValid = verifyVNPayResponse(params);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const orderId = params['vnp_TxnRef'];
    const responseCode = params['vnp_ResponseCode'];
    const transactionNo = params['vnp_TransactionNo'];

    // Update VNPay transaction status
    const { error: transactionError } = await supabase
      .from('vnpay_transactions')
      .update({
        status: responseCode === '00' ? 'success' : 'failed',
        response_code: responseCode,
        response_message: params['vnp_Message'],
      })
      .eq('order_id', orderId);

    if (transactionError) {
      console.error('Error updating transaction:', transactionError);
      return NextResponse.json(
        { error: 'Failed to update transaction' },
        { status: 500 }
      );
    }

    // Update order status
    if (responseCode === '00') {
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'processing',
          payment_details: {
            transaction_no: transactionNo,
            payment_date: new Date().toISOString(),
          },
        })
        .eq('id', orderId);

      if (orderError) {
        console.error('Error updating order:', orderError);
        return NextResponse.json(
          { error: 'Failed to update order' },
          { status: 500 }
        );
      }

      // Create payment history record
      const { error: historyError } = await supabase
        .from('payment_history')
        .insert({
          order_id: orderId,
          payment_method_id: (await supabase
            .from('payment_methods')
            .select('id')
            .eq('code', 'VNPAY')
            .single()
          ).data?.id,
          amount: parseFloat(params['vnp_Amount']) / 100,
          status: 'success',
          transaction_id: transactionNo,
          payment_details: params,
        });

      if (historyError) {
        console.error('Error creating payment history:', historyError);
        return NextResponse.json(
          { error: 'Failed to create payment history' },
          { status: 500 }
        );
      }
    }

    // Redirect to order success/failure page
    const redirectUrl = responseCode === '00'
      ? `/orders/${orderId}/success`
      : `/orders/${orderId}/failed`;

    return NextResponse.redirect(new URL(redirectUrl, req.url));
  } catch (error) {
    console.error('Error processing VNPay callback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 