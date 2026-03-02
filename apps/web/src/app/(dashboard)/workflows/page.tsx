'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { FeatureGate } from '@/components/common/feature-gate';
import { useAuthContext } from '@/contexts/auth-context';
import { GitBranch, Plus, X, ChevronDown, ChevronRight, CheckCircle, XCircle, Clock, Ban, Trash2 } from 'lucide-react';

interface WorkflowStep {
  order: number;
  approverType: string;
  approverValue: string;
  required?: boolean;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  entityType: string;
  steps: WorkflowStep[];
  isActive: boolean;
  createdAt: string;
}

interface WorkflowInstanceStep {
  id: string;
  stepOrder: number;
  approverType: string;
  approverValue: string;
  status: string;
  resolvedBy?: string;
  resolvedAt?: string;
  comments?: string;
  resolver?: { id: string; firstName: string; lastName: string };
}

interface WorkflowInstance {
  id: string;
  entityType: string;
  entityId: string;
  status: string;
  currentStepOrder: number;
  createdAt: string;
  completedAt?: string;
  template?: { name: string };
  initiator?: { firstName: string; lastName: string };
  steps?: WorkflowInstanceStep[];
}

const ENTITY_TYPES = ['LEAVE', 'EXPENSE', 'DOCUMENT', 'PAYROLL'];
const APPROVER_TYPES = ['ROLE', 'USER', 'MANAGER'];
const ROLE_VALUES = ['COMPANY_ADMIN', 'HR_ADMIN', 'MANAGER'];

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    IN_PROGRESS: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    APPROVED: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    REJECTED: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    CANCELLED: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300',
    SKIPPED: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function statusIcon(status: string) {
  switch (status) {
    case 'APPROVED': return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'REJECTED': return <XCircle className="w-4 h-4 text-red-500" />;
    case 'PENDING': return <Clock className="w-4 h-4 text-yellow-500" />;
    case 'CANCELLED': return <Ban className="w-4 h-4 text-gray-500" />;
    default: return <Clock className="w-4 h-4 text-gray-400" />;
  }
}

