'use client';

import { useState, useEffect } from 'react';
import { apiClient, type TrainingCourse, type TrainingEnrollment } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { FeatureGate } from '@/components/common/feature-gate';
import { Permission } from '@hrplatform/shared';

export default function TrainingPage() {
  const [activeTab, setActiveTab] = useState<'courses' | 'my-enrollments'>('courses');
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [enrollments, setEnrollments] = useState<TrainingEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [courseForm, setCourseForm] = useState({ title: '', description: '', category: 'TECHNICAL', instructor: '', duration: '', isMandatory: false });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (activeTab === 'courses') fetchCourses();
    else fetchEnrollments();
  }, [activeTab]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getTrainingCourses();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getMyEnrollments();
      setEnrollments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await apiClient.createTrainingCourse({
        ...courseForm,
        duration: courseForm.duration ? Number(courseForm.duration) : undefined,
      });
      setShowCreateCourse(false);
      setCourseForm({ title: '', description: '', category: 'TECHNICAL', instructor: '', duration: '', isMandatory: false });
      fetchCourses();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    try {
      await apiClient.enrollInCourse(courseId);
      setSuccess('Successfully enrolled in course');
      setTimeout(() => setSuccess(''), 3000);
      fetchCourses();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300',
      PUBLISHED: 'bg-green-100 text-green-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      ENROLLED: 'bg-blue-100 text-blue-800',
      DROPPED: 'bg-red-100 text-red-800',
      FAILED: 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'}`}>{status.replace(/_/g, ' ')}</span>;
  };

  return (
    <FeatureGate feature="TRAINING">
      <RoleGate requiredPermissions={[Permission.VIEW_TRAINING, Permission.MANAGE_TRAINING, Permission.ENROLL_TRAINING]}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Training & Learning</h1>
              <p className="text-muted-foreground mt-1">Courses, enrollments, and skill development</p>
            </div>
          </div>

          {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}
          {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">{success}</div>}

          <div className="flex space-x-4 mb-6 border-b border-border">
            <button onClick={() => setActiveTab('courses')} className={`pb-3 px-1 font-medium text-sm ${activeTab === 'courses' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-muted-foreground hover:text-foreground'}`}>
              All Courses
            </button>
            <button onClick={() => setActiveTab('my-enrollments')} className={`pb-3 px-1 font-medium text-sm ${activeTab === 'my-enrollments' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-muted-foreground hover:text-foreground'}`}>
              My Enrollments
            </button>
          </div>

          {activeTab === 'courses' && (
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={() => setShowCreateCourse(!showCreateCourse)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
                  {showCreateCourse ? 'Cancel' : '+ New Course'}
                </button>
              </div>

              {showCreateCourse && (
                <form onSubmit={handleCreateCourse} className="bg-card rounded-lg shadow-md p-6 mb-6">
                  <h3 className="font-semibold text-foreground mb-4">Create Training Course</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
                      <input type="text" required value={courseForm.title} onChange={e => setCourseForm(p => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                      <select value={courseForm.category} onChange={e => setCourseForm(p => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md">
                        <option value="TECHNICAL">Technical</option>
                        <option value="COMPLIANCE">Compliance</option>
                        <option value="SOFT_SKILLS">Soft Skills</option>
                        <option value="ONBOARDING">Onboarding</option>
                        <option value="LEADERSHIP">Leadership</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Instructor</label>
                      <input type="text" value={courseForm.instructor} onChange={e => setCourseForm(p => ({ ...p, instructor: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Duration (hours)</label>
                      <input type="number" min="1" value={courseForm.duration} onChange={e => setCourseForm(p => ({ ...p, duration: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="mandatory" checked={courseForm.isMandatory} onChange={e => setCourseForm(p => ({ ...p, isMandatory: e.target.checked }))} className="rounded" />
                      <label htmlFor="mandatory" className="text-sm text-foreground">Mandatory course</label>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                      <textarea value={courseForm.description} onChange={e => setCourseForm(p => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md" rows={2} />
                    </div>
                  </div>
                  <button type="submit" disabled={creating} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm">{creating ? 'Creating...' : 'Create Course'}</button>
                </form>
              )}

              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading courses...</div>
              ) : courses.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-lg shadow-md"><p className="text-muted-foreground">No courses available</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.map(course => (
                    <div key={course.id} className="bg-card rounded-lg shadow-md p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-foreground">{course.title}</h3>
                        {statusBadge(course.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{course.description || 'No description'}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {course.category && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">{course.category}</span>}
                        {course.isMandatory && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Mandatory</span>}
                        {course.duration && <span className="text-xs text-muted-foreground">{course.duration}h</span>}
                      </div>
                      {course.instructor && <p className="text-xs text-muted-foreground mb-3">Instructor: {course.instructor}</p>}
                      <button onClick={() => handleEnroll(course.id)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Enroll</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'my-enrollments' && (
            <div>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading enrollments...</div>
              ) : enrollments.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-lg shadow-md"><p className="text-muted-foreground">You are not enrolled in any courses</p></div>
              ) : (
                <div className="bg-card rounded-lg shadow-md overflow-hidden">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Course</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Progress</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Enrolled</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {enrollments.map(enrollment => (
                        <tr key={enrollment.id} className="hover:bg-muted">
                          <td className="px-6 py-4 text-sm font-medium text-foreground">{enrollment.courseId}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-muted rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${enrollment.progress}%` }} />
                              </div>
                              <span className="text-xs text-muted-foreground">{enrollment.progress}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">{statusBadge(enrollment.status)}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{enrollment.score != null ? `${enrollment.score}%` : '-'}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(enrollment.enrolledAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </RoleGate>
    </FeatureGate>
  );
}
