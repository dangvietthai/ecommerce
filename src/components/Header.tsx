'use client';

import Link from 'next/link';
import { Search, ShoppingCart, User, Menu, ChevronDown, LogOut, Mail, Lock, Phone, CreditCard, ShoppingBag, UserCircle, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import CartPopup from './CartPopup';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/hooks/useCart';
import CartDrawer from './CartDrawer';

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isSticky, setIsSticky] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoginForm, setIsLoginForm] = useState(true);
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: ''
  });
  const [registerError, setRegisterError] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { items } = useCart();
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    fetchCategories();
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        fetchUserProfile(session.user.email);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        await fetchUserProfile(session.user.email);
      }
      setIsLoading(false);
    });

    const handleScroll = () => {
      setIsSticky(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchUserProfile = async (email: string) => {
    try {
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (userData) {
        setUserProfile({
          id: userData.id,
          full_name: userData.full_name,
          email: userData.email,
          phone: userData.phone,
          address: userData.address,
          avatar_url: userData.avatar_url,
          created_at: userData.created_at,
          updated_at: userData.updated_at
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      if (data.user) {
        // Kiểm tra role của user
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('email', data.user.email)
          .single();

        if (userError) throw userError;

        setShowLoginModal(false);
        setLoginEmail('');
        setLoginPassword('');

        if (userData?.role === 'admin') {
          router.push('/admin');
        }
      }
    } catch (error) {
      console.error('Error logging in:', error);
      setLoginError('Email hoặc mật khẩu không chính xác');
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  useEffect(() => {
    // Lắng nghe sự kiện thay đổi session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session?.user || null);
        // Kiểm tra role của user
        if (session?.user) {
          supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()
            .then(({ data, error }) => {
              if (!error && data?.role === 'admin') {
                setIsAdmin(true);
              }
            });
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAdmin(false);
      }
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          data: {
            full_name: registerData.fullName,
            phone: registerData.phone
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (authError) {
        setRegisterError('Có lỗi xảy ra khi đăng ký');
        return;
      }

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              email: registerData.email,
              full_name: registerData.fullName,
              phone: registerData.phone,
              points: 0,
              role: 'customer',
              address: '',
              password_hash: authData.user.aud
            },
          ]);

        if (profileError) {
          console.error('Error creating profile:', profileError);
          setRegisterError('Có lỗi xảy ra khi tạo thông tin người dùng');
          return;
      }

        // Show success message about email confirmation
        setRegisterError('Vui lòng kiểm tra email của bạn để xác nhận tài khoản');
      setShowUserMenu(false);
      setRegisterData({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        phone: ''
      });
        setIsLoginForm(true); // Switch back to login form
      }
    } catch (error) {
      setRegisterError('Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('email', session.user.email)
          .single();

        if (userError) throw userError;
        setIsAdmin(userData?.role === 'admin');
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      <header className={`w-full bg-white shadow-sm ${isSticky ? 'fixed top-0 left-0 z-50 animate-slideDown' : ''}`}>
        <div className="container mx-auto px-4">
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between py-4">
            {/* Logo */}
            <Link href="/" className="text-2xl font-bold">
              Lumière
            </Link>

            {/* Mobile Search and Menu */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="w-48 pl-10 pr-4 py-2 text-sm border rounded-full focus:outline-none focus:border-red-500"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              <CartPopup />
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold">
            Lumière
          </Link>

          {/* Desktop Navigation */}
            <nav className="flex items-center space-x-8">
              <Link 
                href="/" 
                className={`nav-link ${pathname === '/' ? 'text-red-600' : ''}`}
              >
              Trang chủ
            </Link>
            <div className="relative dropdown-trigger">
                <Link 
                  href="/products" 
                  className={`nav-link flex items-center ${pathname.startsWith('/products') ? 'text-red-600' : ''}`}
                >
                Sản phẩm
                <ChevronDown className="w-4 h-4 ml-1" />
                </Link>
                <div className="dropdown-menu w-48 py-2">
                  {categories.map((category) => (
                    <Link 
                      key={category.id}
                      href={`/category/${category.slug}`} 
                      className="block px-4 py-2 hover:bg-gray-50"
                    >
                      {category.name}
                </Link>
                  ))}
                </div>
              </div>
              <Link 
                href="/news" 
                className={`nav-link ${pathname === '/news' ? 'text-red-600' : ''}`}
              >
                Tin tức
              </Link>
              <Link 
                href="/about" 
                className={`nav-link ${pathname === '/about' ? 'text-red-600' : ''}`}
              >
              Về chúng tôi
            </Link>
              <Link 
                href="/contact" 
                className={`nav-link ${pathname === '/contact' ? 'text-red-600' : ''}`}
              >
              Liên hệ
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-6">
              {/* Search */}
              <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                  className="w-full pl-10 pr-4 py-2 text-sm border rounded-full focus:outline-none focus:border-red-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>

            {/* Cart */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative text-gray-600 hover:text-red-600"
              >
                <ShoppingCart className="w-6 h-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    {totalItems}
                  </span>
                )}
              </button>

            {/* User Menu */}
              <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-1 hover:text-red-600"
              >
                <User className="w-6 h-6" />
                <ChevronDown className="w-4 h-4" />
              </button>

                <AnimatePresence>
              {showUserMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg py-2 z-50"
                    >
                  {user ? (
                    <>
                      <Link
                        href="/account"
                        className="block px-4 py-2 hover:bg-gray-50 flex items-center"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <UserCircle className="w-4 h-4 mr-2 text-gray-500" />
                        Tài khoản
                      </Link>
                        {isAdmin && (
                      <Link
                            href="/admin"
                        className="block px-4 py-2 hover:bg-gray-50 flex items-center"
                        onClick={() => setShowUserMenu(false)}
                      >
                            <Settings className="w-4 h-4 mr-2 text-gray-500" />
                            Quản trị
                      </Link>
                        )}
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-red-600"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Đăng xuất
                      </button>
                    </>
                  ) : (
                    <div className="p-4">
                      {isLoginForm ? (
                          <form onSubmit={handleLogin} className="space-y-4">
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                  type="email"
                                  value={loginEmail}
                                  onChange={(e) => setLoginEmail(e.target.value)}
                                  placeholder="Email"
                                  required
                                    autoComplete="email"
                                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-red-500"
                                />
                              </div>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                  type="password"
                                  value={loginPassword}
                                  onChange={(e) => setLoginPassword(e.target.value)}
                                  placeholder="Mật khẩu"
                                  required
                                    autoComplete="current-password"
                                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-red-500"
                                />
                            </div>
                            {loginError && (
                              <div className="text-red-500 text-sm">{loginError}</div>
                            )}
                            <button
                              type="submit"
                              className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition duration-200"
                            >
                              Đăng nhập
                            </button>
                            <div className="text-center text-sm text-gray-600">
                              Chưa có tài khoản?{' '}
                              <button
                                type="button"
                                onClick={() => setIsLoginForm(false)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Đăng ký ngay
                              </button>
                            </div>
                          </form>
                      ) : (
                          <form onSubmit={handleRegister} className="space-y-4">
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                  type="email"
                                  value={registerData.email}
                                  onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                                  placeholder="Email"
                                  required
                                    autoComplete="email"
                                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-red-500"
                                />
                              </div>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                  type="text"
                                  value={registerData.fullName}
                                  onChange={(e) => setRegisterData({...registerData, fullName: e.target.value})}
                                  placeholder="Họ và tên"
                                  required
                                    autoComplete="name"
                                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-red-500"
                                />
                              </div>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                  type="password"
                                  value={registerData.password}
                                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                                  placeholder="Mật khẩu"
                                  required
                                    autoComplete="new-password"
                                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-red-500"
                                />
                              </div>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                  type="password"
                                  value={registerData.confirmPassword}
                                  onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                                  placeholder="Xác nhận mật khẩu"
                                  required
                                    autoComplete="new-password"
                                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-red-500"
                                />
                              </div>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                  type="tel"
                                  value={registerData.phone}
                                  onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                                  placeholder="Số điện thoại"
                                    autoComplete="tel"
                                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-red-500"
                                />
                            </div>
                            {registerError && (
                              <div className="text-red-500 text-sm">{registerError}</div>
                            )}
                            <button
                              type="submit"
                              className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition duration-200"
                            >
                              Đăng ký
                            </button>
                            <div className="text-center text-sm text-gray-600">
                              Đã có tài khoản?{' '}
                              <button
                                type="button"
                                onClick={() => setIsLoginForm(true)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Đăng nhập
                              </button>
                            </div>
                          </form>
                      )}
                    </div>
                  )}
                    </motion.div>
                )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
    </header>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </>
  );
} 