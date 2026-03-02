'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { PageContainer } from '@/components/ui/page-container';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/status-badge';
import { StatCard } from '@/components/ui/stat-card';
import { ErrorBanner } from '@/components/ui/error-banner';
import { TableLoader } from '@/components/ui/page-loader';
import {
  Megaphone, Heart, Send, Pin, Loader2, AlertCircle,
  Users, Lightbulb, Star, Rocket, Target, Award, MessageSquare,
} from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  isPinned: boolean;
  author?: { firstName: string; lastName: string };
  publishedAt: string | null;
  createdAt: string;
}

interface Kudos {
  id: string;
  message: string;
  category: string;
  sender: { firstName: string; lastName: string };
  recipient: { firstName: string; lastName: string };
  createdAt: string;
}

const categoryConfig: Record<string, { icon: typeof Users; label: string }> = {
  TEAMWORK: { icon: Users, label: 'Teamwork' },
  INNOVATION: { icon: Lightbulb, label: 'Innovation' },
  LEADERSHIP: { icon: Star, label: 'Leadership' },
  ABOVE_AND_BEYOND: { icon: Rocket, label: 'Above & Beyond' },
  CUSTOMER_FOCUS: { icon: Target, label: 'Customer Focus' },
};

const priorityConfig: Record<string, { variant: 'error' | 'warning' | 'info'; borderClass: string }> = {
  URGENT: { variant: 'error', borderClass: 'border-l-red-500 dark:border-l-red-400' },
  IMPORTANT: { variant: 'warning', borderClass: 'border-l-amber-500 dark:border-l-amber-400' },
  NORMAL: { variant: 'info', borderClass: 'border-l-blue-500 dark:border-l-blue-400' },
};

const categories = ['TEAMWORK', 'INNOVATION', 'LEADERSHIP', 'ABOVE_AND_BEYOND', 'CUSTOMER_FOCUS'];

