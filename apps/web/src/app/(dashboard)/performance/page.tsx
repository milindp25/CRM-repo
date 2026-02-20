'use client';

import { useState, useEffect } from 'react';
import { apiClient, type ReviewCycle, type Goal } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { FeatureGate } from '@/components/common/feature-gate';
import { Permission } from '@hrplatform/shared';

export default function PerformancePage() {
  const [activeTab, setActiveTab] = useState<'cycles' | 'goals'>('cycles');
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create cycle form
  const [showCreateCycle, setShowCreateCycle] = useState(false);
  const [cycleForm, setCycleForm] = useState({ name: '', cycleType: 'QUARTERLY', startDate: '', endDate: '', description: '' });
  const [creating, setCreating] = useState(false);

  // Create goal form
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [goalForm, setGoalForm] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });

  useEffect(() => {
    if (activeTab === 'cycles') fetchCycles();
    else fetchGoals();
  }, [activeTab]);

  const fetchCycles = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getReviewCycles();
      setCycles(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getMyGoals();
      setGoals(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await apiClient.createReviewCycle(cycleForm);
      setShowCreateCycle(false);
      setCycleForm({ name: '', cycleType: 'QUARTERLY', startDate: '', endDate: '', description: '' });
      fetchCycles();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await apiClient.createGoal(goalForm);
      setShowCreateGoal(false);
      setGoalForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
      fetchGoals();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300',
      ACTIVE: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-red-100 text-red-800',
      NOT_STARTED: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <FeatureGate feature="PERFORMANCE">
      <RoleGate requiredPermissions={[Permission.VIEW_PERFORMANCE, Permission.MANAGE_PERFORMANCE, Permission.VIEW_OWN_PERFORMANCE]}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Performance Management</h1>
              <p className="text-muted-foreground mt-1">Review cycles, goals, and performance tracking</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
          )}

          {/* Tabs */}
          <div className="flex space-x-4 mb-6 border-b border-border">
            <button
              onClick={() => setActiveTab('cycles')}
              className={`pb-3 px-1 font-medium text-sm ${activeTab === 'cycles' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Review Cycles
            </button>
            <button
              onClick={() => setActiveTab('goals')}
              className={`pb-3 px-1 font-medium text-sm ${activeTab === 'goals' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-muted-foreground hover:text-foreground'}`}
            >
              My Goals
            </button>
          </div>

          {/* Review Cycles Tab */}
          {activeTab === 'cycles' && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowCreateCycle(!showCreateCycle)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  {showCreateCycle ? 'Cancel' : '+ New Review Cycle'}
                </button>
              </div>

              {showCreateCycle && (
                <form onSubmit={handleCreateCycle} className="bg-card rounded-lg shadow-md p-6 mb-6">
                  <h3 className="font-semibold text-foreground mb-4">Create Review Cycle</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Name *</label>
                      <input type="text" required value={cycleForm.name} onChange={e => setCycleForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md" placeholder="Q1 2025 Review" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Type *</label>
                      <select value={cycleForm.cycleType} onChange={e => setCycleForm(p => ({ ...p, cycleType: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md">
                        <option value="QUARTERLY">Quarterly</option>
                        <option value="HALF_YEARLY">Half Yearly</option>
                        <option value="ANNUAL">Annual</option>
                        <option value="CUSTOM">Custom</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Start Date *</label>
                      <input type="date" required value={cycleForm.startDate} onChange={e => setCycleForm(p => ({ ...p, startDate: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">End Date *</label>
                      <input type="date" required value={cycleForm.endDate} onChange={e => setCycleForm(p => ({ ...p, endDate: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                      <textarea value={cycleForm.description} onChange={e => setCycleForm(p => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md" rows={2} />
                    </div>
                  </div>
                  <button type="submit" disabled={creating} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm">{creating ? 'Creating...' : 'Create Cycle'}</button>
                </form>
              )}

              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading review cycles...</div>
              ) : cycles.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-lg shadow-md">
                  <p className="text-muted-foreground">No review cycles found. Create one to get started.</p>
                </div>
              ) : (
                <div className="bg-card rounded-lg shadow-md overflow-hidden">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Period</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {cycles.map(cycle => (
                        <tr key={cycle.id} className="hover:bg-muted">
                          <td className="px-6 py-4 text-sm font-medium text-foreground">{cycle.name}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{cycle.cycleType.replace(/_/g, ' ')}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}</td>
                          <td className="px-6 py-4">{statusBadge(cycle.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Goals Tab */}
          {activeTab === 'goals' && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowCreateGoal(!showCreateGoal)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  {showCreateGoal ? 'Cancel' : '+ New Goal'}
                </button>
              </div>

              {showCreateGoal && (
                <form onSubmit={handleCreateGoal} className="bg-card rounded-lg shadow-md p-6 mb-6">
                  <h3 className="font-semibold text-foreground mb-4">Create Goal</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
                      <input type="text" required value={goalForm.title} onChange={e => setGoalForm(p => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Priority</label>
                      <select value={goalForm.priority} onChange={e => setGoalForm(p => ({ ...p, priority: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md">
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Due Date</label>
                      <input type="date" value={goalForm.dueDate} onChange={e => setGoalForm(p => ({ ...p, dueDate: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                      <textarea value={goalForm.description} onChange={e => setGoalForm(p => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md" rows={2} />
                    </div>
                  </div>
                  <button type="submit" disabled={creating} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm">{creating ? 'Creating...' : 'Create Goal'}</button>
                </form>
              )}

              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading goals...</div>
              ) : goals.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-lg shadow-md">
                  <p className="text-muted-foreground">No goals found. Create one to start tracking your objectives.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {goals.map(goal => (
                    <div key={goal.id} className="bg-card rounded-lg shadow-md p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-foreground">{goal.title}</h3>
                        {statusBadge(goal.status)}
                      </div>
                      {goal.description && <p className="text-sm text-muted-foreground mb-3">{goal.description}</p>}
                      <div className="flex items-center gap-4 mb-3">
                        <span className={`text-xs px-2 py-1 rounded ${goal.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' : goal.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' : goal.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{goal.priority}</span>
                        {goal.dueDate && <span className="text-xs text-muted-foreground">Due: {new Date(goal.dueDate).toLocaleDateString()}</span>}
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${goal.progress}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{goal.progress}% complete</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </RoleGate>
    </FeatureGate>
  );
}
