import { Fragment, type ReactNode } from 'react'
import { Link } from '@/i18n/navigation'

// Renders the inline markup of Ratgeber content (see content/ratgeber/types.ts) as React
// elements — no raw HTML is ever injected.
const TOKEN = /\*\*(.+?)\*\*|\[\^(\d+)\]|\[([^\]]+)\]\(([^)\s]+)\)/g

export function sourceAnchor(n: number) {
  return `quelle-${n}`
}

export function RichText({ text }: { text: string }) {
  const nodes: ReactNode[] = []
  let last = 0
  for (const match of text.matchAll(TOKEN)) {
    const [whole, bold, citation, linkText, href] = match
    const index = match.index ?? 0
    if (index > last) nodes.push(text.slice(last, index))
    const key = `${index}`
    if (bold !== undefined) {
      nodes.push(
        <strong key={key} className="font-semibold text-neutral-900 dark:text-white">
          {bold}
        </strong>
      )
    } else if (citation !== undefined) {
      nodes.push(
        <sup key={key}>
          <a
            href={`#${sourceAnchor(Number(citation))}`}
            className="text-primary-600 dark:text-primary-400 hover:underline"
          >
            [{citation}]
          </a>
        </sup>
      )
    } else if (href.startsWith('/')) {
      nodes.push(
        <Link
          key={key}
          href={href}
          className="text-primary-600 dark:text-primary-400 underline underline-offset-2 hover:text-primary-700"
        >
          {linkText}
        </Link>
      )
    } else {
      nodes.push(
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 dark:text-primary-400 underline underline-offset-2 hover:text-primary-700"
        >
          {linkText}
        </a>
      )
    }
    last = index + whole.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return <Fragment>{nodes}</Fragment>
}

/** Plain text with markup stripped — for meta tags and JSON-LD. */
export function plainText(text: string): string {
  return text
    .replace(/\[\^\d+\]/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)\s]+\)/g, '$1')
}
