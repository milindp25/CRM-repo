'use client';

import { useState, useEffect, useCallback, useId } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import {
  Building2, Users, Mail, Layers, Sparkles, Check,
  ChevronRight, ChevronLeft, Plus, X, Loader2,
  Globe, Phone, MapPin, Briefcase, Shield, BarChart3,
  Calendar, FileText, DollarSign, ClipboardList, GraduationCap,
  Target, Megaphone, Clock, UserCheck, User, Compass,
  ArrowRight, ExternalLink,
} from 'lucide-react';

/* ═══════════════════ Step Definitions per Role ═══════════════════ */

interface StepDef {
  id: number;
  key: string;
  title: string;
  description: string;
  icon: any;
}

const ADMIN_STEPS: StepDef[] = [
  { id: 0, key: 'company-profile', title: 'About Your Company', description: 'Tell us a bit about your organization', icon: Building2 },
  { id: 1, key: 'plan', title: 'Pick Your Plan', description: 'Choose the plan that fits your team size', icon: Sparkles },
  { id: 2, key: 'departments', title: 'Create Teams', description: 'Set up your departments and teams', icon: Layers },
  { id: 3, key: 'invite', title: 'Add Your People', description: 'Send invites to your team members', icon: Mail },
  { id: 4, key: 'modules', title: 'Turn On Features', description: 'Choose what tools you want to use', icon: Layers },
  { id: 5, key: 'all-set', title: "You're All Set!", description: 'Welcome to HRPlatform', icon: Check },
];

const MANAGER_STEPS: StepDef[] = [
  { id: 0, key: 'welcome-profile', title: 'Your Profile', description: 'Add your photo and details', icon: User },
  { id: 1, key: 'explore', title: 'Quick Tour', description: 'See what you can do from here', icon: Compass },
  { id: 2, key: 'all-set-invited', title: "You're All Set!", description: 'Start managing your team', icon: Check },
];

const EMPLOYEE_STEPS: StepDef[] = [
  { id: 0, key: 'welcome-profile', title: 'Your Profile', description: 'Add your photo and details', icon: User },
  { id: 1, key: 'all-set-invited', title: "You're All Set!", description: 'Welcome aboard!', icon: Check },
];

function getStepsForRole(role: string): StepDef[] {
  if (role === 'COMPANY_ADMIN') return ADMIN_STEPS;
  if (role === 'HR_ADMIN' || role === 'MANAGER') return MANAGER_STEPS;
  return EMPLOYEE_STEPS;
}

function getWizardTitle(role: string): { heading: string; sub: string } {
  if (role === 'COMPANY_ADMIN') return {
    heading: 'Set up your organization',
    sub: 'Complete these steps to get the most out of HRPlatform',
  };
  if (role === 'HR_ADMIN' || role === 'MANAGER') return {
    heading: 'Welcome to your team!',
    sub: 'Let\u2019s get you set up so you can start managing your team',
  };
  return {
    heading: 'Welcome aboard!',
    sub: 'Let\u2019s get your profile ready',
  };
}

/* ═══════════════════ Admin Step 1: Company Profile ═══════════════════ */

function CompanyProfileStep({ onNext }: { onNext: () => void }) {
  const [form, setForm] = useState({
    email: '', phone: '', website: '', industry: '',
    companySize: '', addressLine1: '', city: '', state: '',
    country: 'India', postalCode: '',
  });
  const [saving, setSaving] = useState(false);

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
    'Retail', 'Consulting', 'Real Estate', 'Media', 'Other',
  ];

  const sizes = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '500+', label: '500+ employees' },
  ];

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
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in-up">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField icon={Mail} label="Company Email" type="email" value={form.email}
          onChange={(v) => setForm({ ...form, email: v })} placeholder="contact@company.com" />
        <InputField icon={Phone} label="Phone" type="tel" value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })} placeholder="+91 98765 43210" />
      </div>
      <InputField icon={Globe} label="Website" type="url" value={form.website}
        onChange={(v) => setForm({ ...form, website: v })} placeholder="https://company.com" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Briefcase className="w-3.5 h-3.5 text-muted-foreground" /> Industry
          </label>
          <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}
            className="w-full h-10 px-3 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors">
            <option value="">Select industry</option>
            {industries.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-muted-foreground" /> Company Size
          </label>
          <select value={form.companySize} onChange={(e) => setForm({ ...form, companySize: e.target.value })}
            className="w-full h-10 px-3 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors">
            <option value="">Select size</option>
            {sizes.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <InputField icon={MapPin} label="Address" value={form.addressLine1}
        onChange={(v) => setForm({ ...form, addressLine1: v })} placeholder="Street address" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <InputField label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
        <InputField label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
        <InputField label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
        <InputField label="Postal Code" value={form.postalCode} onChange={(v) => setForm({ ...form, postalCode: v })} />
      </div>

      <StepActions>
        <span /> {/* spacer */}
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <>Continue <ChevronRight className="w-4 h-4" /></>}
        </button>
      </StepActions>
    </form>
  );
}

