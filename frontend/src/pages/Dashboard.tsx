import { useState, useEffect, useCallback } from 'react';
import {
  TrendingDown,
  Wallet,
  Scale,
  Receipt,
  Award,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import { analyticsService } from '../services/analyticsService';
import { budgetService } from '../services/budgetService';
import { AnalyticsSummary, BudgetAlert } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate, getCurrentMonthAndYear } from '../utils/dateUtils';
import { Link } from 'react-router-dom';

const PIE_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#F97316', // Orange
];

export default function Dashboard() {
  const current = getCurrentMonthAndYear();
  const [month, setMonth] = useState(current.month);
  const [year, setYear] = useState(current.year);

  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsData, alertsData] = await Promise.all([
        analyticsService.getAnalytics(month, year),
        budgetService.getAlerts(month, year),
      ]);
      setAnalytics(analyticsData);
      setAlerts(alertsData);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setError(errorObj.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const hasExpenses = analytics && analytics.totalExpenses > 0;
  const isOverBudget = analytics && analytics.totalBudget > 0 && analytics.remainingBudget < 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0B0F19]">
      <Header
        title="Financial Dashboard"
        subtitle="Real-time financial summary and spending insights"
        month={month}
        year={year}
        onMonthChange={setMonth}
        onYearChange={setYear}
      />

      <div className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-6 sm:space-y-8">
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadDashboardData}
              className="text-xs bg-rose-500/20 px-3 py-1.5 rounded-lg hover:bg-rose-500/30 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <LoadingState message="Loading financial analytics..." minHeight="min-h-[400px]" />
        ) : (
          <>
            {/* KPI Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Expenses"
                value={formatCurrency(analytics?.totalExpenses || 0)}
                subtitle={`${analytics?.transactionCount || 0} transactions this month`}
                icon={TrendingDown}
                variant="rose"
              />
              <StatCard
                title="Monthly Budget"
                value={formatCurrency(analytics?.totalBudget || 0)}
                subtitle="Allocated category budgets"
                icon={Wallet}
                variant="blue"
              />
              <StatCard
                title="Remaining Budget"
                value={formatCurrency(analytics?.remainingBudget || 0)}
                subtitle={isOverBudget ? 'Budget exceeded' : 'Available spending buffer'}
                icon={Scale}
                variant={isOverBudget ? 'rose' : 'emerald'}
              />
              <StatCard
                title="Top Category"
                value={analytics?.highestSpendingCategory || 'None'}
                subtitle={
                  analytics?.highestSpendingAmount
                    ? `${formatCurrency(analytics.highestSpendingAmount)} spent`
                    : 'No spending recorded'
                }
                icon={Award}
                variant="purple"
              />
            </div>

            {/* Dynamic Budget Alert Banners */}
            {alerts && alerts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                    Budget Health & Alerts
                  </h3>
                  <Link
                    to="/budgets"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                  >
                    <span>Manage Budgets</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {alerts.map((alert) => {
                    const isExceeded = alert.status === 'EXCEEDED';
                    const isWarning = alert.status === 'WARNING';
                    const isApproaching = alert.status === 'APPROACHING';

                    return (
                      <div
                        key={alert.budgetId}
                        className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                          isExceeded
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                            : isWarning
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            : isApproaching
                            ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        }`}
                      >
                        {isExceeded ? (
                          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                        ) : isWarning ? (
                          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-white truncate">
                              {alert.categoryName}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isExceeded
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : isWarning
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-blue-500/20 text-blue-300'
                              }`}
                            >
                              {alert.percentageUsed}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-300 mt-1">{alert.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Category Breakdown Pie Chart */}
              <div className="p-6 rounded-2xl bg-[#111827] border border-[#1E293B] shadow-xl flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Category Breakdown</h3>
                    <p className="text-xs text-gray-400">Monthly expense distribution by category</p>
                  </div>
                </div>

                {!hasExpenses ? (
                  <EmptyState
                    title="No category expenses"
                    description="No expenses recorded for this month to display breakdown."
                    minHeight="min-h-[280px]"
                  />
                ) : (
                  <div className="h-[280px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics?.categoryBreakdown}
                          dataKey="amount"
                          nameKey="categoryName"
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={3}
                        >
                          {analytics?.categoryBreakdown.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1E293B',
                            borderColor: '#334155',
                            borderRadius: '10px',
                            color: '#F8FAFC',
                          }}
                          formatter={(value: unknown) => [formatCurrency(Number(value)), 'Total Spent']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Legend Chips */}
                {hasExpenses && analytics?.categoryBreakdown && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#1E293B]">
                    {analytics.categoryBreakdown.map((cat, idx) => (
                      <div
                        key={cat.categoryName}
                        className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#1E293B]/60 text-xs text-gray-300"
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                        />
                        <span>{cat.categoryName}</span>
                        <span className="font-semibold text-gray-400">
                          {formatCurrency(cat.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Monthly Spending Trend Bar Chart */}
              <div className="p-6 rounded-2xl bg-[#111827] border border-[#1E293B] shadow-xl flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Spending Trends</h3>
                    <p className="text-xs text-gray-400">Historical spending across previous 6 months</p>
                  </div>
                </div>

                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.monthlySpending} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1E293B',
                          borderColor: '#334155',
                          borderRadius: '10px',
                          color: '#F8FAFC',
                        }}
                        formatter={(value: unknown) => [formatCurrency(Number(value)), 'Total Expenses']}
                      />
                      <Bar dataKey="amount" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 pt-4 border-t border-[#1E293B] flex items-center justify-between text-xs text-gray-400">
                  <span>6-Month Continuous Record</span>
                  <span className="font-medium text-blue-400">MySQL Aggregation</span>
                </div>
              </div>
            </div>

            {/* Line Chart & Recent Transactions Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Spending Curve (Line Chart) */}
              <div className="lg:col-span-1 p-6 rounded-2xl bg-[#111827] border border-[#1E293B] shadow-xl flex flex-col">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Spending Trajectory</h3>
                  <p className="text-xs text-gray-400">Trend trajectory over time</p>
                </div>
                <div className="h-[240px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics?.monthlySpending} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1E293B',
                          borderColor: '#334155',
                          borderRadius: '10px',
                          color: '#F8FAFC',
                        }}
                        formatter={(value: unknown) => [formatCurrency(Number(value)), 'Monthly Spend']}
                      />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#8B5CF6"
                        strokeWidth={3}
                        dot={{ fill: '#8B5CF6', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Transactions Table */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-[#111827] border border-[#1E293B] shadow-xl flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Recent Transactions</h3>
                    <p className="text-xs text-gray-400">Latest recorded transactions</p>
                  </div>
                  <Link
                    to="/expenses"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                  >
                    <span>View All</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {!analytics?.recentTransactions || analytics.recentTransactions.length === 0 ? (
                  <EmptyState
                    title="No recent expenses"
                    description="You haven't recorded any expenses yet."
                    minHeight="min-h-[200px]"
                    icon={Receipt}
                  />
                ) : (
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#1E293B] text-[11px] font-semibold uppercase text-gray-400">
                          <th className="pb-3 pl-2">Description</th>
                          <th className="pb-3">Category</th>
                          <th className="pb-3">Date</th>
                          <th className="pb-3">Mode</th>
                          <th className="pb-3 text-right pr-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E293B]/60 text-xs">
                        {analytics.recentTransactions.map((exp) => (
                          <tr key={exp.expenseId} className="hover:bg-[#1E293B]/30 transition-colors">
                            <td className="py-3 pl-2 font-medium text-gray-200">
                              {exp.description || 'Expense'}
                            </td>
                            <td className="py-3 text-gray-300">
                              <span className="px-2 py-0.5 rounded-md bg-[#1E293B] border border-[#334155] text-[11px]">
                                {exp.categoryName || 'General'}
                              </span>
                            </td>
                            <td className="py-3 text-gray-400 font-mono text-[11px]">
                              {formatDate(exp.expenseDate)}
                            </td>
                            <td className="py-3 text-gray-400">{exp.paymentMode}</td>
                            <td className="py-3 text-right pr-2 font-semibold text-rose-400 font-mono">
                              -{formatCurrency(exp.amount)}
                            </td>
                          </tr>
                        ))}
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
