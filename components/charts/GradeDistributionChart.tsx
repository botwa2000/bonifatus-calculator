'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts'

type Props = {
  data: { name: string; value: number; color: string }[]
}

export function GradeDistributionChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255,255,255,0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: 13,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
