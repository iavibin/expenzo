import { Calendar, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatMonthName } from '../utils/dateUtils';

interface HeaderProps {
  title: string;
  subtitle?: string;
  month?: number;
  year?: number;
  onMonthChange?: (month: number) => void;
  onYearChange?: (year: number) => void;
  actions?: React.ReactNode;
}

export default function Header({
  title,
  subtitle,
  month,
  year,
  onMonthChange,
  onYearChange,
  actions,
}: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="h-20 bg-[#0F172A]/80 backdrop-blur-md border-b border-[#1E293B] px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Optional Month / Year Selector */}
        {month !== undefined && year !== undefined && (
          <div className="flex items-center gap-2 bg-[#1E293B]/70 border border-[#334155] rounded-lg px-3 py-1.5 text-sm">
            <Calendar className="w-4 h-4 text-blue-400" />
            {onMonthChange ? (
              <select
                value={month}
                onChange={(e) => onMonthChange(parseInt(e.target.value))}
                className="bg-transparent text-gray-200 focus:outline-none cursor-pointer text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m} className="bg-[#0F172A] text-gray-200">
                    {formatMonthName(m)}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-gray-200 font-medium">{formatMonthName(month)}</span>
            )}

            {onYearChange ? (
              <select
                value={year}
                onChange={(e) => onYearChange(parseInt(e.target.value))}
                className="bg-transparent text-gray-200 focus:outline-none cursor-pointer text-sm border-l border-[#334155] pl-2"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y} className="bg-[#0F172A] text-gray-200">
                    {y}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-gray-400 font-mono text-xs">{year}</span>
            )}
          </div>
        )}

        {/* Action buttons (e.g. Add Expense / Export) */}
        {actions}

        {/* User Pill */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[#1E293B]">
          <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <UserIcon className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-gray-200 hidden md:inline">
            {user?.name || 'Account'}
          </span>
        </div>
      </div>
    </header>
  );
}
