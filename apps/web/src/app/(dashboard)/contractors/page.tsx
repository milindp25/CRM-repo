'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';

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
  const [showCreate, setShowCreate] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [invoices, setInvoices] = useState<ContractorInvoice[]>([]);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', companyName: '',
    contractType: 'HOURLY', hourlyRate: '', startDate: '',
  });
  const [invoiceForm, setInvoiceForm] = useState({ amount: '', description: '', periodStart: '', periodEnd: '' });

  useEffect(() => { fetchContractors(); }, []);

  const fetchContractors = async () => {
    try {
      setLoading(true);
      const data = await apiClient.request('/contractors');
      setContractors(Array.isArray(data) ? data : data?.data || []);
    } catch (err: any) { toast.error('Failed to load contractors', err.message); }
    finally { setLoading(false); }
  };

  const fetchInvoices = async (contractorId: string) => {
    try {
      const data = await apiClient.request(`/contractors/${contractorId}/invoices`);
      setInvoices(Array.isArray(data) ? data : data?.data || []);
    } catch {}
  };

  const validateContractor = (): boolean => {
    if (!form.firstName.trim()) {
      toast.error('Validation Error', 'First name is required');
      return false;
    }
    if (!form.lastName.trim()) {
      toast.error('Validation Error', 'Last name is required');
      return false;
    }
    if (!form.email.trim()) {
      toast.error('Validation Error', 'Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast.error('Validation Error', 'Please enter a valid email address');
      return false;
    }
    if (!form.startDate) {
      toast.error('Validation Error', 'Start date is required');
      return false;
    }
    if (form.contractType === 'HOURLY' && form.hourlyRate && Number(form.hourlyRate) <= 0) {
      toast.error('Validation Error', 'Hourly rate must be greater than 0');
      return false;
    }
    return true;
  };

  const validateInvoice = (): boolean => {
    if (!invoiceForm.amount || Number(invoiceForm.amount) <= 0) {
      toast.error('Validation Error', 'Invoice amount must be greater than 0');
      return false;
    }
    if (!invoiceForm.periodStart) {
      toast.error('Validation Error', 'Period start date is required');
      return false;
    }
    if (!invoiceForm.periodEnd) {
      toast.error('Validation Error', 'Period end date is required');
      return false;
    }
    if (new Date(invoiceForm.periodEnd) < new Date(invoiceForm.periodStart)) {
      toast.error('Validation Error', 'Period end must be after period start');
      return false;
    }
    return true;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateContractor()) return;
    try {
      await apiClient.request('/contractors', {
        method: 'POST',
        body: JSON.stringify({ ...form, hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined }),
      });
      setShowCreate(false);
      setForm({ firstName: '', lastName: '', email: '', phone: '', companyName: '', contractType: 'HOURLY', hourlyRate: '', startDate: '' });
      toast.success('Contractor Added', `${form.firstName} ${form.lastName} has been added`);
      fetchContractors();
    } catch (err: any) { toast.error('Failed to add contractor', err.message); }
  };

  const handleSubmitInvoice = async () => {
    if (!selectedContractor) return;
    if (!validateInvoice()) return;
    try {
      await apiClient.request(`/contractors/${selectedContractor.id}/invoices`, {
        method: 'POST',
        body: JSON.stringify({ ...invoiceForm, amount: Number(invoiceForm.amount) }),
      });
      setShowInvoiceForm(false);
      setInvoiceForm({ amount: '', description: '', periodStart: '', periodEnd: '' });
      toast.success('Invoice Submitted', `$${Number(invoiceForm.amount).toLocaleString()} invoice created`);
      fetchInvoices(selectedContractor.id);
    } catch (err: any) { toast.error('Failed to submit invoice', err.message); }
  };

  const handleInvoiceAction = async (invoiceId: string, action: string) => {
    try {
      await apiClient.request(`/contractors/invoices/${invoiceId}/${action}`, { method: 'POST' });
      toast.success(`Invoice ${action.charAt(0).toUpperCase() + action.slice(1)}d`, `Invoice has been ${action}d`);
      if (selectedContractor) fetchInvoices(selectedContractor.id);
    } catch (err: any) { toast.error(`Failed to ${action} invoice`, err.message); }
  };

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    INACTIVE: 'bg-gray-100 dark:bg-gray-800 text-gray-500',
    TERMINATED: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    PENDING: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    APPROVED: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    PAID: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    REJECTED: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
  };

  if (selectedContractor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => { setSelectedContractor(null); setInvoices([]); }} className="text-muted-foreground hover:text-foreground">&larr; Back</button>
          <h1 className="text-2xl font-bold text-foreground">{selectedContractor.firstName} {selectedContractor.lastName}</h1>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedContractor.status]}`}>{selectedContractor.status}</span>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-muted-foreground">Email:</span> <span className="text-foreground ml-1">{selectedContractor.email}</span></div>
          <div><span className="text-muted-foreground">Type:</span> <span className="text-foreground ml-1">{selectedContractor.contractType}</span></div>
          <div><span className="text-muted-foreground">Rate:</span> <span className="text-foreground ml-1">{selectedContractor.hourlyRate ? `$${selectedContractor.hourlyRate}/hr` : '-'}</span></div>
          <div><span className="text-muted-foreground">Start:</span> <span className="text-foreground ml-1">{new Date(selectedContractor.startDate).toLocaleDateString()}</span></div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Invoices</h2>
          <button onClick={() => setShowInvoiceForm(!showInvoiceForm)} className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90">
            {showInvoiceForm ? 'Cancel' : 'New Invoice'}
          </button>
        </div>

        {showInvoiceForm && (
          <div className="bg-card border border-border rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <input type="number" value={invoiceForm.amount} onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })} placeholder="Amount" className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm" />
            <input type="date" value={invoiceForm.periodStart} onChange={(e) => setInvoiceForm({ ...invoiceForm, periodStart: e.target.value })} className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm" />
            <input type="date" value={invoiceForm.periodEnd} onChange={(e) => setInvoiceForm({ ...invoiceForm, periodEnd: e.target.value })} className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm" />
            <button onClick={handleSubmitInvoice} className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90">Submit</button>
          </div>
        )}

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Invoice #</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Period</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-4 py-3 text-sm text-foreground">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 text-sm text-foreground">${Number(inv.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(inv.periodStart).toLocaleDateString()} - {new Date(inv.periodEnd).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.status]}`}>{inv.status}</span></td>
                  <td className="px-4 py-3 flex gap-1">
                    {inv.status === 'PENDING' && (
                      <>
                        <button onClick={() => handleInvoiceAction(inv.id, 'approve')} className="text-xs text-green-600 hover:underline">Approve</button>
                        <button onClick={() => handleInvoiceAction(inv.id, 'reject')} className="text-xs text-red-600 hover:underline">Reject</button>
                      </>
                    )}
                    {inv.status === 'APPROVED' && (
                      <button onClick={() => handleInvoiceAction(inv.id, 'pay')} className="text-xs text-blue-600 hover:underline">Mark Paid</button>
                    )}
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No invoices</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contractors</h1>
          <p className="text-muted-foreground">Manage contractors, freelancers, and their invoices</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
          {showCreate ? 'Cancel' : 'Add Contractor'}
        </button>
      </div>


      {showCreate && (
        <form onSubmit={handleCreate} className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="First Name" className="px-3 py-2 border border-border rounded-lg bg-background text-foreground" required />
            <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Last Name" className="px-3 py-2 border border-border rounded-lg bg-background text-foreground" required />
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="px-3 py-2 border border-border rounded-lg bg-background text-foreground" required />
            <select value={form.contractType} onChange={(e) => setForm({ ...form, contractType: e.target.value })} className="px-3 py-2 border border-border rounded-lg bg-background text-foreground">
              <option value="HOURLY">Hourly</option>
              <option value="FIXED_PRICE">Fixed Price</option>
              <option value="MILESTONE">Milestone</option>
            </select>
            <input type="number" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} placeholder="Hourly Rate" className="px-3 py-2 border border-border rounded-lg bg-background text-foreground" />
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="px-3 py-2 border border-border rounded-lg bg-background text-foreground" required />
          </div>
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">Add Contractor</button>
        </form>
      )}

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : contractors.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No contractors</div>
        ) : contractors.map((c) => (
          <div key={c.id} onClick={() => { setSelectedContractor(c); fetchInvoices(c.id); }} className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">{c.firstName} {c.lastName}</h3>
                <p className="text-sm text-muted-foreground">{c.email} &middot; {c.contractType} {c.hourlyRate ? `· $${c.hourlyRate}/hr` : ''}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[c.status]}`}>{c.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
