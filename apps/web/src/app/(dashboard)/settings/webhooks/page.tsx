'use client';

import { useState, useEffect } from 'react';
import { apiClient, type WebhookEndpoint, type WebhookDelivery } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { FeatureGate } from '@/components/common/feature-gate';
import { Permission } from '@hrplatform/shared';
import Link from 'next/link';

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

  const statusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'bg-green-100 text-green-700';
      case 'FAILED': return 'bg-red-100 text-red-700';
      case 'RETRYING': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <RoleGate requiredPermissions={[Permission.MANAGE_COMPANY]}>
      <FeatureGate feature="WEBHOOKS">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Link href="/settings" className="hover:text-blue-600">Settings</Link>
                <span>/</span><span>Webhooks</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">Webhooks</h1>
              <p className="text-muted-foreground mt-1">Send real-time notifications to external services</p>
            </div>
            <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              Add Endpoint
            </button>
          </div>

          {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}
          {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">{success}</div>}

          {showCreate && (
            <div className="mb-6 bg-card rounded-lg shadow-md p-6 border">
              <h2 className="text-lg font-semibold mb-4">Add Webhook Endpoint</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Name *</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. Slack Notifications" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Endpoint URL *</label>
                  <input type="url" required value={url} onChange={e => setUrl(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="https://example.com/webhooks" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Events *</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                    {WEBHOOK_EVENTS.map(evt => (
                      <label key={evt.value} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={events.includes(evt.value)} onChange={() => toggleEvent(evt.value)} className="rounded" />
                        {evt.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={creating || events.length === 0} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {creating ? 'Creating...' : 'Create Endpoint'}
                  </button>
                  <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-lg hover:bg-muted">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading webhooks...</div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg shadow-md">
              <div className="text-4xl mb-2">🔗</div>
              <h3 className="text-lg font-medium text-foreground">No webhook endpoints</h3>
              <p className="text-muted-foreground mt-1">Add an endpoint to receive real-time event notifications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map(wh => (
                <div key={wh.id} className="bg-card rounded-lg shadow-sm border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">{wh.name}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${wh.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-muted-foreground'}`}>
                          {wh.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 font-mono">{wh.url}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {wh.events.map(evt => (
                          <span key={evt} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">{evt}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleTest(wh.id)} className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded">Test</button>
                      <button onClick={() => viewDeliveries(wh.id)} className="px-3 py-1 text-sm text-muted-foreground hover:bg-muted rounded">Deliveries</button>
                      <button onClick={() => handleToggle(wh.id, wh.isActive)} className="px-3 py-1 text-sm text-yellow-600 hover:bg-yellow-50 rounded">
                        {wh.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button onClick={() => handleDelete(wh.id)} className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Delivery History Modal */}
          {selectedWebhook && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50" onClick={() => setSelectedWebhook(null)}>
              <div className="bg-card rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto border border-border" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Delivery History</h2>
                  <button onClick={() => setSelectedWebhook(null)} className="text-muted-foreground hover:text-muted-foreground">✕</button>
                </div>
                <div className="p-6">
                  {deliveries.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No deliveries yet</p>
                  ) : (
                    <div className="space-y-2">
                      {deliveries.map(d => (
                        <div key={d.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 text-xs rounded-full ${statusColor(d.status)}`}>{d.status}</span>
                              <span className="text-sm font-medium">{d.eventType}</span>
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
                </div>
              </div>
            </div>
          )}
        </div>
      </FeatureGate>
    </RoleGate>
  );
}
