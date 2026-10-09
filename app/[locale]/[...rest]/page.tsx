import { notFound } from 'next/navigation'

// Any path inside a locale that no route matches renders the localized not-found page
// with a real 404 status (instead of falling through to the root not-found).
export default function CatchAllPage() {
  notFound()
}
