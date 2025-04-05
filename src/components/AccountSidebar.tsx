import Link from 'next/link';
import { UserCircle, ShoppingBag, CreditCard, Heart, Settings } from 'lucide-react';

interface AccountSidebarProps {
  activePage: string;
}

export default function AccountSidebar({ activePage }: AccountSidebarProps) {
  return (
    <div className="w-full md:w-64 space-y-1">
      <Link
        href="/account"
        className={`flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 ${
          activePage === 'profile' ? 'bg-gray-50 text-red-600' : 'text-gray-700'
        }`}
      >
        <UserCircle className="w-5 h-5" />
        <span>Thông tin tài khoản</span>
      </Link>
      <Link
        href="/orders"
        className={`flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 ${
          activePage === 'orders' ? 'bg-gray-50 text-red-600' : 'text-gray-700'
        }`}
      >
        <ShoppingBag className="w-5 h-5" />
        <span>Đơn hàng của tôi</span>
      </Link>
      <Link
        href="/payment"
        className={`flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 ${
          activePage === 'payment' ? 'bg-gray-50 text-red-600' : 'text-gray-700'
        }`}
      >
        <CreditCard className="w-5 h-5" />
        <span>Phương thức thanh toán</span>
      </Link>
      <Link
        href="/favorites"
        className={`flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 ${
          activePage === 'favorites' ? 'bg-gray-50 text-red-600' : 'text-gray-700'
        }`}
      >
        <Heart className="w-5 h-5" />
        <span>Sản phẩm yêu thích</span>
      </Link>
      <Link
        href="/settings"
        className={`flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 ${
          activePage === 'settings' ? 'bg-gray-50 text-red-600' : 'text-gray-700'
        }`}
      >
        <Settings className="w-5 h-5" />
        <span>Cài đặt</span>
      </Link>
    </div>
  );
} 