import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import Header from '../components/Header';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { budgetService, BudgetPayload } from '../services/budgetService';
import { categoryService } from '../services/categoryService';
import { Budget, Category } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { getCurrentMonthAndYear } from '../utils/dateUtils';

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

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingBudget(null);
    setFormCategory(categories[0] ? String(categories[0].categoryId) : '');
    setFormAmount('');
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (b: Budget) => {
    setEditingBudget(b);
    setFormCategory(String(b.categoryId));
    setFormAmount(String(b.budgetAmount));
    setModalError(null);
    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) {
      setModalError('Please enter a valid positive budget amount.');
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
      budgetAmount: amt,
    };

    setModalSubmitting(true);
    try {
      if (editingBudget) {
        await budgetService.updateBudget(editingBudget.budgetId, payload);
        showSuccess('Budget updated successfully');
      } else {
        await budgetService.createBudget(payload);
        showSuccess('Budget created successfully');
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

  // Trigger Delete Confirmation
  const handleDeleteClick = (b: Budget) => {
    setDeleteBudgetItem(b);
  };

  const confirmDeleteBudget = async () => {
    if (!deleteBudgetItem) return;
    setDeleting(true);
    try {
      await budgetService.deleteBudget(deleteBudgetItem.budgetId);
      showSuccess(`Budget for ${deleteBudgetItem.categoryName} removed successfully`);
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
    <div className="flex-1 flex flex-col min-h-0 bg-[#0B0F19]">
      <Header
        title="Budget Planning"
        subtitle="Set spending limits and monitor threshold alerts"
        month={month}
        year={year}
        onMonthChange={setMonth}
        onYearChange={setYear}
        actions={
          <button
            onClick={handleOpenAdd}
            className="px-3 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Set Budget</span>
            <span className="sm:hidden">Set</span>
          </button>
        }
      />

      <div className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <LoadingState message="Loading monthly category budgets..." minHeight="min-h-[350px]" />
        ) : budgets.length === 0 ? (
          <EmptyState
            title="No budgets configured"
            description="You have not set any category budgets for this month."
            actionText="Create Category Budget"
            onAction={handleOpenAdd}
            icon={Target}
            minHeight="min-h-[300px]"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((b) => {
              const pct = b.percentageUsed ?? 0;
              const isExceeded = b.status === 'EXCEEDED' || pct >= 100;
              const isWarning = b.status === 'WARNING' || (pct >= 90 && pct < 100);
              const isApproaching = b.status === 'APPROACHING' || (pct >= 75 && pct < 90);

              let badgeBg = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
              let barColor = 'bg-emerald-500';

              if (isExceeded) {
                badgeBg = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
                barColor = 'bg-rose-500';
              } else if (isWarning) {
                badgeBg = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
                barColor = 'bg-amber-500';
              } else if (isApproaching) {
                badgeBg = 'bg-blue-500/15 text-blue-300 border-blue-500/30';
                barColor = 'bg-blue-500';
              }

              return (
                <div
                  key={b.budgetId}
                  className="p-5 sm:p-6 rounded-2xl bg-[#111827] border border-[#1E293B] shadow-xl flex flex-col justify-between hover:border-[#334155] transition-all"
                >
                  <div>
                    {/* Header: Category & Threshold Badge */}
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div className="min-w-0">
                        <h4 className="font-bold text-base text-white truncate">
                          {b.categoryName}
                        </h4>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Monthly Budget: <span className="text-gray-200 font-mono font-medium">{formatCurrency(b.budgetAmount)}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${badgeBg} flex items-center gap-1`}
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

                    {/* Progress Bar with Percentage */}
                    <div className="space-y-2 mt-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Spent: <strong className="text-white font-mono">{formatCurrency(b.amountSpent)}</strong></span>
                        <span className="font-mono font-bold text-gray-200">
                          {pct}%
                        </span>
                      </div>

                      <div className="w-full h-2.5 rounded-full bg-[#1A2234] border border-[#2D3748] overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>

                      {/* Remaining / Overspent helper */}
                      <div className="flex items-center justify-between text-[11px] pt-1 text-gray-400">
                        {(() => {
                          const remaining = b.remainingAmount ?? (b.budgetAmount - (b.amountSpent ?? 0));
                          return (
                            <span>
                              {remaining < 0 ? (
                                <span className="text-rose-400 font-semibold">
                                  Exceeded by {formatCurrency(Math.abs(remaining))}
                                </span>
                              ) : (
                                <span>Remaining: <strong className="text-emerald-400 font-mono">{formatCurrency(remaining)}</strong></span>
                              )}
                            </span>
                          );
                        })()}
                        <span className="text-gray-500">Cap: {formatCurrency(b.budgetAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="mt-6 pt-4 border-t border-[#1E293B] flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEdit(b)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                      title="Edit Budget"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(b)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete Budget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111827] border border-[#1E293B] rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
              <h3 className="text-lg font-bold text-white tracking-tight">
                {editingBudget ? 'Edit Category Budget' : 'Set Category Budget'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Category *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  required
                  className="w-full bg-[#1A2234] border border-[#2D3748] rounded-xl px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="" disabled>Select category</option>
                  {categories.map((c) => (
                    <option key={c.categoryId} value={c.categoryId}>
                      {c.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Monthly Budget Amount (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-gray-400 font-mono text-sm">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="500.00"
                    required
                    className="w-full bg-[#1A2234] border border-[#2D3748] rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-gray-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#1A2234] border border-[#2D3748] text-gray-400 text-[11px]">
                Budget applies to: <strong className="text-gray-200">{month}/{year}</strong>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
        } for "${deleteBudgetItem?.categoryName || 'this category'}"?`}
        confirmText="Delete Budget"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDeleteBudget}
        onCancel={() => setDeleteBudgetItem(null)}
      />
    </div>
  );
}
