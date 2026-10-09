import { Link } from '@/i18n/navigation'

/** Visible breadcrumb trail; the last item is the current page and is not a link. */
export function Breadcrumbs({
  label,
  items,
}: {
  label: string
  items: Array<{ name: string; path: string }>
}) {
  return (
    <nav aria-label={label} className="mb-8 text-sm text-neutral-500 dark:text-neutral-400">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={item.path} className="flex items-center gap-2">
              {isLast ? (
                <span aria-current="page" className="text-neutral-700 dark:text-neutral-200">
                  {item.name}
                </span>
              ) : (
                <>
                  <Link href={item.path} className="hover:text-primary-600 hover:underline">
                    {item.name}
                  </Link>
                  <span aria-hidden="true">›</span>
                </>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
