import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      items,
      total_amount,
      payment_method = 'cod',
      notes
    } = await request.json();

    // Validate required fields
    if (!customer_name || !customer_phone || !shipping_address || !items || !total_amount) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)) {
      return NextResponse.json(
        { error: 'Email không hợp lệ' },
        { status: 400 }
      );
    }

    // Validate phone number format
    if (!/^[0-9]{10}$/.test(customer_phone)) {
      return NextResponse.json(
        { error: 'Số điện thoại không hợp lệ' },
        { status: 400 }
      );
    }

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Giỏ hàng trống' },
        { status: 400 }
      );
    }

    // Validate total amount
    if (total_amount <= 0) {
      return NextResponse.json(
        { error: 'Tổng tiền không hợp lệ' },
        { status: 400 }
      );
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        total_amount,
        payment_method,
        payment_status: payment_method === 'cod' ? 'pending' : 'pending',
        status: 'pending',
        notes
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        { error: 'Lỗi khi tạo đơn hàng' },
        { status: 500 }
      );
    }

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Rollback order creation
      await supabase
        .from('orders')
        .delete()
        .eq('id', order.id);
      return NextResponse.json(
        { error: 'Lỗi khi tạo chi tiết đơn hàng' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
      message: 'Đặt hàng thành công',
      redirect: `/order-success?orderId=${order.id}`
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Lỗi server' },
      { status: 500 }
    );
  }
} 