export default function WorkflowsPage() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'templates' | 'instances' | 'approvals'>('templates');

  // Templates
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [templateForm, setTemplateForm] = useState({ name: '', description: '', entityType: 'LEAVE' });
  const [templateSteps, setTemplateSteps] = useState<WorkflowStep[]>([{ order: 1, approverType: 'ROLE', approverValue: 'HR_ADMIN', required: true }]);
  const [creating, setCreating] = useState(false);

  // Instances
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [instancesLoading, setInstancesLoading] = useState(false);
  const [instanceStatusFilter, setInstanceStatusFilter] = useState('');
  const [expandedInstance, setExpandedInstance] = useState<string | null>(null);

  // Approvals
  const [approvals, setApprovals] = useState<any[]>([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isAdmin = user?.role === 'COMPANY_ADMIN' || user?.role === 'HR_ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (activeTab === 'templates') fetchTemplates();
    else if (activeTab === 'instances') fetchInstances();
    else if (activeTab === 'approvals') fetchApprovals();
  }, [activeTab, instanceStatusFilter]);

  const fetchTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const result = await apiClient.getWorkflowTemplates();
      setTemplates(Array.isArray(result) ? result : result.data || []);
    } catch (err: any) { setError(err.message); }
    finally { setTemplatesLoading(false); }
  };

  const fetchInstances = async () => {
    try {
      setInstancesLoading(true);
      const filters: any = {};
      if (instanceStatusFilter) filters.status = instanceStatusFilter;
      const result = await apiClient.getWorkflowInstances(filters);
      setInstances(Array.isArray(result) ? result : result.data || []);
    } catch (err: any) { setError(err.message); }
    finally { setInstancesLoading(false); }
  };

  const fetchApprovals = async () => {
    try {
      setApprovalsLoading(true);
      const result = await apiClient.getMyApprovals();
      setApprovals(Array.isArray(result) ? result : []);
    } catch (err: any) { setError(err.message); }
    finally { setApprovalsLoading(false); }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateForm.name.trim()) { setError('Template name is required'); return; }
    if (templateSteps.length === 0) { setError('At least one step is required'); return; }
    setCreating(true);
    try {
      await apiClient.createWorkflowTemplate({
        name: templateForm.name,
        description: templateForm.description || undefined,
        entityType: templateForm.entityType,
        steps: templateSteps,
      });
      setShowCreateTemplate(false);
      setTemplateForm({ name: '', description: '', entityType: 'LEAVE' });
      setTemplateSteps([{ order: 1, approverType: 'ROLE', approverValue: 'HR_ADMIN', required: true }]);
      setSuccess('Workflow template created successfully');
      setTimeout(() => setSuccess(''), 3000);
      fetchTemplates();
    } catch (err: any) { setError(err.message); }
    finally { setCreating(false); }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await apiClient.deleteWorkflowTemplate(id);
      setSuccess('Template deactivated');
      setTimeout(() => setSuccess(''), 3000);
      fetchTemplates();
    } catch (err: any) { setError(err.message); }
  };

  const handleApproveStep = async (stepId: string) => {
    try {
      await apiClient.approveWorkflowStep(stepId);
      setSuccess('Step approved');
      setTimeout(() => setSuccess(''), 3000);
      fetchApprovals();
    } catch (err: any) { setError(err.message); }
  };

  const handleRejectStep = async (stepId: string) => {
    try {
      await apiClient.rejectWorkflowStep(stepId);
      setSuccess('Step rejected');
      setTimeout(() => setSuccess(''), 3000);
      fetchApprovals();
    } catch (err: any) { setError(err.message); }
  };

  const handleCancelInstance = async (id: string) => {
    try {
      await apiClient.cancelWorkflow(id);
      setSuccess('Workflow cancelled');
      setTimeout(() => setSuccess(''), 3000);
      fetchInstances();
    } catch (err: any) { setError(err.message); }
  };

  const addStep = () => {
    setTemplateSteps(prev => [...prev, { order: prev.length + 1, approverType: 'ROLE', approverValue: 'HR_ADMIN', required: true }]);
  };

  const removeStep = (index: number) => {
    setTemplateSteps(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })));
  };

  const updateStep = (index: number, field: string, value: any) => {
    setTemplateSteps(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  return (
    <FeatureGate feature="WORKFLOWS">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Workflow Management</h1>
            <p className="text-muted-foreground mt-1">Configure approval workflows and track active instances</p>
          </div>
        </div>

        {error && <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">{error}<button onClick={() => setError('')} className="ml-2 font-bold">x</button></div>}
        {success && <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">{success}</div>}

        {/* Tab Navigation */}
        <div className="flex border-b border-border mb-6">
          {(['templates', 'instances', 'approvals'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${
                activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'approvals' ? 'My Approvals' : tab}
            </button>
          ))}
        </div>

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div>
            {isAdmin && (
              <div className="mb-4">
                <button
                  onClick={() => setShowCreateTemplate(!showCreateTemplate)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  {showCreateTemplate ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New Template</>}
                </button>
              </div>
            )}

            {showCreateTemplate && (
              <form onSubmit={handleCreateTemplate} className="bg-card border border-border rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-foreground mb-4">Create Workflow Template</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Template Name *</label>
                    <input
                      type="text" required
                      value={templateForm.name}
                      onChange={e => setTemplateForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                      placeholder="e.g., Leave Approval Flow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Entity Type *</label>
                    <select
                      value={templateForm.entityType}
                      onChange={e => setTemplateForm(p => ({ ...p, entityType: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    >
                      {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                    <input
                      type="text"
                      value={templateForm.description}
                      onChange={e => setTemplateForm(p => ({ ...p, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                {/* Steps Builder */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">Approval Steps</label>
                  <div className="space-y-3">
                    {templateSteps.map((step, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                        <span className="text-sm font-medium text-muted-foreground w-16">Step {step.order}</span>
                        <select
                          value={step.approverType}
                          onChange={e => updateStep(i, 'approverType', e.target.value)}
                          className="px-3 py-1.5 border border-border rounded-md text-sm bg-background text-foreground"
                        >
                          {APPROVER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        {step.approverType === 'ROLE' ? (
                          <select
                            value={step.approverValue}
                            onChange={e => updateStep(i, 'approverValue', e.target.value)}
                            className="px-3 py-1.5 border border-border rounded-md text-sm bg-background text-foreground"
                          >
                            {ROLE_VALUES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                          </select>
                        ) : step.approverType === 'MANAGER' ? (
                          <span className="text-sm text-muted-foreground">Reporting Manager</span>
                        ) : (
                          <input
                            type="text"
                            value={step.approverValue}
                            onChange={e => updateStep(i, 'approverValue', e.target.value)}
                            placeholder="User ID"
                            className="px-3 py-1.5 border border-border rounded-md text-sm bg-background text-foreground flex-1"
                          />
                        )}
                        {templateSteps.length > 1 && (
                          <button type="button" onClick={() => removeStep(i)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addStep} className="mt-2 text-sm text-primary hover:underline">+ Add Step</button>
                </div>

                <button type="submit" disabled={creating} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm">
                  {creating ? 'Creating...' : 'Create Template'}
                </button>
              </form>
            )}

            {templatesLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading templates...</div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-lg border border-border">
                <GitBranch className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No workflow templates configured</p>
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map(t => (
                  <div key={t.id} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground">{t.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${t.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                            {t.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Entity: {t.entityType} &middot; {(t.steps as WorkflowStep[])?.length || 0} step(s)
                          {t.description && ` &middot; ${t.description}`}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {(t.steps as WorkflowStep[])?.map((s, i) => (
                            <span key={i} className="text-xs px-2 py-1 bg-muted rounded border border-border text-muted-foreground">
                              {i + 1}. {s.approverType === 'MANAGER' ? 'Manager' : s.approverValue?.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                      {isAdmin && t.isActive && (
                        <button onClick={() => handleDeleteTemplate(t.id)} title="Deactivate" className="p-2 hover:bg-muted rounded text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Instances Tab */}
        {activeTab === 'instances' && (
          <div>
            <div className="flex gap-4 mb-4">
              <select
                value={instanceStatusFilter}
                onChange={e => setInstanceStatusFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {instancesLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading instances...</div>
            ) : instances.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-lg border border-border">
                <p className="text-muted-foreground">No workflow instances found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {instances.map(inst => (
                  <div key={inst.id} className="bg-card border border-border rounded-lg">
                    <div
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpandedInstance(expandedInstance === inst.id ? null : inst.id)}
                    >
                      <div className="flex items-center gap-3">
                        {expandedInstance === inst.id ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{inst.template?.name || 'Workflow'}</span>
                            {statusBadge(inst.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {inst.entityType} &middot; Started by {inst.initiator ? `${inst.initiator.firstName} ${inst.initiator.lastName}` : 'Unknown'} &middot; {new Date(inst.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {(inst.status === 'PENDING' || inst.status === 'IN_PROGRESS') && isAdmin && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCancelInstance(inst.id); }}
                          className="px-3 py-1 text-xs text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    {expandedInstance === inst.id && inst.steps && (
                      <div className="px-4 pb-4 border-t border-border pt-3">
                        <h4 className="text-sm font-medium text-foreground mb-2">Steps</h4>
                        <div className="space-y-2">
                          {inst.steps.map((step: WorkflowInstanceStep) => (
                            <div key={step.id} className="flex items-center gap-3 text-sm">
                              {statusIcon(step.status)}
                              <span className="text-muted-foreground">Step {step.stepOrder}:</span>
                              <span className="text-foreground">{step.approverType} - {step.approverValue.replace(/_/g, ' ')}</span>
                              {statusBadge(step.status)}
                              {step.resolver && <span className="text-muted-foreground text-xs">by {step.resolver.firstName} {step.resolver.lastName}</span>}
                              {step.comments && <span className="text-xs text-muted-foreground italic">&quot;{step.comments}&quot;</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Approvals Tab */}
        {activeTab === 'approvals' && (
          <div>
            {approvalsLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading approvals...</div>
            ) : approvals.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-lg border border-border">
                <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No pending approvals</p>
              </div>
            ) : (
              <div className="space-y-3">
                {approvals.map((step: any) => (
                  <div key={step.id} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium text-foreground">
                            {step.instance?.template?.name || 'Workflow'} - Step {step.stepOrder}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {step.instance?.entityType} &middot; Started by {step.instance?.initiator?.firstName} {step.instance?.initiator?.lastName}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveStep(step.id)}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleRejectStep(step.id)}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </FeatureGate>
  );
}
