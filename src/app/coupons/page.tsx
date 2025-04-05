'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';

interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase_amount: number | null;
  max_discount_amount: number | null;
  start_date: string;
  end_date: string;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
}

interface UserCoupon {
  id: string;
  coupon_id: string;
  is_used: boolean;
  used_at: string | null;
  coupons: Coupon;
}

export default function CouponsPage() {
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [userCoupons, setUserCoupons] = useState<UserCoupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCoupons() {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        // Fetch available coupons
        const { data: couponsData, error: couponsError } = await supabase
          .from('coupons')
          .select('*')
          .eq('is_active', true)
          .gte('end_date', new Date().toISOString())
          .lte('start_date', new Date().toISOString())
          .order('created_at', { ascending: false });

        if (couponsError) throw couponsError;
        setAvailableCoupons(couponsData || []);

        // If user is logged in, fetch their coupons
        if (user) {
          const { data: userCouponsData, error: userCouponsError } = await supabase
            .from('user_coupons')
            .select(`
              *,
              coupons (*)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (userCouponsError) throw userCouponsError;
          setUserCoupons(userCouponsData || []);
        }
      } catch (error) {
        console.error('Error fetching coupons:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCoupons();
  }, []);

  const getCouponStatus = (coupon: Coupon) => {
    const now = new Date();
    const startDate = new Date(coupon.start_date);
    const endDate = new Date(coupon.end_date);

    if (now < startDate) {
      return {
        status: 'upcoming',
        text: 'Sắp diễn ra',
        color: 'text-blue-600 bg-blue-50'
      };
    }

    if (now > endDate) {
      return {
        status: 'expired',
        text: 'Đã hết hạn',
        color: 'text-red-600 bg-red-50'
      };
    }

    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return {
        status: 'limit_reached',
        text: 'Đã hết lượt sử dụng',
        color: 'text-red-600 bg-red-50'
      };
    }

    return {
      status: 'active',
      text: 'Đang hoạt động',
      color: 'text-green-600 bg-green-50'
    };
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="container mx-auto px-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm p-6">
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Mã giảm giá</h1>

          {/* Available Coupons */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Mã giảm giá đang hoạt động</h2>
            {availableCoupons.length === 0 ? (
              <p className="text-gray-500">Hiện không có mã giảm giá nào đang hoạt động.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableCoupons.map((coupon) => {
                  const status = getCouponStatus(coupon);
                  return (
                    <div key={coupon.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-gray-900">{coupon.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                            {status.text}
                          </span>
                        </div>
                        <div className="mb-4">
                          <p className="text-gray-600">{coupon.description}</p>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-2xl font-bold text-blue-600">
                            {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `${coupon.discount_value.toLocaleString('vi-VN')}đ`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {coupon.usage_limit && (
                              <p>Đã dùng: {coupon.used_count}/{coupon.usage_limit}</p>
                            )}
                            <p>HSD: {new Date(coupon.end_date).toLocaleDateString('vi-VN')}</p>
                          </div>
                        </div>
                        {coupon.min_purchase_amount && (
                          <p className="text-sm text-gray-500 mb-4">
                            Áp dụng cho đơn hàng từ {coupon.min_purchase_amount.toLocaleString('vi-VN')}đ
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <code className="text-lg font-mono bg-gray-100 px-3 py-1 rounded">
                            {coupon.code}
                          </code>
                          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            Sao chép
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* User's Coupons */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Mã giảm giá của tôi</h2>
            {userCoupons.length === 0 ? (
              <p className="text-gray-500">Bạn chưa có mã giảm giá nào.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userCoupons.map((userCoupon) => {
                  const coupon = userCoupon.coupons;
                  const status = getCouponStatus(coupon);
                  return (
                    <div key={userCoupon.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-gray-900">{coupon.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                            {userCoupon.is_used ? 'Đã sử dụng' : status.text}
                          </span>
                        </div>
                        <div className="mb-4">
                          <p className="text-gray-600">{coupon.description}</p>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-2xl font-bold text-blue-600">
                            {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `${coupon.discount_value.toLocaleString('vi-VN')}đ`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {userCoupon.used_at && (
                              <p>Đã dùng: {new Date(userCoupon.used_at).toLocaleString('vi-VN')}</p>
                            )}
                            <p>HSD: {new Date(coupon.end_date).toLocaleDateString('vi-VN')}</p>
                          </div>
                        </div>
                        {coupon.min_purchase_amount && (
                          <p className="text-sm text-gray-500 mb-4">
                            Áp dụng cho đơn hàng từ {coupon.min_purchase_amount.toLocaleString('vi-VN')}đ
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <code className="text-lg font-mono bg-gray-100 px-3 py-1 rounded">
                            {coupon.code}
                          </code>
                          {!userCoupon.is_used && (
                            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                              Sao chép
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 