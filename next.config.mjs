/** @type {import('next').NextConfig} */

const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Stop clickjacking
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Referrer policy
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Permissions policy — disable sensitive browser APIs we don't use
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // Basic XSS protection for older browsers
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // HSTS — only add in production (30 days)
  ...(process.env.NODE_ENV === 'production'
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }]
    : []),
  // Content-Security-Policy
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js hydration, analytics inline scripts, framer-motion inline styles need unsafe-inline
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      // Images from Supabase storage + whitelisted CDNs
      "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://images.pexels.com https://cdn.pixabay.com",
      // Media (gallery videos/audio stored in Supabase)
      "media-src 'self' https://*.supabase.co",
      // Supabase REST + Realtime WebSocket, Google Analytics beacons
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://analytics.google.com",
      // Prevent any plugins (Flash, etc.)
      "object-src 'none'",
      // Prevent base-tag injection
      "base-uri 'self'",
      // Restrict form submissions to same origin
      "form-action 'self'",
      // Prevent embedding in external iframes (mirrors X-Frame-Options)
      "frame-ancestors 'self'",
    ].join('; '),
  },
]

const inlinedSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const inlinedAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
console.log(
  '[env-check] target=%s url(len=%d, scheme=%s) anon(len=%d) service(len=%d)',
  process.env.VERCEL_ENV ?? 'local',
  (inlinedSupabaseUrl ?? '').length,
  (inlinedSupabaseUrl ?? '').slice(0, 8),
  (inlinedAnonKey ?? '').length,
  (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').length,
)

const nextConfig = {
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
      },
    ],
  },
}

export default nextConfig
