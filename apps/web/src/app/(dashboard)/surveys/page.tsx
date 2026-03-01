'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { PageContainer } from '@/components/ui/page-container';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { ErrorBanner } from '@/components/ui/error-banner';
import { TableLoader } from '@/components/ui/page-loader';
import {
  ClipboardList, Plus, BarChart3, MessageSquare, Send, X as XIcon,
  Eye, Lock, ChevronLeft,
} from 'lucide-react';

interface Survey {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  isAnonymous: boolean;
  questions: any[];
  _count?: { responses: number };
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

const questionTypes = ['RATING', 'TEXT', 'MULTIPLE_CHOICE', 'NPS'];

const defaultForm = {
  title: '',
  description: '',
  type: 'PULSE',
  isAnonymous: true,
  questions: [{ id: '1', type: 'RATING', text: '', options: [] as string[], required: true }],
};

export default function SurveysPage() {
  const toast = useToast();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [responding, setResponding] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [analytics, setAnalytics] = useState<any>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [form, setForm] = useState({ ...defaultForm });

  useEffect(() => { fetchSurveys(); }, []);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.request('/surveys');
      setSurveys(Array.isArray(data) ? data : data?.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load surveys');
    } finally {
      setLoading(false);
    }
  };

  const validateCreateForm = (): boolean => {
    if (!form.title.trim()) {
      toast.error('Validation Error', 'Survey title is required');
      return false;
    }
    if (form.questions.length === 0) {
      toast.error('Validation Error', 'Add at least one question');
      return false;
    }
    for (let i = 0; i < form.questions.length; i++) {
      if (!form.questions[i].text.trim()) {
        toast.error('Validation Error', `Question ${i + 1} text is required`);
        return false;
      }
      if (form.questions[i].type === 'MULTIPLE_CHOICE' && (!form.questions[i].options || form.questions[i].options.length < 2)) {
        toast.error('Validation Error', `Question ${i + 1} (Multiple Choice) needs at least 2 options`);
        return false;
      }
    }
    return true;
  };

  const validateResponse = (): boolean => {
    if (!selectedSurvey) return false;
    const questions = selectedSurvey.questions || [];
    for (const q of questions) {
      if (q.required && (answers[q.id] === undefined || answers[q.id] === '')) {
        toast.error('Required Question', `Please answer: "${q.text}"`);
        return false;
      }
    }
    return true;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCreateForm()) return;
    try {
      await apiClient.request('/surveys', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setShowCreate(false);
      setForm({ ...defaultForm });
      toast.success('Survey Created', `Survey "${form.title}" is ready as a draft`);
      fetchSurveys();
    } catch (err: any) { toast.error('Failed to create survey', err.message); }
  };

  const handleActivate = async (id: string) => {
    try {
      await apiClient.request(`/surveys/${id}/activate`, { method: 'POST' });
      toast.success('Survey Activated', 'Employees can now respond to this survey');
      fetchSurveys();
    } catch (err: any) { toast.error('Failed to activate survey', err.message); }
  };

  const handleClose = async (id: string) => {
    try {
      await apiClient.request(`/surveys/${id}/close`, { method: 'POST' });
      toast.info('Survey Closed', 'No more responses will be accepted');
      fetchSurveys();
    } catch (err: any) { toast.error('Failed to close survey', err.message); }
  };

  const handleRespond = async (surveyId: string) => {
    if (!validateResponse()) return;
    try {
      const answerArray = Object.entries(answers).map(([questionId, value]) => ({ questionId, value }));
      await apiClient.request(`/surveys/${surveyId}/responses`, {
        method: 'POST',
        body: JSON.stringify({ answers: answerArray }),
      });
      setResponding(false);
      setSelectedSurvey(null);
      setAnswers({});
      toast.success('Response Submitted', 'Thank you for your feedback!');
    } catch (err: any) { toast.error('Failed to submit response', err.message); }
  };

  const fetchAnalytics = async (id: string) => {
    try {
      const data = await apiClient.request(`/surveys/${id}/analytics`);
      setAnalytics(data);
      setShowAnalytics(true);
    } catch (err: any) { toast.error('Failed to load analytics', err.message); }
  };

