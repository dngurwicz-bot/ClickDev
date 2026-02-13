/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Prevent Turbopack from inferring the monorepo root and missing frontend/.env.local
  turbopack: {
    root: __dirname,
  },
}

module.exports = nextConfig
