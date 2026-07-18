import { ImageResponse } from 'next/og'
import { getPost } from '@/content/blog/registry'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const post = await getPost(locale, slug)

  const title = post?.title ?? 'Bonifatus Blog'

  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '72px',
        justifyContent: 'space-between',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '32px' }}>🎓</span>
        <span style={{ fontSize: '28px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>
          Bonifatus Blog
        </span>
      </div>

      <div>
        <p
          style={{
            fontSize: title.length > 60 ? '36px' : '44px',
            fontWeight: '800',
            color: 'white',
            lineHeight: '1.2',
            maxWidth: '900px',
          }}
        >
          {title}
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '24px',
            padding: '8px 20px',
            color: 'white',
            fontSize: '18px',
          }}
        >
          bonifatus.com
        </div>
      </div>
    </div>,
    { ...size }
  )
}
