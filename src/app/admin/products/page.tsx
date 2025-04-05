'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock_quantity: number;
  category_id: string;
  image_url: string;
  is_active: boolean;
  is_new: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  created_at: string;
  updated_at: string;
  category?: string; // Optional for display purposes
  product_images?: { id: string; image_url: string }[];
}

interface Category {
  id: string;
  name: string;
  created_at: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 0,
    category_id: '',
    stock_quantity: 0,
    image_url: '',
    is_active: true,
    is_new: true,
    is_featured: false,
    is_bestseller: false,
    slug: ''
  });

  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [additionalImageFiles, setAdditionalImageFiles] = useState<File[]>([]);
  const [mainImagePreview, setMainImagePreview] = useState<string>('');
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            name
          ),
          product_images (
            image_url,
            is_primary
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our Product interface
      const transformedData = data.map(product => ({
        ...product,
        category: product.categories?.name || 'Uncategorized',
        image_url: product.product_images?.find((img: { image_url: string; is_primary: boolean }) => img.is_primary)?.image_url || product.image_url
      }));
      
      setProducts(transformedData);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddProduct = async () => {
    try {
      console.log('Adding product:', newProduct);
      
      // Validate required fields
      if (!newProduct.name || !newProduct.category_id || !newProduct.price || !mainImageFile) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }

      // Generate slug from name
      const slug = newProduct.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Upload main image if exists
      let mainImageUrl = '';
      if (mainImageFile) {
        const mainImagePath = `products/${Date.now()}-${mainImageFile.name}`;
        const { data: mainImageData, error: mainImageError } = await supabase.storage
          .from('products')
          .upload(mainImagePath, mainImageFile);

        if (mainImageError) throw mainImageError;
        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(mainImagePath);
        mainImageUrl = publicUrl;
      }

      // Insert product first
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert([{
          name: newProduct.name,
          slug: slug,
          description: newProduct.description,
          price: newProduct.price,
          category_id: newProduct.category_id,
          stock_quantity: newProduct.stock_quantity,
          image_url: mainImageUrl,
          is_active: newProduct.is_active,
          is_new: newProduct.is_new,
          is_featured: newProduct.is_featured,
          is_bestseller: newProduct.is_bestseller
        }])
        .select()
        .single();

      if (productError) {
        console.error('Supabase error:', productError);
        throw productError;
      }

      // Insert main image into product_images
      if (mainImageUrl) {
        const { error: mainImageError } = await supabase
          .from('product_images')
          .insert([{
            product_id: productData.id,
            image_url: mainImageUrl,
            is_primary: true,
            display_order: 0
          }]);

        if (mainImageError) throw mainImageError;
      }

      // Upload and insert additional images
      for (let i = 0; i < additionalImageFiles.length; i++) {
        const file = additionalImageFiles[i];
        const imagePath = `products/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(imagePath, file);

        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(imagePath);

        const { error: imageError } = await supabase
          .from('product_images')
          .insert([{
            product_id: productData.id,
            image_url: publicUrl,
            is_primary: false,
            display_order: i + 1
          }]);

        if (imageError) throw imageError;
      }

      console.log('Product added successfully:', productData);
      
      setShowAddModal(false);
      setNewProduct({
        name: '',
        description: '',
        price: 0,
        category_id: '',
        stock_quantity: 0,
        image_url: '',
        is_active: true,
        is_new: true,
        is_featured: false,
        is_bestseller: false,
        slug: ''
      });
      setMainImageFile(null);
      setAdditionalImageFiles([]);
      setMainImagePreview('');
      setAdditionalImagePreviews([]);
      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Có lỗi xảy ra khi thêm sản phẩm. Vui lòng thử lại.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMainImagePreview(reader.result as string);
        setNewProduct(prev => ({ ...prev, image_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAdditionalImageFiles(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdditionalImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImageFiles(prev => prev.filter((_, i) => i !== index));
    setAdditionalImagePreviews(prev => prev.filter((_, i) => i !== index));
    setNewProduct(prev => ({
      ...prev,
      image_url: prev.image_url.split(',').filter((_, i) => i !== index).join(',')
    }));
  };

  const handleEditClick = async (product: Product) => {
    try {
      // Fetch additional images
      const { data: additionalImages, error: imagesError } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', product.id)
        .eq('is_primary', false)
        .order('display_order');

      if (imagesError) throw imagesError;

      setEditingProduct({
        ...product,
        product_images: additionalImages || []
      });
      setShowEditModal(true);
      setMainImagePreview('');
      setMainImageFile(null);
      setAdditionalImageFiles([]);
      setAdditionalImagePreviews([]); // Reset additional image previews
    } catch (error) {
      console.error('Error fetching product images:', error);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    
    try {
      // Validate required fields
      if (!editingProduct.name || !editingProduct.category_id || !editingProduct.price) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }

      // Generate new slug from name
      const slug = editingProduct.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Upload và cập nhật ảnh chính nếu có
      let mainImageUrl = editingProduct.image_url;
      if (mainImageFile) {
        const mainImagePath = `products/${Date.now()}-${mainImageFile.name}`;
        const { data: mainImageData, error: mainImageError } = await supabase.storage
          .from('products')
          .upload(mainImagePath, mainImageFile);

        if (mainImageError) throw mainImageError;
        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(mainImagePath);
        mainImageUrl = publicUrl;

        // Xóa ảnh chính cũ trong product_images nếu có
        const { error: deleteError } = await supabase
          .from('product_images')
          .delete()
          .eq('product_id', editingProduct.id)
          .eq('is_primary', true);

        if (deleteError) throw deleteError;

        // Thêm ảnh chính mới vào product_images
        const { error: insertError } = await supabase
          .from('product_images')
          .insert({
            product_id: editingProduct.id,
            image_url: mainImageUrl,
            is_primary: true,
            display_order: 0
          });

        if (insertError) throw insertError;
      }

      // Cập nhật thông tin sản phẩm
      const { error: productError } = await supabase
        .from('products')
        .update({
          name: editingProduct.name,
          slug: slug,
          description: editingProduct.description,
          price: editingProduct.price,
          category_id: editingProduct.category_id,
          stock_quantity: editingProduct.stock_quantity,
          image_url: mainImageUrl, // Cập nhật URL ảnh chính
          is_active: editingProduct.is_active,
          is_new: editingProduct.is_new,
          is_featured: editingProduct.is_featured,
          is_bestseller: editingProduct.is_bestseller,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingProduct.id);

      if (productError) throw productError;

      // Upload và thêm ảnh phụ mới
      for (let i = 0; i < additionalImageFiles.length; i++) {
        const file = additionalImageFiles[i];
        const imagePath = `products/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(imagePath, file);

        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(imagePath);

        const { error: imageError } = await supabase
          .from('product_images')
          .insert([{
            product_id: editingProduct.id,
            image_url: publicUrl,
            is_primary: false,
            display_order: i + 1
          }]);

        if (imageError) throw imageError;
      }

      // Refresh data và đóng modal
      await fetchProducts(); // Thêm await để đảm bảo dữ liệu được cập nhật
      setShowEditModal(false);
      setEditingProduct(null);
      setMainImageFile(null);
      setMainImagePreview('');
      setAdditionalImageFiles([]);
      setAdditionalImagePreviews([]);
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Có lỗi xảy ra khi cập nhật sản phẩm');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quản lý sản phẩm</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-red-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Thêm sản phẩm</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg"
        />
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sản phẩm
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Danh mục
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Giá
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 h-10 w-10 relative">
                      <Image
                        src={product.image_url || '/placeholder.png'}
                        alt={product.name}
                        fill
                        className="rounded-lg object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {product.description}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {product.category || 'Chưa phân loại'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(product.price)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEditClick(product)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ marginTop: 0 }}>
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full">
            <h2 className="text-xl font-bold py-4 border-b">Thêm sản phẩm mới</h2>
            <div className="grid grid-cols-2 gap-6 mt-4">
              {/* Cột trái */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tên sản phẩm</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="mt-1 block w-full border rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    className="mt-1 block w-full border rounded-md px-3 py-2"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Giá</label>
                    <input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                      className="mt-1 block w-full border rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Số lượng</label>
                    <input
                      type="number"
                      value={newProduct.stock_quantity}
                      onChange={(e) => setNewProduct({...newProduct, stock_quantity: Number(e.target.value)})}
                      className="mt-1 block w-full border rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Danh mục</label>
                  <select
                    value={newProduct.category_id}
                    onChange={(e) => setNewProduct({...newProduct, category_id: e.target.value})}
                    className="mt-1 block w-full border rounded-md px-3 py-2"
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cột phải */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ảnh chính</label>
                  <div className="mt-1 flex items-center space-x-4">
                    <div className="relative w-32 h-32 border rounded-md overflow-hidden">
                      {mainImagePreview ? (
                        <img
                          src={mainImagePreview}
                          alt="Main product"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50">
                          <span className="text-gray-400">Chưa có ảnh</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="cursor-pointer bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Chọn ảnh
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleMainImageChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Ảnh phụ</label>
                  <div className="mt-1">
                    <div className="grid grid-cols-3 gap-4">
                      {additionalImagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Additional ${index + 1}`}
                            className="w-full h-32 object-cover rounded-md"
                          />
                          <button
                            onClick={() => removeAdditionalImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <label className="cursor-pointer bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Thêm ảnh phụ
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleAdditionalImagesChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newProduct.is_active}
                      onChange={(e) => setNewProduct({...newProduct, is_active: e.target.checked})}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 block text-sm text-gray-900">
                      Kích hoạt ngay
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleAddProduct}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ marginTop: 0 }}>
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full">
            <h2 className="text-xl font-bold py-4 border-b">Sửa sản phẩm</h2>
            <div className="grid grid-cols-2 gap-6 mt-4">
              {/* Cột trái */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tên sản phẩm</label>
                  <input
                    type="text"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                    className="mt-1 block w-full border rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                  <textarea
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                    className="mt-1 block w-full border rounded-md px-3 py-2"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Giá</label>
                    <input
                      type="number"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({...editingProduct, price: Number(e.target.value)})}
                      className="mt-1 block w-full border rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Số lượng</label>
                    <input
                      type="number"
                      value={editingProduct.stock_quantity}
                      onChange={(e) => setEditingProduct({...editingProduct, stock_quantity: Number(e.target.value)})}
                      className="mt-1 block w-full border rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Danh mục</label>
                  <select
                    value={editingProduct.category_id}
                    onChange={(e) => setEditingProduct({...editingProduct, category_id: e.target.value})}
                    className="mt-1 block w-full border rounded-md px-3 py-2"
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cột phải */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ảnh chính</label>
                  <div className="mt-1 flex items-center space-x-4">
                    <div className="relative w-32 h-32 border rounded-md overflow-hidden">
                      {mainImagePreview || editingProduct.image_url ? (
                        <img
                          src={mainImagePreview || editingProduct.image_url}
                          alt="Main product"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50">
                          <span className="text-gray-400">Chưa có ảnh</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="cursor-pointer bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Chọn ảnh
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleMainImageChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Ảnh phụ</label>
                  <div className="mt-1">
                    <div className="grid grid-cols-3 gap-4">
                      {/* Existing Additional Images */}
                      {editingProduct.product_images?.map((image, index) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.image_url}
                            alt={`Additional ${index + 1}`}
                            className="w-full h-32 object-cover rounded-md"
                          />
                          <button
                            onClick={async () => {
                              try {
                                const { error } = await supabase
                                  .from('product_images')
                                  .delete()
                                  .eq('id', image.id);
                                
                                if (error) throw error;

                                // Update local state
                                setEditingProduct({
                                  ...editingProduct,
                                  product_images: editingProduct.product_images?.filter(img => img.id !== image.id)
                                });
                              } catch (error) {
                                console.error('Error deleting image:', error);
                              }
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}

                      {/* New Additional Images Preview */}
                      {additionalImagePreviews.map((preview, index) => (
                        <div key={`new-${index}`} className="relative group">
                          <img
                            src={preview}
                            alt={`New Additional ${index + 1}`}
                            className="w-full h-32 object-cover rounded-md"
                          />
                          <button
                            onClick={() => {
                              setAdditionalImageFiles(prev => prev.filter((_, i) => i !== index));
                              setAdditionalImagePreviews(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4">
                      <label className="cursor-pointer bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Thêm ảnh phụ
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleAdditionalImagesChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.is_active}
                      onChange={(e) => setEditingProduct({...editingProduct, is_active: e.target.checked})}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 block text-sm text-gray-900">
                      Kích hoạt
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProduct(null);
                }}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateProduct}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 