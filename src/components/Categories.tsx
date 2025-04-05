import Image from 'next/image';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  image: string;
  productCount: number;
}

const categories: Category[] = [
  {
    id: 'kitchen',
    name: 'Đồ dùng nhà bếp',
    image: '/images/category-kitchen.jpg',
    productCount: 150,
  },
  {
    id: 'bedroom',
    name: 'Đồ dùng phòng ngủ',
    image: '/images/category-bedroom.jpg',
    productCount: 120,
  },
  {
    id: 'bathroom',
    name: 'Đồ dùng phòng tắm',
    image: '/images/category-bathroom.jpg',
    productCount: 80,
  },
  {
    id: 'living',
    name: 'Đồ dùng phòng khách',
    image: '/images/category-living.jpg',
    productCount: 200,
  },
];

export default function Categories() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">
          Danh mục sản phẩm
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.id}`}
              className="group relative overflow-hidden rounded-lg"
            >
              <div className="relative aspect-square">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center text-white">
                  <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                  <p className="text-sm">{category.productCount} sản phẩm</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
} 