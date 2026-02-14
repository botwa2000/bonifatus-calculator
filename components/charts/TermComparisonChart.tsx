'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type Props = {
  data: { label: string; bonus: number }[]
  height?: number
}

export function TermComparisonChart({ data, height = 300 }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11 }}
          stroke="#9ca3af"
          angle={-20}
          textAnchor="end"
          height={60}
        />
        <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255,255,255,0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: 13,
          }}
          formatter={(value: number) => [value.toFixed(2), 'Bonus Points']}
        />
        <Bar dataKey="bonus" fill="#7c3aed" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
