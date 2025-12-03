/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['gateway.pinata.cloud', 'ipfs.io'],
  },
  env: {
    BASE_RPC_URL: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
  },
}

module.exports = nextConfig

