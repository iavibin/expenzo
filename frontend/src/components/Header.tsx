import React from 'react';
import { Calendar, User as UserIcon, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
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
  const { toggleMobile } = useSidebar();

  return (
    <header className="h-16 sm:h-18 bg-foundation-surface/90 backdrop-blur-md border-b border-foundation-border px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 transition-colors">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={toggleMobile}
          className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-foundation-surfaceElevated transition-colors"
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-xl font-bold text-white tracking-tight leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 line-clamp-1">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Month / Year Selector */}
        {month !== undefined && year !== undefined && (
          <div className="flex items-center gap-1.5 sm:gap-2 bg-foundation-surfaceElevated border border-foundation-border rounded-lg px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm">
            <Calendar className="w-3.5 h-3.5 text-brand-tealLight shrink-0" />
            {onMonthChange ? (
              <select
                value={month}
                onChange={(e) => onMonthChange(parseInt(e.target.value))}
                className="bg-transparent text-gray-200 focus:outline-none cursor-pointer text-xs sm:text-sm font-medium"
                aria-label="Filter by month"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m} className="bg-foundation-surface text-gray-200">
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
                className="bg-transparent text-gray-200 focus:outline-none cursor-pointer text-xs sm:text-sm border-l border-foundation-border pl-1.5 sm:pl-2 font-mono"
                aria-label="Filter by year"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y} className="bg-foundation-surface text-gray-200">
                    {y}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-gray-400 font-mono text-[11px] sm:text-xs">{year}</span>
            )}
          </div>
        )}

        {/* Action buttons (e.g. Add Expense / Export) */}
        {actions}

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-foundation-border">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center text-brand-tealLight shrink-0">
            <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <span className="text-xs sm:text-sm font-medium text-gray-300 hidden lg:inline max-w-[120px] truncate">
            {user?.name || 'Account'}
          </span>
        </div>
      </div>
    </header>
  );
}
