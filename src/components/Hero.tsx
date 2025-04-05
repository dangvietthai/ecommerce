import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Hero() {
  return (
    <div className="relative">
      {/* Main Slider */}
      <div className="relative h-[500px] overflow-hidden">
        <Image
          src="/images/hero-1.jpg"
          alt="Hero Image"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Chào mừng đến với LocalShop
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              Khám phá các sản phẩm chất lượng với giá tốt nhất
            </p>
            <button className="bg-red-600 text-white px-8 py-3 rounded-full hover:bg-red-700 transition-colors">
              Mua sắm ngay
            </button>
          </div>
        </div>
      </div>

      {/* Slider Controls */}
      <button className="absolute left-4 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100">
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button className="absolute right-4 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100">
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Slider Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        <button className="w-3 h-3 rounded-full bg-white"></button>
        <button className="w-3 h-3 rounded-full bg-white/50"></button>
        <button className="w-3 h-3 rounded-full bg-white/50"></button>
      </div>
    </div>
  );
} 