import { describe, expect, it } from 'vitest'
import { afterAuthPath, connectPath, inviteFromSearch, safeNextPath } from './invite-handoff'

describe('invite hand-off through sign-in and sign-up', () => {
  it('reads and normalises the code from the query', () => {
    expect(inviteFromSearch('?invite=abcde-fghjk')).toBe('ABCDEFGHJK')
    expect(inviteFromSearch('?invite=123456')).toBeNull()
    expect(inviteFromSearch('?other=1')).toBeNull()
  })
  it('routes through the dashboard to the Connections tab', () => {
    expect(afterAuthPath('ABCDEFGHJK')).toBe('/dashboard?invite=ABCDEFGHJK')
    expect(afterAuthPath(null)).toBe('/dashboard')
    expect(connectPath('ABCDEFGHJK')).toBe('/profile?tab=connections&code=ABCDEFGHJK')
  })
  it('continues only to same-site paths', () => {
    expect(safeNextPath('/dashboard?invite=ABCDEFGHJK')).toBe('/dashboard?invite=ABCDEFGHJK')
    expect(safeNextPath('//evil.example')).toBe('/dashboard')
    expect(safeNextPath(String.raw`/\evil.example`)).toBe('/dashboard')
    expect(safeNextPath('https://evil.example')).toBe('/dashboard')
    expect(safeNextPath(null)).toBe('/dashboard')
  })
})
