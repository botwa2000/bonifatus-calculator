const APPLE_STORE_URL = 'https://apps.apple.com/app/id6761691648'
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.bonifatus.app'

function AppleStoreBadge({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="135"
      height="40"
      viewBox="0 0 135 40"
      role="img"
      aria-label="Download on the App Store"
    >
      <rect width="135" height="40" rx="7" fill="#000" />
      <rect x="0.5" y="0.5" width="134" height="39" rx="6.5" stroke="rgba(255,255,255,0.2)" />
      {/* Apple logo */}
      <path
        fill="#fff"
        d="M19.1 20.3c0-2.7 2.2-4 2.3-4.1-1.3-1.9-3.2-2.1-3.9-2.2-1.6-.2-3.2 1-4 1s-2.1-1-3.5-1c-1.8 0-3.4 1-4.3 2.6-1.9 3.2-.5 8 1.3 10.6.9 1.3 1.9 2.7 3.3 2.6 1.3 0 1.8-.8 3.4-.8s2 .8 3.4.8c1.4 0 2.3-1.3 3.2-2.6.6-.9 1-1.8 1.3-2.8-.1-.1-2.5-1-2.5-3.8zM16.6 12.6c.7-.9 1.2-2.2 1.1-3.4-1.1 0-2.4.7-3.1 1.6-.7.8-1.3 2-1.1 3.3 1.2 0 2.4-.7 3.1-1.5z"
      />
      {/* Text */}
      <text
        x="31"
        y="14"
        fill="rgba(255,255,255,0.7)"
        fontSize="9"
        fontFamily="-apple-system,sans-serif"
      >
        Download on the
      </text>
      <text
        x="31"
        y="28"
        fill="#fff"
        fontSize="17"
        fontFamily="-apple-system,sans-serif"
        fontWeight="600"
        letterSpacing="-0.3"
      >
        App Store
      </text>
    </svg>
  )
}

function GooglePlayBadge({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="152"
      height="45"
      viewBox="0 0 152 45"
      role="img"
      aria-label="Get it on Google Play"
    >
      <rect width="152" height="45" rx="7" fill="#000" />
      <rect x="0.5" y="0.5" width="151" height="44" rx="6.5" stroke="rgba(255,255,255,0.2)" />
      {/* Google Play triangle icon */}
      <path fill="#EA4335" d="M10 10l13 12.5L10 35V10z" />
      <path fill="#FBBC04" d="M10 35l13-12.5 6.5 6.5L10 35z" />
      <path fill="#34A853" d="M29.5 22.5L23 29l-13 6 19.5-12.5z" />
      <path fill="#4285F4" d="M10 10l19.5 12.5L23 16 10 10z" />
      {/* Text */}
      <text
        x="40"
        y="18"
        fill="rgba(255,255,255,0.7)"
        fontSize="9"
        fontFamily="-apple-system,sans-serif"
      >
        GET IT ON
      </text>
      <text
        x="40"
        y="34"
        fill="#fff"
        fontSize="18"
        fontFamily="-apple-system,sans-serif"
        fontWeight="500"
      >
        Google Play
      </text>
    </svg>
  )
}

interface AppStoreBadgesProps {
  label?: string
  className?: string
}

export function AppStoreBadges({ label, className = '' }: AppStoreBadgesProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>}
      <div className="flex flex-wrap gap-3 items-center">
        <a
          href={APPLE_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Download Bonifatus on the App Store"
          className="transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg"
        >
          <AppleStoreBadge />
        </a>
        <a
          href={GOOGLE_PLAY_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Get Bonifatus on Google Play"
          className="transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg"
        >
          <GooglePlayBadge />
        </a>
      </div>
    </div>
  )
}
