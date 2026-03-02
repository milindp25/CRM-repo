import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | HRPlatform',
  description: 'How HRPlatform collects, uses, and protects your data.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-200">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to HRPlatform
          </Link>
          <span className="text-xs text-slate-400 dark:text-slate-500">Last updated: March 1, 2026</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 mb-12">
          Your privacy matters. Here&apos;s how we handle your data.
        </p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-3">1. Information We Collect</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 mb-3">
              We collect information you provide directly when you create an account, set up your company, or use our services:
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1.5 ml-2">
              <li><strong>Account Information</strong> &mdash; Name, email address, company name, and role</li>
              <li><strong>Employee Data</strong> &mdash; Information you enter about your employees (names, contact details, employment records)</li>
              <li><strong>Payroll Data</strong> &mdash; Salary details, tax identifiers, and bank information (encrypted at rest)</li>
              <li><strong>Usage Data</strong> &mdash; How you interact with our platform (pages visited, features used, timestamps)</li>
              <li><strong>Device Information</strong> &mdash; Browser type, IP address, and device identifiers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1.5 ml-2">
              <li>Provide, maintain, and improve our HR management services</li>
              <li>Process payroll, generate payslips, and calculate tax deductions</li>
              <li>Send transactional emails (payslips, leave approvals, notifications)</li>
              <li>Provide customer support and respond to your requests</li>
              <li>Detect and prevent fraud, abuse, or security issues</li>
              <li>Comply with legal obligations and enforce our terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">3. Data Security</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              We take data security seriously. All sensitive data (SSN, Aadhaar, PAN, bank details, salary information) is encrypted using AES-256-CBC encryption at rest. Data in transit is protected using TLS 1.2+. We use role-based access controls to ensure employees only see data relevant to their role. Our infrastructure is hosted on secure, SOC 2-compliant cloud providers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">4. Data Sharing</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 mb-3">
              We do not sell your data. We may share information only in these circumstances:
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1.5 ml-2">
              <li><strong>With your consent</strong> &mdash; When you explicitly authorize sharing</li>
              <li><strong>Service providers</strong> &mdash; Trusted partners who help us operate (email delivery, hosting, payment processing)</li>
              <li><strong>Legal requirements</strong> &mdash; When required by law, regulation, or legal process</li>
              <li><strong>Business transfers</strong> &mdash; In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">5. Multi-Tenant Data Isolation</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              HRPlatform is a multi-tenant system. Each company&apos;s data is logically isolated at the database level. No company can access another company&apos;s employee records, payroll data, or any other information. This isolation is enforced at every layer of our application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">6. Data Retention</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              We retain your data for as long as your account is active or as needed to provide services. When you delete your account, we will delete or anonymize your data within 90 days, except where retention is required by law (e.g., tax records, audit logs). You can request data export or deletion at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">7. Your Rights</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 mb-3">
              Depending on your jurisdiction, you may have the right to:
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1.5 ml-2">
              <li>Access and receive a copy of your personal data</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Data portability (export your data in a standard format)</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">8. Cookies</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              We use essential cookies to keep you signed in and remember your preferences (language, theme). We do not use third-party tracking or advertising cookies. Session cookies expire when you close your browser. Persistent cookies (like authentication tokens) expire after 7 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">9. Changes to This Policy</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy on this page and updating the &quot;Last updated&quot; date. Continued use of our services after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">10. Contact Us</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              If you have questions about this Privacy Policy or how we handle your data, please contact us at{' '}
              <a href="mailto:privacy@hrplatform.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                privacy@hrplatform.com
              </a>.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-white/10 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            &copy; {new Date().getFullYear()} HRPlatform. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
