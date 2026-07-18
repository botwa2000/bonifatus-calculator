import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = "Bonifatus — Reward Your Child's Grades"
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
          }}
        >
          🎓
        </div>
        <span
          style={{
            fontSize: '56px',
            fontWeight: '800',
            color: 'white',
            letterSpacing: '-1px',
          }}
        >
          Bonifatus
        </span>
      </div>
      <p
        style={{
          fontSize: '28px',
          color: 'rgba(255,255,255,0.9)',
          textAlign: 'center',
          maxWidth: '800px',
          margin: '0',
          lineHeight: '1.4',
        }}
      >
        Reward Your Child&apos;s Grades
      </p>
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginTop: '40px',
        }}
      >
        {['Smart Rewards', 'Multi-Language', 'Free to Start'].map((tag) => (
          <div
            key={tag}
            style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '24px',
              padding: '8px 20px',
              color: 'white',
              fontSize: '18px',
            }}
          >
            {tag}
          </div>
        ))}
      </div>
    </div>,
    { ...size }
  )
}
