'use client';

import { useState, useEffect } from 'react';
import { apiClient, type JobPosting, type Applicant } from '@/lib/api-client';
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
  Plus, Loader2, AlertCircle, Briefcase, Users, CheckCircle2,
  Send, MapPin, Clock, UserPlus, FileText,
} from 'lucide-react';

export default function RecruitmentPage() {
  const toast = useToast();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showJobModal, setShowJobModal] = useState(false);
  const [jobForm, setJobForm] = useState({ title: '', description: '', location: '', jobType: 'FULL_TIME', experience: '', openings: 1 });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (selectedJob) fetchApplicants(selectedJob.id);
  }, [selectedJob?.id]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getJobPostings();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicants = async (jobId: string) => {
    try {
      const data = await apiClient.getApplicants(jobId);
      setApplicants(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormError(null);
    try {
      await apiClient.createJobPosting({ ...jobForm, openings: Number(jobForm.openings) });
      setShowJobModal(false);
      setJobForm({ title: '', description: '', location: '', jobType: 'FULL_TIME', experience: '', openings: 1 });
      toast.success('Job posting created', 'New job posting has been created successfully.');
      fetchJobs();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create job posting');
    } finally {
      setCreating(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await apiClient.publishJobPosting(id);
      toast.success('Job published', 'Job posting is now live.');
      fetchJobs();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openJobModal = () => {
    setShowJobModal(true);
    setJobForm({ title: '', description: '', location: '', jobType: 'FULL_TIME', experience: '', openings: 1 });
    setFormError(null);
  };

  // Stats
  const publishedJobs = jobs.filter(j => j.status === 'PUBLISHED').length;
  const totalOpenings = jobs.reduce((sum, j) => sum + (j.openings || 0), 0);
  const totalFilled = jobs.reduce((sum, j) => sum + (j.filled || 0), 0);

  if (loading && jobs.length === 0) return <PageLoader />;

  return (
    <FeatureGate feature="RECRUITMENT">
      <RoleGate requiredPermissions={[Permission.VIEW_RECRUITMENT, Permission.MANAGE_RECRUITMENT]}>
        <PageContainer
          title="Hiring"
          description="Manage job openings, applicants, and your hiring process"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Hiring' },
          ]}
          actions={
            <RoleGate requiredPermissions={[Permission.MANAGE_RECRUITMENT]} hideOnly>
              <button
                onClick={openJobModal}
                className="inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" /> New Job Posting
              </button>
            </RoleGate>
          }
        >
          {error && (
            <ErrorBanner
              message={error}
              onDismiss={() => setError(null)}
              onRetry={fetchJobs}
            />
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <StatCard title="Total Postings" value={jobs.length} icon={Briefcase} iconColor="blue" />
            <StatCard title="Published" value={publishedJobs} icon={Send} iconColor="green" />
            <StatCard title="Total Openings" value={totalOpenings} icon={Users} iconColor="purple" />
            <StatCard title="Positions Filled" value={totalFilled} icon={CheckCircle2} iconColor="cyan" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Job Postings List */}
            <div className="lg:col-span-1 space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Job Postings</h2>
              {loading ? (
                <div className="rounded-xl border bg-card p-4 animate-pulse">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="py-3 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border bg-card">
                  <Briefcase className="w-10 h-10 text-muted-foreground/40 mb-3" />
                  <h3 className="text-sm font-semibold text-foreground">No job postings yet</h3>
                  <p className="text-xs text-muted-foreground mt-1">Create one to start hiring.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {jobs.map(job => (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className={`rounded-xl border bg-card p-4 cursor-pointer transition-all ${
                        selectedJob?.id === job.id
                          ? 'border-primary ring-1 ring-primary/20 shadow-sm'
                          : 'hover:border-border hover:shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <h3 className="font-medium text-foreground text-sm">{job.title}</h3>
                        <StatusBadge variant={getStatusVariant(job.status)} size="sm">
                          {job.status}
                        </StatusBadge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {job.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {job.location}
                          </span>
                        )}
                        <span>{job.jobType.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {job.filled}/{job.openings} filled
                        </span>
                        {job.status === 'DRAFT' && (
                          <button
                            onClick={e => { e.stopPropagation(); handlePublish(job.id); }}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                          >
                            <Send className="w-3 h-3" /> Publish
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Applicant Pipeline */}
            <div className="lg:col-span-2 space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {selectedJob ? `Applicants - ${selectedJob.title}` : 'Select a job to view applicants'}
              </h2>
              {selectedJob ? (
                applicants.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border bg-card">
                    <UserPlus className="w-10 h-10 text-muted-foreground/40 mb-3" />
                    <h3 className="text-sm font-semibold text-foreground">No applicants yet</h3>
                    <p className="text-xs text-muted-foreground mt-1">Applicants will appear here once they apply.</p>
                  </div>
                ) : (
                  <div className="rounded-xl border bg-card overflow-hidden">
                    <table className="min-w-full divide-y">
                      <thead className="border-b bg-muted/30">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Candidate</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Stage</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Rating</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Applied</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {applicants.map(app => (
                          <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3.5 text-sm font-medium text-foreground">{app.firstName} {app.lastName}</td>
                            <td className="px-4 py-3.5 text-sm text-muted-foreground">{app.email}</td>
                            <td className="px-4 py-3.5">
                              <StatusBadge variant={getStatusVariant(app.stage)} dot>
                                {app.stage}
                              </StatusBadge>
                            </td>
                            <td className="px-4 py-3.5 text-sm text-muted-foreground">{app.rating ? `${app.rating}/5` : '-'}</td>
                            <td className="px-4 py-3.5 text-sm text-muted-foreground">{new Date(app.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border bg-card">
                  <FileText className="w-10 h-10 text-muted-foreground/40 mb-3" />
                  <h3 className="text-sm font-semibold text-foreground">No job selected</h3>
                  <p className="text-xs text-muted-foreground mt-1">Click on a job posting to view its applicants.</p>
                </div>
              )}
            </div>
          </div>

          {/* Create Job Modal */}
          <Modal open={showJobModal} onClose={() => setShowJobModal(false)} size="lg">
            <ModalHeader onClose={() => setShowJobModal(false)}>
              Create Job Posting
            </ModalHeader>
            <form onSubmit={handleCreateJob}>
              <ModalBody>
                <div className="space-y-4">
                  {formError && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-sm text-red-700 dark:text-red-400">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {formError}
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Job Title <span className="text-destructive">*</span></label>
                    <input
                      type="text"
                      required
                      value={jobForm.title}
                      onChange={e => setJobForm(p => ({ ...p, title: e.target.value }))}
                      className="h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                      placeholder="Senior Software Engineer"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Job Type</label>
                      <select
                        value={jobForm.jobType}
                        onChange={e => setJobForm(p => ({ ...p, jobType: e.target.value }))}
                        className="h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                      >
                        <option value="FULL_TIME">Full Time</option>
                        <option value="PART_TIME">Part Time</option>
                        <option value="CONTRACT">Contract</option>
                        <option value="INTERN">Intern</option>
                        <option value="REMOTE">Remote</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Location</label>
                      <input
                        type="text"
                        value={jobForm.location}
                        onChange={e => setJobForm(p => ({ ...p, location: e.target.value }))}
                        className="h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                        placeholder="New York, NY"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Experience</label>
                      <input
                        type="text"
                        value={jobForm.experience}
                        onChange={e => setJobForm(p => ({ ...p, experience: e.target.value }))}
                        className="h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                        placeholder="e.g. 2-5 years"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Openings</label>
                      <input
                        type="number"
                        min="1"
                        value={jobForm.openings}
                        onChange={e => setJobForm(p => ({ ...p, openings: Number(e.target.value) }))}
                        className="h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Description <span className="text-destructive">*</span></label>
                    <textarea
                      required
                      value={jobForm.description}
                      onChange={e => setJobForm(p => ({ ...p, description: e.target.value }))}
                      className="w-full min-h-[100px] px-3 py-2 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-y"
                      rows={3}
                      placeholder="Describe the role, responsibilities, and requirements"
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <button
                  type="button"
                  onClick={() => setShowJobModal(false)}
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
                  Create Posting
                </button>
              </ModalFooter>
            </form>
          </Modal>
        </PageContainer>
      </RoleGate>
    </FeatureGate>
  );
}
