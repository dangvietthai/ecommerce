import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export const useAdmin = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // Lấy session hiện tại
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('❌ No session found');
          window.location.href = '/';
          return;
        }

        // Kiểm tra role trong bảng users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('email', session.user.email)
          .single();

        if (userError || !userData) {
          console.log('❌ Error fetching user data:', userError);
          window.location.href = '/';
          return;
        }

        if (userData.role.toLowerCase() !== 'admin') {
          console.log('❌ User is not admin');
          window.location.href = '/';
          return;
        }

        console.log('✅ User is admin');
        setIsAdmin(true);
      } catch (error) {
        console.error('❌ Error checking admin status:', error);
        window.location.href = '/';
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  return { isAdmin, isLoading };
}; 