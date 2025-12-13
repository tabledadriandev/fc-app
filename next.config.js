/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // DISABLED to prevent React infinite loops
  images: {
    domains: [
      'gateway.pinata.cloud',
      'ipfs.io',
      'imagedelivery.net',
      'client.warpcast.com',
      'farcaster.xyz',
      'warpcast.com',
      'explorer-api.walletconnect.com',
      'privy.farcaster.xyz',
      'privy.warpcast.com',
      'auth.privy.io',
      'cloudflareinsights.com',
      'www.walletlink.org'
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
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "connect-src 'self' https://farcaster.xyz https://client.farcaster.xyz https://warpcast.com https://client.warpcast.com https://wrpcd.net https://*.wrpcd.net https://privy.farcaster.xyz https://privy.warpcast.com https://auth.privy.io https://*.rpc.privy.systems https://cloudflareinsights.com https://explorer-api.walletconnect.com https://*.walletconnect.com https://*.replicate.com https://image.pollinations.ai https://*.pollinations.ai https://www.walletlink.org wss://www.walletlink.org"
          },
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL'
          }
        ],
      },
    ]
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

