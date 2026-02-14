import { NextResponse } from 'next/server'

type StockData = {
  ticker: string
  name: string
  price: number
  return30d: number
  currency: string
}

// Curated watchlist of well-known companies (US + EU)
const WATCHLIST = [
  'AAPL',
  'MSFT',
  'GOOGL',
  'AMZN',
  'NVDA',
  'TSLA',
  'META',
  'JPM',
  'V',
  'JNJ',
  'PG',
  'KO',
  'DIS',
  'NFLX',
]

const EU_TICKERS: Record<string, { name: string; currency: string }> = {
  ASML: { name: 'ASML', currency: 'EUR' },
  SAP: { name: 'SAP', currency: 'EUR' },
}

const FALLBACK_DATA: StockData[] = [
  { ticker: 'NVDA', name: 'NVIDIA', price: 142.5, return30d: 12.3, currency: 'USD' },
  { ticker: 'AAPL', name: 'Apple', price: 237.8, return30d: 5.7, currency: 'USD' },
  { ticker: 'MSFT', name: 'Microsoft', price: 445.2, return30d: 4.2, currency: 'USD' },
  { ticker: 'GOOGL', name: 'Alphabet', price: 178.9, return30d: 3.8, currency: 'USD' },
  { ticker: 'AMZN', name: 'Amazon', price: 213.4, return30d: 6.1, currency: 'USD' },
  { ticker: 'META', name: 'Meta', price: 612.3, return30d: 7.5, currency: 'USD' },
  { ticker: 'TSLA', name: 'Tesla', price: 268.9, return30d: 9.2, currency: 'USD' },
  { ticker: 'ASML', name: 'ASML', price: 892.1, return30d: 3.1, currency: 'EUR' },
  { ticker: 'SAP', name: 'SAP', price: 238.5, return30d: 2.8, currency: 'EUR' },
  { ticker: 'V', name: 'Visa', price: 312.7, return30d: 1.9, currency: 'USD' },
]

let cachedData: StockData[] | null = null
let cacheTime = 0
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

type FMPQuote = {
  symbol: string
  name: string
  price: number
  changesPercentage: number
}

type FMPHistorical = {
  historical: { date: string; close: number }[]
}

async function fetchFromFMP(): Promise<StockData[] | null> {
  const apiKey = process.env.FMP_API_KEY
  if (!apiKey) return null

  try {
    const allTickers = [...WATCHLIST, ...Object.keys(EU_TICKERS)]
    const symbols = allTickers.join(',')

    // Batch quote for current prices
    const quoteRes = await fetch(
      `https://financialmodelingprep.com/api/v3/quote/${symbols}?apikey=${apiKey}`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!quoteRes.ok) return null
    const quotes: FMPQuote[] = await quoteRes.json()
    if (!Array.isArray(quotes) || quotes.length === 0) return null

    // Get 30-day returns via historical price for each ticker
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 35) // extra buffer for weekends
    const fromDate = thirtyDaysAgo.toISOString().split('T')[0]
    const toDate = new Date().toISOString().split('T')[0]

    const historicalPromises = allTickers.map(async (ticker) => {
      try {
        const res = await fetch(
          `https://financialmodelingprep.com/api/v3/historical-price-full/${ticker}?from=${fromDate}&to=${toDate}&apikey=${apiKey}`,
          { signal: AbortSignal.timeout(8000) }
        )
        if (!res.ok) return { ticker, oldPrice: null }
        const data: FMPHistorical = await res.json()
        const hist = data?.historical
        if (!hist || hist.length === 0) return { ticker, oldPrice: null }
        // Get the oldest price in the range (closest to 30 days ago)
        const oldPrice = hist[hist.length - 1]?.close
        return { ticker, oldPrice: oldPrice ?? null }
      } catch {
        return { ticker, oldPrice: null }
      }
    })

    const historicals = await Promise.all(historicalPromises)
    const oldPriceMap = new Map(historicals.map((h) => [h.ticker, h.oldPrice]))

    const stocks: StockData[] = quotes
      .map((q) => {
        const oldPrice = oldPriceMap.get(q.symbol)
        const return30d =
          oldPrice && oldPrice > 0 ? ((q.price - oldPrice) / oldPrice) * 100 : q.changesPercentage // fallback to daily change
        const euInfo = EU_TICKERS[q.symbol]
        return {
          ticker: q.symbol,
          name: q.name || q.symbol,
          price: q.price,
          return30d: Math.round(return30d * 10) / 10,
          currency: euInfo?.currency ?? 'USD',
        }
      })
      .filter((s) => s.return30d > 0)
      .sort((a, b) => b.return30d - a.return30d)

    return stocks.length > 0 ? stocks : null
  } catch {
    return null
  }
}

export async function GET() {
  const now = Date.now()

  if (cachedData && now - cacheTime < CACHE_DURATION) {
    return NextResponse.json({ success: true, stocks: cachedData })
  }

  const liveData = await fetchFromFMP()

  if (liveData) {
    cachedData = liveData
    cacheTime = now
    return NextResponse.json({ success: true, stocks: cachedData })
  }

  // Fallback to static sample data
  cachedData = FALLBACK_DATA.filter((s) => s.return30d > 0).sort(
    (a, b) => b.return30d - a.return30d
  )
  cacheTime = now

  return NextResponse.json({ success: true, stocks: cachedData })
}
