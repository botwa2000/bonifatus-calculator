'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'

type AccountDetails = Record<string, unknown>

type PaymentAccount = {
  id: string
  userId: string
  accountType: string
  accountDetails: AccountDetails
  isDefault: boolean
  label: string | null
  createdAt: string
}

type AccountType = 'bank' | 'paypal' | 'wero'

const CARD_CLASS =
  'rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm'
const INPUT_CLASS =
  'rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white outline-none focus:border-primary-500 transition-colors w-full'
const BTN_PRIMARY =
  'bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed'
const BTN_GHOST =
  'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-medium px-3 py-2 rounded-lg text-sm transition-colors'
const BTN_DANGER =
  'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium px-3 py-2 rounded-lg text-sm transition-colors'

function AccountTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'bank':
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"
          />
        </svg>
      )
    case 'paypal':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944 2.22A.956.956 0 015.886 1.5h5.888c3.498 0 5.604 1.867 5.258 5.192-.44 4.237-3.19 6.013-6.506 6.013H8.78a.58.58 0 00-.573.487L7.076 21.337z" />
        </svg>
      )
    case 'wero':
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
          />
        </svg>
      )
    default:
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
          />
        </svg>
      )
  }
}

function maskDetail(value: unknown): string {
  const str = String(value || '')
  if (str.length <= 4) return str
  return '****' + str.slice(-4)
}

function getDisplayDetails(type: string, details: AccountDetails): string {
  switch (type) {
    case 'bank':
      return details.iban ? maskDetail(details.iban) : ''
    case 'paypal':
      return details.email ? maskDetail(details.email) : ''
    case 'wero':
      return details.phone
        ? maskDetail(details.phone)
        : details.email
          ? maskDetail(details.email)
          : ''
    default:
      return ''
  }
}

