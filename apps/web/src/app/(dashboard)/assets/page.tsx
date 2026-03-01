'use client';

import { useState, useEffect } from 'react';
import { apiClient, type Asset } from '@/lib/api-client';
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
  Plus, Monitor, Loader2, AlertCircle, Package, Filter, X,
  CheckCircle2, Wrench, Archive, Laptop
} from 'lucide-react';

const categories = ['LAPTOP', 'PHONE', 'MONITOR', 'DESK', 'CHAIR', 'VEHICLE', 'SOFTWARE_LICENSE', 'OTHER'];

const INITIAL_FORM = { name: '', assetCode: '', category: 'LAPTOP', brand: '', model: '', serialNumber: '', location: '', description: '' };

export default function AssetsPage() {
  const toast = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssets();
  }, [statusFilter, categoryFilter]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getAssets({
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
      });
      setAssets(Array.isArray(data) ? data : []);
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
      await apiClient.createAsset(form);
      setShowForm(false);
      setForm(INITIAL_FORM);
      toast.success('Asset created', 'New asset has been added successfully.');
      fetchAssets();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create asset');
    } finally {
      setSubmitting(false);
    }
  };

  const openNewForm = () => {
    setShowForm(true);
    setForm(INITIAL_FORM);
    setFormError(null);
  };

  const hasFilters = statusFilter || categoryFilter;
  const clearFilters = () => { setStatusFilter(''); setCategoryFilter(''); };

  // Stats
  const available = assets.filter(a => a.status === 'AVAILABLE').length;
  const assigned = assets.filter(a => a.status === 'ASSIGNED').length;
  const maintenance = assets.filter(a => a.status === 'UNDER_MAINTENANCE').length;

  const conditionVariant = (condition: string) => {
    const map: Record<string, 'success' | 'info' | 'warning' | 'orange' | 'error' | 'neutral'> = {
      NEW: 'success', GOOD: 'info', FAIR: 'warning', POOR: 'orange', DAMAGED: 'error',
    };
    return map[condition] || 'neutral';
  };

  const inputClass = 'w-full h-10 px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';
  const selectClass = inputClass;

  return (
    <FeatureGate feature="ASSETS">
      <RoleGate requiredPermissions={[Permission.VIEW_ASSETS, Permission.MANAGE_ASSETS]}>
        <PageContainer
          title="Equipment"
          description="Track and manage company equipment and devices"
          breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Equipment' }]}
          actions={
            <RoleGate requiredPermissions={[Permission.MANAGE_ASSETS]} hideOnly>
              <button
                onClick={openNewForm}
                className="inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" /> New Asset
              </button>
            </RoleGate>
          }
        >
          {error && <ErrorBanner message={error} onDismiss={() => setError(null)} onRetry={fetchAssets} />}

          {/* Stats */}
          {!loading && assets.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Assets" value={assets.length} icon={Package} iconColor="blue" subtitle="All assets" />
              <StatCard title="Available" value={available} icon={CheckCircle2} iconColor="green" subtitle="Ready to assign" />
              <StatCard title="Assigned" value={assigned} icon={Laptop} iconColor="purple" subtitle="Currently in use" />
              <StatCard title="Maintenance" value={maintenance} icon={Wrench} iconColor="amber" subtitle="Under repair" />
            </div>
          )}

          {/* Filters */}
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
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectClass + ' !w-auto min-w-[160px]'}>
                <option value="">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                <option value="RETIRED">Retired</option>
              </select>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className={selectClass + ' !w-auto min-w-[160px]'}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="rounded-xl border bg-card overflow-hidden">
              <TableLoader rows={6} cols={6} />
            </div>
          ) : assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border bg-card">
              <Package className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No assets found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {hasFilters ? 'Try adjusting your filters to see results.' : 'Add your first asset to start tracking company equipment.'}
              </p>
              {!hasFilters && (
                <RoleGate requiredPermissions={[Permission.MANAGE_ASSETS]} hideOnly>
                  <button onClick={openNewForm} className="mt-4 inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                    <Plus className="w-4 h-4" /> Add Asset
                  </button>
                </RoleGate>
              )}
            </div>
          ) : (
            <div className="rounded-xl border bg-card overflow-hidden">
              <table className="min-w-full divide-y">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Asset</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Condition</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {assets.map(asset => (
                    <tr key={asset.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0">
                            <Monitor className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">{asset.name}</div>
                            {asset.brand && <div className="text-xs text-muted-foreground">{asset.brand} {asset.model}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{asset.assetCode}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{asset.category.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3">
                        <StatusBadge variant={conditionVariant(asset.condition)}>
                          {asset.condition}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge variant={getStatusVariant(asset.status)} dot>
                          {asset.status.replace(/_/g, ' ')}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{asset.location || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Create Modal */}
          <Modal open={showForm} onClose={() => setShowForm(false)} size="lg">
            <ModalHeader onClose={() => setShowForm(false)}>Add New Asset</ModalHeader>
            <form onSubmit={handleCreate}>
              <ModalBody>
                <div className="space-y-4">
                  {formError && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-sm text-red-700 dark:text-red-400">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {formError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Name <span className="text-destructive">*</span></label>
                      <input type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputClass} placeholder="MacBook Pro 16" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Asset Code <span className="text-destructive">*</span></label>
                      <input type="text" required value={form.assetCode} onChange={e => setForm(p => ({ ...p, assetCode: e.target.value }))} className={inputClass} placeholder="AST-001" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Category <span className="text-destructive">*</span></label>
                      <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={selectClass}>
                        {categories.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Brand</label>
                      <input type="text" value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))} className={inputClass} placeholder="Apple" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Model</label>
                      <input type="text" value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} className={inputClass} placeholder="M3 Pro" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Serial Number</label>
                      <input type="text" value={form.serialNumber} onChange={e => setForm(p => ({ ...p, serialNumber: e.target.value }))} className={inputClass} placeholder="SN-12345" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Location</label>
                      <input type="text" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className={inputClass} placeholder="Floor 2, Desk 14" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-sm font-medium text-foreground">Description</label>
                      <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className={inputClass} placeholder="Brief description of the asset" />
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
                  Add Asset
                </button>
              </ModalFooter>
            </form>
          </Modal>
        </PageContainer>
      </RoleGate>
    </FeatureGate>
  );
}
