import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between" aria-label="Main navigation">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">HR</span>
            </div>
            <span className="text-xl font-bold text-gray-900">HRPlatform</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-3 py-2"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main>
        <section className="container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Modern HR Management
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Made Simple
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Streamline your HR operations with our all-in-one platform. Manage employees, attendance, leave, and payroll effortlessly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/register"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 font-semibold text-lg transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full sm:w-auto"
              >
                Start Free Trial
              </Link>
              <Link
                href="#features"
                className="bg-white text-gray-700 px-8 py-4 rounded-lg hover:bg-gray-50 font-semibold text-lg transition-colors border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 w-full sm:w-auto"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-4 py-20 bg-white/50 rounded-3xl my-10">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-center text-gray-900 mb-4">
              Everything You Need to Manage Your Team
            </h2>
            <p className="text-gray-600 text-center mb-16 max-w-2xl mx-auto">
              Powerful features designed to make HR management efficient and effective
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon="👥"
                title="Employee Management"
                description="Complete employee lifecycle management from onboarding to offboarding"
              />
              <FeatureCard
                icon="📅"
                title="Attendance Tracking"
                description="Real-time attendance monitoring with GPS verification and reports"
              />
              <FeatureCard
                icon="🏖️"
                title="Leave Management"
                description="Streamlined leave requests and approvals with balance tracking"
              />
              <FeatureCard
                icon="💰"
                title="Payroll Processing"
                description="Automated payroll with statutory compliance and payslip generation"
              />
              <FeatureCard
                icon="📊"
                title="Analytics & Reports"
                description="Comprehensive insights and customizable reports for data-driven decisions"
              />
              <FeatureCard
                icon="🔒"
                title="Secure & Compliant"
                description="Enterprise-grade security with role-based access control"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-center text-white shadow-2xl">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Ready to Transform Your HR?
            </h2>
            <p className="text-xl mb-8 text-blue-50">
              Join hundreds of companies streamlining their HR operations
            </p>
            <Link
              href="/register"
              className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-50 font-semibold text-lg transition-colors shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
            >
              Get Started Free
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 HRPlatform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl border-2 border-gray-100 hover:border-blue-200 transition-all hover:shadow-lg group">
      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}
