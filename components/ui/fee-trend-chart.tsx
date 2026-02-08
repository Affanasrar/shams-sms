"use client"

import React from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

type Point = {
  month: string
  collected: number
  due: number
}

export default function FeeTrendChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" stroke="#64748b" />
        <YAxis stroke="#64748b" />
        <Tooltip
          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}
        />
        <Line type="monotone" dataKey="collected" stroke="#3b71ca" strokeWidth={2} dot={false} name="Collected" />
        <Line type="monotone" dataKey="due" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Due" />
      </LineChart>
    </ResponsiveContainer>
  )
}
