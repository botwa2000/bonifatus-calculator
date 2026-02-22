'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { deriveTier, tierColor } from '@/lib/utils/grade-helpers'

type Props = {
  data: { subject: string; avgScore: number }[]
  height?: number
}

export function SubjectPerformanceChart({ data, height = 300 }: Props) {
  const sorted = [...data].sort((a, b) => b.avgScore - a.avgScore)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <YAxis
          dataKey="subject"
          type="category"
          tick={{ fontSize: 11 }}
          stroke="#9ca3af"
          width={75}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255,255,255,0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: 13,
          }}
          formatter={(value) => [Number(value).toFixed(1), 'Avg Score']}
        />
        <Bar dataKey="avgScore" radius={[0, 4, 4, 0]}>
          {sorted.map((entry, index) => (
            <Cell key={index} fill={tierColor(deriveTier(entry.avgScore))} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
