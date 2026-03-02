'use client';

import { useState, useEffect } from 'react';
import { apiClient, type ExpenseClaim } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { FeatureGate } from '@/components/common/feature-gate';
import { Permission } from '@hrplatform/shared';
import { PageContainer } from '@/components/ui/page-container';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { StatCard } from '@/components/ui/stat-card';
import { ErrorBanner } from '@/components/ui/error-banner';
import { TableLoader } from '@/components/ui/page-loader';
import { useToast } from '@/components/ui/toast';
import {
  Plus, Loader2, AlertCircle, Receipt, DollarSign, Clock,
  CheckCircle2, XCircle, CreditCard
} from 'lucide-react';

const categories = ['TRAVEL', 'FOOD', 'ACCOMMODATION', 'EQUIPMENT', 'COMMUNICATION', 'TRAINING', 'OTHER'];

const INITIAL_FORM = { title: '', description: '', category: 'TRAVEL', amount: '', expenseDate: '' };

export default function ExpensesPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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

  const fetchCurrent = () => activeTab === 'my' ? fetchMyExpenses() : fetchAllExpenses();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await apiClient.createExpense({
        ...form,
        amount: Number(form.amount),
      });
      setShowForm(false);
      setForm(INITIAL_FORM);
      toast.success('Expense submitted', 'Your expense claim has been submitted successfully.');
      fetchCurrent();
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await apiClient.approveExpense(id);
      toast.success('Expense approved', 'The expense claim has been approved.');
      fetchAllExpenses();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await apiClient.rejectExpense(id);
      toast.success('Expense rejected', 'The expense claim has been rejected.');
      fetchAllExpenses();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openNewForm = () => {
    setShowForm(true);
    setForm(INITIAL_FORM);
    setFormError(null);
  };

  // Stats
  const pending = expenses.filter(e => e.status === 'PENDING').length;
  const approved = expenses.filter(e => e.status === 'APPROVED').length;
  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const inputClass = 'w-full h-10 px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';

  return (
    <FeatureGate feature="EXPENSES">
      <RoleGate requiredPermissions={[Permission.VIEW_EXPENSES, Permission.MANAGE_EXPENSES, Permission.SUBMIT_EXPENSE]}>
        <PageContainer
          title="Expense Management"
          description="Submit and manage expense claims"
          breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Expenses' }]}
          actions={
            <button
              onClick={openNewForm}
              className="inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> Submit Expense
            </button>
          }
        >
          {error && <ErrorBanner message={error} onDismiss={() => setError(null)} onRetry={fetchCurrent} />}

          {/* Stats */}
          {!loading && expenses.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Claims" value={expenses.length} icon={Receipt} iconColor="blue" subtitle="All claims" />
              <StatCard title="Pending" value={pending} icon={Clock} iconColor="amber" subtitle="Awaiting review" />
              <StatCard title="Approved" value={approved} icon={CheckCircle2} iconColor="green" subtitle="Ready for reimbursement" />
              <StatCard title="Total Amount" value={`${totalAmount.toLocaleString()}`} icon={DollarSign} iconColor="purple" subtitle="Across all claims" />
            </div>
          )}

          {/* Tabs */}
          <div className="flex space-x-1 border-b border-border">
            <button
              onClick={() => setActiveTab('my')}
              className={`pb-3 px-4 font-medium text-sm transition-colors ${
                activeTab === 'my'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              My Expenses
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-3 px-4 font-medium text-sm transition-colors ${
                activeTab === 'all'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Expenses
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="rounded-xl border bg-card overflow-hidden">
              <TableLoader rows={6} cols={5} />
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border bg-card">
              <Receipt className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No expense claims found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {activeTab === 'my' ? 'Submit your first expense claim to get started.' : 'No expense claims have been submitted yet.'}
              </p>
              {activeTab === 'my' && (
                <button onClick={openNewForm} className="mt-4 inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                  <Plus className="w-4 h-4" /> Submit Expense
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border bg-card overflow-hidden">
              <table className="min-w-full divide-y">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    {activeTab === 'all' && <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {expenses.map(expense => (
                    <tr key={expense.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center flex-shrink-0">
                            <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">{expense.title}</div>
                            {expense.description && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{expense.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">{expense.category}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{expense.currency} {Number(expense.amount).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(expense.expenseDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <StatusBadge variant={getStatusVariant(expense.status)} dot>
                          {expense.status}
                        </StatusBadge>
                      </td>
                      {activeTab === 'all' && (
                        <td className="px-4 py-3">
                          {expense.status === 'PENDING' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleApprove(expense.id)}
                                className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-400 dark:hover:bg-green-950/50 transition-colors"
                              >
                                <CheckCircle2 className="w-3 h-3" /> Approve
                              </button>
                              <button
                                onClick={() => handleReject(expense.id)}
                                className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50 transition-colors"
                              >
                                <XCircle className="w-3 h-3" /> Reject
                              </button>
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

          {/* Create Modal */}
          <Modal open={showForm} onClose={() => setShowForm(false)} size="lg">
            <ModalHeader onClose={() => setShowForm(false)}>Submit Expense Claim</ModalHeader>
            <form onSubmit={handleCreate}>
              <ModalBody>
                <div className="space-y-4">
                  {formError && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-sm text-red-700 dark:text-red-400">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {formError}
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Title <span className="text-destructive">*</span></label>
                    <input type="text" required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className={inputClass} placeholder="Business trip to Mumbai" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Category <span className="text-destructive">*</span></label>
                      <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inputClass}>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Amount <span className="text-destructive">*</span></label>
                      <input type="number" required min="1" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} className={inputClass} placeholder="0.00" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Expense Date <span className="text-destructive">*</span></label>
                      <input type="date" required value={form.expenseDate} onChange={e => setForm(p => ({ ...p, expenseDate: e.target.value }))} className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Description</label>
                      <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className={inputClass} placeholder="Optional details" />
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <button type="button" onClick={() => setShowForm(false)} disabled={submitting}
                  className="h-9 px-4 border border-input rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="h-9 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit Claim
                </button>
              </ModalFooter>
            </form>
          </Modal>
        </PageContainer>
      </RoleGate>
    </FeatureGate>
  );
}
