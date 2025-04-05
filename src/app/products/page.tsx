'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Search, Heart, Star, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url: string;
  category_id: string;
  stock: number;
  created_at: string;
  category: {
    id: string;
    name: string;
  };
  rating: number;
  review_count: number;
}

interface Category {
  id: string;
  name: string;
}

type SortOption = {
  label: string;
  value: string;
  orderBy: string;
  ascending: boolean;
};

const sortOptions: SortOption[] = [
  { label: 'Nổi bật', value: 'featured', orderBy: 'created_at', ascending: false },
  { label: 'Mới nhất', value: 'newest', orderBy: 'created_at', ascending: false },
  { label: 'Giá tăng dần', value: 'price-asc', orderBy: 'price', ascending: true },
  { label: 'Giá giảm dần', value: 'price-desc', orderBy: 'price', ascending: false },
];

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [showSortOptions, setShowSortOptions] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [selectedCategories, priceRange, sortBy, searchTerm]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name)
        `);

      // Apply category filter
      if (selectedCategories.length > 0) {
        query = query.in('category_id', selectedCategories);
      }

      // Apply search filter
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      // Apply price filter only if it's not the default range
      if (priceRange[0] !== 0 || priceRange[1] !== 1000) {
        query = query
          .gte('price', priceRange[0] * 10000)
          .lte('price', priceRange[1] * 10000);
      }

      // Apply sorting
      switch (sortBy) {
        case 'price-asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price-desc':
          query = query.order('price', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handlePriceChange = (value: [number, number]) => {
    setPriceRange(value);
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, 1000]);
    setSearchTerm('');
    setSortBy('featured');
    fetchProducts();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      {/* Header */}
      <div className="container mx-auto px-4">
        <div className="text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-red-600">Trang chủ</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Sản phẩm</span>
        </div>
        <h1 className="text-2xl font-semibold mb-8">Tất cả sản phẩm</h1>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="space-y-6">
              {/* Categories */}
              <div>
                <h3 className="text-lg font-medium mb-4">Danh mục</h3>
                <div className="space-y-2">
                  {categories.map(category => (
                    <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => handleCategoryChange(category.id)}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-gray-600">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-lg font-medium mb-4">Khoảng giá</h3>
                <div className="px-2">
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={priceRange[1]}
                    onChange={(e) => handlePriceChange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>{(priceRange[0] * 10000).toLocaleString('vi-VN')}đ</span>
                    <span>{(priceRange[1] * 10000).toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>
              </div>

              <button
                onClick={resetFilters}
                className="w-full px-4 py-2 border border-primary text-primary rounded hover:bg-primary/5 transition-colors"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search and Sort Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm sản phẩm..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary min-w-[150px]"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <div 
                  key={product.id}
                  className="group relative bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  <Link href={`/products/${product.id}`} className="block">
                    <div className="relative h-64 w-full overflow-hidden">
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="w-full h-full object-center object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-0 left-0 m-2">
                        <button className="p-2 rounded-full bg-white bg-opacity-70 hover:bg-opacity-100 text-pink-500 transition-all duration-300">
                          <Heart className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-center">
                        <h3 className="mb-1 text-lg font-medium text-gray-900">{product.name}</h3>
                        <p className="text-lg font-medium text-pink-600">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(product.price)}
                        </p>
                      </div>
                      <p className="mb-2 text-sm text-gray-500">{product.category.name}</p>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(product.rating)
                                ? 'text-yellow-400'
                                : 'text-gray-200'
                            }`}
                          />
                        ))}
                        <span className="ml-1 text-sm text-gray-500">({product.review_count} đánh giá)</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">{product.description}</p>
                      <div className="mt-4">
                        <button className="w-full bg-pink-600 text-white py-2 px-4 rounded-md hover:bg-pink-700 transition-colors duration-300 flex items-center justify-center">
                          <ShoppingBag className="h-4 w-4 mr-2" />
                          Thêm vào giỏ hàng
                        </button>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 