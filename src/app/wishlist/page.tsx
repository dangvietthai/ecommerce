'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  sale_price: number | null;
  image_url: string | null;
  is_new: boolean;
  is_bestseller: boolean;
}

interface WishlistItem {
  product_id: string;
  products: Product;
}

type SupabaseResponse = {
  data: WishlistItem[] | null;
  error: any;
};

export default function WishlistPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWishlist() {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch wishlist items
        const { data: wishlistData, error: wishlistError } = await supabase
          .from('wishlist')
          .select(`
            product_id,
            products (
              id,
              name,
              slug,
              description,
              price,
              sale_price,
              image_url,
              is_new,
              is_bestseller
            )
          `)
          .eq('user_id', user.id) as SupabaseResponse;

        if (wishlistError) throw wishlistError;

        // Transform data to get only products
        if (wishlistData) {
          const products = wishlistData.map(item => item.products);
          setProducts(products);
        }
      } catch (error) {
        console.error('Error fetching wishlist:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchWishlist();
  }, []);

  const removeFromWishlist = async (productId: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;

      // Update local state
      setProducts(products.filter(product => product.id !== productId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="container mx-auto px-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="h-48 bg-gray-200 rounded mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Danh sách yêu thích</h1>
          
          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Bạn chưa có sản phẩm yêu thích nào.</p>
              <Link href="/products" className="text-blue-600 hover:text-blue-800">
                Xem tất cả sản phẩm
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <Link href={`/products/${product.slug}`} className="group">
                    <div className="relative h-48">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">Không có hình ảnh</span>
                        </div>
                      )}
                      {product.is_new && (
                        <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                          Mới
                        </span>
                      )}
                      {product.is_bestseller && (
                        <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                          Bán chạy
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h2 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
                        {product.name}
                      </h2>
                      <div className="flex items-center justify-between">
                        <div>
                          {product.sale_price ? (
                            <>
                              <span className="text-lg font-bold text-red-600">
                                {product.sale_price.toLocaleString('vi-VN')}đ
                              </span>
                              <span className="ml-2 text-sm text-gray-500 line-through">
                                {product.price.toLocaleString('vi-VN')}đ
                              </span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-gray-900">
                              {product.price.toLocaleString('vi-VN')}đ
                            </span>
                          )}
                        </div>
                        <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                          Thêm vào giỏ
                        </button>
                      </div>
                    </div>
                  </Link>
                  <div className="p-4 border-t">
                    <button
                      onClick={() => removeFromWishlist(product.id)}
                      className="w-full text-red-600 hover:text-red-800 flex items-center justify-center space-x-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      <span>Xóa khỏi danh sách yêu thích</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
} 