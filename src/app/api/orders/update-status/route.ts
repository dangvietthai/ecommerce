import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { orderId, status, payment_status } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get current order to check payment method
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('payment_method')
      .eq('id', orderId)
      .single();

    if (fetchError) {
      console.error('Error fetching order:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch order' },
        { status: 500 }
      );
    }

    // Update order status and payment status based on payment method
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    // For COD orders, update payment_status based on order status
    if (currentOrder.payment_method === 'cod') {
      if (status === 'completed') {
        updateData.payment_status = 'paid';
      } else if (status === 'cancelled') {
        updateData.payment_status = 'failed';
      } else {
        updateData.payment_status = 'pending';
      }
    } else {
      // For other payment methods, use provided payment_status
      updateData.payment_status = payment_status || 'pending';
    }

    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order:', updateError);
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
      message: 'Order updated successfully'
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 