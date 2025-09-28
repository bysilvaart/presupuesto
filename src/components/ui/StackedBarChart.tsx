import {
  Bar,
  BarChart as ReBarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { formatCLP } from '@/lib/format';

interface StackedBarChartProps {
  data: Record<string, string | number>[];
  stackKeys: string[];
  colors: string[];
}

const StackedBarChart = ({ data, stackKeys, colors }: StackedBarChartProps) => (
  <div className="h-72">
    <ResponsiveContainer>
      <ReBarChart data={data} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
        <YAxis stroke="#94a3b8" tickFormatter={(value) => formatCLP(Number(value))} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value: number) => formatCLP(value)} contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12 }} />
        <Legend wrapperStyle={{ color: '#e2e8f0' }} />
        {stackKeys.map((key, index) => (
          <Bar key={key} dataKey={key} stackId="stack" fill={colors[index] ?? colors[0]} radius={[12, 12, 12, 12]} />
        ))}
      </ReBarChart>
    </ResponsiveContainer>
  </div>
);

export default StackedBarChart;
