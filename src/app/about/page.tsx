'use client';

import { Award, Target, Users, Heart } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function AboutPage() {
  return (
    <main>
      {/* About Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="text-sm text-gray-600 mb-6">
            <a href="/" className="hover:text-red-600">Trang chủ</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Giới thiệu</span>
          </div>

          {/* Hero Section */}
          <motion.div 
            className="relative h-[400px] rounded-lg overflow-hidden mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <Image
              src="/images/about-hero.jpg"
              alt="LocalShop Hero"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-center text-white">
                <motion.h1 
                  className="text-4xl font-bold mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Về chúng tôi
                </motion.h1>
                <motion.p 
                  className="text-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Cung cấp sản phẩm chất lượng với giá cả hợp lý
                </motion.p>
              </div>
            </div>
          </motion.div>

          {/* Company Introduction */}
          <motion.div 
            className="max-w-3xl mx-auto text-center mb-12"
            {...fadeInUp}
          >
            <h2 className="text-3xl font-bold mb-6">Chào mừng đến với LocalShop</h2>
            <p className="text-gray-600 mb-6">
              LocalShop là một trong những đơn vị tiên phong trong lĩnh vực bán lẻ
              trực tuyến tại Việt Nam. Chúng tôi tự hào mang đến cho khách hàng
              những sản phẩm chất lượng cao với giá cả hợp lý, cùng với dịch vụ
              chăm sóc khách hàng tận tâm.
            </p>
            <p className="text-gray-600">
              Với đội ngũ nhân viên trẻ trung, năng động và chuyên nghiệp,
              chúng tôi luôn nỗ lực không ngừng để mang đến trải nghiệm mua sắm
              tốt nhất cho khách hàng.
            </p>
          </motion.div>

          {/* Features Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.div 
              className="bg-white rounded-lg shadow-md p-6 text-center"
              variants={fadeInUp}
            >
              <Award className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Chất lượng</h3>
              <p className="text-gray-600">
                Sản phẩm được kiểm tra kỹ lưỡng trước khi đến tay khách hàng
              </p>
            </motion.div>
            <motion.div 
              className="bg-white rounded-lg shadow-md p-6 text-center"
              variants={fadeInUp}
            >
              <Target className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Mục tiêu</h3>
              <p className="text-gray-600">
                Trở thành đơn vị bán lẻ trực tuyến hàng đầu Việt Nam
              </p>
            </motion.div>
            <motion.div 
              className="bg-white rounded-lg shadow-md p-6 text-center"
              variants={fadeInUp}
            >
              <Users className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Đội ngũ</h3>
              <p className="text-gray-600">
                Nhân viên trẻ trung, năng động và chuyên nghiệp
              </p>
            </motion.div>
            <motion.div 
              className="bg-white rounded-lg shadow-md p-6 text-center"
              variants={fadeInUp}
            >
              <Heart className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Tận tâm</h3>
              <p className="text-gray-600">
                Luôn đặt lợi ích và trải nghiệm của khách hàng lên hàng đầu
              </p>
            </motion.div>
          </motion.div>

          {/* Team Section */}
          <motion.div 
            className="text-center mb-12"
            {...fadeInUp}
          >
            <h2 className="text-3xl font-bold mb-8">Đội ngũ của chúng tôi</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: 'Nguyễn Văn A',
                  position: 'Giám đốc điều hành',
                  image: '/images/team/member1.jpg',
                  description: 'Với hơn 10 năm kinh nghiệm trong lĩnh vực bán lẻ trực tuyến.'
                },
                {
                  name: 'Trần Thị B',
                  position: 'Giám đốc Marketing',
                  image: '/images/team/member2.jpg',
                  description: 'Chuyên gia marketing với nhiều chiến dịch thành công.'
                },
                {
                  name: 'Lê Văn C',
                  position: 'Giám đốc Kinh doanh',
                  image: '/images/team/member3.jpg',
                  description: 'Điều hành và phát triển chiến lược kinh doanh.'
                }
              ].map((member, index) => (
                <motion.div 
                  key={index}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                  variants={fadeInUp}
                >
                  <div className="relative aspect-square">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                    <p className="text-gray-600 mb-2">{member.position}</p>
                    <p className="text-sm text-gray-500">
                      {member.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Values Section */}
          <motion.div 
            className="bg-gray-50 rounded-lg p-8"
            {...fadeInUp}
          >
            <h2 className="text-3xl font-bold text-center mb-8">
              Giá trị cốt lõi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <motion.div 
                className="bg-white p-6 rounded-lg shadow-md"
                variants={fadeInUp}
              >
                <h3 className="text-xl font-bold mb-4">Chất lượng</h3>
                <p className="text-gray-600">
                  Chúng tôi cam kết mang đến những sản phẩm chất lượng cao nhất
                  cho khách hàng.
                </p>
              </motion.div>
              <motion.div 
                className="bg-white p-6 rounded-lg shadow-md"
                variants={fadeInUp}
              >
                <h3 className="text-xl font-bold mb-4">Uy tín</h3>
                <p className="text-gray-600">
                  Xây dựng niềm tin với khách hàng thông qua sự trung thực và
                  minh bạch trong mọi hoạt động.
                </p>
              </motion.div>
              <motion.div 
                className="bg-white p-6 rounded-lg shadow-md"
                variants={fadeInUp}
              >
                <h3 className="text-xl font-bold mb-4">Đổi mới</h3>
                <p className="text-gray-600">
                  Không ngừng cải tiến và đổi mới để mang đến trải nghiệm tốt
                  nhất cho khách hàng.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
} 