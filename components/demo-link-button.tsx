'use client'

type Props = {
  children: React.ReactNode
  className?: string
}

export function DemoLinkButton({ children, className }: Props) {
  const handleOpenDemo = () => {
    window.dispatchEvent(new CustomEvent('open-demo'))
    window.location.hash = 'demo-calculator'
    const el = document.getElementById('demo-calculator')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <button type="button" onClick={handleOpenDemo} className={className}>
      {children}
    </button>
  )
}
