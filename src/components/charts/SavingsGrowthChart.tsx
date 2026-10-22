import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CompoundYearPoint } from '../../utils/financeMath';
import { formatCurrency } from '../../utils/format';

export interface SavingsGrowthChartProps {
  data: CompoundYearPoint[];
  height?: number;
}

const emptyState = (
  <div
    className="flex items-center justify-center text-sm text-slate-500"
    style={{ height: 240 }}
  >
    Adjust the inputs to see projected growth.
  </div>
);

export const SavingsGrowthChart: React.FC<SavingsGrowthChartProps> = ({
  data,
  height = 260,
}) => {
  if (!data.length) return emptyState;

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="mccuContrib" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.9} />
              <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="mccuEarnings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#059669" stopOpacity={0.9} />
              <stop offset="95%" stopColor="#059669" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="year"
            stroke="#64748b"
            fontSize={12}
            tickFormatter={(v: number) => `Yr ${v}`}
          />
          <YAxis
            stroke="#64748b"
            fontSize={12}
            tickFormatter={(v: number) => formatCurrency(v, true)}
            width={80}
          />
          <Tooltip
            formatter={(value, name) => [formatCurrency(Number(value)), String(name)]}
            labelFormatter={(label) => `Year ${label}`}
            contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0' }}
          />
          <Area
            type="monotone"
            dataKey="contributions"
            name="Contributions"
            stroke="#1d4ed8"
            fill="url(#mccuContrib)"
            strokeWidth={2}
            stackId="1"
          />
          <Area
            type="monotone"
            dataKey="interest"
            name="Interest earned"
            stroke="#059669"
            fill="url(#mccuEarnings)"
            strokeWidth={2}
            stackId="1"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SavingsGrowthChart;
