'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Pencil, Trash2, Search, Tag, Calendar } from 'lucide-react';

interface Promotion {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_discount: number;
  start_date: string;
  end_date: string;
  usage_limit: number;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [newPromotion, setNewPromotion] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    min_purchase: 0,
    max_discount: 0,
    start_date: '',
    end_date: '',
    usage_limit: 0,
    is_active: true
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromotions(data || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPromotion = async () => {
    try {
      const { error } = await supabase
        .from('promotions')
        .insert([{
          ...newPromotion,
          used_count: 0
        }]);

      if (error) throw error;
      
      setShowAddModal(false);
      setNewPromotion({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 0,
        min_purchase: 0,
        max_discount: 0,
        start_date: '',
        end_date: '',
        usage_limit: 0,
        is_active: true
      });
      fetchPromotions();
    } catch (error) {
      console.error('Error adding promotion:', error);
    }
  };

  const handleEditPromotion = async () => {
    if (!editingPromotion) return;

    try {
      const { error } = await supabase
        .from('promotions')
        .update({
          code: editingPromotion.code,
          description: editingPromotion.description,
          discount_type: editingPromotion.discount_type,
          discount_value: editingPromotion.discount_value,
          min_purchase: editingPromotion.min_purchase,
          max_discount: editingPromotion.max_discount,
          start_date: editingPromotion.start_date,
          end_date: editingPromotion.end_date,
          usage_limit: editingPromotion.usage_limit,
          is_active: editingPromotion.is_active
        })
        .eq('id', editingPromotion.id);

      if (error) throw error;
      
      setEditingPromotion(null);
      fetchPromotions();
    } catch (error) {
      console.error('Error updating promotion:', error);
    }
  };

  const handleDeletePromotion = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa khuyến mãi này?')) return;

    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchPromotions();
    } catch (error) {
      console.error('Error deleting promotion:', error);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('promotions')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchPromotions();
    } catch (error) {
      console.error('Error toggling promotion status:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredPromotions = promotions.filter(promotion =>
    promotion.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    promotion.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <h1 className="text-2xl font-bold">Quản lý khuyến mãi</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-red-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Thêm khuyến mãi</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Tìm kiếm khuyến mãi..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg"
        />
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
      </div>

      {/* Promotions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPromotions.map((promotion) => (
          <div key={promotion.id} className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-900 flex items-center">
                  <Tag className="w-4 h-4 mr-2" />
                  {promotion.code}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{promotion.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditingPromotion(promotion)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeletePromotion(promotion.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Giảm giá:</span>
                <span className="font-medium">
                  {promotion.discount_type === 'percentage' 
                    ? `${promotion.discount_value}%`
                    : formatCurrency(promotion.discount_value)}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Đơn tối thiểu:</span>
                <span>{formatCurrency(promotion.min_purchase)}</span>
              </div>

              {promotion.max_discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Giảm tối đa:</span>
                  <span>{formatCurrency(promotion.max_discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Đã sử dụng:</span>
                <span>{promotion.used_count}/{promotion.usage_limit || '∞'}</span>
              </div>
            </div>

            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-2" />
                {formatDate(promotion.start_date)} - {formatDate(promotion.end_date)}
              </div>
            </div>

            <div className="pt-4 border-t flex justify-between items-center">
              <span className={`px-2 py-1 text-xs rounded-full ${
                promotion.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {promotion.is_active ? 'Đang hoạt động' : 'Đã tắt'}
              </span>
              <button
                onClick={() => handleToggleActive(promotion.id, promotion.is_active)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  promotion.is_active
                    ? 'bg-red-100 text-red-800 hover:bg-red-200'
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                {promotion.is_active ? 'Tắt' : 'Bật'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Promotion Modal */}
      {(showAddModal || editingPromotion) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ marginTop: 0 }}>
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full">
            <h2 className="text-xl font-bold py-4 border-b">
              {editingPromotion ? 'Chỉnh sửa khuyến mãi' : 'Thêm khuyến mãi mới'}
            </h2>
            <div className="grid grid-cols-2 gap-6 mt-4">
              {/* Cột trái */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mã khuyến mãi</label>
                  <input
                    type="text"
                    value={editingPromotion?.code || newPromotion.code}
                    onChange={(e) => editingPromotion 
                      ? setEditingPromotion({...editingPromotion, code: e.target.value})
                      : setNewPromotion({...newPromotion, code: e.target.value})
                    }
                    className="mt-1 block w-full border rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                  <textarea
                    value={editingPromotion?.description || newPromotion.description}
                    onChange={(e) => editingPromotion
                      ? setEditingPromotion({...editingPromotion, description: e.target.value})
                      : setNewPromotion({...newPromotion, description: e.target.value})
                    }
                    className="mt-1 block w-full border rounded-md px-3 py-2"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Loại giảm giá</label>
                    <select
                      value={editingPromotion?.discount_type || newPromotion.discount_type}
                      onChange={(e) => {
                        const value = e.target.value as 'percentage' | 'fixed';
                        editingPromotion
                          ? setEditingPromotion({...editingPromotion, discount_type: value})
                          : setNewPromotion({...newPromotion, discount_type: value});
                      }}
                      className="mt-1 block w-full border rounded-md px-3 py-2"
                    >
                      <option value="percentage">Phần trăm</option>
                      <option value="fixed">Số tiền cố định</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Giá trị giảm</label>
                    <input
                      type="number"
                      value={editingPromotion?.discount_value || newPromotion.discount_value}
                      onChange={(e) => editingPromotion
                        ? setEditingPromotion({...editingPromotion, discount_value: Number(e.target.value)})
                        : setNewPromotion({...newPromotion, discount_value: Number(e.target.value)})
                      }
                      className="mt-1 block w-full border rounded-md px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              {/* Cột phải */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Đơn tối thiểu</label>
                    <input
                      type="number"
                      value={editingPromotion?.min_purchase || newPromotion.min_purchase}
                      onChange={(e) => editingPromotion
                        ? setEditingPromotion({...editingPromotion, min_purchase: Number(e.target.value)})
                        : setNewPromotion({...newPromotion, min_purchase: Number(e.target.value)})
                      }
                      className="mt-1 block w-full border rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Giảm tối đa</label>
                    <input
                      type="number"
                      value={editingPromotion?.max_discount || newPromotion.max_discount}
                      onChange={(e) => editingPromotion
                        ? setEditingPromotion({...editingPromotion, max_discount: Number(e.target.value)})
                        : setNewPromotion({...newPromotion, max_discount: Number(e.target.value)})
                      }
                      className="mt-1 block w-full border rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ngày bắt đầu</label>
                    <input
                      type="date"
                      value={editingPromotion?.start_date || newPromotion.start_date}
                      onChange={(e) => editingPromotion
                        ? setEditingPromotion({...editingPromotion, start_date: e.target.value})
                        : setNewPromotion({...newPromotion, start_date: e.target.value})
                      }
                      className="mt-1 block w-full border rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ngày kết thúc</label>
                    <input
                      type="date"
                      value={editingPromotion?.end_date || newPromotion.end_date}
                      onChange={(e) => editingPromotion
                        ? setEditingPromotion({...editingPromotion, end_date: e.target.value})
                        : setNewPromotion({...newPromotion, end_date: e.target.value})
                      }
                      className="mt-1 block w-full border rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Giới hạn sử dụng</label>
                    <input
                      type="number"
                      value={editingPromotion?.usage_limit || newPromotion.usage_limit}
                      onChange={(e) => editingPromotion
                        ? setEditingPromotion({...editingPromotion, usage_limit: Number(e.target.value)})
                        : setNewPromotion({...newPromotion, usage_limit: Number(e.target.value)})
                      }
                      className="mt-1 block w-full border rounded-md px-3 py-2"
                      placeholder="0 = không giới hạn"
                    />
                  </div>

                  <div className="flex items-center h-full">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingPromotion?.is_active || newPromotion.is_active}
                        onChange={(e) => editingPromotion
                          ? setEditingPromotion({...editingPromotion, is_active: e.target.checked})
                          : setNewPromotion({...newPromotion, is_active: e.target.checked})
                        }
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 block text-sm text-gray-900">
                        Kích hoạt ngay
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingPromotion(null);
                }}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={editingPromotion ? handleEditPromotion : handleAddPromotion}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                {editingPromotion ? 'Lưu' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 