'use client';

import { useState, useEffect } from 'react';
import { apiClient, type JobPosting, type Applicant } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { FeatureGate } from '@/components/common/feature-gate';
import { Permission } from '@hrplatform/shared';

export default function RecruitmentPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCreateJob, setShowCreateJob] = useState(false);
  const [jobForm, setJobForm] = useState({ title: '', description: '', location: '', jobType: 'FULL_TIME', experience: '', openings: 1 });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (selectedJob) fetchApplicants(selectedJob.id);
  }, [selectedJob?.id]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
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
    try {
      await apiClient.createJobPosting({ ...jobForm, openings: Number(jobForm.openings) });
      setShowCreateJob(false);
      setJobForm({ title: '', description: '', location: '', jobType: 'FULL_TIME', experience: '', openings: 1 });
      fetchJobs();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await apiClient.publishJobPosting(id);
      fetchJobs();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PUBLISHED: 'bg-green-100 text-green-800',
      PAUSED: 'bg-yellow-100 text-yellow-800',
      CLOSED: 'bg-red-100 text-red-800',
      FILLED: 'bg-blue-100 text-blue-800',
      APPLIED: 'bg-blue-100 text-blue-800',
      SCREENING: 'bg-yellow-100 text-yellow-800',
      INTERVIEW: 'bg-purple-100 text-purple-800',
      OFFER: 'bg-green-100 text-green-800',
      HIRED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
  };

  return (
    <FeatureGate feature="RECRUITMENT">
      <RoleGate requiredPermissions={[Permission.VIEW_RECRUITMENT, Permission.MANAGE_RECRUITMENT]}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Recruitment</h1>
              <p className="text-gray-600 mt-1">Job postings, applicants, and hiring pipeline</p>
            </div>
            <button onClick={() => setShowCreateJob(!showCreateJob)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
              {showCreateJob ? 'Cancel' : '+ New Job Posting'}
            </button>
          </div>

          {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

          {showCreateJob && (
            <form onSubmit={handleCreateJob} className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Create Job Posting</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                  <input type="text" required value={jobForm.title} onChange={e => setJobForm(p => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                  <select value={jobForm.jobType} onChange={e => setJobForm(p => ({ ...p, jobType: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERN">Intern</option>
                    <option value="REMOTE">Remote</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input type="text" value={jobForm.location} onChange={e => setJobForm(p => ({ ...p, location: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                  <input type="text" value={jobForm.experience} onChange={e => setJobForm(p => ({ ...p, experience: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="e.g. 2-5 years" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Openings</label>
                  <input type="number" min="1" value={jobForm.openings} onChange={e => setJobForm(p => ({ ...p, openings: Number(e.target.value) }))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea required value={jobForm.description} onChange={e => setJobForm(p => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md" rows={3} />
                </div>
              </div>
              <button type="submit" disabled={creating} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm">{creating ? 'Creating...' : 'Create Posting'}</button>
            </form>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Job Postings List */}
            <div className="lg:col-span-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Job Postings</h2>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg shadow-md"><p className="text-gray-500">No job postings yet</p></div>
              ) : (
                <div className="space-y-2">
                  {jobs.map(job => (
                    <div key={job.id} onClick={() => setSelectedJob(job)} className={`bg-white rounded-lg shadow-sm p-4 cursor-pointer border-2 transition ${selectedJob?.id === job.id ? 'border-blue-500' : 'border-transparent hover:border-gray-200'}`}>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-medium text-gray-900 text-sm">{job.title}</h3>
                        {statusBadge(job.status)}
                      </div>
                      <p className="text-xs text-gray-500">{job.location || 'No location'} &middot; {job.jobType.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-500 mt-1">{job.filled}/{job.openings} filled</p>
                      {job.status === 'DRAFT' && (
                        <button onClick={e => { e.stopPropagation(); handlePublish(job.id); }} className="mt-2 text-xs text-blue-600 hover:text-blue-800">Publish</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Applicant Pipeline */}
            <div className="lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                {selectedJob ? `Applicants - ${selectedJob.title}` : 'Select a job to view applicants'}
              </h2>
              {selectedJob ? (
                applicants.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg shadow-md"><p className="text-gray-500">No applicants yet for this position</p></div>
                ) : (
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applied</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {applicants.map(app => (
                          <tr key={app.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{app.firstName} {app.lastName}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{app.email}</td>
                            <td className="px-4 py-3">{statusBadge(app.stage)}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{app.rating ? `${app.rating}/5` : '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{new Date(app.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow-md"><p className="text-gray-500">Click on a job posting to view its applicants</p></div>
              )}
            </div>
          </div>
        </div>
      </RoleGate>
    </FeatureGate>
  );
}
