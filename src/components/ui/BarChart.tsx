import {
  Bar,
  BarChart as ReBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { formatCLP } from '@/lib/format';

interface BarChartProps {
  data: { name: string; value: number }[];
  color?: string;
}

const BarChart = ({ data, color = '#0ea5e9' }: BarChartProps) => (
  <div className="h-64">
    <ResponsiveContainer>
      <ReBarChart data={data} barSize={32}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
        <YAxis stroke="#94a3b8" tickFormatter={(value) => formatCLP(value)} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value: number) => formatCLP(value)} contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12 }} />
        <Bar dataKey="value" fill={color} radius={[12, 12, 12, 12]} />
      </ReBarChart>
    </ResponsiveContainer>
  </div>
);

export default BarChart;
