'use client';

import { User, ShoppingBag, Heart, Settings, LogOut, Camera, Trash2, UserCircle, CreditCard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  points: number;
  role: string;
  address: string;
  avatar_url: string | null;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [activePage, setActivePage] = useState('profile');

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
      fetchUserProfile(session.user.id);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
      fetchUserProfile(session.user.id);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user ID:', userId);
      
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        return;
      }

      if (!session) {
        console.error('No session found');
        return;
      }

      // First try to find user by email
      const { data: existingUser, error: emailError } = await supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .single();

      if (emailError && emailError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error checking existing user:', emailError);
        return;
      }

      if (existingUser) {
        console.log('Found existing user:', existingUser);
        setUserProfile(existingUser);
        return;
      }

      // If no user found by email, try to find by ID
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, phone, points, role, address, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Database error:', error);
        return;
      }

      console.log('Fetched user data:', data);
      
      if (data) {
        setUserProfile({
          id: data.id,
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          points: data.points,
          role: data.role,
          address: data.address,
          avatar_url: data.avatar_url || null
        });
      } else {
        // If no profile exists, create one
        const { data: newProfile, error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: userId,
              full_name: session.user.user_metadata?.full_name || '',
              email: session.user.email,
              phone: '',
              points: 0,
              role: 'customer',
              password_hash: session.user.aud || '', // Use a temporary value for password_hash
              address: ''
            }
          ])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
          return;
        }

        console.log('Created new profile:', newProfile);
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      if (userProfile?.avatar_url) {
        // Update user profile to remove avatar_url
        const { error: updateError } = await supabase
          .from('users')
          .update({
            avatar_url: null,
            updated_at: new Date().toISOString()
          })
          .eq('email', user.email);

        if (updateError) {
          throw updateError;
        }

        // Update local state
        setUserProfile(prev => prev ? {
          ...prev,
          avatar_url: null
        } : null);
        setAvatarPreview(null);
        setAvatarFile(null);

        setUpdateMessage({ type: 'success', text: 'Xóa ảnh đại diện thành công!' });
      }
    } catch (error: any) {
      console.error('Error deleting avatar:', error);
      setUpdateMessage({ type: 'error', text: error.message || 'Có lỗi xảy ra khi xóa ảnh đại diện' });
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateMessage(null);

    const formData = new FormData(e.currentTarget);
    const full_name = formData.get('full_name') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;

    try {
      console.log('Updating profile with:', { full_name, phone, address });
      
      // Update user profile
      const { data, error } = await supabase
        .from('users')
        .update({
          full_name,
          phone,
          address,
          avatar_url: avatarPreview || userProfile?.avatar_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('email', user.email)
        .select()
        .single();

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      console.log('Update successful:', data);
      
      // Update local state
      setUserProfile(prev => prev ? {
        ...prev,
        full_name,
        phone,
        address,
        avatar_url: avatarPreview || userProfile?.avatar_url || null
      } : null);
      
      setUpdateMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setUpdateMessage({ type: 'error', text: error.message || 'Có lỗi xảy ra khi cập nhật thông tin' });
    } finally {
      setIsUpdating(false);
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
        <span className="text-gray-400">Tài khoản</span>
      </div>

      {/* Page Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Tài khoản</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
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

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Account Information */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Thông tin tài khoản</h2>
            {updateMessage && (
              <div className={`mb-4 p-4 rounded-lg ${
                updateMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {updateMessage.text}
              </div>
            )}
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  name="full_name"
                  defaultValue={userProfile?.full_name || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={userProfile?.phone || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={userProfile?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ
                </label>
                <textarea
                  defaultValue={userProfile?.address || ''}
                  name="address"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
              </button>
            </form>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Đơn hàng gần đây</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Mã đơn hàng
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Ngày đặt
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Tổng tiền
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Trạng thái
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-4 text-sm">#DH001</td>
                    <td className="py-3 px-4 text-sm">01/01/2024</td>
                    <td className="py-3 px-4 text-sm">2.999.000đ</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                        Đã giao hàng
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <a href="#" className="text-sm text-red-600 hover:text-red-700">
                        Xem chi tiết
                      </a>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 text-sm">#DH002</td>
                    <td className="py-3 px-4 text-sm">02/01/2024</td>
                    <td className="py-3 px-4 text-sm">1.499.000đ</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">
                        Đang xử lý
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <a href="#" className="text-sm text-red-600 hover:text-red-700">
                        Xem chi tiết
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 