'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api-client';

const STEPS = [
  { id: 0, title: 'Company Profile', description: 'Set up your organization details' },
  { id: 1, title: 'First Department', description: 'Create your first department' },
  { id: 2, title: 'Invite Team', description: 'Invite your team members' },
  { id: 3, title: 'Enable Modules', description: 'Choose which features to enable' },
];

// ==================== Step 1: Company Profile ====================
function CompanyProfileStep({ onNext }: { onNext: () => void }) {
  const [form, setForm] = useState({
    email: '',
    phone: '',
    website: '',
    addressLine1: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data: Record<string, string> = {};
      Object.entries(form).forEach(([k, v]) => { if (v) data[k] = v; });
      if (Object.keys(data).length > 0) {
        await apiClient.updateCompany(data);
      }
      onNext();
    } catch (err) {
      console.error('Failed to update company:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="contact@company.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="+91 98765 43210" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
        <input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="https://company.com" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input type="text" value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Street address" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
          <input type="text" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>
      <div className="flex justify-end pt-4">
        <button type="submit" disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
          {saving ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </form>
  );
}

// ==================== Step 2: First Department ====================
function DepartmentStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.code) return;
    setSaving(true);
    try {
      await apiClient.createDepartment({ name: form.name, code: form.code, description: form.description || undefined });
      onNext();
    } catch (err) {
      console.error('Failed to create department:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-500">Create your first department to organize your team. You can always add more later.</p>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Department Name *</label>
        <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., Engineering" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Department Code *</label>
        <input type="text" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., ENG" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={2} />
      </div>
      <div className="flex justify-between pt-4">
        <button type="button" onClick={onSkip} className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium">
          Skip for now
        </button>
        <button type="submit" disabled={saving || !form.name || !form.code}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
          {saving ? 'Creating...' : 'Create & Continue'}
        </button>
      </div>
    </form>
  );
}

// ==================== Step 3: Invite Team ====================
function InviteStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [invites, setInvites] = useState([{ email: '', role: 'EMPLOYEE' }]);
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(0);

  const addRow = () => setInvites([...invites, { email: '', role: 'EMPLOYEE' }]);
  const removeRow = (i: number) => setInvites(invites.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: string, value: string) => {
    const updated = [...invites];
    updated[i] = { ...updated[i], [field]: value };
    setInvites(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validInvites = invites.filter((inv) => inv.email.includes('@'));
    if (validInvites.length === 0) { onNext(); return; }
    setSaving(true);
    let count = 0;
    for (const inv of validInvites) {
      try {
        await apiClient.createInvitation({ email: inv.email, role: inv.role });
        count++;
      } catch (err) {
        console.error(`Failed to invite ${inv.email}:`, err);
      }
    }
    setSent(count);
    setTimeout(onNext, 1500);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-500">Invite your team members. They will receive an email with instructions to join.</p>
      {invites.map((inv, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className="flex-1">
            <input type="email" value={inv.email} onChange={(e) => updateRow(i, 'email', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="colleague@company.com" />
          </div>
          <div className="w-40">
            <select value={inv.role} onChange={(e) => updateRow(i, 'role', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="HR_ADMIN">HR Admin</option>
              <option value="COMPANY_ADMIN">Admin</option>
            </select>
          </div>
          {invites.length > 1 && (
            <button type="button" onClick={() => removeRow(i)} className="p-2 text-gray-400 hover:text-red-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ))}
      <button type="button" onClick={addRow} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
        + Add another
      </button>
      {sent > 0 && (
        <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm">
          {sent} invitation{sent > 1 ? 's' : ''} sent successfully!
        </div>
      )}
      <div className="flex justify-between pt-4">
        <button type="button" onClick={onSkip} className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium">
          Skip for now
        </button>
        <button type="submit" disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
          {saving ? 'Sending...' : 'Send Invitations & Continue'}
        </button>
      </div>
    </form>
  );
}

// ==================== Step 4: Enable Modules ====================
function ModulesStep({ onComplete }: { onComplete: () => void }) {
  const [modules, setModules] = useState<Record<string, boolean>>({
    ATTENDANCE: true,
    LEAVE: true,
    PAYROLL: false,
    REPORTS: false,
    DOCUMENTS: false,
    AUDIT_LOGS: false,
  });
  const [saving, setSaving] = useState(false);

  const moduleInfo: Record<string, { label: string; description: string }> = {
    ATTENDANCE: { label: 'Attendance', description: 'Track employee check-ins, work hours, and overtime' },
    LEAVE: { label: 'Leave Management', description: 'Handle leave applications, approvals, and balances' },
    PAYROLL: { label: 'Payroll', description: 'Process salaries, deductions, and generate payslips' },
    REPORTS: { label: 'Reports', description: 'Generate HR analytics and business intelligence reports' },
    DOCUMENTS: { label: 'Documents', description: 'Store and manage employee documents securely' },
    AUDIT_LOGS: { label: 'Audit Logs', description: 'Track all system activities for compliance' },
  };

  const toggle = (key: string) => setModules({ ...modules, [key]: !modules[key] });

  const handleComplete = async () => {
    setSaving(true);
    try {
      await apiClient.post('/company/onboarding/complete');
      onComplete();
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Choose which HR modules to enable. You can always change these later in Settings.</p>
      <div className="space-y-3">
        {Object.entries(moduleInfo).map(([key, info]) => (
          <label key={key} className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
            modules[key] ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'
          }`}>
            <input type="checkbox" checked={modules[key]} onChange={() => toggle(key)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
            <div>
              <p className="font-medium text-gray-900">{info.label}</p>
              <p className="text-sm text-gray-500">{info.description}</p>
            </div>
          </label>
        ))}
      </div>
      <div className="flex justify-end pt-4">
        <button onClick={handleComplete} disabled={saving}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-lg">
          {saving ? 'Setting up...' : 'Complete Setup'}
        </button>
      </div>
    </div>
  );
}

// ==================== Main Wizard ====================
export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const status = await apiClient.get<{ completed: boolean; currentStep: number }>('/company/onboarding');
        if (status.completed) {
          router.replace('/dashboard');
          return;
        }
        setCurrentStep(status.currentStep);
      } catch {
        // If endpoint fails, start from step 0
      } finally {
        setLoading(false);
      }
    }
    checkOnboarding();
  }, [router]);

  const goToStep = useCallback(async (step: number) => {
    setCurrentStep(step);
    try {
      await apiClient.patch('/company/onboarding/step', { step });
    } catch {
      // Non-critical, continue anyway
    }
  }, []);

  const handleComplete = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">HR</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome to HRPlatform</h1>
        <p className="text-gray-500 mt-2">Let&apos;s get your organization set up in just a few steps.</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-10 px-4">
        {STEPS.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                i < currentStep
                  ? 'bg-green-500 text-white'
                  : i === currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
              }`}>
                {i < currentStep ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-xs mt-1 font-medium ${
                i <= currentStep ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {step.title}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-16 h-0.5 mx-2 mt-[-16px] ${
                i < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Current Step */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">{STEPS[currentStep].title}</h2>
        <p className="text-sm text-gray-500 mb-6">{STEPS[currentStep].description}</p>

        {currentStep === 0 && <CompanyProfileStep onNext={() => goToStep(1)} />}
        {currentStep === 1 && <DepartmentStep onNext={() => goToStep(2)} onSkip={() => goToStep(2)} />}
        {currentStep === 2 && <InviteStep onNext={() => goToStep(3)} onSkip={() => goToStep(3)} />}
        {currentStep === 3 && <ModulesStep onComplete={handleComplete} />}
      </div>

      {/* Skip All */}
      <div className="text-center mt-6">
        <button onClick={handleComplete} className="text-sm text-gray-400 hover:text-gray-600">
          Skip setup and go to dashboard
        </button>
      </div>
    </div>
  );
}
