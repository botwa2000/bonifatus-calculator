'use client'

import { useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

export function ContactForm() {
  const t = useTranslations('contact')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      })

      if (!res.ok) {
        throw new Error('Failed')
      }

      setSuccess(true)
      setName('')
      setEmail('')
      setSubject('')
      setMessage('')
    } catch {
      setError(t('errorMessage'))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {/* Contact Form */}
      <div className="md:col-span-2 bg-white dark:bg-neutral-800 rounded-2xl shadow-card p-8">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">
          {t('formTitle')}
        </h2>

        {success ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-100 dark:bg-success-900/30 mb-4">
              <svg
                className="w-8 h-8 text-success-600 dark:text-success-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              {t('successTitle')}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-300">{t('successDesc')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {t('nameLabel')}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('namePlaceholder')}
                  className="w-full rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {t('emailLabel')}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  className="w-full rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('subjectLabel')}
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t('subjectPlaceholder')}
                className="w-full rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('messageLabel')}
              </label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('messagePlaceholder')}
                className="w-full rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none resize-none"
              />
            </div>

            {error && (
              <div className="text-sm text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900/20 rounded-lg px-4 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 px-8 py-3 font-semibold text-white shadow-button hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              {sending ? t('sending') : t('sendButton')}
            </button>
          </form>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            {t('infoTitle')}
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                {t('emailDirect')}
              </p>
              <a
                href="mailto:info@bonifatus.com"
                className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-semibold"
              >
                info@bonifatus.com
              </a>
            </div>

            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                {t('addressTitle')}
              </p>
              <p className="text-neutral-700 dark:text-neutral-300 text-sm">{t('address')}</p>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('responseTime')}</p>
          </div>
        </div>

        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-6">
          <p className="text-sm text-primary-800 dark:text-primary-200">{t('privacyNote')}</p>
        </div>
      </div>

      {/* CTA - full width */}
      <div className="md:col-span-3 text-center bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-white mb-3">{t('ctaTitle')}</h2>
        <p className="text-white/90 mb-6">{t('ctaDesc')}</p>
        <Link
          href="/register"
          className="inline-block rounded-xl bg-white px-8 py-3 font-semibold text-primary-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        >
          {t('signUpFree')}
        </Link>
      </div>
    </div>
  )
}
