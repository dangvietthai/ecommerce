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

interface Collection {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  start_date: string | null;
  end_date: string | null;
}

export default function CollectionPage({ params }: { params: { slug: string } }) {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    async function fetchCollectionAndProducts() {
      try {
        // Fetch collection details
        const { data: collectionData, error: collectionError } = await supabase
          .from('collections')
          .select('*')
          .eq('slug', params.slug)
          .single();

        if (collectionError) throw collectionError;
        setCollection(collectionData);

        // Fetch products in collection
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('collection_id', collectionData.id)
          .eq('is_active', true)
          .order(sortBy, { ascending: sortOrder === 'asc' });

        if (productsError) throw productsError;
        setProducts(productsData || []);
      } catch (error) {
        console.error('Error fetching collection and products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCollectionAndProducts();
  }, [params.slug, sortBy, sortOrder]);

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

  if (!collection) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="container mx-auto px-4">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy bộ sưu tập</h1>
              <Link href="/collections" className="text-blue-600 hover:text-blue-800">
                Quay lại danh sách bộ sưu tập
              </Link>
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
          {/* Collection Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">{collection.name}</h1>
              <div className="flex items-center space-x-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="created_at">Mới nhất</option>
                  <option value="price">Giá</option>
                  <option value="name">Tên sản phẩm</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
            {collection.description && (
              <p className="mt-4 text-gray-600">{collection.description}</p>
            )}
            {collection.start_date && collection.end_date && (
              <p className="mt-2 text-sm text-gray-500">
                {new Date(collection.start_date).toLocaleDateString('vi-VN')} - {new Date(collection.end_date).toLocaleDateString('vi-VN')}
              </p>
            )}
          </div>

          {/* Products Grid */}
          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Không có sản phẩm nào trong bộ sưu tập này.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link 
                  key={product.id} 
                  href={`/products/${product.slug}`}
                  className="group"
                >
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden transition-transform duration-300 hover:scale-105">
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
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
} 