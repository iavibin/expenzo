import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import Header from '../components/Header';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
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
  const [sortBy, setSortBy] = useState('date');
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

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingExpense(null);
    setFormDescription('');
    setFormAmount('');
    setFormCategory(categories[0] ? String(categories[0].categoryId) : '');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormPaymentMode('UPI');
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setFormDescription(exp.description);
    setFormAmount(String(exp.amount));
    setFormCategory(String(exp.categoryId));
    setFormDate(exp.expenseDate);
    setFormPaymentMode(exp.paymentMode || 'Cash');
    setModalError(null);
    setIsModalOpen(true);
  };

  // Handle Form Submit (Add or Edit)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) {
      setModalError('Please enter a valid positive amount.');
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
      description: formDescription.trim(),
      amount: amt,
      categoryId: parseInt(formCategory),
      expenseDate: formDate,
      paymentMode: formPaymentMode,
    };

    setModalSubmitting(true);
    try {
      if (editingExpense) {
        await expenseService.updateExpense(editingExpense.expenseId, payload);
        showSuccess('Expense updated successfully');
      } else {
        await expenseService.createExpense(payload);
        showSuccess('Expense recorded successfully');
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

  // Trigger Delete Confirmation
  const handleDeleteClick = (exp: Expense) => {
    setDeleteExpenseItem(exp);
  };

  const confirmDeleteExpense = async () => {
    if (!deleteExpenseItem) return;
    setDeleting(true);
    try {
      await expenseService.deleteExpense(deleteExpenseItem.expenseId);
      showSuccess('Expense deleted successfully');
      setDeleteExpenseItem(null);
      loadExpenses();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      showError(errorObj.response?.data?.message || 'Failed to delete expense.');
    } finally {
      setDeleting(false);
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

  const hasActiveFilters = Boolean(
    search || selectedCategory || startDate || endDate || sortBy !== 'date' || sortOrder !== 'desc'
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0B0F19]">
      <Header
        title="Expense Management"
        subtitle="Record, search, and categorize your transactions"
        actions={
          <button
            onClick={handleOpenAdd}
            className="px-3 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Expense</span>
            <span className="sm:hidden">Add</span>
          </button>
        }
      />

      <div className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-6">
        {/* Filters & Search Toolbar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#111827] border border-[#1E293B] shadow-md space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search description or note..."
                className="w-full bg-[#1A2234] border border-[#2D3748] rounded-xl pl-10 pr-4 py-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-[#1A2234] border border-[#2D3748] rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500 cursor-pointer"
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
              <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#1A2234] border border-[#2D3748] rounded-xl pl-8 pr-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              />
            </div>

            {/* End Date */}
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#1A2234] border border-[#2D3748] rounded-xl pl-8 pr-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Sort & Reset Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#1E293B] text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-gray-400 font-medium flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Sort by:</span>
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#1A2234] border border-[#2D3748] rounded-lg px-2.5 py-1 text-xs text-gray-200 focus:outline-none cursor-pointer"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="bg-[#1A2234] border border-[#2D3748] rounded-lg px-2.5 py-1 text-xs text-gray-200 focus:outline-none cursor-pointer"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1.5 font-medium px-2 py-1 rounded-lg hover:bg-blue-500/10 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Expenses List Card */}
        <div className="rounded-2xl bg-[#111827] border border-[#1E293B] shadow-xl overflow-hidden">
          {error && (
            <div className="p-4 bg-rose-500/10 border-b border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <LoadingState message="Loading your expenses..." minHeight="min-h-[350px]" />
          ) : expenses.length === 0 ? (
            <EmptyState
              title={hasActiveFilters ? 'No matching expenses' : 'No expenses recorded'}
              description={
                hasActiveFilters
                  ? 'No records match your selected filters. Try broadening your criteria.'
                  : 'Start tracking by recording your first expense transaction.'
              }
              actionText={hasActiveFilters ? 'Reset Filters' : 'Record New Expense'}
              onAction={hasActiveFilters ? handleResetFilters : handleOpenAdd}
              icon={Receipt}
              minHeight="min-h-[280px]"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[600px]">
                <thead>
                  <tr className="border-b border-[#1E293B] bg-[#0F172A]/80 text-[11px] font-semibold uppercase text-gray-400">
                    <th className="py-3.5 pl-6">Date</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">Mode</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 pr-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]/60">
                  {expenses.map((exp) => (
                    <tr key={exp.expenseId} className="hover:bg-[#1E293B]/40 transition-colors">
                      <td className="py-3.5 pl-6 text-gray-300 font-mono text-[11px]">
                        {formatDate(exp.expenseDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-md bg-[#1E293B] border border-[#334155] text-gray-200 font-medium text-[11px]">
                          {exp.categoryName || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-200 font-medium">
                        {exp.description || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-gray-400">
                        {exp.paymentMode || 'Cash'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-400 text-sm">
                        -{formatCurrency(exp.amount)}
                      </td>
                      <td className="py-3.5 pr-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(exp)}
                            title="Edit Expense"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(exp)}
                            title="Delete Expense"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111827] border border-[#1E293B] rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
              <h3 className="text-lg font-bold text-white tracking-tight">
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
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
                  Amount (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-gray-400 font-mono text-sm">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full bg-[#1A2234] border border-[#2D3748] rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-gray-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

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
                  Description / Merchant
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Starbucks, Groceries, Movie Tickets"
                  className="w-full bg-[#1A2234] border border-[#2D3748] rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full bg-[#1A2234] border border-[#2D3748] rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={formPaymentMode}
                    onChange={(e) => setFormPaymentMode(e.target.value)}
                    className="w-full bg-[#1A2234] border border-[#2D3748] rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
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
        } for "${deleteExpenseItem?.categoryName || 'General'}"? This action cannot be undone.`}
        confirmText="Delete Expense"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDeleteExpense}
        onCancel={() => setDeleteExpenseItem(null)}
      />
    </div>
  );
}
