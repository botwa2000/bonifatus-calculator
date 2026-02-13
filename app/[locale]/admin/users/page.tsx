'use client'

import { useEffect, useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'

type User = {
  id: string
  fullName: string
  email: string
  role: string
  emailVerified: string | null
  createdAt: string
  isActive: boolean
  termsCount: number
  connectionsCount: number
}

export default function AdminUsersPage() {
  const t = useTranslations('admin')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<'fullName' | 'createdAt' | 'termsCount'>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((d) => setUsers(d.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let result = users
    if (roleFilter !== 'all') {
      result = result.filter((u) => u.role === roleFilter)
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      )
    }
    result.sort((a, b) => {
      let cmp = 0
      if (sortField === 'fullName') cmp = a.fullName.localeCompare(b.fullName)
      else if (sortField === 'createdAt')
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      else cmp = a.termsCount - b.termsCount
      return sortDir === 'desc' ? -cmp : cmp
    })
    return result
  }, [users, search, roleFilter, sortField, sortDir])

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-neutral-500 dark:text-neutral-400">{t('loadingUsers')}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-white">
        {t('usersTitle')}
      </h1>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
        >
          <option value="all">{t('allRoles')}</option>
          <option value="parent">{t('parentRole')}</option>
          <option value="child">{t('childRole')}</option>
          <option value="admin">{t('adminRole')}</option>
        </select>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          {t('userCount', { count: filtered.length })}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50">
            <tr>
              <SortHeader
                label={t('name')}
                field="fullName"
                current={sortField}
                dir={sortDir}
                onSort={toggleSort}
              />
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">
                {t('email')}
              </th>
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">
                {t('role')}
              </th>
              <SortHeader
                label={t('joined')}
                field="createdAt"
                current={sortField}
                dir={sortDir}
                onSort={toggleSort}
              />
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">
                {t('verified')}
              </th>
              <SortHeader
                label={t('terms')}
                field="termsCount"
                current={sortField}
                dir={sortDir}
                onSort={toggleSort}
              />
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300">
                {t('connections')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30">
                <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">
                  {u.fullName}
                </td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{u.email}</td>
                <td className="px-4 py-3">
                  <RoleBadge role={u.role} />
                </td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${u.emailVerified ? 'bg-green-500' : 'bg-yellow-500'}`}
                  />
                </td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{u.termsCount}</td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                  {u.connectionsCount}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                  {t('noUsers')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SortHeader({
  label,
  field,
  current,
  dir,
  onSort,
}: {
  label: string
  field: 'fullName' | 'createdAt' | 'termsCount'
  current: string
  dir: string
  onSort: (f: 'fullName' | 'createdAt' | 'termsCount') => void
}) {
  return (
    <th
      className="cursor-pointer px-4 py-3 font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
      onClick={() => onSort(field)}
    >
      {label} {current === field ? (dir === 'asc' ? '\u2191' : '\u2193') : ''}
    </th>
  )
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    parent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    child: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  }
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${colors[role] ?? 'bg-neutral-100 text-neutral-700'}`}
    >
      {role}
    </span>
  )
}
