'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

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

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [responding, setResponding] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [analytics, setAnalytics] = useState<any>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'PULSE',
    isAnonymous: true,
    questions: [{ id: '1', type: 'RATING', text: '', options: [] as string[], required: true }],
  });

  useEffect(() => { fetchSurveys(); }, []);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const data = await apiClient.request('/surveys');
      setSurveys(Array.isArray(data) ? data : data?.data || []);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.request('/surveys', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setShowCreate(false);
      setSuccess('Survey created');
      setTimeout(() => setSuccess(''), 3000);
      fetchSurveys();
    } catch (err: any) { setError(err.message); }
  };

  const handleActivate = async (id: string) => {
    try {
      await apiClient.request(`/surveys/${id}/activate`, { method: 'POST' });
      setSuccess('Survey activated');
      setTimeout(() => setSuccess(''), 3000);
      fetchSurveys();
    } catch (err: any) { setError(err.message); }
  };

  const handleClose = async (id: string) => {
    try {
      await apiClient.request(`/surveys/${id}/close`, { method: 'POST' });
      setSuccess('Survey closed');
      setTimeout(() => setSuccess(''), 3000);
      fetchSurveys();
    } catch (err: any) { setError(err.message); }
  };

  const handleRespond = async (surveyId: string) => {
    try {
      const answerArray = Object.entries(answers).map(([questionId, value]) => ({ questionId, value }));
      await apiClient.request(`/surveys/${surveyId}/responses`, {
        method: 'POST',
        body: JSON.stringify({ answers: answerArray }),
      });
      setResponding(false);
      setSelectedSurvey(null);
      setAnswers({});
      setSuccess('Response submitted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) { setError(err.message); }
  };

  const fetchAnalytics = async (id: string) => {
    try {
      const data = await apiClient.request(`/surveys/${id}/analytics`);
      setAnalytics(data);
    } catch (err: any) { setError(err.message); }
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

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    ACTIVE: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    CLOSED: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    ARCHIVED: 'bg-gray-100 dark:bg-gray-800 text-gray-500',
  };

  const questionTypes = ['RATING', 'TEXT', 'MULTIPLE_CHOICE', 'NPS'];

  if (selectedSurvey && responding) {
    const questions = selectedSurvey.questions || [];
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => { setResponding(false); setSelectedSurvey(null); }} className="text-muted-foreground hover:text-foreground">&larr; Back</button>
          <h1 className="text-2xl font-bold text-foreground">{selectedSurvey.title}</h1>
        </div>
        {selectedSurvey.description && <p className="text-muted-foreground">{selectedSurvey.description}</p>}
        {selectedSurvey.isAnonymous && <p className="text-sm text-green-600 dark:text-green-400">This survey is anonymous</p>}
        <div className="space-y-4">
          {questions.map((q: any, i: number) => (
            <div key={q.id} className="bg-card border border-border rounded-lg p-4">
              <label className="block text-sm font-medium text-foreground mb-2">{i + 1}. {q.text} {q.required && <span className="text-destructive">*</span>}</label>
              {q.type === 'RATING' && (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setAnswers({ ...answers, [q.id]: n })}
                      className={`w-10 h-10 rounded-lg border ${answers[q.id] === n ? 'bg-primary text-primary-foreground' : 'border-border text-foreground hover:bg-muted'}`}>{n}</button>
                  ))}
                </div>
              )}
              {q.type === 'NPS' && (
                <div className="flex gap-1 flex-wrap">
                  {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                    <button key={n} type="button" onClick={() => setAnswers({ ...answers, [q.id]: n })}
                      className={`w-9 h-9 rounded-lg border text-sm ${answers[q.id] === n ? 'bg-primary text-primary-foreground' : 'border-border text-foreground hover:bg-muted'}`}>{n}</button>
                  ))}
                </div>
              )}
              {q.type === 'TEXT' && (
                <textarea value={answers[q.id] || ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground" rows={3} />
              )}
              {q.type === 'MULTIPLE_CHOICE' && q.options?.map((opt: string) => (
                <label key={opt} className="flex items-center gap-2 text-sm text-foreground mt-1">
                  <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
                  {opt}
                </label>
              ))}
            </div>
          ))}
        </div>
        <button onClick={() => handleRespond(selectedSurvey.id)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">Submit Response</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Surveys</h1>
          <p className="text-muted-foreground">Pulse surveys and engagement assessments</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
          {showCreate ? 'Cancel' : 'Create Survey'}
        </button>
      </div>

      {error && <div className="p-3 bg-destructive/10 text-destructive rounded-lg">{error}</div>}
      {success && <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg">{success}</div>}

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Title</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground">
                <option value="PULSE">Pulse</option>
                <option value="ENGAGEMENT">Engagement</option>
                <option value="EXIT">Exit</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={form.isAnonymous} onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })} />
                Anonymous responses
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground" rows={2} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">Questions</label>
              <button type="button" onClick={addQuestion} className="text-sm text-primary hover:underline">+ Add Question</button>
            </div>
            {form.questions.map((q, i) => (
              <div key={q.id} className="border border-border rounded-lg p-3 mb-2 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <div className="md:col-span-3">
                    <input type="text" value={q.text} onChange={(e) => updateQuestion(i, 'text', e.target.value)} placeholder={`Question ${i + 1}`} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground" required />
                  </div>
                  <select value={q.type} onChange={(e) => updateQuestion(i, 'type', e.target.value)} className="px-3 py-2 border border-border rounded-lg bg-background text-foreground">
                    {questionTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                {q.type === 'MULTIPLE_CHOICE' && (
                  <input type="text" placeholder="Options (comma-separated)" value={q.options?.join(', ') || ''} onChange={(e) => updateQuestion(i, 'options', e.target.value.split(',').map((s: string) => s.trim()))} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm" />
                )}
              </div>
            ))}
          </div>
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">Create Survey</button>
        </form>
      )}

      {analytics && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Analytics</h2>
            <button onClick={() => setAnalytics(null)} className="text-sm text-muted-foreground hover:text-foreground">Close</button>
          </div>
          <pre className="text-sm text-foreground overflow-auto">{JSON.stringify(analytics, null, 2)}</pre>
        </div>
      )}

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : surveys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No surveys found</div>
        ) : surveys.map((s) => (
          <div key={s.id} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground">{s.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[s.status]}`}>{s.status}</span>
                  <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">{s.type}</span>
                </div>
                {s.description && <p className="text-sm text-muted-foreground mt-1">{s.description}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  {s.questions?.length || 0} questions &middot; {s._count?.responses || 0} responses
                  {s.isAnonymous && ' · Anonymous'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {s.status === 'DRAFT' && (
                  <button onClick={() => handleActivate(s.id)} className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:opacity-90">Activate</button>
                )}
                {s.status === 'ACTIVE' && (
                  <>
                    <button onClick={() => { setSelectedSurvey(s); setResponding(true); }} className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90">Respond</button>
                    <button onClick={() => handleClose(s.id)} className="px-3 py-1 text-sm border border-border text-foreground rounded-lg hover:bg-muted">Close</button>
                  </>
                )}
                {(s.status === 'CLOSED' || s.status === 'ACTIVE') && (
                  <button onClick={() => fetchAnalytics(s.id)} className="px-3 py-1 text-sm border border-border text-foreground rounded-lg hover:bg-muted">Analytics</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
