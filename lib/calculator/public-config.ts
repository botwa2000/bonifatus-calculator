import { getCalculatorConfig } from '@/lib/db/queries/config'
import type { CalculatorConfig } from '@/components/demo-calculator'

/**
 * The public calculator config, loaded on the server so the calculator renders in the
 * HTML crawlers get. Without it the page was only "Loading settings…", which Google
 * flagged as Soft 404. Same JSON shape as /api/config/calculator (json columns are
 * untyped in the schema; dates become strings). On a query failure it returns
 * undefined: the calculator then fetches the config itself and shows its error state.
 */
export async function loadPublicCalculatorConfig(): Promise<CalculatorConfig | undefined> {
  try {
    return JSON.parse(JSON.stringify(await getCalculatorConfig())) as CalculatorConfig
  } catch (err) {
    console.error('[calculator] server config load failed', err)
    return undefined
  }
}
