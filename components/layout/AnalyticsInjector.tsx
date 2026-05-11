import { createPublicClient } from '@/lib/supabase/public-client'
import Script from 'next/script'

/**
 * Server component that reads Google Analytics / GTM / Meta Pixel IDs from
 * site_settings and injects the appropriate script tags.
 * Renders nothing when IDs are blank or not configured.
 */
export default async function AnalyticsInjector() {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['google_analytics_id', 'google_tag_manager_id', 'facebook_pixel_id'])

  const s = Object.fromEntries((data ?? []).map((r) => [r.key, (r.value ?? '').trim()]))

  const gaId  = s.google_analytics_id
  const gtmId = s.google_tag_manager_id
  const pixelId = s.facebook_pixel_id

  return (
    <>
      {/* Google Tag Manager */}
      {gtmId && (
        <>
          <Script
            id="gtm-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`,
            }}
          />
        </>
      )}

      {/* Google Analytics 4 (direct, if no GTM) */}
      {gaId && !gtmId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script
            id="ga4-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}');`,
            }}
          />
        </>
      )}

      {/* Meta / Facebook Pixel */}
      {pixelId && (
        <Script
          id="fb-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${pixelId}');fbq('track','PageView');`,
          }}
        />
      )}
    </>
  )
}