export function PaymentAccountManager() {
  const t = useTranslations('parent')

  const [accounts, setAccounts] = useState<PaymentAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formType, setFormType] = useState<AccountType>('bank')
  const [formLabel, setFormLabel] = useState('')
  const [formIsDefault, setFormIsDefault] = useState(false)
  // Bank fields
  const [formIban, setFormIban] = useState('')
  const [formBic, setFormBic] = useState('')
  const [formHolder, setFormHolder] = useState('')
  // PayPal fields
  const [formPaypalEmail, setFormPaypalEmail] = useState('')
  // Wero fields
  const [formWeroPhone, setFormWeroPhone] = useState('')
  const [formWeroEmail, setFormWeroEmail] = useState('')

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/payments/accounts')
      const data = await res.json()
      if (data.success) {
        setAccounts(data.accounts)
      } else {
        setError(data.error || 'Failed to load accounts')
      }
    } catch {
      setError('Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const resetForm = () => {
    setFormType('bank')
    setFormLabel('')
    setFormIsDefault(false)
    setFormIban('')
    setFormBic('')
    setFormHolder('')
    setFormPaypalEmail('')
    setFormWeroPhone('')
    setFormWeroEmail('')
    setShowForm(false)
  }

  const handleAdd = async () => {
    setSaving(true)
    setError(null)

    let accountDetails: AccountDetails = {}
    switch (formType) {
      case 'bank':
        accountDetails = { iban: formIban, bic: formBic, holder: formHolder }
        break
      case 'paypal':
        accountDetails = { email: formPaypalEmail }
        break
      case 'wero':
        accountDetails = { phone: formWeroPhone, email: formWeroEmail }
        break
    }

    try {
      const res = await fetch('/api/payments/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountType: formType,
          accountDetails,
          label: formLabel || undefined,
          isDefault: formIsDefault,
        }),
      })

      const data = await res.json()
      if (data.success) {
        resetForm()
        fetchAccounts()
      } else {
        setError(data.error || 'Failed to add account')
      }
    } catch {
      setError('Failed to add account')
    } finally {
      setSaving(false)
    }
  }

  const handleSetDefault = async (accountId: string) => {
    try {
      // We re-create the account as default. A simpler approach is a dedicated endpoint,
      // but the spec only has POST/DELETE. We'll delete then re-create with isDefault.
      // Actually, let's use a PATCH-like approach via POST + DELETE:
      // Simpler: just POST a new update. But the API doesn't have PATCH.
      // For now, we delete all defaults and re-POST. But that loses data.
      // Better approach: we should update directly in DB. Let's make a direct call.
      // Since our API doesn't have a PATCH, let's do a transaction via a custom fetch.
      // We'll just re-fetch after toggling. Actually the simplest way within the given API
      // is to delete the old account and re-create it as default. But that changes the ID.
      // Let's implement a client-side workaround: delete + re-create with same details.

      const account = accounts.find((a) => a.id === accountId)
      if (!account) return

      // Delete old
      await fetch('/api/payments/accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      })

      // Re-create as default
      await fetch('/api/payments/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountType: account.accountType,
          accountDetails: account.accountDetails,
          label: account.label || undefined,
          isDefault: true,
        }),
      })

      fetchAccounts()
    } catch {
      setError('Failed to set default account')
    }
  }

  const handleDelete = async (accountId: string) => {
    try {
      const res = await fetch('/api/payments/accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      })

      const data = await res.json()
      if (data.success) {
        setAccounts((prev) => prev.filter((a) => a.id !== accountId))
      } else {
        setError(data.error || 'Failed to delete account')
      }
    } catch {
      setError('Failed to delete account')
    }
  }

  const accountTypeLabels: Record<AccountType, string> = {
    bank: t('payoutBank'),
    paypal: 'PayPal',
    wero: 'Wero',
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
          {t('paymentAccounts')}
        </h3>
        {!showForm && (
          <button type="button" onClick={() => setShowForm(true)} className={BTN_PRIMARY}>
            {t('addAccount')}
          </button>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-2 font-medium underline"
          >
            {t('dismiss')}
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className={CARD_CLASS}>
          <div className="flex items-center justify-center py-8">
            <svg
              className="animate-spin h-5 w-5 text-primary-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="ml-2 text-sm text-neutral-500 dark:text-neutral-400">
              {t('loading')}
            </span>
          </div>
        </div>
      )}

      {/* Account cards */}
      {!loading && accounts.length === 0 && !showForm && (
        <div className={CARD_CLASS}>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
            {t('noAccounts')}
          </p>
        </div>
      )}

      {!loading &&
        accounts.map((account) => (
          <div key={account.id} className={CARD_CLASS}>
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                <AccountTypeIcon type={account.accountType} />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-900 dark:text-white text-sm">
                    {account.label ||
                      accountTypeLabels[account.accountType as AccountType] ||
                      account.accountType}
                  </span>
                  {account.isDefault && (
                    <span className="inline-block rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 text-xs font-medium">
                      {t('default')}
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {accountTypeLabels[account.accountType as AccountType] || account.accountType}
                  {' \u00b7 '}
                  {getDisplayDetails(account.accountType, account.accountDetails)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {!account.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(account.id)}
                    className={BTN_GHOST}
                    title={t('setDefault')}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                      />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(account.id)}
                  className={BTN_DANGER}
                  title={t('deleteAccount')}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}

      {/* Add account form */}
      {showForm && (
        <div className={CARD_CLASS}>
          <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 mb-4">
            {t('addAccount')}
          </h4>

          <div className="space-y-4">
            {/* Account type selector */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('accountType')}
              </label>
              <div className="flex gap-2">
                {(['bank', 'paypal', 'wero'] as AccountType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormType(type)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formType === type
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-700'
                        : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-750'
                    }`}
                  >
                    <AccountTypeIcon type={type} />
                    {accountTypeLabels[type]}
                  </button>
                ))}
              </div>
            </div>

            {/* Label */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('accountLabel')}
              </label>
              <input
                type="text"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder={t('accountLabelPlaceholder')}
                className={INPUT_CLASS}
              />
            </div>

            {/* Type-specific fields */}
            {formType === 'bank' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    IBAN
                  </label>
                  <input
                    type="text"
                    value={formIban}
                    onChange={(e) => setFormIban(e.target.value)}
                    placeholder="DE89 3704 0044 0532 0130 00"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    BIC
                  </label>
                  <input
                    type="text"
                    value={formBic}
                    onChange={(e) => setFormBic(e.target.value)}
                    placeholder="COBADEFFXXX"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    {t('accountHolder')}
                  </label>
                  <input
                    type="text"
                    value={formHolder}
                    onChange={(e) => setFormHolder(e.target.value)}
                    placeholder={t('accountHolderPlaceholder')}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            )}

            {formType === 'paypal' && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {t('paypalEmail')}
                </label>
                <input
                  type="email"
                  value={formPaypalEmail}
                  onChange={(e) => setFormPaypalEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={INPUT_CLASS}
                />
              </div>
            )}

            {formType === 'wero' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    {t('weroPhone')}
                  </label>
                  <input
                    type="tel"
                    value={formWeroPhone}
                    onChange={(e) => setFormWeroPhone(e.target.value)}
                    placeholder="+49 170 1234567"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    {t('weroEmail')}
                  </label>
                  <input
                    type="email"
                    value={formWeroEmail}
                    onChange={(e) => setFormWeroEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            )}

            {/* Default toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formIsDefault}
                onChange={(e) => setFormIsDefault(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                {t('setAsDefault')}
              </span>
            </label>

            {/* Form actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={resetForm} className={BTN_GHOST}>
                {t('cancel')}
              </button>
              <button type="button" onClick={handleAdd} disabled={saving} className={BTN_PRIMARY}>
                {saving ? t('saving') : t('addAccount')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
