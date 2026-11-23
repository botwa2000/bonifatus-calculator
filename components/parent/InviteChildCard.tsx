'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { QRCodeSVG } from 'qrcode.react'
import type { Invite } from '@/hooks/useParentData'

type Props = {
  /** Newest pending, unexpired invite, if the parent already has one. */
  existing: Invite | null
  onCreate: () => Promise<Invite | null>
}

/**
 * Parent dashboard while no child is linked: create an invite and send it.
 * The parent lands here right after sign-up, so this is the first thing they see.
 * Sharing or copying the link sends `invite_share` (/admin/stats → Family invites).
 */
export function InviteChildCard({ existing, onCreate }: Props) {
  const t = useTranslations('parent')
  const locale = useLocale()
  const [created, setCreated] = useState<Invite | null>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [copied, setCopied] = useState(false)
  // Known only in the browser; set after mount so server and client HTML match.
  const [canShare, setCanShare] = useState(false)
  useEffect(() => setCanShare(typeof navigator.share === 'function'), [])

  const invite = created ?? existing
  const url = invite ? `${window.location.origin}/${locale}/invite?code=${invite.code}` : ''

  const create = async () => {
    setBusy(true)
    setFailed(false)
    const inv = await onCreate()
    setBusy(false)
    if (inv) setCreated(inv)
    else setFailed(true)
  }

  const track = (mode: 'share' | 'copy') =>
    window.bonifatusTrack?.('invite_share', { mode, source: 'home' })

  const share = async () => {
    if (!invite) return
    try {
      await navigator.share({
        title: t('inviteShareTitle'),
        text: t('inviteShareText', { url, code: invite.code }),
      })
      track('share')
    } catch {
      // Dismissed by the parent: nothing was sent.
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      track('copy')
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="rounded-2xl border border-primary-200 dark:border-neutral-700 bg-primary-50/60 dark:bg-neutral-800/60 p-5 sm:p-6 space-y-4">
      <div>
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
          {t('inviteCardTitle')}
        </h3>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{t('inviteCardBody')}</p>
      </div>

      {invite ? (
        <div className="flex flex-col sm:flex-row gap-5 sm:items-center">
          <div className="self-center rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white p-3">
            <QRCodeSVG value={url} size={140} />
          </div>
          <div className="flex-1 space-y-3">
            <p className="text-3xl font-bold tracking-widest text-primary-700 dark:text-primary-300">
              {invite.code}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {t('shareCode', { date: new Date(invite.expiresAt).toLocaleString(locale) })}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              {canShare && (
                <button
                  onClick={share}
                  className="rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 px-4 py-2 text-sm font-semibold text-white shadow-button"
                >
                  {t('inviteShare')}
                </button>
              )}
              <button
                onClick={copy}
                className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-800 dark:text-white"
              >
                {copied ? t('inviteLinkCopied') : t('inviteCopyLink')}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={create}
          disabled={busy}
          className="inline-flex justify-center rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-button disabled:opacity-60"
        >
          {busy ? t('generating') : t('inviteChild')}
        </button>
      )}

      {failed && (
        <p role="alert" className="text-sm text-error-700 dark:text-error-300">
          {t('inviteFailed')}
        </p>
      )}
    </div>
  )
}
