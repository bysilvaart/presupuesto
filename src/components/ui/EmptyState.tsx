import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: ReactNode;
}

const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-800 bg-slate-900/60 px-6 py-10 text-center text-slate-300">
    <span className="text-4xl" aria-hidden>
      {icon}
    </span>
    <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
    <p className="max-w-md text-sm text-slate-400">{description}</p>
    {action}
  </div>
);

export default EmptyState;
