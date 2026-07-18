import { randomInt } from 'crypto'

export function generateCode(): string {
  return randomInt(100_000, 1_000_000).toString()
}
