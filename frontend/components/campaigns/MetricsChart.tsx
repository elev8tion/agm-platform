/**
 * Metrics Chart
 * Performance visualization using recharts
 */

'use client';

import { Card } from '@/components/ui/Card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface MetricsDataPoint {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
}

interface MetricsChartProps {
  data: MetricsDataPoint[];
  title?: string;
  className?: string;
}

export function MetricsChart({ data, title = 'Campaign Performance', className }: MetricsChartProps) {
  return (
    <Card title={title} className={className}>
      <div className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#f1f5f9'
              }}
            />
            <Legend
              wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }}
            />
            <Line
              type="monotone"
              dataKey="impressions"
              stroke="#5B5FC7"
              strokeWidth={2}
              dot={{ fill: '#5B5FC7', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="clicks"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="conversions"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: '#f59e0b', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
