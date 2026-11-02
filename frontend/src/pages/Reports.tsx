import { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Receipt,
  Wallet,
  Scale,
  FileBarChart,
  AlertCircle,
  Loader2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import { ReportSkeleton } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';
import { reportService } from '../services/reportService';
import { MonthlyReport } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { getCurrentMonthAndYear, formatMonthName } from '../utils/dateUtils';
import { CHART_COLORS } from '../utils/chartColors';
import DotGrid from '../components/DotGrid';

export default function Reports() {
  const { showSuccess, showError } = useToast();
  const current = getCurrentMonthAndYear();
  const [month, setMonth] = useState(current.month);
  const [year, setYear] = useState(current.year);

  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportService.getMonthlyReport(month, year);
      setReport(data);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setError(errorObj.response?.data?.message || 'Failed to load monthly report.');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      await reportService.downloadExportCsv(month, year);
      showSuccess(`Report for ${formatMonthName(month)} ${year} exported successfully as CSV`);
    } catch (err: unknown) {
      showError((err as Error).message || 'Failed to download CSV export.');
    } finally {
      setExporting(false);
    }
  };

  const isOverBudget = Boolean(report && report.totalBudget > 0 && report.remainingBudget < 0);

  return (
    <div className="relative flex-1 flex flex-col min-h-0 bg-foundation-bg overflow-hidden">
      {/* React Bits Dot Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <DotGrid
          dotSize={3}
          gap={24}
          baseColor="#263445"
          activeColor="#14b8a6"
          proximity={120}
          opacity={0.35}
        />
      </div>

      <div className="relative z-10 flex-1 flex flex-col min-h-0">
        <Header
          title="Monthly Reports & Export"
          subtitle={`Summary statement for ${formatMonthName(month)} ${year}`}
          month={month}
          year={year}
          onMonthChange={setMonth}
          onYearChange={setYear}
          actions={
          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="px-3.5 sm:px-4 py-2 rounded-lg bg-brand-teal hover:bg-brand-tealLight text-white text-xs font-medium flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </>
            )}
          </button>
        }
      />

      <div className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-6 sm:space-y-8">
        {/* Prominent Reporting Period Statement Banner */}
        <div className="p-5 sm:p-6 rounded-xl bg-foundation-surface border border-foundation-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center text-brand-tealLight shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Monthly Statement
                </span>
                <span className="px-2 py-0.5 rounded bg-foundation-surfaceElevated text-gray-300 text-[10px] font-mono font-medium border border-foundation-border">
                  {formatMonthName(month)} {year}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
                Financial Report Overview
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Calculated directly from verified MySQL expense and budget ledger records
              </p>
            </div>
          </div>

          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="self-start sm:self-auto px-3.5 py-2 rounded-lg bg-foundation-surfaceElevated hover:bg-[#222e40] text-gray-200 border border-foundation-borderSubtle text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-brand-tealLight" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            )}
            <span>Download CSV Statement</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <ReportSkeleton />
        ) : (
          <>
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <StatCard
                title="Total Expenses"
                value={formatCurrency(report?.totalExpenses || 0)}
                subtitle="Aggregated monthly outflow"
                icon={Receipt}
                variant="rose"
              />
              <StatCard
                title="Total Budget"
                value={formatCurrency(report?.totalBudget || 0)}
                subtitle="Configured spending cap"
                icon={Wallet}
                variant="blue"
              />
              <StatCard
                title="Remaining Balance"
                value={formatCurrency(report?.remainingBudget || 0)}
                subtitle={
                  isOverBudget
                    ? 'Budget Deficit'
                    : report?.totalBudget === 0
                    ? 'No budget allocated'
                    : 'Surplus Reserve'
                }
                icon={Scale}
                variant={isOverBudget ? 'rose' : 'emerald'}
              />
              <StatCard
                title="Transactions"
                value={String(report?.transactionCount || 0)}
                subtitle="Completed expense records"
                icon={FileBarChart}
                variant="teal"
              />
            </div>

            {/* Two Column Section: Category Breakdown & Budget Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Category Breakdown Table */}
              <div className="p-5 sm:p-6 rounded-xl bg-foundation-surface border border-foundation-border shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                        Category Breakdown
                      </h3>
                      <p className="text-xs text-gray-400">Total expense share per category</p>
                    </div>
                    <span className="text-xs text-gray-300 font-mono px-2 py-0.5 rounded bg-foundation-surfaceElevated border border-foundation-border">
                      {report?.categoryBreakdown.length || 0} Categories
                    </span>
                  </div>

                  {!report?.categoryBreakdown || report.categoryBreakdown.length === 0 ? (
                    <EmptyState
                      title="No category spending"
                      description={`No expenses recorded for ${formatMonthName(month)} ${year}.`}
                      minHeight="min-h-[200px]"
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[320px]">
                        <thead>
                          <tr className="border-b border-foundation-border text-[11px] font-semibold uppercase text-gray-400">
                            <th className="pb-2.5 pl-2">Category</th>
                            <th className="pb-2.5 text-right">Amount</th>
                            <th className="pb-2.5 text-right pr-2">Share</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-foundation-borderSubtle">
                          {report.categoryBreakdown.map((item, idx) => {
                            const total = report.totalExpenses || 1;
                            const pct = Math.round((item.amount / total) * 100);
                            const dotColor = CHART_COLORS[idx % CHART_COLORS.length];

                            return (
                              <tr key={item.categoryName} className="hover:bg-foundation-surfaceElevated/50 transition-colors">
                                <td className="py-2.5 pl-2 font-medium text-gray-200">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-2.5 h-2.5 rounded-full shrink-0"
                                      style={{ backgroundColor: dotColor }}
                                    />
                                    <span>{item.categoryName}</span>
                                  </div>
                                </td>
                                <td className="py-2.5 text-right font-mono tabular-nums font-semibold text-rose-400">
                                  {formatCurrency(item.amount)}
                                </td>
                                <td className="py-2.5 text-right pr-2">
                                  <div className="flex items-center justify-end gap-2">
                                    <div className="w-16 h-1.5 rounded-full bg-foundation-input border border-foundation-borderSubtle overflow-hidden hidden sm:block">
                                      <div
                                        className="h-full rounded-full"
                                        style={{ width: `${pct}%`, backgroundColor: dotColor }}
                                      />
                                    </div>
                                    <span className="font-mono tabular-nums text-gray-300 font-semibold text-[11px] min-w-[32px] text-right">
                                      {pct}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-foundation-border text-[11px] text-gray-400 flex items-center justify-between">
                  <span>Category Outflow</span>
                  <span className="font-mono tabular-nums text-gray-300">Total: {formatCurrency(report?.totalExpenses || 0)}</span>
                </div>
              </div>

              {/* Budget vs Actual Spending Comparison */}
              <div className="p-5 sm:p-6 rounded-xl bg-foundation-surface border border-foundation-border shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                        Budget vs. Actual
                      </h3>
                      <p className="text-xs text-gray-400">Monthly budget compliance and threshold status</p>
                    </div>
                    <span className="text-xs text-gray-300 font-mono px-2 py-0.5 rounded bg-foundation-surfaceElevated border border-foundation-border">
                      {report?.budgetComparison.length || 0} Budgets
                    </span>
                  </div>

                  {!report?.budgetComparison || report.budgetComparison.length === 0 ? (
                    <EmptyState
                      title="No budget comparison"
                      description={`No category budgets were defined for ${formatMonthName(month)} ${year}.`}
                      minHeight="min-h-[200px]"
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[380px]">
                        <thead>
                          <tr className="border-b border-foundation-border text-[11px] font-semibold uppercase text-gray-400">
                            <th className="pb-2.5 pl-2">Category</th>
                            <th className="pb-2.5 text-right">Budget</th>
                            <th className="pb-2.5 text-right">Actual</th>
                            <th className="pb-2.5 text-right pr-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-foundation-borderSubtle">
                          {report.budgetComparison.map((b) => {
                            const isExceeded = b.status === 'EXCEEDED';
                            const isWarning = b.status === 'WARNING';
                            const isApproaching = b.status === 'APPROACHING';

                            return (
                              <tr key={b.budgetId} className="hover:bg-foundation-surfaceElevated/50 transition-colors">
                                <td className="py-2.5 pl-2 font-medium text-gray-200">
                                  {b.categoryName}
                                </td>
                                <td className="py-2.5 text-right font-mono tabular-nums text-gray-300">
                                  {formatCurrency(b.budgetAmount)}
                                </td>
                                <td className="py-2.5 text-right font-mono tabular-nums font-semibold text-rose-400">
                                  {formatCurrency(b.amountSpent)}
                                </td>
                                <td className="py-2.5 text-right pr-2">
                                  <span
                                    className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                      isExceeded
                                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                        : isWarning
                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                        : isApproaching
                                        ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    }`}
                                  >
                                    {isExceeded ? (
                                      <AlertTriangle className="w-3 h-3" />
                                    ) : isWarning ? (
                                      <AlertCircle className="w-3 h-3" />
                                    ) : (
                                      <CheckCircle2 className="w-3 h-3" />
                                    )}
                                    <span>{b.status || 'NORMAL'}</span>
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-foundation-border text-[11px] text-gray-400 flex items-center justify-between">
                  <span>Spending Limit Compliance</span>
                  <span className="font-mono tabular-nums text-gray-300">Total Cap: {formatCurrency(report?.totalBudget || 0)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
    </div>
  );
}
