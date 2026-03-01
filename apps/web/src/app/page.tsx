import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import {
  DollarSign,
  Clock,
  CalendarDays,
  TrendingUp,
  Users,
  BarChart3,
  Check,
  Star,
  ArrowRight,
  Play,
  Zap,
  Globe,
  Sparkles,
  ChevronRight,
  UserPlus,
  Settings,
  Rocket,
  Quote,
  Heart,
  Twitter,
  Linkedin,
  Github,
  Building2,
  Briefcase,
  Fingerprint,
  Palmtree,
  Receipt,
  Handshake,
  Timer,
  GraduationCap,
  Target,
  Search,
  Laptop,
  CalendarClock,
  BookOpen,
  ClipboardList,
  MessageSquare,
  MapPin,
  ShieldCheck,
  LineChart,
  LayoutDashboard,
  Key,
  Webhook,
  FormInput,
  Workflow,
  Lock,
} from 'lucide-react';
import { LandingNav } from '@/components/landing/landing-nav';
import { detectRegion, getRegionData } from '@/lib/landing-data';

export default function Home() {
  const cookieStore = cookies();
  const hasSession =
    cookieStore.has('has_session') || cookieStore.has('access_token');

  if (hasSession) {
    redirect('/dashboard');
  }

  // Detect region for localized content
  const headersList = headers();
  const region = detectRegion(headersList);
  const regionData = getRegionData(region);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white overflow-hidden">
      {/* ===================== NAVIGATION ===================== */}
      <LandingNav />

      {/* ===================== HERO ===================== */}
      <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-32">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          {/* Primary gradient orb */}
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-gradient-to-br from-blue-400/20 via-indigo-300/10 to-transparent dark:from-blue-600/20 dark:via-indigo-600/10 blur-3xl" />
          {/* Secondary orb */}
          <div className="absolute top-[10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-purple-300/15 dark:bg-purple-600/10 blur-3xl" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03] landing-grid"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-white/5 border border-blue-200 dark:border-white/10 backdrop-blur-sm mb-8 landing-fade-in">
              <Rocket className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Trusted by 500+ companies worldwide
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 landing-fade-in landing-delay-1">
              Run Payroll, Track Teams &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 dark:from-blue-400 dark:via-cyan-400 dark:to-blue-500">
                Grow Faster
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed landing-fade-in landing-delay-2">
              Stop juggling spreadsheets. Manage payroll, attendance, leave,
              hiring, and your entire team — from one simple dashboard.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 landing-fade-in landing-delay-3">
              <Link
                href="/register"
                className="group relative inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl shadow-2xl shadow-blue-600/25 hover:shadow-blue-500/40 transition-all duration-300 hover:-translate-y-0.5"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#how-it-works"
                className="group inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/15 hover:border-slate-300 dark:hover:border-white/25 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 backdrop-blur-sm transition-all duration-300"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 group-hover:bg-slate-200 dark:group-hover:bg-white/20 transition-colors">
                  <Play className="w-4 h-4 ml-0.5" />
                </div>
                Watch Demo
              </a>
            </div>

            {/* Trust Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto landing-fade-in landing-delay-4">
              {[
                { value: '20hrs', label: 'Saved per Week' },
                { value: '500+', label: 'Happy Teams' },
                { value: '60sec', label: 'Quick Setup' },
                { value: `${regionData.currency.symbol}0`, label: 'To Start' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5"
                >
                  <span className="text-xl font-bold text-slate-900 dark:text-white">
                    {stat.value}
                  </span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Visual — Dashboard Mockup (stays dark-themed for contrast) */}
          <div className="relative mt-20 max-w-5xl mx-auto landing-fade-in landing-delay-5">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/20 via-indigo-400/20 to-purple-400/20 dark:from-blue-600/20 dark:via-indigo-600/20 dark:to-purple-600/20 rounded-3xl blur-2xl" />
            <div className="relative rounded-2xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-slate-400/20 dark:shadow-black/40">
              {/* Mock browser bar */}
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-7 max-w-md mx-auto rounded-lg bg-white/5 border border-white/5 flex items-center px-3">
                    <Globe className="w-3.5 h-3.5 text-slate-500 mr-2" />
                    <span className="text-xs text-slate-500">
                      app.hrplatform.com/dashboard
                    </span>
                  </div>
                </div>
              </div>

              {/* Mock dashboard content */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  {
                    label: 'Total Employees',
                    value: '1,247',
                    change: '+12%',
                    color: 'from-blue-500 to-blue-600',
                  },
                  {
                    label: 'Attendance Rate',
                    value: '96.8%',
                    change: '+2.1%',
                    color: 'from-emerald-500 to-emerald-600',
                  },
                  {
                    label: 'Payroll Processed',
                    value: '$2.4M',
                    change: 'On Time',
                    color: 'from-purple-500 to-purple-600',
                  },
                  {
                    label: 'Open Positions',
                    value: '23',
                    change: '5 New',
                    color: 'from-orange-500 to-orange-600',
                  },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="rounded-xl bg-white/5 border border-white/5 p-4"
                  >
                    <p className="text-xs text-slate-400 mb-1">{card.label}</p>
                    <p className="text-2xl font-bold text-white mb-1">
                      {card.value}
                    </p>
                    <span
                      className={`text-xs font-medium text-transparent bg-clip-text bg-gradient-to-r ${card.color}`}
                    >
                      {card.change}
                    </span>
                  </div>
                ))}
              </div>

              {/* Mock chart area */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 rounded-xl bg-white/5 border border-white/5 p-4">
                  <p className="text-sm font-medium text-slate-300 mb-4">
                    Workforce Analytics
                  </p>
                  {/* Fake chart bars */}
                  <div className="flex items-end gap-2 h-32">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map(
                      (h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t-sm bg-gradient-to-t from-blue-600/80 to-blue-400/60"
                          style={{ height: `${h}%` }}
                        />
                      )
                    )}
                  </div>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/5 p-4">
                  <p className="text-sm font-medium text-slate-300 mb-4">
                    Department Split
                  </p>
                  {/* Fake donut */}
                  <div className="relative w-28 h-28 mx-auto">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="rgba(59,130,246,0.6)"
                        strokeWidth="12"
                        strokeDasharray="90 251.2"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="rgba(139,92,246,0.6)"
                        strokeWidth="12"
                        strokeDasharray="65 251.2"
                        strokeDashoffset="-90"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="rgba(16,185,129,0.6)"
                        strokeWidth="12"
                        strokeDasharray="50 251.2"
                        strokeDashoffset="-155"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="rgba(245,158,11,0.5)"
                        strokeWidth="12"
                        strokeDasharray="46.2 251.2"
                        strokeDashoffset="-205"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-white">8</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-3">
                    {[
                      { color: 'bg-blue-500', label: 'Eng' },
                      { color: 'bg-purple-500', label: 'Sales' },
                      { color: 'bg-emerald-500', label: 'Ops' },
                      { color: 'bg-orange-500', label: 'HR' },
                    ].map((d) => (
                      <div key={d.label} className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${d.color}`} />
                        <span className="text-[10px] text-slate-400">
                          {d.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== TRUSTED BY ===================== */}
      <section className="relative py-16 lg:py-20 border-y border-slate-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-10">
            Trusted by forward-thinking companies
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {regionData.trustedCompanies.map((name) => (
              <div
                key={name}
                className="flex items-center justify-center h-14 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all duration-300"
              >
                <span className="text-lg font-bold text-slate-300 dark:text-slate-600 tracking-wider">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FEATURES ===================== */}
      <section id="features" className="relative py-24 lg:py-32">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-50/50 to-transparent dark:from-transparent dark:via-indigo-950/10 dark:to-transparent pointer-events-none" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Full Platform
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
              Everything You Need,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                All in One Place
              </span>
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400">
              28 features across HR, payroll, talent, and compliance — built for teams of every size.
            </p>
          </div>

          {/* Feature Categories Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Core HR */}
            <div className="rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Core HR</h3>
              </div>
              <div className="space-y-3">
                {[
                  { icon: Users, name: 'Employee Directory', desc: 'Profiles, contacts, and org structure' },
                  { icon: Building2, name: 'Departments', desc: 'Organize teams hierarchically' },
                  { icon: Briefcase, name: 'Job Titles & Bands', desc: 'Define roles and salary levels' },
                  { icon: Fingerprint, name: 'Attendance', desc: 'Daily check-in, work-from-home, geofencing' },
                  { icon: Palmtree, name: 'Leave Management', desc: 'Request, approve, and track time off' },
                ].map((f) => (
                  <div key={f.name} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                    <f.icon className="w-4 h-4 mt-0.5 text-blue-500 dark:text-blue-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{f.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payroll & Finance */}
            <div className="rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Payroll & Finance</h3>
              </div>
              <div className="space-y-3">
                {[
                  { icon: DollarSign, name: 'Payroll & Taxes', desc: 'Automated salary processing with tax compliance' },
                  { icon: Receipt, name: 'Expense Claims', desc: 'Submit, approve, and reimburse expenses' },
                  { icon: Handshake, name: 'Contractor Payments', desc: 'Manage contractors, invoices, and payments' },
                  { icon: Timer, name: 'Timesheets', desc: 'Project time tracking and overtime calculations' },
                ].map((f) => (
                  <div key={f.name} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                    <f.icon className="w-4 h-4 mt-0.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{f.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Talent & Growth */}
            <div className="rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Talent & Growth</h3>
              </div>
              <div className="space-y-3">
                {[
                  { icon: Target, name: 'Performance Reviews', desc: 'Goals, OKRs, and review cycles' },
                  { icon: Search, name: 'Recruitment / ATS', desc: 'Job postings, applicants, and hiring pipeline' },
                  { icon: GraduationCap, name: 'Training / LMS', desc: 'Courses, enrollments, and certifications' },
                ].map((f) => (
                  <div key={f.name} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                    <f.icon className="w-4 h-4 mt-0.5 text-purple-500 dark:text-purple-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{f.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Operations */}
            <div className="rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Operations</h3>
              </div>
              <div className="space-y-3">
                {[
                  { icon: Laptop, name: 'Asset Tracking', desc: 'Track company devices and equipment' },
                  { icon: CalendarClock, name: 'Shift Scheduling', desc: 'Rotations, swaps, and shift rules' },
                  { icon: BookOpen, name: 'Company Policies', desc: 'Distribute and track acknowledgments' },
                  { icon: ClipboardList, name: 'Offboarding', desc: 'Exit checklists and final settlement' },
                  { icon: MessageSquare, name: 'Pulse Surveys', desc: 'Engagement surveys and NPS scoring' },
                  { icon: Palmtree, name: 'Leave Policies', desc: 'Accrual rules, carryover, and balances' },
                ].map((f) => (
                  <div key={f.name} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                    <f.icon className="w-4 h-4 mt-0.5 text-amber-500 dark:text-amber-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{f.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Analytics & Compliance */}
            <div className="rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg">
                  <LineChart className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Analytics & Compliance</h3>
              </div>
              <div className="space-y-3">
                {[
                  { icon: BarChart3, name: 'Reports', desc: 'Generate and export HR reports' },
                  { icon: LineChart, name: 'HR Analytics', desc: 'Headcount, attrition, and cost trends' },
                  { icon: ShieldCheck, name: 'Audit Logs', desc: 'Full activity trail for compliance' },
                  { icon: LayoutDashboard, name: 'Custom Dashboards', desc: 'Role-based layouts and widgets' },
                ].map((f) => (
                  <div key={f.name} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                    <f.icon className="w-4 h-4 mt-0.5 text-cyan-500 dark:text-cyan-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{f.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Integrations & Admin */}
            <div className="rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg">
                  <Key className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Integrations & Admin</h3>
              </div>
              <div className="space-y-3">
                {[
                  { icon: Lock, name: 'Single Sign-On', desc: 'SAML/OAuth for enterprise login' },
                  { icon: Key, name: 'API Access', desc: 'REST API keys for integrations' },
                  { icon: Webhook, name: 'Webhooks', desc: 'Event-driven notifications to external systems' },
                  { icon: FormInput, name: 'Custom Fields', desc: 'Add your own data fields to any entity' },
                  { icon: Workflow, name: 'Approval Workflows', desc: 'Multi-step approval chains' },
                  { icon: MapPin, name: 'Geofencing', desc: 'Location-based attendance verification' },
                ].map((f) => (
                  <div key={f.name} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                    <f.icon className="w-4 h-4 mt-0.5 text-rose-500 dark:text-rose-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{f.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section id="how-it-works" className="relative py-24 lg:py-32">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50 to-transparent dark:from-transparent dark:via-blue-950/20 dark:to-transparent pointer-events-none" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 mb-6">
              <Rocket className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                How It Works
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
              Up and Running in{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                Under 5 Minutes
              </span>
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400">
              No training needed. No consultants required. Just sign up and go.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6">
            {[
              {
                step: '01',
                icon: UserPlus,
                title: 'Create Your Account',
                description:
                  'Enter your company name and email. That\'s it — no credit card, no long forms, no phone calls.',
                gradient: 'from-blue-500 to-blue-600',
              },
              {
                step: '02',
                icon: Settings,
                title: 'Add Your Team',
                description:
                  'Import your employee list or add them one by one. Our setup wizard walks you through everything.',
                gradient: 'from-indigo-500 to-indigo-600',
              },
              {
                step: '03',
                icon: Rocket,
                title: 'Start Managing',
                description:
                  'Run payroll, approve leaves, track attendance — your whole HR, handled. Welcome to the easy way.',
                gradient: 'from-purple-500 to-purple-600',
              },
            ].map((item, idx) => (
              <div key={item.step} className="relative">
                {/* Connector line (desktop) */}
                {idx < 2 && (
                  <div className="hidden lg:block absolute top-16 left-[calc(50%+60px)] w-[calc(100%-60px)] h-px">
                    <div className="w-full h-full bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-white/10 dark:via-white/20 dark:to-white/10" />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-300 dark:bg-white/20" />
                  </div>
                )}

                <div className="text-center">
                  {/* Step number */}
                  <div className="relative inline-flex mb-6">
                    <div
                      className={`flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${item.gradient} shadow-xl`}
                    >
                      <item.icon className="w-9 h-9 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 flex items-center justify-center w-7 h-7 rounded-full bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-white/20">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.step}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== STATS ===================== */}
      <section className="relative py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-slate-50 to-white dark:from-white/[0.04] dark:to-white/[0.01] backdrop-blur-sm p-12 lg:p-16 overflow-hidden">
            {/* Glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] rounded-full bg-blue-200/30 dark:bg-blue-600/10 blur-3xl pointer-events-none" aria-hidden="true" />

            <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              {[
                {
                  value: '20hrs',
                  label: 'Saved Every Week',
                  sublabel: 'Less admin, more strategy',
                },
                {
                  value: '500+',
                  label: 'Companies Trust Us',
                  sublabel: 'From startups to enterprises',
                },
                {
                  value: '4.9★',
                  label: 'Customer Rating',
                  sublabel: 'Teams love using it',
                },
                {
                  value: `${regionData.currency.symbol}0`,
                  label: 'To Get Started',
                  sublabel: 'No credit card needed',
                },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 mb-2">
                    {stat.value}
                  </p>
                  <p className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                    {stat.label}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{stat.sublabel}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===================== PRICING ===================== */}
      <section id="pricing" className="relative py-24 lg:py-32">
        {/* Background */}
        <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-200/20 dark:bg-purple-600/5 blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 mb-6">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Pricing
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
              Plans That{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400">
                Fit Your Budget
              </span>
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400">
              Start free with your whole team. Upgrade only when you need more.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free */}
            <div className="relative rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-8 hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Free</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Perfect for small teams getting started.
              </p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{regionData.currency.freePlan}</span>
                <span className="text-slate-400 dark:text-slate-500">/month</span>
              </div>
              <Link
                href="/register"
                className="block w-full text-center px-6 py-3 text-sm font-semibold text-slate-700 dark:text-white border border-slate-200 dark:border-white/15 hover:border-slate-300 dark:hover:border-white/25 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-200"
              >
                Get Started Free
              </Link>
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-4">
                  Includes:
                </p>
                <ul className="space-y-3">
                  {[
                    'Up to 10 employees',
                    'Payroll & payslips',
                    'Attendance tracking',
                    'Leave management',
                    'Team directory',
                    'Email alerts',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300"
                    >
                      <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Professional (Popular) */}
            <div className="relative rounded-2xl border-2 border-blue-500/40 bg-gradient-to-b from-blue-50 to-white dark:from-blue-600/[0.08] dark:to-transparent p-8 shadow-xl shadow-blue-200/30 dark:shadow-blue-600/5 scale-[1.02] lg:scale-105">
              {/* Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-lg shadow-blue-600/30 uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  Most Popular
                </span>
              </div>

              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                Professional
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                For growing companies with advanced needs.
              </p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{regionData.currency.proPlan}</span>
                <span className="text-slate-500 dark:text-slate-400">{regionData.currency.proUnit}</span>
              </div>
              <Link
                href="/register"
                className="block w-full text-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 transition-all duration-200 hover:-translate-y-0.5"
              >
                Start Free Trial
              </Link>
              <div className="mt-8 pt-6 border-t border-blue-100 dark:border-white/10">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-4">
                  Everything in Free, plus:
                </p>
                <ul className="space-y-3">
                  {[
                    'Unlimited employees',
                    'Auto payroll & taxes',
                    'Performance reviews',
                    'Hiring & recruitment',
                    'Reports & dashboards',
                    'Approval workflows',
                    'Expense management',
                    'Priority support',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300"
                    >
                      <Check className="w-4 h-4 text-blue-500 dark:text-blue-400 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Enterprise */}
            <div className="relative rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-8 hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                Enterprise
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                For large organizations with custom requirements.
              </p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                  Custom
                </span>
              </div>
              <Link
                href="/register"
                className="block w-full text-center px-6 py-3 text-sm font-semibold text-slate-700 dark:text-white border border-slate-200 dark:border-white/15 hover:border-slate-300 dark:hover:border-white/25 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-200"
              >
                Contact Sales
              </Link>
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-4">
                  Everything in Professional, plus:
                </p>
                <ul className="space-y-3">
                  {[
                    'Unlimited everything',
                    'Single sign-on (SSO)',
                    'Custom integrations',
                    'Dedicated account manager',
                    'Phone & chat support',
                    'Uptime guarantee',
                    'Data stored in your region',
                    'Your branding, your logo',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300"
                    >
                      <Check className="w-4 h-4 text-purple-500 dark:text-purple-400 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== TESTIMONIALS ===================== */}
      <section id="testimonials" className="relative py-24 lg:py-32">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-50 to-transparent dark:from-transparent dark:via-indigo-950/10 dark:to-transparent pointer-events-none" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-50 dark:bg-pink-500/10 border border-pink-200 dark:border-pink-500/20 mb-6">
              <Heart className="w-3.5 h-3.5 text-pink-500 dark:text-pink-400" />
              <span className="text-xs font-semibold text-pink-600 dark:text-pink-400 uppercase tracking-wider">
                Testimonials
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
              What Our Customers{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400">
                Say
              </span>
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400">
              Join hundreds of companies that trust HRPlatform.
            </p>
          </div>

          {/* Testimonial Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                quote:
                  'HRPlatform replaced five different tools for us. Payroll, attendance, leave management, performance reviews — everything in one place. Our HR team saves 20 hours every week.',
                name: 'Sarah Chen',
                title: 'VP of People',
                company: 'TechCorp (450 employees)',
              },
              {
                quote:
                  'The implementation was incredibly smooth. We were fully operational within a week. The multi-level approval workflows and custom leave policies are exactly what we needed.',
                name: 'Michael Rivera',
                title: 'HR Director',
                company: 'InnovateCo (1,200 employees)',
              },
              {
                quote:
                  'As a startup, we needed something powerful but affordable. The free tier gave us everything to get started, and the Professional plan scales perfectly as we grow.',
                name: 'Priya Sharma',
                title: 'Co-Founder & COO',
                company: 'StartupX (85 employees)',
              },
            ].map((testimonial) => (
              <div
                key={testimonial.name}
                className="relative rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.03] p-8 hover:bg-slate-50 dark:hover:bg-white/[0.06] hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                {/* Quote */}
                <Quote className="w-8 h-8 text-slate-100 dark:text-white/5 mb-3" />
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  {testimonial.quote}
                </p>
                {/* Author */}
                <div className="flex items-center gap-3">
                  {/* Avatar placeholder */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shrink-0">
                    {testimonial.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {testimonial.title}, {testimonial.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="relative py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-600/20 dark:via-indigo-600/20 dark:to-purple-600/20" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-blue-200/30 dark:bg-blue-600/15 blur-3xl" aria-hidden="true" />

            <div className="relative text-center px-6 py-16 lg:py-24">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
                Ready to Make HR{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-cyan-400">
                  Effortless?
                </span>
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-10">
                Join 500+ companies that stopped drowning in paperwork
                and started focusing on their people.
              </p>
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 px-10 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl shadow-2xl shadow-blue-600/25 hover:shadow-blue-500/40 transition-all duration-300 hover:-translate-y-0.5"
              >
                Start Your Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="mt-6 text-sm text-slate-400 dark:text-slate-500">
                No credit card required &bull; Free forever plan &bull; Setup in
                60 seconds
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="border-t border-slate-100 dark:border-white/5 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                Product
              </h4>
              <ul className="space-y-3">
                {[
                  { label: 'Features', href: '#features' },
                  { label: 'How It Works', href: '#how-it-works' },
                  { label: 'Pricing', href: '#pricing' },
                  { label: 'Testimonials', href: '#testimonials' },
                ].map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            {/* Get Started */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                Get Started
              </h4>
              <ul className="space-y-3">
                {[
                  { label: 'Sign Up Free', href: '/register' },
                  { label: 'Log In', href: '/login' },
                  { label: 'Forgot Password', href: '/auth/forgot-password' },
                ].map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            {/* Support */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                Support
              </h4>
              <ul className="space-y-3">
                {[
                  { label: 'Contact Us', href: 'mailto:support@hrplatform.com' },
                  { label: 'Report a Bug', href: 'mailto:bugs@hrplatform.com' },
                ].map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Legal</h4>
              <ul className="space-y-3">
                {[
                  { label: 'Privacy Policy', href: '/privacy' },
                  { label: 'Terms of Service', href: '/terms' },
                ].map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2.5 mb-4 md:mb-0">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                HRPlatform
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-600 mb-4 md:mb-0">
              &copy; 2026 HRPlatform. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="text-slate-400 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-400 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-400 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-400 transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