/* ═══════════════════ Admin Step 2: Choose Plan ═══════════════════ */

function PlanStep({ onNext }: { onNext: () => void }) {
  const [selected, setSelected] = useState('FREE');

  const plans = [
    {
      id: 'FREE', name: 'Free', price: 'Free', period: 'forever',
      badge: 'Current Plan',
      features: ['Up to 25 employees', 'Core HR features', 'Basic reports', 'Email support'],
    },
    {
      id: 'BASIC', name: 'Basic', price: '$4', period: '/user/month',
      features: ['Up to 100 employees', 'All Free features', 'Payroll management', 'Leave policies', 'Priority support'],
    },
    {
      id: 'PROFESSIONAL', name: 'Professional', price: '$8', period: '/user/month',
      badge: 'Popular',
      features: ['Up to 500 employees', 'All Basic features', 'Performance reviews', 'Recruitment/ATS', 'Custom workflows', 'API access'],
    },
    {
      id: 'ENTERPRISE', name: 'Enterprise', price: '$15', period: '/user/month',
      features: ['Unlimited employees', 'All Pro features', 'SSO/SAML', 'Advanced analytics', 'Dedicated support', 'Custom integrations'],
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
        <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span className="text-sm text-blue-700 dark:text-blue-300">
          Start with our <strong>Free</strong> plan — upgrade anytime as your team grows.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="radiogroup" aria-label="Select a plan">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelected(plan.id)}
            role="radio"
            aria-checked={selected === plan.id}
            className={`relative text-left p-5 rounded-xl border-2 transition-all ${
              selected === plan.id
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border hover:border-primary/30'
            }`}
          >
            {plan.badge && (
              <span className={`absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-xs font-semibold ${
                plan.badge === 'Popular'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                  : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
              }`}>
                {plan.badge}
              </span>
            )}
            <div className="mb-3">
              <p className="font-semibold text-foreground">{plan.name}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
            </div>
            <ul className="space-y-1.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            {selected === plan.id && (
              <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
          </button>
        ))}
      </div>

      <StepActions>
        <span />
        <button onClick={onNext} className="btn-primary">
          Continue with {plans.find((p) => p.id === selected)?.name} <ChevronRight className="w-4 h-4" />
        </button>
      </StepActions>
    </div>
  );
}

/* ═══════════════════ Admin Step 3: Departments ═══════════════════ */

function DepartmentStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const suggestions = [
    { name: 'Engineering', code: 'ENG' },
    { name: 'Human Resources', code: 'HR' },
    { name: 'Sales', code: 'SALES' },
    { name: 'Marketing', code: 'MKT' },
    { name: 'Finance', code: 'FIN' },
    { name: 'Operations', code: 'OPS' },
  ];

  const [departments, setDepartments] = useState<Array<{ name: string; code: string }>>([]);
  const [saving, setSaving] = useState(false);

  const addSuggestion = (dept: { name: string; code: string }) => {
    if (!departments.find((d) => d.code === dept.code)) {
      setDepartments([...departments, dept]);
    }
  };

  const removeDept = (code: string) => {
    setDepartments(departments.filter((d) => d.code !== code));
  };

  const handleSubmit = async () => {
    if (departments.length === 0) { onNext(); return; }
    setSaving(true);
    for (const dept of departments) {
      try {
        await apiClient.createDepartment({ name: dept.name, code: dept.code });
      } catch (err) {
        console.error(`Failed to create ${dept.name}:`, err);
      }
    }
    setSaving(false);
    onNext();
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <p className="text-sm text-muted-foreground">
        Quick-add departments from suggestions, or skip and set them up later.
      </p>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => {
          const added = departments.some((d) => d.code === s.code);
          return (
            <button
              key={s.code}
              onClick={() => added ? removeDept(s.code) : addSuggestion(s)}
              aria-pressed={added}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                added
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border hover:border-primary/50'
              }`}
            >
              {added ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {s.name}
            </button>
          );
        })}
      </div>

      {/* Selected departments */}
      {departments.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">{departments.length} department{departments.length > 1 ? 's' : ''} selected</p>
          <div className="flex flex-wrap gap-2">
            {departments.map((d) => (
              <span key={d.code} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-muted text-sm">
                <span className="font-mono text-xs text-muted-foreground">{d.code}</span>
                <span className="text-foreground">{d.name}</span>
                <button onClick={() => removeDept(d.code)} className="text-muted-foreground hover:text-destructive ml-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <StepActions>
        <button onClick={onSkip} className="btn-ghost">Skip for now</button>
        <button onClick={handleSubmit} disabled={saving} className="btn-primary">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <>Continue <ChevronRight className="w-4 h-4" /></>}
        </button>
      </StepActions>
    </div>
  );
}

/* ═══════════════════ Admin Step 4: Invite Team ═══════════════════ */

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

  const handleSubmit = async () => {
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
    setTimeout(onNext, 1200);
    setSaving(false);
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <p className="text-sm text-muted-foreground">
        Invite your team members. They&apos;ll receive an email with instructions to join.
      </p>

      <div className="space-y-3">
        {invites.map((inv, i) => (
          <div key={i} className="flex gap-2 items-start">
            <input
              type="email"
              value={inv.email}
              onChange={(e) => updateRow(i, 'email', e.target.value)}
              className="flex-1 h-10 px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              placeholder="colleague@company.com"
              aria-label="Email address"
            />
            <select
              value={inv.role}
              onChange={(e) => updateRow(i, 'role', e.target.value)}
              className="w-36 h-10 px-3 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              aria-label="Role"
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="HR_ADMIN">HR Admin</option>
              <option value="COMPANY_ADMIN">Admin</option>
            </select>
            {invites.length > 1 && (
              <button onClick={() => removeRow(i)} className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-muted transition-colors" aria-label="Remove invite row">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button onClick={addRow} className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1">
        <Plus className="w-3.5 h-3.5" /> Add another
      </button>

      {sent > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 text-sm text-green-700 dark:text-green-400">
          <Check className="w-4 h-4" />
          {sent} invitation{sent > 1 ? 's' : ''} sent successfully!
        </div>
      )}

      <StepActions>
        <button onClick={onSkip} className="btn-ghost">Skip for now</button>
        <button onClick={handleSubmit} disabled={saving} className="btn-primary">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <>Send & Continue <ChevronRight className="w-4 h-4" /></>}
        </button>
      </StepActions>
    </div>
  );
}

/* ═══════════════════ Admin Step 5: Enable Modules ═══════════════════ */

const moduleList = [
  { key: 'ATTENDANCE', label: 'Attendance', desc: 'Track check-ins, work hours, and overtime', icon: Clock, default: true },
  { key: 'LEAVE', label: 'Leave Management', desc: 'Handle leave applications and approvals', icon: Calendar, default: true },
  { key: 'PAYROLL', label: 'Payroll', desc: 'Process salaries and generate payslips', icon: DollarSign, default: false },
  { key: 'PERFORMANCE', label: 'Performance', desc: 'Reviews, goals, and feedback cycles', icon: Target, default: false },
  { key: 'RECRUITMENT', label: 'Recruitment', desc: 'Job postings, applicants, and interviews', icon: UserCheck, default: false },
  { key: 'TRAINING', label: 'Training', desc: 'Courses, enrollments, and certifications', icon: GraduationCap, default: false },
  { key: 'DOCUMENTS', label: 'Documents', desc: 'Secure document storage and management', icon: FileText, default: false },
  { key: 'REPORTS', label: 'Reports & Analytics', desc: 'HR analytics and business insights', icon: BarChart3, default: false },
  { key: 'AUDIT_LOGS', label: 'Audit Logs', desc: 'Track all system activities', icon: ClipboardList, default: false },
  { key: 'SURVEYS', label: 'Surveys', desc: 'Employee engagement surveys', icon: Megaphone, default: false },
];

function ModulesStep({ onNext }: { onNext: () => void }) {
  const [modules, setModules] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    moduleList.forEach((m) => { initial[m.key] = m.default; });
    return initial;
  });
  const [saving, setSaving] = useState(false);

  const toggle = (key: string) => setModules({ ...modules, [key]: !modules[key] });
  const enabledCount = Object.values(modules).filter(Boolean).length;

  const handleComplete = async () => {
    setSaving(true);
    try {
      await apiClient.post('/company/onboarding/complete');
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
    } finally {
      setSaving(false);
      onNext();
    }
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Pick the features you want to use. You can always turn them on or off later in Settings.</p>
        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">{enabledCount} enabled</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {moduleList.map((mod) => {
          const Icon = mod.icon;
          const enabled = modules[mod.key];
          return (
            <button
              key={mod.key}
              onClick={() => toggle(mod.key)}
              aria-pressed={enabled}
              className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                enabled
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/30'
              }`}
            >
              <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                enabled
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">{mod.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{mod.desc}</p>
              </div>
              <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                enabled ? 'border-primary bg-primary' : 'border-input'
              }`}>
                {enabled && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
            </button>
          );
        })}
      </div>

      <StepActions>
        <span />
        <button onClick={handleComplete} disabled={saving} className="btn-primary">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Setting up...</> : <>Complete Setup <ChevronRight className="w-4 h-4" /></>}
        </button>
      </StepActions>
    </div>
  );
}

/* ═══════════════════ Admin Step 6: All Set ═══════════════════ */

function AllSetStep({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="text-center py-8 space-y-6 animate-scale-in">
      <div className="relative inline-block">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
          <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        {/* Confetti-like dots */}
        <div className="absolute -top-2 -left-2 w-3 h-3 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="absolute -top-1 -right-3 w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '100ms' }} />
        <div className="absolute -bottom-1 -left-3 w-2.5 h-2.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '200ms' }} />
        <div className="absolute -bottom-2 right-0 w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Welcome to HRPlatform!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your organization is all set up and ready to go. Start exploring your HR toolkit and managing your team efficiently.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 pt-2">
        <button onClick={onFinish} className="btn-primary text-base px-8 py-3">
          Start Using HRPlatform <ChevronRight className="w-5 h-5" />
        </button>
        <button
          onClick={() => {
            localStorage.removeItem('hrplatform-tour-completed');
            onFinish();
          }}
          className="text-sm text-primary hover:text-primary/80 font-medium"
        >
          Take a quick tour first
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════ Invited User: Welcome & Profile Step ═══════════════════ */

function WelcomeProfileStep({ onNext, userName }: { onNext: () => void; userName: string }) {
  const [form, setForm] = useState({
    phone: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
  });
  const [saving, setSaving] = useState(false);

  const timezones = [
    'Asia/Kolkata', 'America/New_York', 'America/Chicago', 'America/Denver',
    'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Tokyo',
    'Asia/Shanghai', 'Australia/Sydney', 'Pacific/Auckland',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Profile updates can be added here later
      onNext();
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up">
      <div className="text-center pb-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <User className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          Welcome, {userName}!
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Let&apos;s verify your details and get you set up.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField icon={Phone} label="Phone Number" type="tel" value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })} placeholder="+91 98765 43210" />
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-muted-foreground" /> Timezone
          </label>
          <select value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            className="w-full h-10 px-3 border border-input bg-background text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors">
            {timezones.map((tz) => <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      <StepActions>
        <span />
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <>Continue <ChevronRight className="w-4 h-4" /></>}
        </button>
      </StepActions>
    </form>
  );
}

/* ═══════════════════ Manager/HR: Explore Features Step ═══════════════════ */

function ExploreFeaturesStep({ onNext, role }: { onNext: () => void; role: string }) {
  const [visited, setVisited] = useState<Set<string>>(new Set());

  const features = role === 'HR_ADMIN' ? [
    { key: 'employees', label: 'View & manage employees', href: '/employees', icon: Users, desc: 'See your team directory and manage records' },
    { key: 'attendance', label: 'Check team attendance', href: '/attendance', icon: Clock, desc: 'Monitor check-ins and work hours' },
    { key: 'leave', label: 'Review leave requests', href: '/leave', icon: Calendar, desc: 'Approve or reject leave applications' },
    { key: 'payroll', label: 'Run payroll', href: '/payroll', icon: DollarSign, desc: 'Process salaries and generate payslips' },
  ] : [
    { key: 'employees', label: 'View your team', href: '/employees', icon: Users, desc: 'See who\u2019s on your team' },
    { key: 'attendance', label: 'Track team attendance', href: '/attendance', icon: Clock, desc: 'Monitor your team\u2019s attendance' },
    { key: 'leave', label: 'Manage leave requests', href: '/leave', icon: Calendar, desc: 'Review and approve team leave' },
    { key: 'performance', label: 'Performance reviews', href: '/performance', icon: Target, desc: 'Set goals and give feedback' },
  ];

  const markVisited = (key: string) => {
    setVisited((prev) => new Set(prev).add(key));
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <p className="text-sm text-muted-foreground">
        Here are some things you can do right away. Click to explore each feature.
      </p>

      <div className="space-y-3">
        {features.map((f) => {
          const Icon = f.icon;
          const done = visited.has(f.key);
          return (
            <Link
              key={f.key}
              href={f.href}
              onClick={() => markVisited(f.key)}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all group ${
                done
                  ? 'border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-950/20'
                  : 'border-border hover:border-primary/30 hover:shadow-sm'
              }`}
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                done
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
              }`}>
                {done ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">{f.label}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
        <Compass className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          {visited.size}/{features.length} explored — feel free to skip and explore later
        </span>
      </div>

      <StepActions>
        <span />
        <button onClick={onNext} className="btn-primary">
          Continue <ChevronRight className="w-4 h-4" />
        </button>
      </StepActions>
    </div>
  );
}

/* ═══════════════════ Invited User: All Set Step ═══════════════════ */

function InvitedAllSetStep({ onFinish, role }: { onFinish: () => void; role: string }) {
  const isEmployee = role === 'EMPLOYEE';

  const quickLinks = isEmployee ? [
    { label: 'View my payslips', href: '/payroll', icon: DollarSign },
    { label: 'Apply for leave', href: '/leave', icon: Calendar },
    { label: 'Mark attendance', href: '/attendance', icon: Clock },
    { label: 'My profile', href: '/profile', icon: User },
  ] : [
    { label: 'View employees', href: '/employees', icon: Users },
    { label: 'Team attendance', href: '/attendance', icon: Clock },
    { label: 'Leave requests', href: '/leave', icon: Calendar },
    { label: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  ];

  return (
    <div className="text-center py-6 space-y-6 animate-scale-in">
      <div className="relative inline-block">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
          <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <div className="absolute -top-2 -left-2 w-3 h-3 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="absolute -top-1 -right-3 w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '100ms' }} />
        <div className="absolute -bottom-1 -left-3 w-2.5 h-2.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '200ms' }} />
        <div className="absolute -bottom-2 right-0 w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          {isEmployee ? 'Welcome aboard!' : "You're all set!"}
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {isEmployee
            ? 'Your profile is ready. Here are some quick links to get you started.'
            : 'You\'re ready to start managing your team. Here are some quick links.'}
        </p>
      </div>

      {/* Quick links grid */}
      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-left">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2.5 p-3 rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all group"
            >
              <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium text-foreground">{link.label}</span>
            </Link>
          );
        })}
      </div>

      <button onClick={onFinish} className="btn-primary text-base px-8 py-3 mt-4">
        Go to Dashboard <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}

/* ═══════════════════ Shared Sub-components ═══════════════════ */

function InputField({
  label, icon: Icon, type = 'text', value, onChange, placeholder,
}: {
  label: string; icon?: any; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
}) {
  const generatedId = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={generatedId} className="text-sm font-medium text-foreground flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
        {label}
      </label>
      <input
        id={generatedId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        placeholder={placeholder}
      />
    </div>
  );
}

function StepActions({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between pt-6 border-t border-border">{children}</div>;
}

/* ═══════════════════ Step Renderer ═══════════════════ */

function StepContent({
  stepKey, goToStep, stepIndex, steps, onComplete, userName, role,
}: {
  stepKey: string;
  goToStep: (step: number) => void;
  stepIndex: number;
  steps: StepDef[];
  onComplete: () => void;
  userName: string;
  role: string;
}) {
  const nextStep = () => goToStep(stepIndex + 1);

  switch (stepKey) {
    // Admin steps
    case 'company-profile':
      return <CompanyProfileStep onNext={nextStep} />;
    case 'plan':
      return <PlanStep onNext={nextStep} />;
    case 'departments':
      return <DepartmentStep onNext={nextStep} onSkip={nextStep} />;
    case 'invite':
      return <InviteStep onNext={nextStep} onSkip={nextStep} />;
    case 'modules':
      return <ModulesStep onNext={nextStep} />;
    case 'all-set':
      return <AllSetStep onFinish={onComplete} />;

    // Invited user steps
    case 'welcome-profile':
      return <WelcomeProfileStep onNext={nextStep} userName={userName} />;
    case 'explore':
      return <ExploreFeaturesStep onNext={nextStep} role={role} />;
    case 'all-set-invited':
      return <InvitedAllSetStep onFinish={onComplete} role={role} />;

    default:
      return null;
  }
}

/* ═══════════════════ Main Wizard ═══════════════════ */

export default function OnboardingPage() {
  useEffect(() => { document.title = 'Onboarding | HRPlatform'; }, []);

  const router = useRouter();
  const { user } = useAuthContext();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

  const role = user?.role || 'EMPLOYEE';
  const steps = getStepsForRole(role);
  const wizardTitle = getWizardTitle(role);
  const isAdmin = role === 'COMPANY_ADMIN';

  useEffect(() => {
    async function checkOnboarding() {
      try {
        if (isAdmin) {
          // COMPANY_ADMIN checks company-level onboarding
          const status = await apiClient.get<{ completed: boolean; currentStep: number }>('/company/onboarding');
          if (status.completed) {
            router.replace('/dashboard');
            return;
          }
          setCurrentStep(status.currentStep);
        } else {
          // Invited users check user-level onboarding
          const status = await apiClient.get<{ completed: boolean }>('/company/onboarding/user');
          if (status.completed) {
            router.replace('/dashboard');
            return;
          }
        }
      } catch {
        // If endpoint fails, start from step 0
      } finally {
        setLoading(false);
      }
    }
    checkOnboarding();
  }, [router, isAdmin]);

  const goToStep = useCallback(async (step: number) => {
    setCurrentStep(step);
    if (isAdmin) {
      try {
        await apiClient.patch('/company/onboarding/step', { step });
      } catch {
        // Non-critical, continue anyway
      }
    }
  }, [isAdmin]);

  const handleComplete = useCallback(async () => {
    // Mark onboarding complete for the user
    if (!isAdmin) {
      try {
        await apiClient.post('/company/onboarding/user/complete');
      } catch {
        // Non-critical
      }
    }
    // Clear onboarding cache so guard doesn't redirect again
    if (user?.companyId) {
      sessionStorage.setItem(`onboarding-checked-${user.companyId}`, 'completed');
    }
    router.push('/dashboard');
  }, [router, isAdmin, user?.companyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const step = steps[currentStep];
  const progress = ((currentStep) / (steps.length - 1)) * 100;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-primary-foreground font-bold text-lg">HR</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">{wizardTitle.heading}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{wizardTitle.sub}</p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Step {currentStep + 1} of {steps.length}</span>
          <span className="text-xs font-medium text-muted-foreground">{Math.round(progress)}% complete</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Onboarding progress">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex justify-between mt-3">
          {steps.map((s, i) => {
            const StepIcon = s.icon;
            return (
              <div key={s.id} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  i < currentStep
                    ? 'bg-green-500 text-white'
                    : i === currentStep
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {i < currentStep ? <Check className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                  <span className="sr-only">{i < currentStep ? 'Completed' : i === currentStep ? 'Current step' : 'Upcoming'}</span>
                </div>
                <span className={`text-[10px] mt-1 font-medium hidden sm:block ${
                  i <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-card rounded-xl border border-border p-6 sm:p-8 shadow-sm">
        {step && step.key !== 'all-set' && step.key !== 'all-set-invited' && (
          <>
            <h2 className="text-xl font-semibold text-foreground mb-1">{step.title}</h2>
            <p className="text-sm text-muted-foreground mb-6">{step.description}</p>
          </>
        )}

        {step && (
          <StepContent
            stepKey={step.key}
            goToStep={goToStep}
            stepIndex={currentStep}
            steps={steps}
            onComplete={handleComplete}
            userName={user?.firstName || 'there'}
            role={role}
          />
        )}
      </div>

      {/* Skip All */}
      {currentStep < steps.length - 1 && (
        <div className="text-center mt-6">
          <button onClick={handleComplete} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Skip setup and go to dashboard
          </button>
        </div>
      )}

      {/* CSS for button styles */}
      <style jsx global>{`
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: hsl(var(--primary-foreground));
          background-color: hsl(var(--primary));
          border-radius: 0.5rem;
          transition: all 150ms;
        }
        .btn-primary:hover { opacity: 0.9; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1.25rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: hsl(var(--muted-foreground));
          transition: all 150ms;
        }
        .btn-ghost:hover { color: hsl(var(--foreground)); }
      `}</style>
    </div>
  );
}
