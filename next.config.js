/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'sbfwbfmieertcddmylgy.supabase.co',
      'devthai23.info.vn'
    ],
  },
  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: '/:path*',
      },
    ]
  },
}

module.exports = nextConfig 