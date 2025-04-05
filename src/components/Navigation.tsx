import Link from 'next/link'
import { useCartStore } from '@/store/cart'

export default function Navigation() {
  const items = useCartStore((state) => state.items)
  const itemCount = items.reduce((total, item) => total + item.quantity, 0)

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-primary">
            Local Shop
          </Link>

          <div className="flex items-center space-x-6">
            <Link href="/products" className="text-gray-600 hover:text-primary">
              Products
            </Link>
            <Link href="/categories" className="text-gray-600 hover:text-primary">
              Categories
            </Link>
            <Link href="/cart" className="text-gray-600 hover:text-primary relative">
              Cart
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
} 