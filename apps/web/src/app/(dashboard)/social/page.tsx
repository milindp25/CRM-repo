'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

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

export default function SocialPage() {
  const [activeTab, setActiveTab] = useState<'announcements' | 'kudos'>('announcements');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [kudos, setKudos] = useState<Kudos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showKudosForm, setShowKudosForm] = useState(false);
  const [kudosForm, setKudosForm] = useState({ recipientEmployeeId: '', message: '', category: 'TEAMWORK' });
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    fetchEmployees();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ann, kd] = await Promise.all([
        apiClient.request('/social/announcements'),
        apiClient.request('/social/kudos'),
      ]);
      setAnnouncements(Array.isArray(ann) ? ann : ann?.data || []);
      setKudos(Array.isArray(kd) ? kd : kd?.data || []);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const fetchEmployees = async () => {
    try {
      const data = await apiClient.getEmployees();
      setEmployees(Array.isArray(data) ? data : data?.data || []);
    } catch {}
  };

  const handleSendKudos = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.request('/social/kudos', { method: 'POST', body: JSON.stringify(kudosForm) });
      setShowKudosForm(false);
      setKudosForm({ recipientEmployeeId: '', message: '', category: 'TEAMWORK' });
      setSuccess('Kudos sent!');
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (err: any) { setError(err.message); }
  };

  const priorityColors: Record<string, string> = {
    URGENT: 'border-l-red-500',
    IMPORTANT: 'border-l-yellow-500',
    NORMAL: 'border-l-blue-500',
  };

  const categoryIcons: Record<string, string> = {
    TEAMWORK: '🤝',
    INNOVATION: '💡',
    LEADERSHIP: '🌟',
    ABOVE_AND_BEYOND: '🚀',
    CUSTOMER_FOCUS: '🎯',
  };

  const categories = ['TEAMWORK', 'INNOVATION', 'LEADERSHIP', 'ABOVE_AND_BEYOND', 'CUSTOMER_FOCUS'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Social Feed</h1>
          <p className="text-muted-foreground">Announcements, recognition, and celebrations</p>
        </div>
        <button onClick={() => setShowKudosForm(!showKudosForm)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
          {showKudosForm ? 'Cancel' : 'Send Kudos'}
        </button>
      </div>

      {error && <div className="p-3 bg-destructive/10 text-destructive rounded-lg">{error}</div>}
      {success && <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg">{success}</div>}

      {showKudosForm && (
        <form onSubmit={handleSendKudos} className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Recipient</label>
              <select value={kudosForm.recipientEmployeeId} onChange={(e) => setKudosForm({ ...kudosForm, recipientEmployeeId: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground" required>
                <option value="">Select employee...</option>
                {employees.map((emp: any) => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Category</label>
              <select value={kudosForm.category} onChange={(e) => setKudosForm({ ...kudosForm, category: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground">
                {categories.map((c) => <option key={c} value={c}>{categoryIcons[c]} {c.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Message</label>
            <textarea value={kudosForm.message} onChange={(e) => setKudosForm({ ...kudosForm, message: e.target.value })} rows={3} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground" required placeholder="Write your recognition message..." />
          </div>
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">Send Kudos</button>
        </form>
      )}

      <div className="flex gap-2 border-b border-border">
        {['announcements', 'kudos'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : activeTab === 'announcements' ? (
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No announcements</div>
          ) : announcements.map((a) => (
            <div key={a.id} className={`bg-card border border-border border-l-4 ${priorityColors[a.priority] || 'border-l-gray-300'} rounded-lg p-4`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-foreground">{a.isPinned && '📌 '}{a.title}</h3>
                <span className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.content}</p>
              {a.author && <p className="text-xs text-muted-foreground mt-2">By {a.author.firstName} {a.author.lastName}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {kudos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No kudos yet. Be the first to recognize someone!</div>
          ) : kudos.map((k) => (
            <div key={k.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{categoryIcons[k.category] || '⭐'}</span>
                <div>
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{k.sender.firstName} {k.sender.lastName}</span>
                    <span className="text-muted-foreground"> recognized </span>
                    <span className="font-medium">{k.recipient.firstName} {k.recipient.lastName}</span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{k.message}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">{k.category.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-muted-foreground">{new Date(k.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
