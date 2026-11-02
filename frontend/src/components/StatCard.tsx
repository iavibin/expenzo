import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'emerald' | 'rose' | 'amber' | 'purple' | 'teal';
}

const VARIANT_STYLES = {
  teal: {
    iconBg: 'bg-brand-teal/10 text-brand-tealLight border border-brand-teal/20',
  },
  blue: {
    iconBg: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
  },
  emerald: {
    iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  },
  rose: {
    iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  },
  amber: {
    iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  },
  purple: {
    iconBg: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20',
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'teal',
}: StatCardProps) {
  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.teal;

  return (
    <div className="p-5 rounded-xl bg-foundation-surface border border-foundation-border transition-colors hover:border-[#2f3d52]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{title}</p>
          <h3 className="text-xl sm:text-2xl font-bold text-white mt-1.5 tracking-tight font-mono tabular-nums truncate">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1 truncate font-normal">{subtitle}</p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${styles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
