import { ReactNode } from 'react';

interface KpiCardProps {
  title: string;
  value: ReactNode;
  trend?: ReactNode;
  description?: string;
}

const KpiCard = ({ title, value, trend, description }: KpiCardProps) => (
  <article className="rounded-3xl border border-slate-900 bg-slate-900/80 p-4 shadow-soft" role="group" aria-label={title}>
    <header className="flex items-center justify-between">
      <p className="text-sm font-medium text-slate-400">{title}</p>
      {trend && <span className="text-xs text-brand">{trend}</span>}
    </header>
    <p className="mt-3 text-2xl font-semibold text-slate-100">{value}</p>
    {description && <p className="mt-2 text-xs text-slate-400">{description}</p>}
  </article>
);

export default KpiCard;
