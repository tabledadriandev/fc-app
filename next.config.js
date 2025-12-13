/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // RE-ENABLED with proper error boundaries
  images: {
    domains: [
      // Core NFT/IPFS domains
      'gateway.pinata.cloud',
      'ipfs.io',
      'imagedelivery.net',
      
      // Farcaster ecosystem
      'client.warpcast.com',
      'client.farcaster.xyz',
      'farcaster.xyz',
      'warpcast.com',
      
      // WalletConnect ecosystem
      'explorer-api.walletconnect.com',
      'walletconnect.com',
      'www.walletlink.org',
      'registry.walletconnect.com',
      
      // Privy/Auth services
      'privy.farcaster.xyz',
      'privy.warpcast.com',
      'auth.privy.io',
      
      // Analytics and monitoring
      'cloudflareinsights.com',
      
      // AI/ML services
      'api.replicate.com',
      'replicate.com',
      'image.pollinations.ai'
    ],
  },
  env: {
    BASE_RPC_URL: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
  },
  async redirects() {
    return [
      {
        source: '/.well-known/farcaster.json',
        destination:
          'https://api.farcaster.xyz/miniapps/hosted-manifest/019ae461-07e8-46c3-17cc-7824954af474',
        permanent: false, // 307/308 – use temporary so you can change later
      },
    ]
  },
  // REMOVED conflicting headers - now handled by middleware.ts for unified CSP
  webpack: (config) => {
    // Stub out optional React Native / logging dependencies that are only
    // required by MetaMask / WalletConnect in certain environments.
    // This avoids module resolution errors on Vercel while keeping the
    // browser bundle functional.
    config.resolve.alias['@react-native-async-storage/async-storage'] = false
    config.resolve.alias['pino-pretty'] = false
    
    // Add webpack Bundle Analyzer for debugging
    if (process.env.NODE_ENV === 'development' && process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(new BundleAnalyzerPlugin())
    }
    
    return config
  },
}

module.exports = nextConfig

