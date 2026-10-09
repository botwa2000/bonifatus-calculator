import { getFormatter, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { DJI_ALLOWANCE_TABLE, type AllowanceEntry } from '@/lib/tools/allowance-table'
import type { RatgeberArticle, RatgeberBlock } from '@/content/ratgeber/types'
import { RichText } from './RichText'

const tableClass = 'w-full text-sm'
const thClass =
  'px-4 py-3 text-left font-semibold text-neutral-700 dark:text-neutral-200 bg-neutral-50 dark:bg-neutral-800'
const tdClass =
  'px-4 py-2.5 border-t border-neutral-100 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'

function TableFrame({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <figure className="my-6">
      <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700">
        {children}
      </div>
      {note && (
        <figcaption className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          <RichText text={note} />
        </figcaption>
      )}
    </figure>
  )
}

async function DjiAllowanceTable({ note }: { note?: string }) {
  const t = await getTranslations('tools')
  const format = await getFormatter()
  const num = (v: number) => format.number(v, { maximumFractionDigits: 2 })
  const ageGroup = (row: AllowanceEntry) =>
    row.ageMin === 0
      ? t('allowanceAgeUnder', { age: row.ageMax! + 1 })
      : row.ageMax === null
        ? t('allowanceAgeFrom', { age: row.ageMin })
        : `${row.ageMin}–${row.ageMax}`

  return (
    <TableFrame note={note}>
      <table className={tableClass}>
        <thead>
          <tr>
            <th className={thClass}>{t('allowanceAgeLabel')}</th>
            <th className={thClass}>{t('allowanceTableRange')}</th>
          </tr>
        </thead>
        <tbody>
          {DJI_ALLOWANCE_TABLE.map((row) => (
            <tr key={row.ageMin}>
              <td className={tdClass}>{ageGroup(row)}</td>
              <td className={`${tdClass} tabular-nums`}>
                {t(row.period === 'week' ? 'allowanceRangePerWeek' : 'allowanceRangePerMonth', {
                  min: num(row.minEur),
                  max: num(row.maxEur),
                })}
                {row.dependentOnly && '*'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-4 py-2 text-xs text-neutral-500 dark:text-neutral-400 border-t border-neutral-100 dark:border-neutral-700">
        {t('allowanceDependentNote')}
      </p>
    </TableFrame>
  )
}

function Cta({ cta }: { cta: RatgeberArticle['cta'] }) {
  return (
    <aside className="my-10 rounded-2xl bg-gradient-to-r from-primary-600 to-secondary-600 p-6 sm:p-8 text-white">
      <p className="text-lg font-bold mb-2">{cta.title}</p>
      <p className="opacity-90 mb-5">{cta.text}</p>
      <Link
        href={cta.href}
        className="inline-block px-6 py-3 bg-white text-primary-700 rounded-lg font-semibold hover:shadow-xl transition-all"
      >
        {cta.button}
      </Link>
    </aside>
  )
}

export function RatgeberBlocks({
  blocks,
  cta,
}: {
  blocks: RatgeberBlock[]
  cta: RatgeberArticle['cta']
}) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'p':
            return (
              <p key={i} className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
                <RichText text={block.text} />
              </p>
            )
          case 'ul':
          case 'ol': {
            const List = block.type
            return (
              <List
                key={i}
                className={`${block.type === 'ul' ? 'list-disc' : 'list-decimal'} pl-6 space-y-2 mb-5 text-neutral-700 dark:text-neutral-300 leading-relaxed marker:text-primary-500`}
              >
                {block.items.map((item, j) => (
                  <li key={j}>
                    <RichText text={item} />
                  </li>
                ))}
              </List>
            )
          }
          case 'table':
            return (
              <TableFrame key={i} note={block.note}>
                <table className={tableClass}>
                  <thead>
                    <tr>
                      {block.head.map((h) => (
                        <th key={h} className={thClass}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr key={r}>
                        {row.map((cell, c) => (
                          <td key={c} className={tdClass}>
                            <RichText text={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableFrame>
            )
          case 'callout':
            return (
              <div
                key={i}
                className="my-6 rounded-xl border-l-4 border-primary-500 bg-primary-50 dark:bg-primary-900/20 px-5 py-4 text-neutral-800 dark:text-neutral-200"
              >
                <RichText text={block.text} />
              </div>
            )
          case 'djiAllowanceTable':
            return <DjiAllowanceTable key={i} note={block.note} />
          case 'cta':
            return <Cta key={i} cta={cta} />
        }
      })}
    </>
  )
}
