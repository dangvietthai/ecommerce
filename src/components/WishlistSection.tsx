import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string;
    description: string;
  };
}

export default function WishlistSection({ userId }: { userId: string }) {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWishlistItems();
  }, [userId]);

  const fetchWishlistItems = async () => {
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          *,
          product:products (
            id,
            name,
            price,
            image_url,
            description
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      setWishlistItems(data || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);

      if (error) throw error;

      setWishlistItems(wishlistItems.filter(item => item.product_id !== productId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const addToCart = async (productId: string) => {
    try {
      // Check if item already exists in cart
      const { data: existingItem } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .single();

      if (existingItem) {
        // Update quantity if item exists
        await supabase
          .from('cart')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id);
      } else {
        // Add new item to cart
        await supabase
          .from('cart')
          .insert([
            {
              user_id: userId,
              product_id: productId,
              quantity: 1
            }
          ]);
      }

      // Optionally remove from wishlist after adding to cart
      await removeFromWishlist(productId);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold mb-6">Sản phẩm yêu thích</h2>
      
      {wishlistItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Heart className="w-12 h-12 mx-auto mb-4 stroke-current" />
          <p>Bạn chưa có sản phẩm yêu thích nào</p>
          <Link href="/products" className="text-red-600 hover:text-red-700 mt-2 inline-block">
            Khám phá sản phẩm ngay
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => (
            <div key={item.id} className="border rounded-lg overflow-hidden group">
              <div className="relative aspect-square">
                <Image
                  src={item.product.image_url}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-2">{item.product.name}</h3>
                <p className="text-red-600 font-medium mb-2">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                  }).format(item.product.price)}
                </p>
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => addToCart(item.product_id)}
                    className="flex items-center text-sm text-white bg-red-600 px-3 py-1.5 rounded hover:bg-red-700"
                  >
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    Thêm vào giỏ
                  </button>
                  <button
                    onClick={() => removeFromWishlist(item.product_id)}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 