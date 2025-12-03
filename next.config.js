/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['gateway.pinata.cloud', 'ipfs.io'],
  },
  env: {
    BASE_RPC_URL: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
  },
  webpack: (config) => {
    // Stub out optional React Native / logging dependencies that are only
    // required by MetaMask / WalletConnect in certain environments.
    // This avoids module resolution errors on Vercel while keeping the
    // browser bundle functional.
    config.resolve.alias['@react-native-async-storage/async-storage'] = false
    config.resolve.alias['pino-pretty'] = false
    return config
  },
}

module.exports = nextConfig

