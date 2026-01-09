/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure CSS is properly processed
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

module.exports = nextConfig
