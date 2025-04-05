import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { updates } = await request.json();

    // Cập nhật từng danh mục một
    for (const update of updates) {
      const { error } = await supabase
        .from('categories')
        .update({ display_order: update.display_order })
        .eq('id', update.id);

      if (error) {
        console.error('Error updating category:', error);
        throw error;
      }
    }

    // Fetch lại danh sách để kiểm tra
    const { data, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (fetchError) {
      console.error('Error fetching categories:', fetchError);
      throw fetchError;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error updating category order:', error);
    return NextResponse.json(
      { error: 'Failed to update category order' },
      { status: 500 }
    );
  }
} 