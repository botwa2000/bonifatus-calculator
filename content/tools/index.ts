import {
  ZEUGNISGELD_LOCALE,
  ZEUGNISGELD_PATH,
  zeugnisgeldCopy,
} from '@/content/tools/zeugnisgeld-rechner'
import {
  NOTENDURCHSCHNITT_LOCALE,
  NOTENDURCHSCHNITT_PATH,
  notendurchschnittCopy,
} from '@/content/tools/notendurchschnitt'

/** Tools that exist in one locale only (German school rules), for the index, footer and hub. */
export interface LocalTool {
  path: string
  locale: string
  name: string
  description: string
}

const LOCAL_TOOLS: readonly LocalTool[] = [
  {
    path: ZEUGNISGELD_PATH,
    locale: ZEUGNISGELD_LOCALE,
    name: zeugnisgeldCopy.shortName,
    description: zeugnisgeldCopy.shortDescription,
  },
  {
    path: NOTENDURCHSCHNITT_PATH,
    locale: NOTENDURCHSCHNITT_LOCALE,
    name: notendurchschnittCopy.shortName,
    description: notendurchschnittCopy.shortDescription,
  },
]

export function getLocalTools(locale: string): LocalTool[] {
  return LOCAL_TOOLS.filter((t) => t.locale === locale)
}
