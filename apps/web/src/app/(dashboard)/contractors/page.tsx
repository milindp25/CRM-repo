'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { PageContainer } from '@/components/ui/page-container';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { StatCard } from '@/components/ui/stat-card';
import { ErrorBanner } from '@/components/ui/error-banner';
import { TableLoader } from '@/components/ui/page-loader';
import {
  Plus, Users, DollarSign, FileText, Clock, ArrowLeft,
  Receipt, Loader2, AlertCircle, Briefcase, CheckCircle, XCircle, CreditCard,
} from 'lucide-react';

interface Contractor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  contractType: string;
  hourlyRate: number | null;
  startDate: string;
  endDate: string | null;
  status: string;
  invoices?: ContractorInvoice[];
}

interface ContractorInvoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  description: string | null;
  periodStart: string;
  periodEnd: string;
  status: string;
  submittedAt: string;
  paidAt: string | null;
}

export default function ContractorsPage() {
  const toast = useToast();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [invoices, setInvoices] = useState<ContractorInvoice[]>([]);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', companyName: '',
    contractType: 'HOURLY', hourlyRate: '', startDate: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({ amount: '', description: '', periodStart: '', periodEnd: '' });

  useEffect(() => { fetchContractors(); }, []);

  const fetchContractors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.request('/contractors');
      setContractors(Array.isArray(data) ? data : data?.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load contractors');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async (contractorId: string) => {
    try {
      const data = await apiClient.request(`/contractors/${contractorId}/invoices`);
      setInvoices(Array.isArray(data) ? data : data?.data || []);
    } catch {}
  };

  const validateContractor = (): string | null => {
    if (!form.firstName.trim()) return 'First name is required';
    if (!form.lastName.trim()) return 'Last name is required';
    if (!form.email.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) return 'Please enter a valid email address';
    if (!form.startDate) return 'Start date is required';
    if (form.contractType === 'HOURLY' && form.hourlyRate && Number(form.hourlyRate) <= 0)
      return 'Hourly rate must be greater than 0';
    return null;
  };

  const validateInvoice = (): string | null => {
    if (!invoiceForm.amount || Number(invoiceForm.amount) <= 0) return 'Invoice amount must be greater than 0';
    if (!invoiceForm.periodStart) return 'Period start date is required';
    if (!invoiceForm.periodEnd) return 'Period end date is required';
    if (new Date(invoiceForm.periodEnd) < new Date(invoiceForm.periodStart)) return 'Period end must be after period start';
    return null;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateContractor();
    if (validationError) { setFormError(validationError); return; }
    try {
      setSubmitting(true);
      setFormError(null);
      await apiClient.request('/contractors', {
        method: 'POST',
        body: JSON.stringify({ ...form, hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined }),
      });
      setShowCreate(false);
      setForm({ firstName: '', lastName: '', email: '', phone: '', companyName: '', contractType: 'HOURLY', hourlyRate: '', startDate: '' });
      toast.success('Contractor Added', `${form.firstName} ${form.lastName} has been added`);
      fetchContractors();
    } catch (err: any) {
      setFormError(err.message || 'Failed to add contractor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractor) return;
    const validationError = validateInvoice();
    if (validationError) { toast.error('Validation Error', validationError); return; }
    try {
      setSubmitting(true);
      await apiClient.request(`/contractors/${selectedContractor.id}/invoices`, {
        method: 'POST',
        body: JSON.stringify({ ...invoiceForm, amount: Number(invoiceForm.amount) }),
      });
      setShowInvoiceForm(false);
      setInvoiceForm({ amount: '', description: '', periodStart: '', periodEnd: '' });
      toast.success('Invoice Submitted', `$${Number(invoiceForm.amount).toLocaleString()} invoice created`);
      fetchInvoices(selectedContractor.id);
    } catch (err: any) {
      toast.error('Failed to submit invoice', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInvoiceAction = async (invoiceId: string, action: string) => {
    try {
      await apiClient.request(`/contractors/invoices/${invoiceId}/${action}`, { method: 'POST' });
      toast.success(`Invoice ${action.charAt(0).toUpperCase() + action.slice(1)}d`, `Invoice has been ${action}d`);
      if (selectedContractor) fetchInvoices(selectedContractor.id);
    } catch (err: any) {
      toast.error(`Failed to ${action} invoice`, err.message);
    }
  };

  const openCreateForm = () => {
    setShowCreate(true);
    setFormError(null);
    setForm({ firstName: '', lastName: '', email: '', phone: '', companyName: '', contractType: 'HOURLY', hourlyRate: '', startDate: '' });
  };

  const activeCount = contractors.filter(c => c.status === 'ACTIVE').length;
  const totalInvoices = contractors.reduce((sum, c) => sum + (c.invoices?.length || 0), 0);

  const inputClass = 'w-full h-10 px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';

  // Contractor detail view
  if (selectedContractor) {
    return (
      <PageContainer
        title={`${selectedContractor.firstName} ${selectedContractor.lastName}`}
        description={`${selectedContractor.contractType} contractor`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Contractors', href: '/contractors' },
          { label: `${selectedContractor.firstName} ${selectedContractor.lastName}` },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge variant={getStatusVariant(selectedContractor.status)} dot>
              {selectedContractor.status}
            </StatusBadge>
            <button
              onClick={() => setShowInvoiceForm(true)}
              className="inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Receipt className="w-4 h-4" /> New Invoice
            </button>
          </div>
        }
      >
        <button
          onClick={() => { setSelectedContractor(null); setInvoices([]); }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Contractors
        </button>

        {/* Contractor Details Card */}
        <div className="rounded-xl border bg-card p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Email</span>
            <p className="text-foreground">{selectedContractor.email}</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Contract Type</span>
            <p className="text-foreground">{selectedContractor.contractType.replace(/_/g, ' ')}</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Rate</span>
            <p className="text-foreground">{selectedContractor.hourlyRate ? `$${selectedContractor.hourlyRate}/hr` : 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Start Date</span>
            <p className="text-foreground">{new Date(selectedContractor.startDate).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Invoices Section */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Invoices</h2>
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Invoice #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Period</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-foreground font-medium">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-sm text-foreground">${Number(inv.amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(inv.periodStart).toLocaleDateString()} - {new Date(inv.periodEnd).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge variant={getStatusVariant(inv.status)}>{inv.status}</StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {inv.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleInvoiceAction(inv.id, 'approve')}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-md transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleInvoiceAction(inv.id, 'reject')}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-destructive hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}
                        {inv.status === 'APPROVED' && (
                          <button
                            onClick={() => handleInvoiceAction(inv.id, 'pay')}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 rounded-md transition-colors"
                          >
                            <CreditCard className="w-3.5 h-3.5" /> Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-sm font-medium text-foreground">No invoices yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Submit the first invoice for this contractor.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* New Invoice Modal */}
        <Modal open={showInvoiceForm} onClose={() => setShowInvoiceForm(false)} size="md">
          <ModalHeader onClose={() => setShowInvoiceForm(false)}>New Invoice</ModalHeader>
          <form onSubmit={handleSubmitInvoice}>
            <ModalBody>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Amount <span className="text-destructive">*</span></label>
                  <input type="number" value={invoiceForm.amount} onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                    placeholder="0.00" className={inputClass} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <input type="text" value={invoiceForm.description} onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                    placeholder="Invoice description" className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Period Start <span className="text-destructive">*</span></label>
                    <input type="date" value={invoiceForm.periodStart} onChange={(e) => setInvoiceForm({ ...invoiceForm, periodStart: e.target.value })}
                      className={inputClass} required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Period End <span className="text-destructive">*</span></label>
                    <input type="date" value={invoiceForm.periodEnd} onChange={(e) => setInvoiceForm({ ...invoiceForm, periodEnd: e.target.value })}
                      className={inputClass} required />
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <button type="button" onClick={() => setShowInvoiceForm(false)} disabled={submitting}
                className="h-9 px-4 border border-input rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="h-9 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Invoice
              </button>
            </ModalFooter>
          </form>
        </Modal>
      </PageContainer>
    );
  }

  // Main contractor list view
  return (
    <PageContainer
      title="Contractors"
      description="Manage contractors, freelancers, and their invoices"
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Contractors' }]}
      actions={
        <button
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Contractor
        </button>
      }
    >
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} onRetry={fetchContractors} />}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Contractors" value={contractors.length} icon={Users} iconColor="blue" loading={loading} />
        <StatCard title="Active" value={activeCount} icon={Briefcase} iconColor="green" loading={loading} />
        <StatCard title="Total Invoices" value={totalInvoices} icon={FileText} iconColor="purple" loading={loading} />
      </div>

      {/* Contractor List */}
      {loading ? (
        <div className="rounded-xl border bg-card overflow-hidden">
          <TableLoader rows={4} cols={4} />
        </div>
      ) : contractors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border bg-card">
          <Users className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No contractors yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">Add your first contractor to start managing freelancers and their invoices.</p>
          <button
            onClick={openCreateForm}
            className="mt-4 inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Contractor
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {contractors.map((c) => (
            <div
              key={c.id}
              onClick={() => { setSelectedContractor(c); fetchInvoices(c.id); }}
              className="rounded-xl border bg-card p-4 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{c.firstName} {c.lastName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {c.email} &middot; {c.contractType.replace(/_/g, ' ')} {c.hourlyRate ? `· $${c.hourlyRate}/hr` : ''}
                    </p>
                  </div>
                </div>
                <StatusBadge variant={getStatusVariant(c.status)} dot>{c.status}</StatusBadge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Contractor Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} size="lg">
        <ModalHeader onClose={() => setShowCreate(false)}>Add Contractor</ModalHeader>
        <form onSubmit={handleCreate}>
          <ModalBody>
            <div className="space-y-4">
              {formError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-sm text-red-700 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">First Name <span className="text-destructive">*</span></label>
                  <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    placeholder="John" className={inputClass} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Last Name <span className="text-destructive">*</span></label>
                  <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    placeholder="Doe" className={inputClass} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Email <span className="text-destructive">*</span></label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="john@example.com" className={inputClass} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Phone</label>
                  <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000" className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Contract Type</label>
                  <select value={form.contractType} onChange={(e) => setForm({ ...form, contractType: e.target.value })}
                    className={inputClass}>
                    <option value="HOURLY">Hourly</option>
                    <option value="FIXED_PRICE">Fixed Price</option>
                    <option value="MILESTONE">Milestone</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Hourly Rate</label>
                  <input type="number" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                    placeholder="0.00" className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Company Name</label>
                  <input type="text" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    placeholder="Freelance LLC" className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Start Date <span className="text-destructive">*</span></label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className={inputClass} required />
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <button type="button" onClick={() => setShowCreate(false)} disabled={submitting}
              className="h-9 px-4 border border-input rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="h-9 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Contractor
            </button>
          </ModalFooter>
        </form>
      </Modal>
    </PageContainer>
  );
}
