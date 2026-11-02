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
import { budgetService, BudgetPayload } from '../services/budgetService';
import { categoryService } from '../services/categoryService';
import { Budget, Category } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { getCurrentMonthAndYear } from '../utils/dateUtils';

export default function Budgets() {
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
      } else {
        await budgetService.createBudget(payload);
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

  // Handle Delete
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;
    try {
      await budgetService.deleteBudget(id);
      loadBudgets();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      alert(errorObj.response?.data?.message || 'Failed to delete budget.');
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
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Set Budget</span>
          </button>
        }
      />

      <div className="flex-1 p-8 overflow-y-auto space-y-6">
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
                  className="p-6 rounded-2xl bg-[#111827] border border-[#1E293B] shadow-xl flex flex-col justify-between hover:border-[#334155] transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-white tracking-tight">{b.categoryName}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                          {b.status || 'NORMAL'}
                        </span>
                        <button
                          onClick={() => handleOpenEdit(b)}
                          title="Edit"
                          className="p-1 rounded text-gray-400 hover:text-blue-400 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(b.budgetId)}
                          title="Delete"
                          className="p-1 rounded text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-5 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-gray-400">Used: {pct}%</span>
                        <span className="text-gray-200">
                          {formatCurrency(b.amountSpent)} / {formatCurrency(b.budgetAmount)}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#1A2234] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Remaining Info */}
                    <div className="mt-4 pt-3 border-t border-[#1E293B] flex items-center justify-between text-xs">
                      <span className="text-gray-400">Remaining</span>
                      <span
                        className={`font-mono font-bold ${
                          (b.remainingAmount ?? 0) < 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {formatCurrency(b.remainingAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Status Helper */}
                  <div className="mt-4 flex items-center gap-2 text-[11px] text-gray-400">
                    {isExceeded ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-rose-300 font-medium">Budget exceeded!</span>
                      </>
                    ) : isWarning ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-amber-300 font-medium">Over 90% threshold reached.</span>
                      </>
                    ) : isApproaching ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-blue-300 font-medium">Over 75% threshold reached.</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300 font-medium">Within safe budget limit.</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Set / Edit Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#111827] border border-[#1E293B] rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
              <h3 className="text-lg font-bold text-white tracking-tight">
                {editingBudget ? 'Edit Budget' : 'Set Category Budget'}
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
                  Monthly Budget Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="500.00"
                  required
                  className="w-full bg-[#1A2234] border border-[#2D3748] rounded-xl px-3.5 py-2.5 text-sm text-gray-100 font-mono focus:outline-none focus:border-blue-500"
                />
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
    </div>
  );
}
