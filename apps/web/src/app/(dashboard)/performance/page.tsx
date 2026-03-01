'use client';

import { useState, useEffect } from 'react';
import { apiClient, type ReviewCycle, type Goal } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { FeatureGate } from '@/components/common/feature-gate';
import { Permission } from '@hrplatform/shared';
import { PageContainer } from '@/components/ui/page-container';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { ErrorBanner } from '@/components/ui/error-banner';
import { StatCard } from '@/components/ui/stat-card';
import { TableLoader, PageLoader } from '@/components/ui/page-loader';
import { useToast } from '@/components/ui/toast';
import {
  Plus, Loader2, AlertCircle, Target, BarChart3, CheckCircle2,
  Clock, CalendarRange, Trophy, Crosshair,
} from 'lucide-react';

export default function PerformancePage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'cycles' | 'goals'>('cycles');
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create cycle form
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [cycleForm, setCycleForm] = useState({ name: '', cycleType: 'QUARTERLY', startDate: '', endDate: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Create goal form
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });

  useEffect(() => {
    if (activeTab === 'cycles') fetchCycles();
    else fetchGoals();
  }, [activeTab]);

  const fetchCycles = async () => {
    try {
      setLoading(true);
      setError(null);
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
      setError(null);
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
    setFormError(null);
    try {
      await apiClient.createReviewCycle(cycleForm);
      setShowCycleModal(false);
      setCycleForm({ name: '', cycleType: 'QUARTERLY', startDate: '', endDate: '', description: '' });
      toast.success('Review cycle created', 'New review cycle has been created successfully.');
      fetchCycles();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create review cycle');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormError(null);
    try {
      await apiClient.createGoal(goalForm);
      setShowGoalModal(false);
      setGoalForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
      toast.success('Goal created', 'New goal has been created successfully.');
      fetchGoals();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create goal');
    } finally {
      setCreating(false);
    }
  };

  const openCycleModal = () => {
    setShowCycleModal(true);
    setCycleForm({ name: '', cycleType: 'QUARTERLY', startDate: '', endDate: '', description: '' });
    setFormError(null);
  };

  const openGoalModal = () => {
    setShowGoalModal(true);
    setGoalForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
    setFormError(null);
  };

  const priorityVariant = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'error' as const;
      case 'HIGH': return 'orange' as const;
      case 'MEDIUM': return 'warning' as const;
      default: return 'success' as const;
    }
  };

  // Stats for cycles
  const activeCycles = cycles.filter(c => c.status === 'ACTIVE').length;
  const completedCycles = cycles.filter(c => c.status === 'COMPLETED').length;

  // Stats for goals
  const completedGoals = goals.filter(g => g.status === 'COMPLETED').length;
  const inProgressGoals = goals.filter(g => g.status === 'IN_PROGRESS').length;
  const avgProgress = goals.length > 0 ? Math.round(goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length) : 0;

  if (loading && cycles.length === 0 && goals.length === 0) return <PageLoader />;

  return (
    <FeatureGate feature="PERFORMANCE">
      <RoleGate requiredPermissions={[Permission.VIEW_PERFORMANCE, Permission.MANAGE_PERFORMANCE, Permission.VIEW_OWN_PERFORMANCE]}>
        <PageContainer
          title="Reviews"
          description="Set up review cycles, track goals, and manage team performance"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Reviews' },
          ]}
          actions={
            <RoleGate requiredPermissions={[Permission.MANAGE_PERFORMANCE]} hideOnly>
              <button
                onClick={activeTab === 'cycles' ? openCycleModal : openGoalModal}
                className="inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {activeTab === 'cycles' ? 'New Review Cycle' : 'New Goal'}
              </button>
            </RoleGate>
          }
        >
          {error && (
            <ErrorBanner
              message={error}
              onDismiss={() => setError(null)}
              onRetry={activeTab === 'cycles' ? fetchCycles : fetchGoals}
            />
          )}

          {/* Tabs */}
          <div className="flex space-x-4 border-b border-border">
            <button
              onClick={() => setActiveTab('cycles')}
              className={`pb-3 px-1 font-medium text-sm transition-colors ${
                activeTab === 'cycles'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Review Cycles
            </button>
            <button
              onClick={() => setActiveTab('goals')}
              className={`pb-3 px-1 font-medium text-sm transition-colors ${
                activeTab === 'goals'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              My Goals
            </button>
          </div>

          {/* Review Cycles Tab */}
          {activeTab === 'cycles' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard title="Total Cycles" value={cycles.length} icon={CalendarRange} iconColor="blue" />
                <StatCard title="Active" value={activeCycles} icon={BarChart3} iconColor="green" />
                <StatCard title="Completed" value={completedCycles} icon={CheckCircle2} iconColor="purple" />
              </div>

              {loading ? (
                <div className="rounded-xl border bg-card overflow-hidden">
                  <TableLoader rows={5} cols={4} />
                </div>
              ) : cycles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border bg-card">
                  <CalendarRange className="w-12 h-12 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground">No review cycles yet</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">Create your first review cycle to start tracking performance.</p>
                  <RoleGate requiredPermissions={[Permission.MANAGE_PERFORMANCE]} hideOnly>
                    <button
                      onClick={openCycleModal}
                      className="mt-4 inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Create Review Cycle
                    </button>
                  </RoleGate>
                </div>
              ) : (
                <div className="rounded-xl border bg-card overflow-hidden">
                  <table className="min-w-full divide-y">
                    <thead className="border-b bg-muted/30">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Period</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {cycles.map(cycle => (
                        <tr key={cycle.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3.5 text-sm font-medium text-foreground">{cycle.name}</td>
                          <td className="px-4 py-3.5 text-sm text-muted-foreground">{cycle.cycleType.replace(/_/g, ' ')}</td>
                          <td className="px-4 py-3.5 text-sm text-muted-foreground">
                            {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge variant={getStatusVariant(cycle.status)} dot>
                              {cycle.status.replace(/_/g, ' ')}
                            </StatusBadge>
                          </td>
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
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <StatCard title="Total Goals" value={goals.length} icon={Target} iconColor="blue" />
                <StatCard title="In Progress" value={inProgressGoals} icon={Clock} iconColor="amber" />
                <StatCard title="Completed" value={completedGoals} icon={Trophy} iconColor="green" />
                <StatCard title="Avg Progress" value={`${avgProgress}%`} icon={BarChart3} iconColor="purple" />
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-xl border bg-card p-6 animate-pulse">
                      <div className="h-5 bg-muted rounded w-40 mb-3" />
                      <div className="h-3 bg-muted rounded w-full mb-4" />
                      <div className="h-2 bg-muted rounded-full w-full" />
                    </div>
                  ))}
                </div>
              ) : goals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border bg-card">
                  <Crosshair className="w-12 h-12 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground">No goals yet</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">Create your first goal to start tracking your objectives.</p>
                  <button
                    onClick={openGoalModal}
                    className="mt-4 inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Create Goal
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {goals.map(goal => (
                    <div key={goal.id} className="rounded-xl border bg-card p-5 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-foreground">{goal.title}</h3>
                        <StatusBadge variant={getStatusVariant(goal.status)} dot>
                          {goal.status.replace(/_/g, ' ')}
                        </StatusBadge>
                      </div>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{goal.description}</p>
                      )}
                      <div className="flex items-center gap-3 mb-3">
                        <StatusBadge variant={priorityVariant(goal.priority)} size="sm">
                          {goal.priority}
                        </StatusBadge>
                        {goal.dueDate && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Due: {new Date(goal.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">{goal.progress}% complete</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Create Review Cycle Modal */}
          <Modal open={showCycleModal} onClose={() => setShowCycleModal(false)} size="lg">
            <ModalHeader onClose={() => setShowCycleModal(false)}>
              Create Review Cycle
            </ModalHeader>
            <form onSubmit={handleCreateCycle}>
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
                      <label className="text-sm font-medium text-foreground">Name <span className="text-destructive">*</span></label>
                      <input
                        type="text"
                        required
                        value={cycleForm.name}
                        onChange={e => setCycleForm(p => ({ ...p, name: e.target.value }))}
                        className="h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                        placeholder="Q1 2025 Review"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Type <span className="text-destructive">*</span></label>
                      <select
                        value={cycleForm.cycleType}
                        onChange={e => setCycleForm(p => ({ ...p, cycleType: e.target.value }))}
                        className="h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                      >
                        <option value="QUARTERLY">Quarterly</option>
                        <option value="HALF_YEARLY">Half Yearly</option>
                        <option value="ANNUAL">Annual</option>
                        <option value="CUSTOM">Custom</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Start Date <span className="text-destructive">*</span></label>
                      <input
                        type="date"
                        required
                        value={cycleForm.startDate}
                        onChange={e => setCycleForm(p => ({ ...p, startDate: e.target.value }))}
                        className="h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">End Date <span className="text-destructive">*</span></label>
                      <input
                        type="date"
                        required
                        value={cycleForm.endDate}
                        onChange={e => setCycleForm(p => ({ ...p, endDate: e.target.value }))}
                        className="h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Description</label>
                    <textarea
                      value={cycleForm.description}
                      onChange={e => setCycleForm(p => ({ ...p, description: e.target.value }))}
                      className="w-full min-h-[80px] px-3 py-2 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-y"
                      rows={2}
                      placeholder="Brief description of this review cycle"
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <button
                  type="button"
                  onClick={() => setShowCycleModal(false)}
                  disabled={creating}
                  className="h-9 px-4 border border-input rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="h-9 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Cycle
                </button>
              </ModalFooter>
            </form>
          </Modal>

          {/* Create Goal Modal */}
          <Modal open={showGoalModal} onClose={() => setShowGoalModal(false)} size="md">
            <ModalHeader onClose={() => setShowGoalModal(false)}>
              Create Goal
            </ModalHeader>
            <form onSubmit={handleCreateGoal}>
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
                    <input
                      type="text"
                      required
                      value={goalForm.title}
                      onChange={e => setGoalForm(p => ({ ...p, title: e.target.value }))}
                      className="h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                      placeholder="Increase sales by 20%"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Priority</label>
                      <select
                        value={goalForm.priority}
                        onChange={e => setGoalForm(p => ({ ...p, priority: e.target.value }))}
                        className="h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Due Date</label>
                      <input
                        type="date"
                        value={goalForm.dueDate}
                        onChange={e => setGoalForm(p => ({ ...p, dueDate: e.target.value }))}
                        className="h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Description</label>
                    <textarea
                      value={goalForm.description}
                      onChange={e => setGoalForm(p => ({ ...p, description: e.target.value }))}
                      className="w-full min-h-[80px] px-3 py-2 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-y"
                      rows={2}
                      placeholder="Describe the goal and key results"
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  disabled={creating}
                  className="h-9 px-4 border border-input rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="h-9 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Goal
                </button>
              </ModalFooter>
            </form>
          </Modal>
        </PageContainer>
      </RoleGate>
    </FeatureGate>
  );
}
