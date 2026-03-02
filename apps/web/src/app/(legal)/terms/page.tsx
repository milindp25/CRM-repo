import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | HRPlatform',
  description: 'Terms and conditions for using HRPlatform.',
};

export default function TermsOfServicePage() {
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
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">Terms of Service</h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 mb-12">
          Please read these terms carefully before using HRPlatform.
        </p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-3">1. Acceptance of Terms</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              By accessing or using HRPlatform (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these terms. If you do not agree, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">2. Description of Service</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              HRPlatform is a cloud-based Human Resource Information System (HRIS) that provides tools for employee management, payroll processing, attendance tracking, leave management, recruitment, performance reviews, and other HR operations. The Service is provided on a subscription basis with various tiers offering different features.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">3. Account Registration</h2>
            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1.5 ml-2">
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must notify us immediately of any unauthorized access to your account</li>
              <li>One company account per organization &mdash; sub-accounts are managed through our role-based system</li>
              <li>You must be at least 18 years old to create an account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">4. Acceptable Use</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 mb-3">
              You agree not to:
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1.5 ml-2">
              <li>Use the Service for any illegal purpose or in violation of any laws</li>
              <li>Upload or transmit malicious code, viruses, or harmful content</li>
              <li>Attempt to access other users&apos; or companies&apos; data</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Use the Service to store data unrelated to HR management</li>
              <li>Share your account credentials with unauthorized individuals</li>
              <li>Exceed the usage limits of your subscription tier</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">5. Data Ownership</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              You retain ownership of all data you enter into the platform. This includes employee records, payroll data, documents, and any other content you create or upload. We do not claim any ownership rights over your data. You grant us a limited license to process and store your data solely for the purpose of providing the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">6. Subscription & Billing</h2>
            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1.5 ml-2">
              <li>Free tier accounts have feature and usage limitations as described on our pricing page</li>
              <li>Paid subscriptions are billed monthly or annually based on your chosen plan</li>
              <li>You may upgrade, downgrade, or cancel your subscription at any time</li>
              <li>Downgrading may result in loss of access to certain features</li>
              <li>Refunds are handled on a case-by-case basis &mdash; contact support for requests</li>
              <li>We reserve the right to change pricing with 30 days&apos; advance notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">7. Service Availability</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              We strive to maintain high availability but do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control. We will make reasonable efforts to notify you of planned maintenance in advance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">8. Data Processing & Privacy</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Our collection, use, and protection of your data is governed by our{' '}
              <Link href="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                Privacy Policy
              </Link>
              . By using the Service, you consent to our data practices as described in the Privacy Policy. As a data processor, we process employee data on your behalf and in accordance with your instructions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">9. Intellectual Property</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              The Service, including its design, features, code, and documentation, is owned by HRPlatform and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works based on our Service without written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">10. Limitation of Liability</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              To the maximum extent permitted by law, HRPlatform shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities. Our total liability for any claim related to the Service shall not exceed the amount you paid us in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">11. Termination</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Either party may terminate the agreement at any time. You can delete your account from your settings page or by contacting us. We may suspend or terminate your account if you violate these terms. Upon termination, we will provide a reasonable window (30 days) for you to export your data before it is permanently deleted.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">12. Changes to Terms</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              We may update these Terms of Service from time to time. We will notify you of material changes by email or through the Service. Continued use of the Service after changes take effect constitutes acceptance of the updated terms. If you disagree with the changes, you may close your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">13. Contact</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              For questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:legal@hrplatform.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                legal@hrplatform.com
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
            <Link href="/terms" className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