  const addQuestion = () => {
    const id = String(form.questions.length + 1);
    setForm({ ...form, questions: [...form.questions, { id, type: 'RATING', text: '', options: [], required: true }] });
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...form.questions];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, questions: updated });
  };

  const removeQuestion = (index: number) => {
    const updated = form.questions.filter((_, i) => i !== index);
    setForm({ ...form, questions: updated });
  };

  // Stat counts
  const activeSurveys = surveys.filter((s) => s.status === 'ACTIVE').length;
  const totalResponses = surveys.reduce((sum, s) => sum + (s._count?.responses || 0), 0);
  const draftSurveys = surveys.filter((s) => s.status === 'DRAFT').length;

  // ── Respond view (full page) ──────────────────────────────────────
  if (selectedSurvey && responding) {
    const questions = selectedSurvey.questions || [];
    return (
      <PageContainer
        title={selectedSurvey.title}
        description={selectedSurvey.description ?? undefined}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Surveys', href: '/surveys' },
          { label: 'Respond' },
        ]}
        actions={
          <button
            onClick={() => { setResponding(false); setSelectedSurvey(null); setAnswers({}); }}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border border-input bg-background text-foreground hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Surveys
          </button>
        }
      >
        {selectedSurvey.isAnonymous && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/30">
            <Lock className="h-4 w-4 text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-700 dark:text-green-300">This survey is anonymous</p>
          </div>
        )}

        <div className="space-y-4">
          {questions.map((q: any, i: number) => (
            <div key={q.id} className="rounded-xl border bg-card p-5">
              <label className="block text-sm font-medium text-foreground mb-3">
                {i + 1}. {q.text} {q.required && <span className="text-destructive">*</span>}
              </label>
              {q.type === 'RATING' && (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setAnswers({ ...answers, [q.id]: n })}
                      className={`w-10 h-10 rounded-lg border text-sm font-medium transition-colors ${answers[q.id] === n ? 'bg-primary text-primary-foreground border-primary' : 'border-input text-foreground hover:bg-muted'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              )}
              {q.type === 'NPS' && (
                <div className="flex gap-1 flex-wrap">
                  {Array.from({ length: 11 }, (_, idx) => idx).map((n) => (
                    <button key={n} type="button" onClick={() => setAnswers({ ...answers, [q.id]: n })}
                      className={`w-9 h-9 rounded-lg border text-sm font-medium transition-colors ${answers[q.id] === n ? 'bg-primary text-primary-foreground border-primary' : 'border-input text-foreground hover:bg-muted'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              )}
              {q.type === 'TEXT' && (
                <textarea
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  className="h-24 w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  rows={3}
                />
              )}
              {q.type === 'MULTIPLE_CHOICE' && q.options?.map((opt: string) => (
                <label key={opt} className="flex items-center gap-2 text-sm text-foreground mt-2 cursor-pointer">
                  <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    className="accent-primary" />
                  {opt}
                </label>
              ))}
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => handleRespond(selectedSurvey.id)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Send className="h-4 w-4" />
            Submit Response
          </button>
        </div>
      </PageContainer>
    );
  }

  // ── Main list view ────────────────────────────────────────────────
  return (
    <PageContainer
      title="Surveys"
      description="Pulse surveys and engagement assessments"
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Surveys' },
      ]}
      actions={
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Survey
        </button>
      }
    >
      {error && (
        <ErrorBanner message={error} onRetry={fetchSurveys} onDismiss={() => setError('')} />
      )}

      {/* Stats */}
      {!loading && surveys.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={ClipboardList} title="Total Surveys" value={surveys.length} iconColor="blue" />
          <StatCard icon={MessageSquare} title="Active Surveys" value={activeSurveys} iconColor="green" />
          <StatCard icon={Send} title="Total Responses" value={totalResponses} iconColor="purple" />
          <StatCard icon={ClipboardList} title="Drafts" value={draftSurveys} iconColor="amber" />
        </div>
      )}

      {/* Survey list */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {loading ? (
          <TableLoader rows={4} cols={4} />
        ) : surveys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground mb-4 opacity-40" />
            <h3 className="text-lg font-semibold text-foreground">No surveys yet</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">Create your first survey to start collecting employee feedback.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Survey
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {surveys.map((s) => (
              <div key={s.id} className="px-5 py-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-foreground truncate">{s.title}</h3>
                      <StatusBadge variant={getStatusVariant(s.status)} dot>{s.status}</StatusBadge>
                      <StatusBadge variant="neutral">{s.type}</StatusBadge>
                      {s.isAnonymous && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Lock className="h-3 w-3" /> Anonymous
                        </span>
                      )}
                    </div>
                    {s.description && <p className="text-sm text-muted-foreground mt-1 truncate">{s.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {s.questions?.length || 0} questions &middot; {s._count?.responses || 0} responses
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {s.status === 'DRAFT' && (
                      <button onClick={() => handleActivate(s.id)}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                        Activate
                      </button>
                    )}
                    {s.status === 'ACTIVE' && (
                      <>
                        <button onClick={() => { setSelectedSurvey(s); setResponding(true); }}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                          <MessageSquare className="h-3 w-3" />
                          Respond
                        </button>
                        <button onClick={() => handleClose(s.id)}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium border border-input bg-background text-foreground hover:bg-muted transition-colors">
                          Close
                        </button>
                      </>
                    )}
                    {(s.status === 'CLOSED' || s.status === 'ACTIVE') && (
                      <button onClick={() => fetchAnalytics(s.id)}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium border border-input bg-background text-foreground hover:bg-muted transition-colors">
                        <BarChart3 className="h-3 w-3" />
                        Analytics
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create Survey Modal ────────────────────────────────────── */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setForm({ ...defaultForm }); }} size="lg">
        <form onSubmit={handleCreate}>
          <ModalHeader onClose={() => { setShowCreate(false); setForm({ ...defaultForm }); }}>
            Create Survey
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    placeholder="Survey title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  >
                    <option value="PULSE">Pulse</option>
                    <option value="ENGAGEMENT">Engagement</option>
                    <option value="EXIT">Exit</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={form.isAnonymous}
                  onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })}
                  className="accent-primary"
                />
                <label htmlFor="anonymous" className="text-sm text-foreground cursor-pointer">Anonymous responses</label>
              </div>

              {/* Questions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-foreground">Questions</label>
                  <button type="button" onClick={addQuestion} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                    <Plus className="h-3.5 w-3.5" />
                    Add Question
                  </button>
                </div>
                <div className="space-y-3">
                  {form.questions.map((q, i) => (
                    <div key={q.id} className="rounded-lg border border-input p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                          <div className="md:col-span-3">
                            <input
                              type="text"
                              value={q.text}
                              onChange={(e) => updateQuestion(i, 'text', e.target.value)}
                              placeholder={`Question ${i + 1}`}
                              className="h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                              required
                            />
                          </div>
                          <select
                            value={q.type}
                            onChange={(e) => updateQuestion(i, 'type', e.target.value)}
                            className="h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                          >
                            {questionTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        {form.questions.length > 1 && (
                          <button type="button" onClick={() => removeQuestion(i)}
                            className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-muted transition-colors">
                            <XIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {q.type === 'MULTIPLE_CHOICE' && (
                        <input
                          type="text"
                          placeholder="Options (comma-separated)"
                          value={q.options?.join(', ') || ''}
                          onChange={(e) => updateQuestion(i, 'options', e.target.value.split(',').map((s: string) => s.trim()))}
                          className="h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <button
              type="button"
              onClick={() => { setShowCreate(false); setForm({ ...defaultForm }); }}
              className="h-9 px-4 rounded-lg text-sm font-medium border border-input bg-background text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Create Survey
            </button>
          </ModalFooter>
        </form>
      </Modal>

      {/* ── Analytics Modal ────────────────────────────────────────── */}
      <Modal open={showAnalytics} onClose={() => { setShowAnalytics(false); setAnalytics(null); }} size="lg">
        <ModalHeader onClose={() => { setShowAnalytics(false); setAnalytics(null); }}>
          Survey Analytics
        </ModalHeader>
        <ModalBody>
          {analytics ? (
            <pre className="text-sm text-foreground bg-muted/30 rounded-lg p-4 overflow-auto max-h-96">{JSON.stringify(analytics, null, 2)}</pre>
          ) : (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <button
            onClick={() => { setShowAnalytics(false); setAnalytics(null); }}
            className="h-9 px-4 rounded-lg text-sm font-medium border border-input bg-background text-foreground hover:bg-muted transition-colors"
          >
            Close
          </button>
        </ModalFooter>
      </Modal>
    </PageContainer>
  );
}
