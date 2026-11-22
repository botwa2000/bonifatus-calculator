'use client'

import { DemoCalculator, type CalculatorConfig } from '@/components/demo-calculator'

export function GradeRewardCalculatorClient({
  initialConfig,
}: {
  initialConfig?: CalculatorConfig
}) {
  return <DemoCalculator allowSample isDemo initialConfig={initialConfig} />
}
