import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Target,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Wallet,
  TrendingDown,
  Scale,
} from 'lucide-react';
import Header from '../components/Header';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { BudgetSkeleton } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';
import { budgetService, BudgetPayload } from '../services/budgetService';
import { categoryService } from '../services/categoryService';
import { Budget, Category } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { getCurrentMonthAndYear, formatMonthName } from '../utils/dateUtils';

export default function Budgets() {
  const { showSuccess, showError } = useToast();
  const current = getCurrentMonthAndYear();
  const [month, setMonth] = useState(current.month);
  const [year, setYear] = useState(current.year);

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete State
  const [deleteBudgetItem, setDeleteBudgetItem] = useState<Budget | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form Fields
  const [formCategory, setFormCategory] = useState('');
  const [formAmount, setFormAmount] = useState('');

  // Load Categories on mount
  useEffect(() => {
    categoryService.getCategories().then(setCategories).catch(console.error);
  }, []);

  const loadBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await budgetService.getBudgets(month, year);
      setBudgets(data);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setError(errorObj.response?.data?.message || 'Failed to load budgets.');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  // Aggregate monthly budget metrics
  const budgetSummary = useMemo(() => {
    const totalBudget = budgets.reduce((acc, b) => acc + (b.budgetAmount || 0), 0);
    const totalSpent = budgets.reduce((acc, b) => acc + (b.amountSpent || 0), 0);
    const remaining = totalBudget - totalSpent;
    const overallPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    return {
      totalBudget,
      totalSpent,
      remaining,
      overallPct,
    };
  }, [budgets]);

  // Open Modal for Add
  const handleOpenAdd = () => {
    setEditingBudget(null);
    const firstAvailableCategory = categories.find((c) => !budgets.some((b) => b.categoryId === c.categoryId));
    setFormCategory(firstAvailableCategory ? String(firstAvailableCategory.categoryId) : '');
    setFormAmount('');
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (b: Budget) => {
    setEditingBudget(b);
    setFormCategory(String(b.categoryId));
    setFormAmount(String(b.budgetAmount));
    setModalError(null);
    setIsModalOpen(true);
  };

  // Submit Budget Form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const amountNum = parseFloat(formAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setModalError('Please enter a valid budget amount greater than 0.');
      return;
    }

    if (!formCategory) {
      setModalError('Please select a category.');
      return;
    }

    const payload: BudgetPayload = {
      categoryId: parseInt(formCategory),
      month,
      year,
      budgetAmount: amountNum,
    };

    setModalSubmitting(true);
    try {
      if (editingBudget) {
        await budgetService.updateBudget(editingBudget.budgetId, payload);
        showSuccess(`Budget for ${editingBudget.categoryName} updated`);
      } else {
        await budgetService.createBudget(payload);
        showSuccess('New category budget allocated');
      }
      setIsModalOpen(false);
      loadBudgets();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setModalError(errorObj.response?.data?.message || 'Failed to save budget.');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Trigger Delete confirmation
  const handleDeleteClick = (b: Budget) => {
    setDeleteBudgetItem(b);
  };

  // Execute Delete
  const confirmDeleteBudget = async () => {
    if (!deleteBudgetItem) return;

    setDeleting(true);
    try {
      await budgetService.deleteBudget(deleteBudgetItem.budgetId);
      showSuccess(`Deleted budget for ${deleteBudgetItem.categoryName}`);
      setDeleteBudgetItem(null);
      loadBudgets();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      showError(errorObj.response?.data?.message || 'Failed to delete budget.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-foundation-bg">
      <Header
        title="Budget Allocation"
        subtitle="Manage category spending caps and track utilization"
        month={month}
        year={year}
        onMonthChange={setMonth}
        onYearChange={setYear}
        actions={
          <button
            onClick={handleOpenAdd}
            className="px-3.5 sm:px-4 py-2 rounded-lg bg-brand-teal hover:bg-brand-tealLight text-white text-xs font-medium flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Set Budget</span>
            <span className="sm:hidden">Set</span>
          </button>
        }
      />

      <div className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-6 sm:space-y-8">
        {/* Monthly Aggregate Overview */}
        {!loading && budgets.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-4 sm:p-5 rounded-xl bg-foundation-surface border border-foundation-border shadow-sm flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Total Budget</p>
                <p className="text-base font-bold text-white font-mono tabular-nums mt-0.5 truncate">
                  {formatCurrency(budgetSummary.totalBudget)}
                </p>
                <p className="text-[10px] text-gray-400">{budgets.length} Categories</p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-foundation-surface border border-foundation-border shadow-sm flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Total Spent</p>
                <p className="text-base font-bold text-white font-mono tabular-nums mt-0.5 truncate">
                  {formatCurrency(budgetSummary.totalSpent)}
                </p>
                <p className="text-[10px] text-gray-400">{budgetSummary.overallPct}% utilized</p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-foundation-surface border border-foundation-border shadow-sm flex items-center gap-3.5">
              <div
                className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${
                  budgetSummary.remaining < 0
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}
              >
                <Scale className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  {budgetSummary.remaining < 0 ? 'Deficit' : 'Remaining Buffer'}
                </p>
                <p
                  className={`text-base font-bold font-mono tabular-nums mt-0.5 truncate ${
                    budgetSummary.remaining < 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {formatCurrency(Math.abs(budgetSummary.remaining))}
                </p>
                <p className="text-[10px] text-gray-400">
                  {budgetSummary.remaining < 0 ? 'Over limit cap' : 'Available balance'}
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-foundation-surface border border-foundation-border shadow-sm flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center text-brand-tealLight shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Overall Progress</p>
                <p className="text-base font-bold text-brand-tealLight font-mono tabular-nums mt-0.5">
                  {budgetSummary.overallPct}%
                </p>
                <p className="text-[10px] text-gray-400">{formatMonthName(month)} {year}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <BudgetSkeleton />
        ) : budgets.length === 0 ? (
          <EmptyState
            title="No budgets configured"
            description={`You have not set any category budgets for ${formatMonthName(month)} ${year}. Allocate spending limits to track category thresholds.`}
            actionText="Create Category Budget"
            onAction={handleOpenAdd}
            icon={Target}
            minHeight="min-h-[280px]"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {budgets.map((b) => {
              const pct = b.percentageUsed ?? 0;
              const isExceeded = b.status === 'EXCEEDED' || pct >= 100;
              const isWarning = b.status === 'WARNING' || (pct >= 90 && pct < 100);

              let badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
              let barColor = 'bg-brand-teal';

              if (isExceeded) {
                badgeBg = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                barColor = 'bg-semantic-rose';
              } else if (isWarning) {
                badgeBg = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                barColor = 'bg-semantic-amber';
              }

              const remaining = b.remainingAmount ?? (b.budgetAmount - (b.amountSpent ?? 0));

              return (
                <div
                  key={b.budgetId}
                  className="p-5 rounded-xl bg-foundation-surface border border-foundation-border shadow-sm flex flex-col justify-between hover:border-[#2f3d52] transition-colors"
                >
                  <div>
                    {/* Header: Category Title & Threshold Badge */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm sm:text-base text-white truncate">
                          {b.categoryName}
                        </h4>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Limit Cap: <span className="text-gray-200 font-mono tabular-nums font-medium">{formatCurrency(b.budgetAmount)}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${badgeBg} flex items-center gap-1`}
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
                      </div>
                    </div>

                    {/* Progress Bar with Benchmark Threshold Notches (75%, 90%, 100%) */}
                    <div className="space-y-2 mt-3.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">
                          Spent: <strong className="text-white font-mono tabular-nums">{formatCurrency(b.amountSpent)}</strong>
                        </span>
                        <span className="font-mono tabular-nums font-bold text-gray-200">
                          {pct}%
                        </span>
                      </div>

                      {/* Bar Track with Visual Markers */}
                      <div className="relative w-full">
                        <div className="w-full h-2 rounded-full bg-foundation-input border border-foundation-borderSubtle overflow-hidden relative">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>

                        {/* Benchmark Markers (75%, 90%) */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-gray-500/30 pointer-events-none"
                          style={{ left: '75%' }}
                          title="75% Approaching Threshold"
                        />
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-gray-500/30 pointer-events-none"
                          style={{ left: '90%' }}
                          title="90% Warning Threshold"
                        />
                      </div>

                      {/* Threshold Subtext */}
                      <div className="flex items-center justify-between text-[10px] text-gray-500 px-0.5 font-mono">
                        <span>0%</span>
                        <span className="text-gray-400">75%</span>
                        <span className="text-amber-400/80">90%</span>
                        <span className="text-rose-400/80">100%</span>
                      </div>

                      {/* Remaining / Overspent Status */}
                      <div className="flex items-center justify-between text-[11px] pt-1.5 text-gray-400 border-t border-foundation-border mt-2">
                        <span>
                          {remaining < 0 ? (
                            <span className="text-rose-400 font-semibold font-mono tabular-nums">
                              Exceeded by {formatCurrency(Math.abs(remaining))}
                            </span>
                          ) : (
                            <span>
                              Remaining:{' '}
                              <strong className="text-emerald-400 font-mono tabular-nums">
                                {formatCurrency(remaining)}
                              </strong>
                            </span>
                          )}
                        </span>
                        <span className="text-gray-500 font-mono">
                          Buffer: {Math.max(0, 100 - pct)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="mt-5 pt-3.5 border-t border-foundation-border flex items-center justify-between text-xs">
                    <span className="text-[11px] text-gray-500 font-mono">
                      {formatMonthName(month).slice(0, 3)} {year}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="px-2 py-1 rounded-md text-gray-400 hover:text-brand-tealLight hover:bg-foundation-surfaceElevated transition-colors flex items-center gap-1 cursor-pointer"
                        title="Edit Budget"
                        aria-label="Edit Budget"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(b)}
                        className="px-2 py-1 rounded-md text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Delete Budget"
                        aria-label="Delete Budget"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-foundation-surface border border-foundation-border rounded-xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3.5 border-b border-foundation-border">
              <h3 className="text-base font-bold text-white tracking-tight">
                {editingBudget ? 'Edit Category Budget' : 'Set Category Budget'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3.5 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-gray-300 mb-1">
                  Category *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  required
                  disabled={Boolean(editingBudget)}
                  className="w-full bg-foundation-input border border-foundation-inputBorder rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-200 focus:outline-none focus:border-brand-tealLight cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>Select category</option>
                  {categories.map((c) => {
                    const alreadyHasBudget = !editingBudget && budgets.some((b) => b.categoryId === c.categoryId);
                    return (
                      <option key={c.categoryId} value={c.categoryId} disabled={alreadyHasBudget}>
                        {c.categoryName} {alreadyHasBudget ? '(Budget already exists)' : ''}
                      </option>
                    );
                  })}
                </select>
                {editingBudget && (
                  <p className="text-[11px] text-gray-400 mt-1">Category cannot be changed when editing.</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">
                  Monthly Budget Amount (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 font-mono text-sm pointer-events-none">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="500.00"
                    required
                    className="w-full bg-foundation-input border border-foundation-inputBorder rounded-lg pl-7 pr-3 py-2 text-xs sm:text-sm text-gray-100 font-mono tabular-nums focus:outline-none focus:border-brand-tealLight focus:ring-1 focus:ring-brand-tealLight"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-foundation-surfaceElevated border border-foundation-borderSubtle text-gray-300 text-xs flex items-center justify-between">
                <span className="text-gray-400">Target Month:</span>
                <span className="font-semibold text-white">
                  {formatMonthName(month)} {year}
                </span>
              </div>

              <div className="pt-3.5 flex items-center justify-end gap-2.5 border-t border-foundation-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-4 py-2 rounded-lg bg-brand-teal hover:bg-brand-tealLight text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {modalSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingBudget ? 'Save Changes' : 'Set Budget'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation In-App Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteBudgetItem)}
        title="Delete Budget"
        message={`Are you sure you want to remove the monthly budget of ${
          deleteBudgetItem ? formatCurrency(deleteBudgetItem.budgetAmount) : ''
        } for "${deleteBudgetItem?.categoryName || 'this category'}" (${formatMonthName(month)} ${year})?`}
        confirmText="Delete Budget"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDeleteBudget}
        onCancel={() => setDeleteBudgetItem(null)}
      />
    </div>
  );
}
