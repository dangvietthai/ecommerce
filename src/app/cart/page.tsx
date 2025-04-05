import Cart from '@/components/Cart';

export default function CartPage() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="py-8">
        <div className="text-sm text-gray-600 container mx-auto px-4">
          <a href="/" className="hover:text-red-600">Trang chủ</a>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Giỏ hàng</span>
        </div>
      </div>
      
      <Cart />
    </>
  );
} 