'use client';

import { useAdmin } from '@/hooks/useAdmin';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  Settings,
  LogOut,
  Tags,
  Percent,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, isLoading } = useAdmin();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);

  const menuItems = [
    {
      title: 'Tổng quan',
      icon: <LayoutDashboard className="w-5 h-5" />,
      href: '/admin'
    },
    {
      title: 'Sản phẩm',
      icon: <Package className="w-5 h-5" />,
      href: '/admin/products'
    },
    {
      title: 'Danh mục',
      icon: <Tags className="w-5 h-5" />,
      href: '/admin/categories'
    },
    {
      title: 'Khuyến mãi',
      icon: <Percent className="w-5 h-5" />,
      href: '/admin/promotions'
    },
    {
      title: 'Người dùng',
      icon: <Users className="w-5 h-5" />,
      href: '/admin/users'
    },
    {
      title: 'Đơn hàng',
      icon: <ShoppingCart className="w-5 h-5" />,
      href: '/admin/orders'
    }
  ];

  const settingsMenu = {
    title: 'Quản trị',
    icon: <Settings className="w-5 h-5" />,
    href: '/admin/settings'
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className={`lg:hidden fixed top-[73px] z-[15] p-1.5 rounded-r-md bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white/90 transition-all duration-200 ease-in-out ${
          isMobileMenuOpen ? 'left-64' : 'left-0'
        }`}
      >
        {isMobileMenuOpen ? (
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40 lg:z-0
        w-64 bg-white shadow-lg transform lg:transform-none transition-transform duration-200 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div 
            className="p-4 border-b cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
          </div>
          
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-red-50 text-red-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {item.icon}
                      <span>{item.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="p-4 border-t space-y-2">
            <Link
              href={settingsMenu.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                pathname === settingsMenu.href
                  ? 'bg-red-50 text-red-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {settingsMenu.icon}
              <span>{settingsMenu.title}</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-3 text-gray-600 hover:text-red-600 transition-colors w-full p-3 rounded-lg"
            >
              <LogOut className="w-5 h-5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
} 