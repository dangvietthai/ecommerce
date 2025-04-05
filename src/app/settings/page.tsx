'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Settings, Lock, Bell, Shield, LogOut } from 'lucide-react';
import AccountSidebar from '@/components/AccountSidebar';

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [emailNotifications, setEmailNotifications] = useState({
    orderUpdates: true,
    promotions: true,
    security: true
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    checkUser();
    fetchSettings();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    setUser(session.user);
  };

  const fetchSettings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setEmailNotifications({
          orderUpdates: data.order_updates,
          promotions: data.promotions,
          security: data.security_alerts
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const updatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateMessage(null);

    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (newPassword !== confirmPassword) {
      setUpdateMessage({ type: 'error', text: 'Mật khẩu mới không khớp' });
      setIsUpdating(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;

      setUpdateMessage({ type: 'success', text: 'Cập nhật mật khẩu thành công' });
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      setUpdateMessage({ type: 'error', text: error.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const updateNotificationSettings = async (setting: keyof typeof emailNotifications) => {
    try {
      const newValue = !emailNotifications[setting];
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: session.user.id,
          [setting === 'orderUpdates' ? 'order_updates' : 
            setting === 'promotions' ? 'promotions' : 'security_alerts']: newValue,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setEmailNotifications(prev => ({
        ...prev,
        [setting]: newValue
      }));

      setUpdateMessage({ type: 'success', text: 'Cập nhật cài đặt thành công' });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      setUpdateMessage({ type: 'error', text: 'Có lỗi xảy ra khi cập nhật cài đặt' });
    }
  };

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="md:col-span-3 bg-white rounded-lg shadow-sm p-6">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
        <a href="/" className="hover:text-red-600">Trang chủ</a>
        <span>/</span>
        <a href="/account" className="hover:text-red-600">Tài khoản</a>
        <span>/</span>
        <span className="text-gray-400">Cài đặt</span>
      </div>

      {/* Page Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Cài đặt tài khoản</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <AccountSidebar activePage="settings" />

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {updateMessage && (
            <div className={`p-4 rounded-lg ${
              updateMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {updateMessage.text}
            </div>
          )}

          {/* Password Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Lock className="w-5 h-5 text-gray-500" />
              <h2 className="text-xl font-semibold text-gray-900">Đổi mật khẩu</h2>
            </div>
            <form onSubmit={updatePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  name="newPassword"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </button>
            </form>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Bell className="w-5 h-5 text-gray-500" />
              <h2 className="text-xl font-semibold text-gray-900">Cài đặt thông báo</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Cập nhật đơn hàng</h3>
                  <p className="text-sm text-gray-500">Nhận thông báo về trạng thái đơn hàng</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifications.orderUpdates}
                    onChange={() => updateNotificationSettings('orderUpdates')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Khuyến mãi</h3>
                  <p className="text-sm text-gray-500">Nhận thông tin về khuyến mãi và ưu đãi</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifications.promotions}
                    onChange={() => updateNotificationSettings('promotions')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Bảo mật</h3>
                  <p className="text-sm text-gray-500">Nhận thông báo về hoạt động đáng ngờ</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifications.security}
                    onChange={() => updateNotificationSettings('security')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Shield className="w-5 h-5 text-gray-500" />
              <h2 className="text-xl font-semibold text-gray-900">Bảo mật tài khoản</h2>
            </div>
            <div className="space-y-4">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700"
              >
                <LogOut className="w-5 h-5" />
                <span>Đăng xuất khỏi tất cả thiết bị</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 