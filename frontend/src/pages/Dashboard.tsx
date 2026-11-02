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
  TrendingUp,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import { DashboardSkeleton } from '../components/Skeleton';
import { analyticsService } from '../services/analyticsService';
import { budgetService } from '../services/budgetService';
import { AnalyticsSummary, BudgetAlert } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate, getCurrentMonthAndYear } from '../utils/dateUtils';
import { CHART_COLORS } from '../utils/chartColors';
import { Link } from 'react-router-dom';
import DotGrid from '../components/DotGrid';

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

  const hasExpenses = Boolean(analytics && analytics.totalExpenses > 0);
  const isOverBudget = Boolean(analytics && analytics.totalBudget > 0 && analytics.remainingBudget < 0);

  // Calculate trajectory comparison between last 2 recorded months
  const monthlySpendingList = analytics?.monthlySpending || [];
  const latestMonthData = monthlySpendingList.length > 0 ? monthlySpendingList[monthlySpendingList.length - 1] : null;
  const previousMonthData = monthlySpendingList.length > 1 ? monthlySpendingList[monthlySpendingList.length - 2] : null;

  let trajectoryDeltaText: string | null = null;
  let isTrajectoryUp = false;

  if (latestMonthData && previousMonthData) {
    const diff = latestMonthData.amount - previousMonthData.amount;
    isTrajectoryUp = diff > 0;
    if (diff === 0) {
      trajectoryDeltaText = 'Equal to previous month';
    } else {
      trajectoryDeltaText = `${isTrajectoryUp ? '+' : ''}${formatCurrency(diff)} vs ${previousMonthData.month}`;
    }
  }

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
          title="Financial Dashboard"
          subtitle="Real-time spending overview and budget tracking"
          month={month}
          year={year}
          onMonthChange={setMonth}
          onYearChange={setYear}
        />

        <div className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-6 sm:space-y-8">
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadDashboardData}
              className="text-xs bg-rose-500/15 px-3 py-1.5 rounded-lg hover:bg-rose-500/25 transition-colors cursor-pointer font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* 1. Primary Financial KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
                subtitle="Allocated category limits"
                icon={Wallet}
                variant="blue"
              />
              <StatCard
                title="Remaining Budget"
                value={formatCurrency(analytics?.remainingBudget || 0)}
                subtitle={
                  isOverBudget
                    ? 'Over budget limit'
                    : analytics?.totalBudget === 0
                    ? 'No budget allocated'
                    : 'Available spending balance'
                }
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
                variant="teal"
              />
            </div>

            {/* 2. Dynamic Budget Alert Banners */}
            {alerts && alerts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Budget Threshold Alerts
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-foundation-surfaceElevated border border-foundation-border text-gray-300 text-[10px] font-mono font-medium">
                      {alerts.length} active
                    </span>
                  </div>
                  <Link
                    to="/budgets"
                    className="text-xs text-brand-tealLight hover:underline flex items-center gap-1 font-medium transition-colors"
                  >
                    <span>Manage Budgets</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {alerts.map((alert) => {
                    const isExceeded = alert.status === 'EXCEEDED';
                    const isWarning = alert.status === 'WARNING';

                    let barColor = 'bg-brand-teal';
                    let badgeClass = 'bg-brand-teal/10 text-brand-tealLight border-brand-teal/20';

                    if (isExceeded) {
                      barColor = 'bg-semantic-rose';
                      badgeClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                    } else if (isWarning) {
                      barColor = 'bg-semantic-amber';
                      badgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                    }

                    return (
                      <div
                        key={alert.budgetId}
                        className="p-4 rounded-xl bg-foundation-surface border border-foundation-border flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {isExceeded ? (
                                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                              ) : isWarning ? (
                                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-brand-tealLight shrink-0" />
                              )}
                              <span className="font-semibold text-xs sm:text-sm text-white truncate">
                                {alert.categoryName}
                              </span>
                            </div>

                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${badgeClass} shrink-0`}
                            >
                              {alert.percentageUsed}%
                            </span>
                          </div>

                          <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                            {alert.message}
                          </p>
                        </div>

                        {/* Progress Track */}
                        <div className="mt-3 pt-2">
                          <div className="w-full h-1.5 rounded-full bg-foundation-input border border-foundation-borderSubtle overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                              style={{ width: `${Math.min(alert.percentageUsed, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Visual Charts Grid (Donut Chart & Monthly Spending Trends) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Category Breakdown Donut Chart with Central KPI */}
              <div className="p-5 sm:p-6 rounded-xl bg-foundation-surface border border-foundation-border flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                      Spending by Category
                    </h3>
                    <p className="text-xs text-gray-400">Monthly expense allocation across categories</p>
                  </div>
                  {hasExpenses && (
                    <span className="text-xs font-mono font-medium text-gray-400 px-2 py-0.5 rounded bg-foundation-surfaceElevated border border-foundation-border">
                      {analytics?.categoryBreakdown?.length || 0} Categories
                    </span>
                  )}
                </div>

                {!hasExpenses ? (
                  <EmptyState
                    title="No category expenses"
                    description="No expenses recorded for this month to display breakdown."
                    minHeight="min-h-[280px]"
                  />
                ) : (
                  <>
                    <div className="relative h-[270px] w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics?.categoryBreakdown}
                            dataKey="amount"
                            nameKey="categoryName"
                            cx="50%"
                            cy="50%"
                            innerRadius={72}
                            outerRadius={96}
                            paddingAngle={3}
                            stroke="#131923"
                            strokeWidth={2}
                          >
                            {analytics?.categoryBreakdown.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            position={{ y: 8 }}
                            wrapperStyle={{ zIndex: 40, pointerEvents: 'none' }}
                            allowEscapeViewBox={{ x: false, y: true }}
                            contentStyle={{
                              backgroundColor: '#1a2230',
                              borderColor: '#263345',
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                              padding: '6px 12px',
                              fontSize: '12px',
                              color: '#FFFFFF',
                            }}
                            itemStyle={{ color: '#FFFFFF' }}
                            labelStyle={{ color: '#FFFFFF' }}
                            formatter={(value: unknown, name: unknown) => [
                              formatCurrency(Number(value)),
                              String(name),
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      {/* Central Total KPI */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-10">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          Total Spent
                        </span>
                        <span className="text-xl sm:text-2xl font-bold text-white tracking-tight font-mono tabular-nums mt-0.5">
                          {formatCurrency(analytics?.totalExpenses || 0)}
                        </span>
                        <span className="text-[10px] text-gray-400 mt-0.5">
                          {analytics?.transactionCount || 0} Entries
                        </span>
                      </div>
                    </div>

                    {/* Category Legend */}
                    {analytics?.categoryBreakdown && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 pt-4 border-t border-foundation-border">
                        {analytics.categoryBreakdown.map((cat, idx) => {
                          const total = analytics.totalExpenses || 1;
                          const pct = Math.round((cat.amount / total) * 100);

                          return (
                            <div
                              key={cat.categoryName}
                              className="flex items-center justify-between p-2 rounded-lg bg-foundation-surfaceElevated/60 border border-foundation-borderSubtle text-xs text-gray-300"
                            >
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                <div
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                                />
                                <span className="truncate font-medium text-gray-200">
                                  {cat.categoryName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 font-mono tabular-nums">
                                <span className="text-gray-300 font-semibold">
                                  {formatCurrency(cat.amount)}
                                </span>
                                <span className="px-1.5 py-0.2 rounded bg-foundation-input text-gray-400 text-[10px] font-bold">
                                  {pct}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Monthly Spending Trend Bar Chart */}
              <div className="p-5 sm:p-6 rounded-xl bg-foundation-surface border border-foundation-border flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                        Monthly Spending Trends
                      </h3>
                      <p className="text-xs text-gray-400">Historical spending trajectory over past 6 months</p>
                    </div>
                  </div>

                  <div className="h-[270px] w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics?.monthlySpending}
                        margin={{ top: 12, right: 12, left: -10, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#0d9488" stopOpacity={0.6} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis
                          dataKey="month"
                          stroke="#64748B"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#222c3c' }}
                        />
                        <YAxis
                          stroke="#64748B"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#222c3c' }}
                          tickFormatter={(val) => (val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`)}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const item = payload[0].payload;
                              return (
                                <div className="p-2.5 bg-foundation-surfaceElevated border border-foundation-border rounded-lg text-xs">
                                  <p className="text-gray-400 font-medium">{item.month}</p>
                                  <p className="text-sm font-bold text-white font-mono tabular-nums mt-1">
                                    {formatCurrency(Number(payload[0].value))}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          dataKey="amount"
                          fill="url(#barGradient)"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={40}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-foundation-border flex items-center justify-between text-xs text-gray-400">
                  <span>6-Month Trajectory</span>
                  <span className="font-medium text-brand-tealLight font-mono">Actual Records</span>
                </div>
              </div>
            </div>

            {/* 4. Spending Trajectory (Area Chart) & Recent Transactions Table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Spending Trajectory Curve */}
              <div className="lg:col-span-1 p-5 sm:p-6 rounded-xl bg-foundation-surface border border-foundation-border flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                        Trend Curve
                      </h3>
                      <p className="text-xs text-gray-400">Month-over-month trajectory</p>
                    </div>

                    {trajectoryDeltaText && (
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 shrink-0 ${
                          isTrajectoryUp
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {isTrajectoryUp ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span>{trajectoryDeltaText}</span>
                      </span>
                    )}
                  </div>

                  <div className="h-[210px] w-full mt-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={analytics?.monthlySpending}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="trajectoryGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis
                          dataKey="month"
                          stroke="#64748B"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#222c3c' }}
                        />
                        <YAxis
                          stroke="#64748B"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#222c3c' }}
                          tickFormatter={(val) => (val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`)}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const item = payload[0].payload;
                              return (
                                <div className="p-2.5 bg-foundation-surfaceElevated border border-foundation-border rounded-lg text-xs">
                                  <p className="text-gray-400 font-medium">{item.month}</p>
                                  <p className="text-sm font-bold text-sky-400 font-mono tabular-nums mt-1">
                                    {formatCurrency(Number(payload[0].value))}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke="#38bdf8"
                          strokeWidth={2}
                          fill="url(#trajectoryGradient)"
                          dot={{ fill: '#38bdf8', r: 3, strokeWidth: 1.5, stroke: '#131923' }}
                          activeDot={{ r: 4, fill: '#38bdf8', strokeWidth: 1.5, stroke: '#FFFFFF' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-foundation-border text-[11px] text-gray-400 flex items-center justify-between">
                  <span>Outflow Pace</span>
                  <span className="text-gray-300 font-mono">Continuous</span>
                </div>
              </div>

              {/* Recent Transactions Table */}
              <div className="lg:col-span-2 p-5 sm:p-6 rounded-xl bg-foundation-surface border border-foundation-border flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                        Recent Transactions
                      </h3>
                      <p className="text-xs text-gray-400">Latest recorded expenses in your account</p>
                    </div>
                    <Link
                      to="/expenses"
                      className="text-xs text-brand-tealLight hover:underline flex items-center gap-1 font-medium transition-colors"
                    >
                      <span>View All</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {!analytics?.recentTransactions || analytics.recentTransactions.length === 0 ? (
                    <EmptyState
                      title="No recent expenses"
                      description="You haven't recorded any expenses yet."
                      minHeight="min-h-[190px]"
                      icon={Receipt}
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[420px]">
                        <thead>
                          <tr className="border-b border-foundation-border text-[11px] font-semibold uppercase text-gray-400">
                            <th className="pb-2.5 pl-2">Description</th>
                            <th className="pb-2.5">Category</th>
                            <th className="pb-2.5">Date</th>
                            <th className="pb-2.5">Mode</th>
                            <th className="pb-2.5 text-right pr-2">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-foundation-borderSubtle text-xs">
                          {analytics.recentTransactions.map((exp) => (
                            <tr key={exp.expenseId} className="hover:bg-foundation-surfaceElevated/50 transition-colors">
                              <td className="py-2.5 pl-2 font-medium text-gray-200">
                                {exp.description || 'Expense'}
                              </td>
                              <td className="py-2.5 text-gray-300">
                                <span className="px-2 py-0.5 rounded bg-foundation-surfaceElevated border border-foundation-borderSubtle text-[11px]">
                                  {exp.categoryName || 'General'}
                                </span>
                              </td>
                              <td className="py-2.5 text-gray-400 font-mono tabular-nums text-[11px]">
                                {formatDate(exp.expenseDate)}
                              </td>
                              <td className="py-2.5 text-gray-400">{exp.paymentMode}</td>
                              <td className="py-2.5 text-right pr-2 font-semibold text-rose-400 font-mono tabular-nums">
                                -{formatCurrency(exp.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-foundation-border flex items-center justify-between text-xs text-gray-400">
                  <span>5 Most Recent Entries</span>
                  <Link to="/expenses" className="text-brand-tealLight hover:underline text-[11px] font-medium">
                    Filter & Search &rarr;
                  </Link>
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