export default function SocialPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'announcements' | 'kudos'>('announcements');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [kudos, setKudos] = useState<Kudos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showKudosForm, setShowKudosForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [kudosForm, setKudosForm] = useState({ recipientEmployeeId: '', message: '', category: 'TEAMWORK' });
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    fetchEmployees();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ann, kd] = await Promise.all([
        apiClient.request('/social/announcements'),
        apiClient.request('/social/kudos'),
      ]);
      setAnnouncements(Array.isArray(ann) ? ann : ann?.data || []);
      setKudos(Array.isArray(kd) ? kd : kd?.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load social feed');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await apiClient.getEmployees();
      setEmployees(Array.isArray(data) ? data : data?.data || []);
    } catch {}
  };

  const validateKudos = (): string | null => {
    if (!kudosForm.recipientEmployeeId) return 'Please select a recipient';
    if (!kudosForm.message.trim()) return 'Please write a recognition message';
    if (kudosForm.message.trim().length < 10) return 'Message must be at least 10 characters';
    if (kudosForm.message.length > 500) return 'Message cannot exceed 500 characters';
    return null;
  };

  const handleSendKudos = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateKudos();
    if (validationError) { setFormError(validationError); return; }
    try {
      setSubmitting(true);
      setFormError(null);
      await apiClient.request('/social/kudos', { method: 'POST', body: JSON.stringify(kudosForm) });
      setShowKudosForm(false);
      setKudosForm({ recipientEmployeeId: '', message: '', category: 'TEAMWORK' });
      toast.success('Kudos Sent!', 'Your recognition has been shared');
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to send kudos');
    } finally {
      setSubmitting(false);
    }
  };

  const openKudosForm = () => {
    setShowKudosForm(true);
    setFormError(null);
    setKudosForm({ recipientEmployeeId: '', message: '', category: 'TEAMWORK' });
  };

  const pinnedCount = announcements.filter(a => a.isPinned).length;
  const inputClass = 'w-full h-10 px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';

  const tabs = [
    { id: 'announcements' as const, label: 'Announcements', icon: Megaphone },
    { id: 'kudos' as const, label: 'Kudos', icon: Heart },
  ];

  return (
    <PageContainer
      title="Team Feed"
      description="Announcements, shout-outs, and celebrations"
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Team Feed' }]}
      actions={
        <button
          onClick={openKudosForm}
          className="inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Send className="w-4 h-4" /> Send Kudos
        </button>
      }
    >
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} onRetry={fetchData} />}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Announcements" value={announcements.length} icon={Megaphone} iconColor="blue" subtitle={`${pinnedCount} pinned`} loading={loading} />
        <StatCard title="Kudos Given" value={kudos.length} icon={Heart} iconColor="rose" loading={loading} />
        <StatCard title="Team Members" value={employees.length} icon={Users} iconColor="green" loading={loading} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="rounded-xl border bg-card overflow-hidden">
          <TableLoader rows={5} cols={3} />
        </div>
      ) : activeTab === 'announcements' ? (
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border bg-card">
              <Megaphone className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No announcements</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">There are no announcements at the moment. Check back later.</p>
            </div>
          ) : (
            announcements.map((a) => {
              const priority = priorityConfig[a.priority] || priorityConfig.NORMAL;
              return (
                <div key={a.id} className={`rounded-xl border bg-card border-l-4 ${priority.borderClass} p-5 hover:shadow-sm transition-all`}>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {a.isPinned && <Pin className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0" />}
                      <h3 className="font-semibold text-foreground truncate">{a.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge variant={priority.variant}>{a.priority}</StatusBadge>
                      <span className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">{a.content}</p>
                  {a.author && (
                    <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                      By {a.author.firstName} {a.author.lastName}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {kudos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border bg-card">
              <Award className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No kudos yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">Be the first to recognize a team member for their great work!</p>
              <button
                onClick={openKudosForm}
                className="mt-4 inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Send className="w-4 h-4" /> Send Kudos
              </button>
            </div>
          ) : (
            kudos.map((k) => {
              const cat = categoryConfig[k.category] || { icon: Award, label: k.category.replace(/_/g, ' ') };
              const CatIcon = cat.icon;
              return (
                <div key={k.id} className="rounded-xl border bg-card p-5 hover:shadow-sm transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CatIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">{k.sender.firstName} {k.sender.lastName}</span>
                        <span className="text-muted-foreground"> recognized </span>
                        <span className="font-semibold">{k.recipient.firstName} {k.recipient.lastName}</span>
                      </p>
                      <p className="text-sm text-muted-foreground mt-1.5">{k.message}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <StatusBadge variant="info">{cat.label}</StatusBadge>
                        <span className="text-xs text-muted-foreground">{new Date(k.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Send Kudos Modal */}
      <Modal open={showKudosForm} onClose={() => setShowKudosForm(false)} size="md">
        <ModalHeader onClose={() => setShowKudosForm(false)}>Send Kudos</ModalHeader>
        <form onSubmit={handleSendKudos}>
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
                  <label className="text-sm font-medium text-foreground">Recipient <span className="text-destructive">*</span></label>
                  <select
                    value={kudosForm.recipientEmployeeId}
                    onChange={(e) => setKudosForm({ ...kudosForm, recipientEmployeeId: e.target.value })}
                    className={inputClass}
                    required
                  >
                    <option value="">Select employee...</option>
                    {employees.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Category</label>
                  <select
                    value={kudosForm.category}
                    onChange={(e) => setKudosForm({ ...kudosForm, category: e.target.value })}
                    className={inputClass}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{(categoryConfig[c]?.label || c.replace(/_/g, ' '))}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Message <span className="text-destructive">*</span></label>
                <textarea
                  value={kudosForm.message}
                  onChange={(e) => setKudosForm({ ...kudosForm, message: e.target.value })}
                  rows={3}
                  maxLength={500}
                  className="w-full min-h-[80px] px-3 py-2 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-y"
                  required
                  placeholder="Write your recognition message (min 10 characters)..."
                />
                <p className={`text-xs ${kudosForm.message.length > 450 ? 'text-amber-500 dark:text-amber-400' : 'text-muted-foreground'}`}>
                  {kudosForm.message.length}/500
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <button type="button" onClick={() => setShowKudosForm(false)} disabled={submitting}
              className="h-9 px-4 border border-input rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="h-9 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Send Kudos
            </button>
          </ModalFooter>
        </form>
      </Modal>
    </PageContainer>
  );
}
