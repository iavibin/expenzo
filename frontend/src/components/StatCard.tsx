import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'emerald' | 'rose' | 'amber' | 'purple';
}

const VARIANT_STYLES = {
  blue: {
    bg: 'from-blue-500/10 to-transparent',
    border: 'border-blue-500/20',
    iconBg: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  },
  emerald: {
    bg: 'from-emerald-500/10 to-transparent',
    border: 'border-emerald-500/20',
    iconBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  },
  rose: {
    bg: 'from-rose-500/10 to-transparent',
    border: 'border-rose-500/20',
    iconBg: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  },
  amber: {
    bg: 'from-amber-500/10 to-transparent',
    border: 'border-amber-500/20',
    iconBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  },
  purple: {
    bg: 'from-purple-500/10 to-transparent',
    border: 'border-purple-500/20',
    iconBg: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue',
}: StatCardProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div
      className={`p-6 rounded-2xl bg-[#111827] border ${styles.border} bg-gradient-to-br ${styles.bg} shadow-lg relative overflow-hidden transition-all duration-200 hover:border-opacity-60 hover:translate-y-[-2px]`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-1.5 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${styles.iconBg}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
