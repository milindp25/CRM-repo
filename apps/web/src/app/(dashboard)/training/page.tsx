'use client';

import { useState, useEffect } from 'react';
import { apiClient, type TrainingCourse, type TrainingEnrollment } from '@/lib/api-client';
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
  Plus, Loader2, AlertCircle, GraduationCap, BookOpen, Users,
  Clock, CheckCircle2, UserPlus, Tag, Award,
} from 'lucide-react';

export default function TrainingPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'courses' | 'my-enrollments'>('courses');
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [enrollments, setEnrollments] = useState<TrainingEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState({ title: '', description: '', category: 'TECHNICAL', instructor: '', duration: '', isMandatory: false });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'courses') fetchCourses();
    else fetchEnrollments();
  }, [activeTab]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
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
      setError(null);
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
    setFormError(null);
    try {
      await apiClient.createTrainingCourse({
        ...courseForm,
        duration: courseForm.duration ? Number(courseForm.duration) : undefined,
      });
      setShowCourseModal(false);
      setCourseForm({ title: '', description: '', category: 'TECHNICAL', instructor: '', duration: '', isMandatory: false });
      toast.success('Course created', 'New training course has been created successfully.');
      fetchCourses();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create course');
    } finally {
      setCreating(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    try {
      await apiClient.enrollInCourse(courseId);
      toast.success('Enrolled successfully', 'You have been enrolled in the course.');
      fetchCourses();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openCourseModal = () => {
    setShowCourseModal(true);
    setCourseForm({ title: '', description: '', category: 'TECHNICAL', instructor: '', duration: '', isMandatory: false });
    setFormError(null);
  };

  const categoryVariant = (category: string) => {
    switch (category) {
      case 'TECHNICAL': return 'purple' as const;
      case 'COMPLIANCE': return 'warning' as const;
      case 'SOFT_SKILLS': return 'cyan' as const;
      case 'ONBOARDING': return 'info' as const;
      case 'LEADERSHIP': return 'orange' as const;
      default: return 'neutral' as const;
    }
  };

  // Stats
  const publishedCourses = courses.filter(c => c.status === 'PUBLISHED').length;
  const mandatoryCourses = courses.filter(c => c.isMandatory).length;
  const completedEnrollments = enrollments.filter(e => e.status === 'COMPLETED').length;
  const avgProgress = enrollments.length > 0 ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length) : 0;

  if (loading && courses.length === 0 && enrollments.length === 0) return <PageLoader />;

  return (
    <FeatureGate feature="TRAINING">
      <RoleGate requiredPermissions={[Permission.VIEW_TRAINING, Permission.MANAGE_TRAINING, Permission.ENROLL_TRAINING]}>
        <PageContainer
          title="Learning"
          description="Browse courses, track progress, and develop your skills"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Learning' },
          ]}
          actions={
            activeTab === 'courses' ? (
              <RoleGate requiredPermissions={[Permission.MANAGE_TRAINING]} hideOnly>
                <button
                  onClick={openCourseModal}
                  className="inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" /> New Course
                </button>
              </RoleGate>
            ) : undefined
          }
        >
          {error && (
            <ErrorBanner
              message={error}
              onDismiss={() => setError(null)}
              onRetry={activeTab === 'courses' ? fetchCourses : fetchEnrollments}
            />
          )}

          {/* Tabs */}
          <div className="flex space-x-4 border-b border-border">
            <button
              onClick={() => setActiveTab('courses')}
              className={`pb-3 px-1 font-medium text-sm transition-colors ${
                activeTab === 'courses'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Courses
            </button>
            <button
              onClick={() => setActiveTab('my-enrollments')}
              className={`pb-3 px-1 font-medium text-sm transition-colors ${
                activeTab === 'my-enrollments'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              My Enrollments
            </button>
          </div>

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard title="Total Courses" value={courses.length} icon={BookOpen} iconColor="blue" />
                <StatCard title="Published" value={publishedCourses} icon={CheckCircle2} iconColor="green" />
                <StatCard title="Mandatory" value={mandatoryCourses} icon={AlertCircle} iconColor="rose" />
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="rounded-xl border bg-card p-6 animate-pulse">
                      <div className="h-5 bg-muted rounded w-3/4 mb-3" />
                      <div className="h-3 bg-muted rounded w-full mb-2" />
                      <div className="h-3 bg-muted rounded w-2/3 mb-4" />
                      <div className="flex gap-2">
                        <div className="h-5 bg-muted rounded w-16" />
                        <div className="h-5 bg-muted rounded w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : courses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border bg-card">
                  <GraduationCap className="w-12 h-12 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground">No courses available</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">Create your first training course to start building skills.</p>
                  <RoleGate requiredPermissions={[Permission.MANAGE_TRAINING]} hideOnly>
                    <button
                      onClick={openCourseModal}
                      className="mt-4 inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Create Course
                    </button>
                  </RoleGate>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.map(course => (
                    <div key={course.id} className="rounded-xl border bg-card p-5 hover:shadow-md transition-all group">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-foreground">{course.title}</h3>
                        <StatusBadge variant={getStatusVariant(course.status)} size="sm">
                          {course.status.replace(/_/g, ' ')}
                        </StatusBadge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {course.description || 'No description'}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {course.category && (
                          <StatusBadge variant={categoryVariant(course.category)} size="sm">
                            <Tag className="w-3 h-3 mr-0.5" />
                            {course.category.replace(/_/g, ' ')}
                          </StatusBadge>
                        )}
                        {course.isMandatory && (
                          <StatusBadge variant="error" size="sm">
                            Mandatory
                          </StatusBadge>
                        )}
                        {course.duration && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {course.duration}h
                          </span>
                        )}
                      </div>
                      {course.instructor && (
                        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {course.instructor}
                        </p>
                      )}
                      <button
                        onClick={() => handleEnroll(course.id)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Enroll
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Enrollments Tab */}
          {activeTab === 'my-enrollments' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard title="My Enrollments" value={enrollments.length} icon={BookOpen} iconColor="blue" />
                <StatCard title="Completed" value={completedEnrollments} icon={Award} iconColor="green" />
                <StatCard title="Avg Progress" value={`${avgProgress}%`} icon={Clock} iconColor="purple" />
              </div>

              {loading ? (
                <div className="rounded-xl border bg-card overflow-hidden">
                  <TableLoader rows={5} cols={5} />
                </div>
              ) : enrollments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border bg-card">
                  <BookOpen className="w-12 h-12 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground">No enrollments yet</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">Browse courses and enroll to start learning.</p>
                  <button
                    onClick={() => setActiveTab('courses')}
                    className="mt-4 inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <BookOpen className="w-4 h-4" /> Browse Courses
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border bg-card overflow-hidden">
                  <table className="min-w-full divide-y">
                    <thead className="border-b bg-muted/30">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Course</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Progress</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Score</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Enrolled</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {enrollments.map(enrollment => (
                        <tr key={enrollment.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3.5 text-sm font-medium text-foreground">{enrollment.courseId}</td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-muted rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full transition-all"
                                  style={{ width: `${enrollment.progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">{enrollment.progress}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge variant={getStatusVariant(enrollment.status)} dot>
                              {enrollment.status.replace(/_/g, ' ')}
                            </StatusBadge>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-muted-foreground">{enrollment.score != null ? `${enrollment.score}%` : '-'}</td>
                          <td className="px-4 py-3.5 text-sm text-muted-foreground">{new Date(enrollment.enrolledAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Create Course Modal */}
          <Modal open={showCourseModal} onClose={() => setShowCourseModal(false)} size="lg">
            <ModalHeader onClose={() => setShowCourseModal(false)}>
              Create Training Course
            </ModalHeader>
            <form onSubmit={handleCreateCourse}>
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
                      value={courseForm.title}
                      onChange={e => setCourseForm(p => ({ ...p, title: e.target.value }))}
                      className="h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                      placeholder="Introduction to React"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Category</label>
                      <select
                        value={courseForm.category}
                        onChange={e => setCourseForm(p => ({ ...p, category: e.target.value }))}
                        className="h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                      >
                        <option value="TECHNICAL">Technical</option>
                        <option value="COMPLIANCE">Compliance</option>
                        <option value="SOFT_SKILLS">Soft Skills</option>
                        <option value="ONBOARDING">Onboarding</option>
                        <option value="LEADERSHIP">Leadership</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Instructor</label>
                      <input
                        type="text"
                        value={courseForm.instructor}
                        onChange={e => setCourseForm(p => ({ ...p, instructor: e.target.value }))}
                        className="h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                        placeholder="Jane Smith"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Duration (hours)</label>
                      <input
                        type="number"
                        min="1"
                        value={courseForm.duration}
                        onChange={e => setCourseForm(p => ({ ...p, duration: e.target.value }))}
                        className="h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                        placeholder="8"
                      />
                    </div>
                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={courseForm.isMandatory}
                          onChange={e => setCourseForm(p => ({ ...p, isMandatory: e.target.checked }))}
                          className="h-4 w-4 rounded border-input text-primary focus:ring-primary/30"
                        />
                        <span className="text-sm text-foreground">Mandatory course</span>
                      </label>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Description</label>
                    <textarea
                      value={courseForm.description}
                      onChange={e => setCourseForm(p => ({ ...p, description: e.target.value }))}
                      className="w-full min-h-[80px] px-3 py-2 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-y"
                      rows={2}
                      placeholder="Describe the course content and objectives"
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
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
                  Create Course
                </button>
              </ModalFooter>
            </form>
          </Modal>
        </PageContainer>
      </RoleGate>
    </FeatureGate>
  );
}
