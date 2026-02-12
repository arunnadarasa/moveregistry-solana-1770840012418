/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Static export for Vercel compatibility
  distDir: 'public', // Export to public/ directory
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig