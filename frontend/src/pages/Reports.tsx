import { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Receipt,
  Wallet,
  Scale,
  FileBarChart,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import { reportService } from '../services/reportService';
import { MonthlyReport } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { getCurrentMonthAndYear, formatMonthName } from '../utils/dateUtils';

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

  const isOverBudget = report && report.totalBudget > 0 && report.remainingBudget < 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0B0F19]">
      <Header
        title="Monthly Reports & Export"
        subtitle={`Summary analysis for ${formatMonthName(month)} ${year}`}
        month={month}
        year={year}
        onMonthChange={setMonth}
        onYearChange={setYear}
        actions={
          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="px-3 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer disabled:opacity-50 shrink-0"
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

      <div className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-8">
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <LoadingState message="Generating monthly report summary..." minHeight="min-h-[400px]" />
        ) : (
          <>
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                subtitle={isOverBudget ? 'Deficit' : 'Surplus'}
                icon={Scale}
                variant={isOverBudget ? 'rose' : 'emerald'}
              />
              <StatCard
                title="Transactions"
                value={String(report?.transactionCount || 0)}
                subtitle="Completed expense records"
                icon={FileBarChart}
                variant="purple"
              />
            </div>

            {/* Two Column Section: Category Breakdown & Budget Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Category Breakdown Table */}
              <div className="p-6 rounded-2xl bg-[#111827] border border-[#1E293B] shadow-xl flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white tracking-tight">Category Breakdown</h3>
                  <span className="text-xs text-gray-400 font-mono">
                    {report?.categoryBreakdown.length || 0} categories
                  </span>
                </div>

                {!report?.categoryBreakdown || report.categoryBreakdown.length === 0 ? (
                  <EmptyState
                    title="No category spending"
                    description="No expenses recorded for this month."
                    minHeight="min-h-[220px]"
                  />
                ) : (
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#1E293B] text-[11px] font-semibold uppercase text-gray-400">
                          <th className="pb-3 pl-2">Category</th>
                          <th className="pb-3 text-right">Amount</th>
                          <th className="pb-3 text-right pr-2">% of Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E293B]/60">
                        {report.categoryBreakdown.map((item) => {
                          const pct =
                            report.totalExpenses > 0
                              ? Math.round((item.amount / report.totalExpenses) * 100)
                              : 0;
                          return (
                            <tr key={item.categoryName} className="hover:bg-[#1E293B]/30 transition-colors">
                              <td className="py-3 pl-2 font-medium text-gray-200">
                                {item.categoryName}
                              </td>
                              <td className="py-3 text-right font-mono font-semibold text-rose-400">
                                {formatCurrency(item.amount)}
                              </td>
                              <td className="py-3 text-right pr-2 text-gray-400 font-mono">
                                {pct}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Budget vs Actual Spending Comparison */}
              <div className="p-6 rounded-2xl bg-[#111827] border border-[#1E293B] shadow-xl flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white tracking-tight">Budget vs. Actual</h3>
                  <span className="text-xs text-gray-400 font-mono">
                    {report?.budgetComparison.length || 0} budgets
                  </span>
                </div>

                {!report?.budgetComparison || report.budgetComparison.length === 0 ? (
                  <EmptyState
                    title="No budget comparison"
                    description="No category budgets were defined for this month."
                    minHeight="min-h-[220px]"
                  />
                ) : (
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#1E293B] text-[11px] font-semibold uppercase text-gray-400">
                          <th className="pb-3 pl-2">Category</th>
                          <th className="pb-3 text-right">Budget</th>
                          <th className="pb-3 text-right">Actual</th>
                          <th className="pb-3 text-right pr-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E293B]/60">
                        {report.budgetComparison.map((b) => {
                          const isExceeded = b.status === 'EXCEEDED';
                          const isWarning = b.status === 'WARNING';
                          const isApproaching = b.status === 'APPROACHING';

                          return (
                            <tr key={b.budgetId} className="hover:bg-[#1E293B]/30 transition-colors">
                              <td className="py-3 pl-2 font-medium text-gray-200">
                                {b.categoryName}
                              </td>
                              <td className="py-3 text-right font-mono text-gray-300">
                                {formatCurrency(b.budgetAmount)}
                              </td>
                              <td className="py-3 text-right font-mono font-semibold text-rose-400">
                                {formatCurrency(b.amountSpent)}
                              </td>
                              <td className="py-3 text-right pr-2">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    isExceeded
                                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                      : isWarning
                                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                      : isApproaching
                                      ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                                      : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  }`}
                                >
                                  {b.status || 'NORMAL'}
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
