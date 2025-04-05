'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function PaymentResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    const vnpResponseCode = searchParams.get('vnp_ResponseCode');
    if (vnpResponseCode === '00') {
      setStatus('success');
    } else {
      setStatus('error');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {status === 'success' ? (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Thanh toán thành công!
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Cảm ơn bạn đã mua hàng tại LocalShop
              </p>
            </>
          ) : status === 'error' ? (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Thanh toán thất bại
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Đã có lỗi xảy ra trong quá trình thanh toán
              </p>
            </>
          ) : (
            <div className="animate-pulse">
              <div className="mx-auto h-12 w-12 rounded-full bg-gray-200"></div>
              <div className="mt-6 h-8 w-48 mx-auto bg-gray-200 rounded"></div>
              <div className="mt-2 h-4 w-64 mx-auto bg-gray-200 rounded"></div>
            </div>
          )}
        </div>

        <div className="mt-8 space-y-4">
          <Link
            href="/"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Về trang chủ
          </Link>
          {status === 'success' && (
            <Link
              href="/orders"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Xem đơn hàng
            </Link>
          )}
        </div>
      </div>
    </div>
  );
} 