'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { useRouter } from 'next/navigation';
import { CreditCard, Truck, Shield } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCart();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    note: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'vnpay' | 'cod'>('vnpay');
  const [isLoading, setIsLoading] = useState(false);

  if (cart.items.length === 0) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">Giỏ hàng trống</p>
        <Link
          href="/products"
          className="text-red-600 hover:text-red-700"
        >
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (paymentMethod === 'vnpay') {
        // Tạo payment URL từ VNPay
        const response = await fetch('/api/create-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: cart.getTotalPrice(),
            orderInfo: `Thanh toan don hang ${formData.fullName}`,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create payment');
        }

        // Hiển thị thông báo và chuyển hướng
        toast.info('Đang chuyển đến trang thanh toán VNPay...', {
          duration: 2000,
        });

        // Đợi 2 giây để người dùng đọc thông báo
        setTimeout(() => {
          try {
            window.location.href = data.paymentUrl;
          } catch (error) {
            console.error('Error redirecting to VNPay:', error);
            toast.error('Không thể chuyển đến trang thanh toán. Vui lòng thử lại.');
          }
        }, 2000);
        return;
      }

      // Xử lý thanh toán COD
      cart.clearCart();
      router.push('/order-success');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-red-600">Trang chủ</Link>
          <span className="mx-2">/</span>
          <Link href="/cart" className="hover:text-red-600">Giỏ hàng</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Thanh toán</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            {/* Shipping Information */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Thông tin giao hàng</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    rows={3}
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  ></textarea>
                </div>
              </form>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Phương thức thanh toán</h2>
              <div className="space-y-4">
                <div 
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'vnpay' ? 'border-red-600 bg-red-50' : 'hover:border-red-600'
                  }`}
                  onClick={() => setPaymentMethod('vnpay')}
                >
                  <CreditCard className="w-6 h-6 text-gray-600 mr-3" />
                  <div>
                    <h3 className="font-medium">Thanh toán qua VNPay</h3>
                    <p className="text-sm text-gray-500">
                      Thanh toán trực tuyến qua cổng thanh toán VNPay
                    </p>
                  </div>
                </div>
                <div 
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'cod' ? 'border-red-600 bg-red-50' : 'hover:border-red-600'
                  }`}
                  onClick={() => setPaymentMethod('cod')}
                >
                  <Truck className="w-6 h-6 text-gray-600 mr-3" />
                  <div>
                    <h3 className="font-medium">Thanh toán khi nhận hàng</h3>
                    <p className="text-sm text-gray-500">
                      Thanh toán bằng tiền mặt khi nhận hàng
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Tổng đơn hàng</h2>
              <div className="space-y-4">
                {/* Order Items */}
                <div className="space-y-2">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg">
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                        <div>
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm text-gray-500">Số lượng: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-medium">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Order Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính</span>
                    <span>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(cart.getTotalPrice())}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Phí vận chuyển</span>
                    <span>Miễn phí</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Tổng cộng</span>
                      <span className="text-red-600">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(cart.getTotalPrice())}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Security Badge */}
                <div className="flex items-center justify-center text-sm text-gray-500 mt-4">
                  <Shield className="w-4 h-4 mr-2" />
                  <span>Thanh toán an toàn</span>
                </div>

                {/* Place Order Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className={`w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors mt-4 ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? 'Đang xử lý...' : 'Đặt hàng'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 