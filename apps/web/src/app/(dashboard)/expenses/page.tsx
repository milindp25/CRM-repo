'use client';

import { useState, useEffect } from 'react';
import { apiClient, type ExpenseClaim } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { FeatureGate } from '@/components/common/feature-gate';
import { Permission } from '@hrplatform/shared';

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'TRAVEL', amount: '', expenseDate: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (activeTab === 'my') fetchMyExpenses();
    else fetchAllExpenses();
  }, [activeTab]);

  const fetchMyExpenses = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getMyExpenses();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllExpenses = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getExpenses();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await apiClient.createExpense({
        ...form,
        amount: Number(form.amount),
      });
      setShowCreate(false);
      setForm({ title: '', description: '', category: 'TRAVEL', amount: '', expenseDate: '' });
      setSuccess('Expense claim submitted');
      setTimeout(() => setSuccess(''), 3000);
      if (activeTab === 'my') fetchMyExpenses();
      else fetchAllExpenses();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await apiClient.approveExpense(id);
      setSuccess('Expense approved');
      setTimeout(() => setSuccess(''), 3000);
      fetchAllExpenses();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await apiClient.rejectExpense(id);
      setSuccess('Expense rejected');
      setTimeout(() => setSuccess(''), 3000);
      fetchAllExpenses();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      REIMBURSED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
  };

  const categories = ['TRAVEL', 'FOOD', 'ACCOMMODATION', 'EQUIPMENT', 'COMMUNICATION', 'TRAINING', 'OTHER'];

  return (
    <FeatureGate feature="EXPENSES">
      <RoleGate requiredPermissions={[Permission.VIEW_EXPENSES, Permission.MANAGE_EXPENSES, Permission.SUBMIT_EXPENSE]}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Expense Management</h1>
              <p className="text-gray-600 mt-1">Submit and manage expense claims</p>
            </div>
            <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
              {showCreate ? 'Cancel' : '+ Submit Expense'}
            </button>
          </div>

          {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}
          {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">{success}</div>}

          {showCreate && (
            <form onSubmit={handleCreate} className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Submit Expense Claim</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input type="text" required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Business trip to Mumbai" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (INR) *</label>
                  <input type="number" required min="1" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expense Date *</label>
                  <input type="date" required value={form.expenseDate} onChange={e => setForm(p => ({ ...p, expenseDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
              </div>
              <button type="submit" disabled={creating} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm">{creating ? 'Submitting...' : 'Submit Claim'}</button>
            </form>
          )}

          <div className="flex space-x-4 mb-6 border-b border-gray-200">
            <button onClick={() => setActiveTab('my')} className={`pb-3 px-1 font-medium text-sm ${activeTab === 'my' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              My Expenses
            </button>
            <button onClick={() => setActiveTab('all')} className={`pb-3 px-1 font-medium text-sm ${activeTab === 'all' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              All Expenses
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading expenses...</div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md"><p className="text-gray-500">No expense claims found</p></div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    {activeTab === 'all' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {expenses.map(expense => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{expense.title}</div>
                        {expense.description && <div className="text-xs text-gray-500">{expense.description}</div>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{expense.category}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{expense.currency} {Number(expense.amount).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(expense.expenseDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4">{statusBadge(expense.status)}</td>
                      {activeTab === 'all' && (
                        <td className="px-6 py-4">
                          {expense.status === 'PENDING' && (
                            <div className="flex gap-2">
                              <button onClick={() => handleApprove(expense.id)} className="text-xs text-green-600 hover:text-green-800 font-medium">Approve</button>
                              <button onClick={() => handleReject(expense.id)} className="text-xs text-red-600 hover:text-red-800 font-medium">Reject</button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </RoleGate>
    </FeatureGate>
  );
}
