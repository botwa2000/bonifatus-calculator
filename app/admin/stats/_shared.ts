/** Response helpers shared by the /admin/stats page routes. */
const PAGE_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'Referrer-Policy': 'no-referrer',
}

export function page(status: number, html: string, cookies: string[] = []): Response {
  const headers = new Headers(PAGE_HEADERS)
  for (const c of cookies) headers.append('Set-Cookie', c)
  return new Response(html, { status, headers })
}

// 303 so a POSTed form lands on a GET.
export function redirect(to: string, cookies: string[] = []): Response {
  const headers = new Headers({ Location: to, 'Cache-Control': 'no-store' })
  for (const c of cookies) headers.append('Set-Cookie', c)
  return new Response(null, { status: 303, headers })
}
