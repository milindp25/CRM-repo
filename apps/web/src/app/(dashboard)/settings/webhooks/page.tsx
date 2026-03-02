'use client';

import { useState, useEffect } from 'react';
import { apiClient, type WebhookEndpoint, type WebhookDelivery } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { FeatureGate } from '@/components/common/feature-gate';
import { Permission } from '@hrplatform/shared';
import { PageContainer } from '@/components/ui/page-container';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { ErrorBanner, EmptyState } from '@/components/ui/error-banner';
import { TableLoader } from '@/components/ui/page-loader';
import { Webhook, Plus, Send, History, Power, Trash2 } from 'lucide-react';

const INPUT_CLASS = 'h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';

const WEBHOOK_EVENTS = [
  { value: 'employee.created', label: 'Employee Created' },
  { value: 'employee.updated', label: 'Employee Updated' },
  { value: 'employee.deleted', label: 'Employee Deleted' },
  { value: 'leave.applied', label: 'Leave Applied' },
  { value: 'leave.approved', label: 'Leave Approved' },
  { value: 'leave.rejected', label: 'Leave Rejected' },
  { value: 'leave.cancelled', label: 'Leave Cancelled' },
  { value: 'attendance.marked', label: 'Attendance Marked' },
  { value: 'payroll.processed', label: 'Payroll Processed' },
  { value: 'invitation.sent', label: 'Invitation Sent' },
  { value: 'invitation.accepted', label: 'Invitation Accepted' },
  { value: 'document.uploaded', label: 'Document Uploaded' },
  { value: 'user.created', label: 'User Created' },
  { value: 'user.updated', label: 'User Updated' },
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);

  // Create form
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchWebhooks(); }, []);

  const fetchWebhooks = async () => {
    try {
      const data = await apiClient.getWebhooks();
      setWebhooks(data);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await apiClient.createWebhook({ name, url, events });
      setShowCreate(false);
      setName(''); setUrl(''); setEvents([]);
      fetchWebhooks();
      setSuccess('Webhook endpoint created');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) { setError(err.message); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this webhook endpoint?')) return;
    try {
      await apiClient.deleteWebhook(id);
      fetchWebhooks();
    } catch (err: any) { setError(err.message); }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await apiClient.updateWebhook(id, { isActive: !isActive });
      fetchWebhooks();
    } catch (err: any) { setError(err.message); }
  };

  const handleTest = async (id: string) => {
    try {
      await apiClient.testWebhook(id);
      setSuccess('Test webhook sent');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) { setError(err.message); }
  };

  const viewDeliveries = async (id: string) => {
    setSelectedWebhook(id);
    try {
      const data = await apiClient.getWebhookDeliveries(id);
      setDeliveries(data.data);
    } catch (err: any) { setError(err.message); }
  };

  const toggleEvent = (event: string) => {
    setEvents(prev => prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]);
  };

  return (
    <RoleGate requiredPermissions={[Permission.MANAGE_COMPANY]}>
      <FeatureGate feature="WEBHOOKS">
        <PageContainer
          title="Event Notifications"
          description="Automatically notify other apps when things happen in HRPlatform"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Settings', href: '/settings' },
            { label: 'Webhooks' },
          ]}
          actions={
            <button onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-lg text-sm font-medium transition-colors">
              <Plus className="h-4 w-4" />
              Add Endpoint
            </button>
          }
        >
          {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

          {success && (
            <div className="p-4 rounded-xl border border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/30 text-sm text-green-700 dark:text-green-300">
              {success}
            </div>
          )}

          {/* Create Form Modal */}
          <Modal open={showCreate} onClose={() => setShowCreate(false)} size="lg">
            <ModalHeader onClose={() => setShowCreate(false)}>Add Webhook Endpoint</ModalHeader>
            <form onSubmit={handleCreate}>
              <ModalBody className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Name *</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)}
                    className={INPUT_CLASS} placeholder="e.g. Slack Notifications" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Notification URL *</label>
                  <input type="url" required value={url} onChange={e => setUrl(e.target.value)}
                    className={INPUT_CLASS} placeholder="https://example.com/webhooks" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Events *</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                    {WEBHOOK_EVENTS.map(evt => (
                      <label key={evt.value} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                        <input type="checkbox" checked={events.includes(evt.value)} onChange={() => toggleEvent(evt.value)} className="rounded border-input" />
                        {evt.label}
                      </label>
                    ))}
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <button type="button" onClick={() => setShowCreate(false)}
                  className="border border-input bg-background text-foreground hover:bg-muted h-9 px-4 rounded-lg text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={creating || events.length === 0}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                  {creating ? 'Creating...' : 'Create Endpoint'}
                </button>
              </ModalFooter>
            </form>
          </Modal>

          {/* Webhooks List */}
          {loading ? (
            <div className="rounded-xl border bg-card overflow-hidden">
              <TableLoader rows={4} cols={3} />
            </div>
          ) : webhooks.length === 0 ? (
            <div className="rounded-xl border bg-card">
              <EmptyState
                icon={<Webhook className="h-10 w-10" />}
                title="No notifications set up yet"
                description="Add a destination to send automatic updates when events happen"
                action={{ label: 'Add Endpoint', onClick: () => setShowCreate(true) }}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map(wh => (
                <div key={wh.id} className="rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">{wh.name}</h3>
                        <StatusBadge variant={getStatusVariant(wh.isActive ? 'ACTIVE' : 'DISABLED')} dot>
                          {wh.isActive ? 'Active' : 'Disabled'}
                        </StatusBadge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 font-mono truncate">{wh.url}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {wh.events.map(evt => (
                          <StatusBadge key={evt} variant="info">{evt}</StatusBadge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => handleTest(wh.id)}
                        className="inline-flex items-center gap-1 text-sm text-primary hover:bg-primary/10 h-8 px-2.5 rounded-lg transition-colors"
                        title="Send test webhook">
                        <Send className="h-3.5 w-3.5" />
                        Test
                      </button>
                      <button onClick={() => viewDeliveries(wh.id)}
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:bg-muted h-8 px-2.5 rounded-lg transition-colors"
                        title="View delivery history">
                        <History className="h-3.5 w-3.5" />
                        Deliveries
                      </button>
                      <button onClick={() => handleToggle(wh.id, wh.isActive)}
                        className="inline-flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 h-8 px-2.5 rounded-lg transition-colors"
                        title={wh.isActive ? 'Disable endpoint' : 'Enable endpoint'}>
                        <Power className="h-3.5 w-3.5" />
                        {wh.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button onClick={() => handleDelete(wh.id)}
                        className="inline-flex items-center gap-1 text-sm text-destructive hover:bg-destructive/10 h-8 px-2.5 rounded-lg transition-colors"
                        title="Delete endpoint">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Delivery History Modal */}
          <Modal open={!!selectedWebhook} onClose={() => setSelectedWebhook(null)} size="xl">
            <ModalHeader onClose={() => setSelectedWebhook(null)}>Delivery History</ModalHeader>
            <ModalBody>
              {deliveries.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No deliveries yet</p>
              ) : (
                <div className="space-y-2">
                  {deliveries.map(d => (
                    <div key={d.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StatusBadge variant={getStatusVariant(d.status)}>{d.status}</StatusBadge>
                          <span className="text-sm font-medium text-foreground">{d.eventType}</span>
                          {d.statusCode && <span className="text-xs text-muted-foreground">HTTP {d.statusCode}</span>}
                          {d.duration && <span className="text-xs text-muted-foreground">{d.duration}ms</span>}
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Attempt {d.attempt}/{d.maxRetries}</div>
                    </div>
                  ))}
                </div>
              )}
            </ModalBody>
          </Modal>
        </PageContainer>
      </FeatureGate>
    </RoleGate>
  );
}
