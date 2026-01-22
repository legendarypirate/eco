/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure CSS is properly processed
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Ensure CSS files are included in the build
  productionBrowserSourceMaps: false,
  // Compress output
  compress: true,
}

module.exports = nextConfig
