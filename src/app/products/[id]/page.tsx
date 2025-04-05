'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Container from '@/components/Container';
import { Star, Minus, Plus, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import { ChevronRight, Heart, ShoppingBag, Truck, Shield, RotateCcw } from 'lucide-react';

interface ProductImage {
  id: string;
  image_url: string;
  is_primary: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  image_url: string;
  stock_quantity: number;
  rating: number;
  review_count: number;
  category: {
    id: string;
    name: string;
  };
  product_images: ProductImage[];
}

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  image_url: string;
  category: {
    name: string;
  };
}

interface DatabaseProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: string;
  image_url: string;
  stock_quantity: number;
  category: {
    id: string;
    name: string;
  } | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  user_name: string;
  created_at: string;
  is_verified: boolean;
}

export default function ProductDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [currentImage, setCurrentImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('reviews');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
    .from('products')
          .select(`
            *,
            category:categories(id, name),
            product_images(id, image_url, is_primary)
          `)
          .eq('id', params.id)
    .single();

        if (error) throw error;

        if (data) {
          const mainImage = data.product_images?.find((img: ProductImage) => img.is_primary)?.image_url || data.image_url;
          const additionalImages = data.product_images?.filter((img: ProductImage) => !img.is_primary) || [];
          
          setProduct({
            ...data,
            product_images: additionalImages
          });
          setCurrentImage(mainImage);
          
          // Fetch related products after setting main product
          const { data: relatedData } = await supabase
    .from('products')
            .select(`
              *,
              category:categories(id, name)
            `)
            .eq('category_id', data.category_id)
            .neq('id', params.id)
    .limit(4);

          if (relatedData) {
            const typedData = relatedData as unknown as DatabaseProduct[];
            setRelatedProducts(typedData.map(item => ({
              id: item.id.toString(),
              name: item.name,
              description: item.description,
              price: item.price,
              category_id: item.category_id,
              image_url: item.image_url,
              stock_quantity: item.stock_quantity,
              category: {
                id: item.category?.id || '',
                name: item.category?.name || 'Uncategorized'
              },
              rating: 0,
              review_count: 0,
              product_images: []
            })));
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [params.id]);

  // Memoize handlers
  const handleQuantityChange = useCallback((action: 'increase' | 'decrease') => {
    if (action === 'increase') {
      setQuantity(prev => prev + 1);
    } else if (action === 'decrease' && quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  }, [quantity]);

  const handleAddToCart = useCallback(() => {
    if (!product) return;

    try {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity: quantity
      });
      
      toast.success('Đã thêm vào giỏ hàng');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Không thể thêm vào giỏ hàng');
    }
  }, [product, quantity, addToCart]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Không tìm thấy sản phẩm</p>
          </div>
    );
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-red-600">Trang chủ</Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-red-600">Sản phẩm</Link>
          <span className="mx-2">/</span>
          <Link href={`/categories/${product.category.id}`} className="hover:text-red-600">
            {product.category.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{product.name}</span>
        </div>

        {/* Product Info */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          {/* Product Image */}
          <div className="lg:col-span-1">
            <div className="aspect-w-1 aspect-h-1 rounded-lg overflow-hidden bg-gray-50">
              <Image
                src={currentImage}
                alt={product.name}
                width={500}
                height={500}
                className="w-full h-full object-center object-cover"
                priority
                loading="eager"
                quality={90}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            {product.product_images && product.product_images.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-4">
                <button
                  onClick={() => setCurrentImage(product.image_url)}
                  className={`relative aspect-square rounded-lg overflow-hidden bg-gray-50 ${
                    currentImage === product.image_url ? 'ring-2 ring-pink-500' : ''
                  }`}
                >
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                    loading="lazy"
                    quality={75}
                    sizes="25vw"
                  />
                </button>
                {product.product_images.map((image) => (
                  <button
                    key={image.id}
                    onClick={() => setCurrentImage(image.image_url)}
                    className={`relative aspect-square rounded-lg overflow-hidden bg-gray-50 ${
                      currentImage === image.image_url ? 'ring-2 ring-pink-500' : ''
                    }`}
                  >
                    <Image
                      src={image.image_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                      loading="lazy"
                      quality={75}
                      sizes="25vw"
                    />
                  </button>
              ))}
            </div>
            )}
          </div>

          {/* Product Details */}
          <div className="mt-10 lg:mt-0 lg:col-span-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              {product.name}
            </h1>

            <div className="mt-3">
              <h2 className="sr-only">Thông tin sản phẩm</h2>
              <p className="text-3xl text-pink-600">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND'
                }).format(product.price)}
              </p>
            </div>

            <div className="mt-3 flex items-center">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating)
                        ? 'text-yellow-400'
                        : 'text-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className="ml-2 text-sm text-gray-500">
                {product.rating} ({product.review_count} đánh giá)
              </p>
            </div>

            <div className="mt-6">
              <h3 className="sr-only">Mô tả</h3>
              <p className="text-base text-gray-700">
                {product.description}
              </p>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-8">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">Số lượng</h3>
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    disabled={quantity <= 1}
                    onClick={() => handleQuantityChange('decrease')}
                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 text-gray-900">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange('increase')}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    <Plus className="h-4 w-4" />
              </button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex sm:flex-col1">
              <button 
                onClick={handleAddToCart}
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                Thêm vào giỏ hàng
              </button>
              <button className="ml-4 py-3 px-3 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-pink-500">
                <Heart className="h-6 w-6 flex-shrink-0" />
                <span className="sr-only">Thêm vào yêu thích</span>
              </button>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-8">
              <div className="space-y-4">
                <div className="flex items-center">
                  <Truck className="h-5 w-5 text-gray-400 mr-3" />
                  <p className="text-sm text-gray-700">
                    Miễn phí vận chuyển cho đơn hàng trên 1.000.000đ
                  </p>
                </div>
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-gray-400 mr-3" />
                  <p className="text-sm text-gray-700">
                    Bảo hành 2 năm cho tất cả sản phẩm
                  </p>
              </div>
                <div className="flex items-center">
                  <RotateCcw className="h-5 w-5 text-gray-400 mr-3" />
                  <p className="text-sm text-gray-700">
                    Đổi trả miễn phí trong 30 ngày
                  </p>
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-16">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('description')}
                className={`py-4 text-sm font-medium ${
                  activeTab === 'description'
                    ? 'border-b-2 border-pink-500 text-pink-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Mô tả
              </button>
              <button
                onClick={() => setActiveTab('ingredients')}
                className={`py-4 text-sm font-medium ${
                  activeTab === 'ingredients'
                    ? 'border-b-2 border-pink-500 text-pink-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Thành phần
              </button>
              <button
                onClick={() => setActiveTab('how-to-use')}
                className={`py-4 text-sm font-medium ${
                  activeTab === 'how-to-use'
                    ? 'border-b-2 border-pink-500 text-pink-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Hướng dẫn sử dụng
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-4 text-sm font-medium ${
                  activeTab === 'reviews'
                    ? 'border-b-2 border-pink-500 text-pink-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Đánh giá
              </button>
              </div>
            </div>

          <div className="py-8">
            {activeTab === 'reviews' && (
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Đánh giá từ khách hàng
                </h3>
                <div className="space-y-6">
                  {[1, 2, 3].map((_, index) => (
                    <div key={index} className="border-b border-gray-200 pb-6">
                      <div className="flex items-center mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className="h-4 w-4 text-yellow-400"
                            />
                          ))}
                        </div>
                        <p className="ml-2 text-sm text-gray-500">5.0</p>
                      </div>
                      <h4 className="text-sm font-medium text-gray-900">
                        Sản phẩm tuyệt vời!
                      </h4>
                      <p className="mt-1 text-sm text-gray-600">
                        Tôi đã sử dụng sản phẩm này được một tháng và có thể thấy sự khác biệt rõ rệt trên da. Da căng mịn và sáng hơn hẳn.
                      </p>
                      <div className="mt-2 text-sm text-gray-500 flex items-center">
                        <span>Nguyễn T.</span>
                        <span className="mx-1">•</span>
                        <span>Đã mua hàng</span>
                        <span className="mx-1">•</span>
                        <span>2 tuần trước</span>
                      </div>
                  </div>
                ))}
                </div>
                <div className="mt-8 text-center">
                  <button className="inline-flex items-center px-4 py-2 border border-pink-600 text-sm font-medium rounded-md text-pink-600 bg-white hover:bg-pink-50">
                    Xem thêm đánh giá
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
          <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Có thể bạn cũng thích
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {relatedProducts.map((product) => (
              <div
                key={product.id}
                className="group relative bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <Link href={`/products/${product.id}`} className="block">
                  <div className="relative aspect-w-4 aspect-h-3 overflow-hidden">
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="w-full h-full object-center object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900">
                      {product.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {product.category.name}
                    </p>
                    <p className="mt-2 text-sm font-medium text-pink-600">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(product.price)}
                    </p>
                  </div>
                </Link>
                </div>
              ))}
            </div>
          </div>
      </div>
    </div>
  );
} 