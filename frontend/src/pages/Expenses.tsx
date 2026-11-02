import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Edit2,
  Calendar,
  X,
  Loader2,
  Receipt,
  AlertCircle,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CreditCard,
} from 'lucide-react';
import Header from '../components/Header';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { TableSkeleton } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';
import { expenseService, ExpensePayload } from '../services/expenseService';
import { categoryService } from '../services/categoryService';
import { Expense, Category } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';

export default function Expenses() {
  const { showSuccess, showError } = useToast();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete Dialog State
  const [deleteExpenseItem, setDeleteExpenseItem] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form Fields
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formPaymentMode, setFormPaymentMode] = useState('UPI');

  // Load Categories on mount
  useEffect(() => {
    categoryService.getCategories().then(setCategories).catch(console.error);
  }, []);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await expenseService.getExpenses({
        search: search.trim() || undefined,
        categoryId: selectedCategory ? parseInt(selectedCategory) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        sortOrder,
      });
      setExpenses(data);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setError(errorObj.response?.data?.message || 'Failed to load expenses.');
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, startDate, endDate, sortBy, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadExpenses();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadExpenses]);

  // Total filtered expense amount
  const totalFilteredAmount = useMemo(() => {
    return expenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);
  }, [expenses]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingExpense(null);
    setFormDescription('');
    setFormAmount('');
    setFormCategory(categories.length > 0 ? String(categories[0].categoryId) : '');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormPaymentMode('UPI');
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setFormDescription(exp.description || '');
    setFormAmount(String(exp.amount));
    setFormCategory(String(exp.categoryId));
    setFormDate(exp.expenseDate || new Date().toISOString().split('T')[0]);
    setFormPaymentMode(exp.paymentMode || 'UPI');
    setModalError(null);
    setIsModalOpen(true);
  };

  // Handle Form Submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const amountNum = parseFloat(formAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setModalError('Please enter a valid expense amount greater than 0.');
      return;
    }

    if (!formCategory) {
      setModalError('Please select a category.');
      return;
    }

    if (!formDate) {
      setModalError('Please select a date.');
      return;
    }

    const payload: ExpensePayload = {
      categoryId: parseInt(formCategory),
      amount: amountNum,
      expenseDate: formDate,
      paymentMode: formPaymentMode,
      description: formDescription.trim(),
    };

    setModalSubmitting(true);
    try {
      if (editingExpense) {
        await expenseService.updateExpense(editingExpense.expenseId, payload);
        showSuccess('Expense updated successfully');
      } else {
        await expenseService.createExpense(payload);
        showSuccess('New expense recorded');
      }
      setIsModalOpen(false);
      loadExpenses();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setModalError(errorObj.response?.data?.message || 'Failed to save expense.');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Trigger Delete confirmation
  const handleDeleteClick = (exp: Expense) => {
    setDeleteExpenseItem(exp);
  };

  // Execute Delete
  const confirmDeleteExpense = async () => {
    if (!deleteExpenseItem) return;

    setDeleting(true);
    try {
      await expenseService.deleteExpense(deleteExpenseItem.expenseId);
      showSuccess(`Deleted expense: ${deleteExpenseItem.description || formatCurrency(deleteExpenseItem.amount)}`);
      setDeleteExpenseItem(null);
      loadExpenses();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      showError(errorObj.response?.data?.message || 'Failed to delete expense.');
    } finally {
      setDeleting(false);
    }
  };

  // Toggle Sorting
  const handleSortToggle = (field: 'date' | 'amount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setStartDate('');
    setEndDate('');
    setSortBy('date');
    setSortOrder('desc');
  };

  const activeFilterCount =
    (search ? 1 : 0) +
    (selectedCategory ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0) +
    (sortBy !== 'date' || sortOrder !== 'desc' ? 1 : 0);

  const selectedCategoryName = categories.find((c) => String(c.categoryId) === selectedCategory)?.categoryName;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-foundation-bg">
      <Header
        title="Expense Management"
        subtitle="Record, search, and categorize your transactions"
        actions={
          <button
            onClick={handleOpenAdd}
            className="px-3.5 sm:px-4 py-2 rounded-lg bg-brand-teal hover:bg-brand-tealLight text-white text-xs font-medium flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Expense</span>
            <span className="sm:hidden">Add</span>
          </button>
        }
      />

      <div className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-6">
        {/* Filters & Search Toolbar */}
        <div className="p-4 sm:p-5 rounded-xl bg-foundation-surface border border-foundation-border shadow-sm space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search description or notes..."
                className="w-full bg-foundation-input border border-foundation-inputBorder rounded-lg pl-9 pr-8 py-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-brand-tealLight focus:ring-1 focus:ring-brand-tealLight transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-foundation-input border border-foundation-inputBorder rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-brand-tealLight cursor-pointer"
                aria-label="Filter by category"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.categoryId} value={c.categoryId}>
                    {c.categoryName}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="Start Date"
                aria-label="Start Date"
                className="w-full bg-foundation-input border border-foundation-inputBorder rounded-lg pl-8 pr-2.5 py-2 text-xs text-gray-200 focus:outline-none focus:border-brand-tealLight cursor-pointer font-mono"
              />
            </div>

            {/* End Date */}
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                title="End Date"
                aria-label="End Date"
                className="w-full bg-foundation-input border border-foundation-inputBorder rounded-lg pl-8 pr-2.5 py-2 text-xs text-gray-200 focus:outline-none focus:border-brand-tealLight cursor-pointer font-mono"
              />
            </div>
          </div>

          {/* Active Filter Chips & Sort Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-foundation-border text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-gray-400 font-medium flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-brand-tealLight" />
                <span>Sort:</span>
              </span>

              <button
                onClick={() => handleSortToggle('date')}
                className={`px-2.5 py-1 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  sortBy === 'date'
                    ? 'bg-brand-teal/15 border-brand-teal/30 text-brand-tealLight font-semibold'
                    : 'bg-foundation-surfaceElevated border-foundation-borderSubtle text-gray-400 hover:text-gray-200'
                }`}
              >
                <span>Date</span>
                {sortBy === 'date' &&
                  (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
              </button>

              <button
                onClick={() => handleSortToggle('amount')}
                className={`px-2.5 py-1 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  sortBy === 'amount'
                    ? 'bg-brand-teal/15 border-brand-teal/30 text-brand-tealLight font-semibold'
                    : 'bg-foundation-surfaceElevated border-foundation-borderSubtle text-gray-400 hover:text-gray-200'
                }`}
              >
                <span>Amount</span>
                {sortBy === 'amount' &&
                  (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
              </button>
            </div>

            {/* Filter Summary & Reset Action */}
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-foundation-input text-gray-400 text-[11px] font-mono border border-foundation-borderSubtle">
                  {activeFilterCount} active {activeFilterCount === 1 ? 'filter' : 'filters'}
                </span>
              )}

              {activeFilterCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-gray-400 hover:text-brand-tealLight flex items-center gap-1 font-medium px-2 py-1 rounded-md hover:bg-foundation-surfaceElevated transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expenses Table Card */}
        <div className="rounded-xl bg-foundation-surface border border-foundation-border shadow-sm overflow-hidden">
          {/* Table Header Summary Strip */}
          <div className="p-3.5 px-5 bg-foundation-surfaceElevated/60 border-b border-foundation-border flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="font-semibold text-gray-200">
                {expenses.length} {expenses.length === 1 ? 'Transaction' : 'Transactions'}
              </span>
              {selectedCategoryName && (
                <span className="px-2 py-0.5 rounded bg-foundation-surface text-gray-300 text-[11px] border border-foundation-border">
                  Category: {selectedCategoryName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-400">Total Spent:</span>
              <span className="font-mono tabular-nums font-bold text-rose-400 text-sm">
                {formatCurrency(totalFilteredAmount)}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <TableSkeleton rows={6} />
          ) : expenses.length === 0 ? (
            <EmptyState
              title={activeFilterCount > 0 ? 'No matching expenses' : 'No expenses recorded'}
              description={
                activeFilterCount > 0
                  ? 'No records match your selected filters. Try broadening your criteria or reset filters.'
                  : 'Start tracking by recording your first expense transaction.'
              }
              actionText={activeFilterCount > 0 ? 'Reset Filters' : 'Record New Expense'}
              onAction={activeFilterCount > 0 ? handleResetFilters : handleOpenAdd}
              icon={Receipt}
              minHeight="min-h-[260px]"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[640px]">
                <thead>
                  <tr className="border-b border-foundation-border bg-foundation-surfaceElevated/30 text-[11px] font-semibold uppercase text-gray-400 select-none">
                    <th
                      onClick={() => handleSortToggle('date')}
                      className="py-3 pl-5 cursor-pointer hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Date</span>
                        {sortBy === 'date' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-brand-tealLight" /> : <ArrowDown className="w-3 h-3 text-brand-tealLight" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-gray-600" />
                        )}
                      </div>
                    </th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Description</th>
                    <th className="py-3 px-3">Payment Mode</th>
                    <th
                      onClick={() => handleSortToggle('amount')}
                      className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Amount</span>
                        {sortBy === 'amount' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-brand-tealLight" /> : <ArrowDown className="w-3 h-3 text-brand-tealLight" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-gray-600" />
                        )}
                      </div>
                    </th>
                    <th className="py-3 pr-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foundation-borderSubtle">
                  {expenses.map((exp) => (
                    <tr key={exp.expenseId} className="hover:bg-foundation-surfaceElevated/50 transition-colors">
                      <td className="py-3 pl-5 text-gray-300 font-mono tabular-nums text-[11px] whitespace-nowrap">
                        {formatDate(exp.expenseDate)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-foundation-surfaceElevated border border-foundation-borderSubtle text-gray-200 text-[11px]">
                          {exp.categoryName || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-200 font-medium max-w-[240px]">
                        <span className="line-clamp-1" title={exp.description || '—'}>
                          {exp.description || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-foundation-surfaceElevated text-gray-300 text-[11px] border border-foundation-borderSubtle">
                          <CreditCard className="w-3 h-3 text-gray-400" />
                          <span>{exp.paymentMode || 'Cash'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-rose-400 text-xs sm:text-sm whitespace-nowrap">
                        -{formatCurrency(exp.amount)}
                      </td>
                      <td className="py-3 pr-5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(exp)}
                            title="Edit Expense"
                            aria-label="Edit Expense"
                            className="p-1 rounded-md text-gray-400 hover:text-brand-tealLight hover:bg-foundation-surfaceElevated transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(exp)}
                            title="Delete Expense"
                            aria-label="Delete Expense"
                            className="p-1 rounded-md text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-foundation-surface border border-foundation-border rounded-xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3.5 border-b border-foundation-border">
              <h3 className="text-base font-bold text-white tracking-tight">
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
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
                  Amount (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 font-mono text-sm pointer-events-none">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full bg-foundation-input border border-foundation-inputBorder rounded-lg pl-7 pr-3 py-2 text-xs sm:text-sm text-gray-100 font-mono tabular-nums focus:outline-none focus:border-brand-tealLight focus:ring-1 focus:ring-brand-tealLight"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">
                  Category *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  required
                  className="w-full bg-foundation-input border border-foundation-inputBorder rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-200 focus:outline-none focus:border-brand-tealLight cursor-pointer"
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
                <label className="block font-semibold text-gray-300 mb-1">
                  Description / Merchant
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Groceries, Electricity Bill, Train ticket"
                  className="w-full bg-foundation-input border border-foundation-inputBorder rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-100 focus:outline-none focus:border-brand-tealLight"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full bg-foundation-input border border-foundation-inputBorder rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-brand-tealLight cursor-pointer font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={formPaymentMode}
                    onChange={(e) => setFormPaymentMode(e.target.value)}
                    className="w-full bg-foundation-input border border-foundation-inputBorder rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-brand-tealLight cursor-pointer"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
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
                    <span>{editingExpense ? 'Save Changes' : 'Add Expense'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation In-App Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteExpenseItem)}
        title="Delete Expense"
        message={`Are you sure you want to delete this expense of ${
          deleteExpenseItem ? formatCurrency(deleteExpenseItem.amount) : ''
        } for "${deleteExpenseItem?.categoryName || 'General'}"${
          deleteExpenseItem?.description ? ` (${deleteExpenseItem.description})` : ''
        }? This record will be permanently removed.`}
        confirmText="Delete Expense"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDeleteExpense}
        onCancel={() => setDeleteExpenseItem(null)}
      />
    </div>
  );
}
