'use client';

import { useState, useEffect } from 'react';
import { apiClient, type Policy } from '@/lib/api-client';
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
  Plus, Loader2, AlertCircle, FileText, Filter, X,
  BookOpen, Send, Eye, CheckCircle2, Archive, ScrollText
} from 'lucide-react';

const categories = ['HR', 'IT', 'FINANCE', 'COMPLIANCE', 'SAFETY', 'GENERAL'];

const INITIAL_FORM = {
  title: '', description: '', content: '', category: 'HR',
  version: '1.0', requiresAcknowledgment: false,
};

export default function PoliciesPage() {
  const toast = useToast();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchPolicies();
  }, [categoryFilter]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getPolicies({
        category: categoryFilter || undefined,
      });
      setPolicies(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await apiClient.createPolicy(form);
      setShowForm(false);
      setForm(INITIAL_FORM);
      toast.success('Policy created', 'New policy has been created successfully.');
      fetchPolicies();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create policy');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await apiClient.publishPolicy(id);
      toast.success('Policy published', 'The policy is now visible to employees.');
      fetchPolicies();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await apiClient.acknowledgePolicy(id);
      toast.success('Policy acknowledged', 'You have acknowledged this policy.');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openNewForm = () => {
    setShowForm(true);
    setForm(INITIAL_FORM);
    setFormError(null);
  };

  const hasFilters = !!categoryFilter;
  const clearFilters = () => setCategoryFilter('');

  // Stats
  const drafts = policies.filter(p => p.status === 'DRAFT').length;
  const published = policies.filter(p => p.status === 'PUBLISHED').length;
  const requireAck = policies.filter(p => p.requiresAcknowledgment).length;

  const inputClass = 'w-full h-10 px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';

  return (
    <FeatureGate feature="POLICIES">
      <RoleGate requiredPermissions={[Permission.VIEW_POLICIES, Permission.MANAGE_POLICIES, Permission.ACKNOWLEDGE_POLICY]}>
        <PageContainer
          title="Policies"
          description="Company policies, handbooks, and acknowledgments"
          breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Policies' }]}
          actions={
            <RoleGate requiredPermissions={[Permission.MANAGE_POLICIES]} hideOnly>
              <button
                onClick={openNewForm}
                className="inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" /> New Policy
              </button>
            </RoleGate>
          }
        >
          {error && <ErrorBanner message={error} onDismiss={() => setError(null)} onRetry={fetchPolicies} />}

          {/* Stats */}
          {!loading && policies.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Policies" value={policies.length} icon={ScrollText} iconColor="blue" subtitle="All policies" />
              <StatCard title="Published" value={published} icon={BookOpen} iconColor="green" subtitle="Active policies" />
              <StatCard title="Drafts" value={drafts} icon={FileText} iconColor="amber" subtitle="In progress" />
              <StatCard title="Require Ack." value={requireAck} icon={CheckCircle2} iconColor="purple" subtitle="Need acknowledgment" />
            </div>
          )}

          {/* Filter */}
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Filter className="w-4 h-4 text-muted-foreground" />
                Filters
              </div>
              {hasFilters && (
                <button onClick={clearFilters} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className={inputClass + ' !w-auto min-w-[160px]'}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="rounded-xl border bg-card overflow-hidden">
              <TableLoader rows={4} cols={3} />
            </div>
          ) : policies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border bg-card">
              <ScrollText className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No policies found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {hasFilters ? 'Try adjusting your filters to see results.' : 'Create your first policy to set company guidelines.'}
              </p>
              {!hasFilters && (
                <RoleGate requiredPermissions={[Permission.MANAGE_POLICIES]} hideOnly>
                  <button onClick={openNewForm} className="mt-4 inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                    <Plus className="w-4 h-4" /> Create Policy
                  </button>
                </RoleGate>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Policy List */}
              <div className="lg:col-span-1 space-y-2">
                {policies.map(policy => (
                  <div
                    key={policy.id}
                    onClick={() => setSelectedPolicy(policy)}
                    className={`rounded-xl border bg-card p-4 cursor-pointer transition-all hover:shadow-sm ${
                      selectedPolicy?.id === policy.id
                        ? 'border-primary ring-1 ring-primary/20'
                        : 'hover:border-muted-foreground/20'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-foreground text-sm leading-tight">{policy.title}</h3>
                      <StatusBadge variant={getStatusVariant(policy.status)}>
                        {policy.status}
                      </StatusBadge>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">{policy.category}</span>
                      <span className="text-xs text-muted-foreground">v{policy.version}</span>
                    </div>
                    {policy.requiresAcknowledgment && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 mt-2">
                        <CheckCircle2 className="w-3 h-3" /> Acknowledgment required
                      </span>
                    )}
                    {policy.status === 'DRAFT' && (
                      <RoleGate requiredPermissions={[Permission.MANAGE_POLICIES]} hideOnly>
                        <button
                          onClick={e => { e.stopPropagation(); handlePublish(policy.id); }}
                          className="mt-2 inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-400 dark:hover:bg-green-950/50 transition-colors"
                        >
                          <Send className="w-3 h-3" /> Publish
                        </button>
                      </RoleGate>
                    )}
                  </div>
                ))}
              </div>

              {/* Policy Content */}
              <div className="lg:col-span-2">
                {selectedPolicy ? (
                  <div className="rounded-xl border bg-card p-6 sticky top-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-2">
                        <h2 className="text-xl font-bold text-foreground">{selectedPolicy.title}</h2>
                        <div className="flex items-center gap-2">
                          <StatusBadge variant={getStatusVariant(selectedPolicy.status)} dot>
                            {selectedPolicy.status}
                          </StatusBadge>
                          <span className="text-xs text-muted-foreground">v{selectedPolicy.version}</span>
                          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">{selectedPolicy.category}</span>
                        </div>
                      </div>
                      {selectedPolicy.requiresAcknowledgment && selectedPolicy.status === 'PUBLISHED' && (
                        <button
                          onClick={() => handleAcknowledge(selectedPolicy.id)}
                          className="inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Acknowledge
                        </button>
                      )}
                    </div>
                    {selectedPolicy.description && (
                      <p className="text-sm text-muted-foreground mb-4">{selectedPolicy.description}</p>
                    )}
                    <div className="border-t pt-4">
                      <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">{selectedPolicy.content}</pre>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border bg-card">
                    <Eye className="w-12 h-12 text-muted-foreground/40 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground">Select a policy</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">Choose a policy from the list to view its content.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Create Modal */}
          <Modal open={showForm} onClose={() => setShowForm(false)} size="lg">
            <ModalHeader onClose={() => setShowForm(false)}>Create Policy</ModalHeader>
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
                    <input type="text" required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className={inputClass} placeholder="Employee Code of Conduct" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Category</label>
                      <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inputClass}>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Version</label>
                      <input type="text" value={form.version} onChange={e => setForm(p => ({ ...p, version: e.target.value }))} className={inputClass} placeholder="1.0" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Description</label>
                    <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className={inputClass} placeholder="Brief summary of the policy" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Content (Markdown) <span className="text-destructive">*</span></label>
                    <textarea
                      required
                      value={form.content}
                      onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                      className="w-full min-h-[160px] px-3 py-2 border border-input bg-background text-foreground rounded-lg text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-y"
                      rows={6}
                      placeholder={'# Policy Title\n\n## Section 1\nPolicy content here...'}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="ack"
                      checked={form.requiresAcknowledgment}
                      onChange={e => setForm(p => ({ ...p, requiresAcknowledgment: e.target.checked }))}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-primary/30"
                    />
                    <label htmlFor="ack" className="text-sm font-medium text-foreground">Requires employee acknowledgment</label>
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
                  Create Policy
                </button>
              </ModalFooter>
            </form>
          </Modal>
        </PageContainer>
      </RoleGate>
    </FeatureGate>
  );
}
