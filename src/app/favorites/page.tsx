'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import AccountSidebar from '@/components/AccountSidebar';
import Image from 'next/image';

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

export default function FavoritesPage() {
  const router = useRouter();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUser();
    fetchWishlistItems();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
    }
  };

  const fetchWishlistItems = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

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
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', session.user.id)
        .eq('product_id', productId);

      if (error) throw error;

      setWishlistItems(wishlistItems.filter(item => item.product_id !== productId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const addToCart = async (productId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Check if item already exists in cart
      const { data: existingItem } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', session.user.id)
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
              user_id: session.user.id,
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
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="md:col-span-3 bg-white rounded-lg shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-100 rounded-lg p-4">
                    <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
        <a href="/" className="hover:text-red-600">Trang chủ</a>
        <span>/</span>
        <a href="/account" className="hover:text-red-600">Tài khoản</a>
        <span>/</span>
        <span className="text-gray-400">Sản phẩm yêu thích</span>
      </div>

      {/* Page Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Sản phẩm yêu thích</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <AccountSidebar activePage="favorites" />

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {wishlistItems.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có sản phẩm yêu thích</h3>
              <p className="text-gray-600 mb-4">Bạn chưa có sản phẩm yêu thích nào. Hãy khám phá các sản phẩm của chúng tôi.</p>
              <a
                href="/products"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Khám phá ngay
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden group">
                  <div className="relative aspect-square">
                    <Image
                      src={item.product.image_url}
                      alt={item.product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{item.product.name}</h3>
                    <p className="text-red-600 font-medium mb-4">
                      {item.product.price.toLocaleString('vi-VN')}đ
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
      </div>
    </main>
  );
} 