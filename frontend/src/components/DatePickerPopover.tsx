import { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerPopoverProps {
  value: string; // YYYY-MM-DD or empty
  onChange: (date: string) => void;
  label: string;
  placeholder?: string;
  minDate?: string; // YYYY-MM-DD
  maxDate?: string; // YYYY-MM-DD
  align?: 'left' | 'right';
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Format Date object to YYYY-MM-DD
function formatIso(year: number, monthIndex: number, day: number): string {
  const y = String(year);
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function DatePickerPopover({
  value,
  onChange,
  label,
  placeholder,
  minDate,
  maxDate,
  align = 'left',
}: DatePickerPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute today's ISO string
  const today = useMemo(() => {
    const now = new Date();
    return formatIso(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  // Current view state (month: 0-11, year: 2026)
  const [viewYear, setViewYear] = useState(() => {
    if (value && value.length === 10) {
      const parts = value.split('-');
      return parseInt(parts[0], 10) || new Date().getFullYear();
    }
    return new Date().getFullYear();
  });

  const [viewMonth, setViewMonth] = useState(() => {
    if (value && value.length === 10) {
      const parts = value.split('-');
      return (parseInt(parts[1], 10) - 1) || new Date().getMonth();
    }
    return new Date().getMonth();
  });

  // Sync view when opened with a value
  useEffect(() => {
    if (isOpen && value && value.length === 10) {
      const parts = value.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      if (!isNaN(y) && !isNaN(m) && m >= 0 && m <= 11) {
        setViewYear(y);
        setViewMonth(m);
      }
    }
  }, [isOpen, value]);

  // Click outside and Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Calendar matrix calculation
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    interface Cell {
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isDisabled: boolean;
      isSelected: boolean;
      isToday: boolean;
    }

    const cells: Cell[] = [];

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
      const iso = formatIso(prevYear, prevMonth, day);

      const isDisabled = Boolean((minDate && iso < minDate) || (maxDate && iso > maxDate));
      cells.push({
        dateStr: iso,
        dayNum: day,
        isCurrentMonth: false,
        isDisabled,
        isSelected: value === iso,
        isToday: today === iso,
      });
    }

    // Days in current month
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const iso = formatIso(viewYear, viewMonth, day);
      const isDisabled = Boolean((minDate && iso < minDate) || (maxDate && iso > maxDate));
      cells.push({
        dateStr: iso,
        dayNum: day,
        isCurrentMonth: true,
        isDisabled,
        isSelected: value === iso,
        isToday: today === iso,
      });
    }

    // Trailing days from next month to complete the grid (up to multiple of 7)
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let day = 1; day <= remaining; day++) {
        const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
        const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
        const iso = formatIso(nextYear, nextMonth, day);
        const isDisabled = Boolean((minDate && iso < minDate) || (maxDate && iso > maxDate));
        cells.push({
          dateStr: iso,
          dayNum: day,
          isCurrentMonth: false,
          isDisabled,
          isSelected: value === iso,
          isToday: today === iso,
        });
      }
    }

    return cells;
  }, [viewYear, viewMonth, minDate, maxDate, value, today]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDate = (dateStr: string, disabled: boolean) => {
    if (disabled) return;
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const isTodayDisabled = Boolean((minDate && today < minDate) || (maxDate && today > maxDate));
    if (!isTodayDisabled) {
      onChange(today);
      setIsOpen(false);
    }
  };

  // Year options for quick select (2020 - 2030)
  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = 2020; y <= 2030; y++) {
      list.push(y);
    }
    return list;
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input Field / Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={label}
        className={`w-full flex items-center justify-between bg-foundation-input border rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer text-left ${
          isOpen
            ? 'border-brand-tealLight ring-1 ring-brand-tealLight'
            : value
            ? 'border-foundation-inputBorder text-gray-100 hover:border-gray-500'
            : 'border-foundation-inputBorder text-gray-400 hover:border-gray-500'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <CalendarIcon className="w-3.5 h-3.5 text-brand-tealLight shrink-0" />
          <span className="font-mono tabular-nums truncate">
            {value || placeholder || label}
          </span>
        </div>

        {value ? (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClear}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleClear();
              }
            }}
            title="Clear date"
            aria-label="Clear date"
            className="p-0.5 rounded text-gray-400 hover:text-white transition-colors ml-1 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        ) : (
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold shrink-0">
            Pick
          </span>
        )}
      </button>

      {/* Calendar Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-label={`${label} calendar popover`}
          className={`absolute z-50 mt-1.5 w-[280px] sm:w-[300px] bg-foundation-surface border border-foundation-border rounded-xl p-3.5 shadow-2xl ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Popover Header: Month & Year Selector with Navigation */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-foundation-border">
            <button
              type="button"
              onClick={handlePrevMonth}
              title="Previous Month"
              aria-label="Previous Month"
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-foundation-surfaceElevated transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className="bg-foundation-surfaceElevated border border-foundation-borderSubtle text-gray-100 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-brand-tealLight cursor-pointer"
                aria-label="Select Month"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className="bg-foundation-surfaceElevated border border-foundation-borderSubtle text-gray-100 rounded-md px-2 py-1 text-xs font-mono focus:outline-none focus:border-brand-tealLight cursor-pointer"
                aria-label="Select Year"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              title="Next Month"
              aria-label="Next Month"
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-foundation-surfaceElevated transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            {DAY_NAMES.map((d) => (
              <span key={d} className="py-0.5">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-xs">
            {calendarCells.map((cell, idx) => {
              let cellClass =
                'h-7 w-full flex items-center justify-center rounded-lg text-xs font-mono transition-colors ';

              if (cell.isDisabled) {
                cellClass += 'text-gray-600 opacity-30 cursor-not-allowed bg-transparent ';
              } else if (cell.isSelected) {
                cellClass +=
                  'bg-brand-teal text-white font-bold shadow-sm shadow-brand-teal/40 cursor-pointer ';
              } else if (cell.isToday) {
                cellClass +=
                  'border border-brand-tealLight text-brand-tealLight font-semibold hover:bg-brand-teal/15 cursor-pointer ';
              } else if (!cell.isCurrentMonth) {
                cellClass +=
                  'text-gray-500 hover:bg-foundation-surfaceElevated hover:text-gray-200 cursor-pointer ';
              } else {
                cellClass +=
                  'text-gray-200 hover:bg-foundation-surfaceElevated hover:text-white cursor-pointer ';
              }

              return (
                <button
                  key={`${cell.dateStr}-${idx}`}
                  type="button"
                  disabled={cell.isDisabled}
                  onClick={() => handleSelectDate(cell.dateStr, cell.isDisabled)}
                  className={cellClass}
                  title={cell.dateStr}
                  aria-label={cell.dateStr}
                >
                  {cell.dayNum}
                </button>
              );
            })}
          </div>

          {/* Popover Footer: Quick Actions (Today, Clear, Close) */}
          <div className="mt-3 pt-2.5 border-t border-foundation-border flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-brand-tealLight hover:underline font-medium cursor-pointer"
            >
              Today
            </button>

            <div className="flex items-center gap-2">
              {value && (
                <button
                  type="button"
                  onClick={() => handleClear()}
                  className="text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-2 py-0.5 rounded bg-foundation-surfaceElevated border border-foundation-borderSubtle text-gray-300 hover:text-white text-[11px] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
