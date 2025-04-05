import Image from 'next/image';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  discount?: number;
}

const featuredProducts: Product[] = [
  {
    id: '1',
    name: 'Bộ dụng cụ nhà bếp cao cấp',
    price: 299000,
    image: '/images/product-1.jpg',
    discount: 20,
  },
  {
    id: '2',
    name: 'Bộ chén dĩa sứ trắng',
    price: 199000,
    image: '/images/product-2.jpg',
    discount: 15,
  },
  {
    id: '3',
    name: 'Nồi chiên không dầu',
    price: 1299000,
    image: '/images/product-3.jpg',
    discount: 25,
  },
  {
    id: '4',
    name: 'Máy xay sinh tố đa năng',
    price: 899000,
    image: '/images/product-4.jpg',
    discount: 10,
  },
];

export default function FeaturedProducts() {
  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">
          Sản phẩm nổi bật
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group"
            >
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative aspect-square">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.discount && (
                    <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-full text-sm">
                      -{product.discount}%
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-red-600 transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-red-600 font-bold text-xl">
                        {product.price.toLocaleString('vi-VN')}đ
                      </span>
                      {product.discount && (
                        <span className="text-gray-500 line-through ml-2">
                          {(
                            (product.price * 100) /
                            (100 - product.discount)
                          ).toLocaleString('vi-VN')}
                          đ
                        </span>
                      )}
                    </div>
                    <button className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition-colors">
                      Mua ngay
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
} 