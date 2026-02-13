export const metadata = {
  title: 'Dashboard | HRPlatform',
  description: 'Your HR management dashboard'
};

export default function DashboardPage() {
  return (
    <div className="p-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Employees"
          value="3"
          icon="👥"
          trend="+2 this month"
          trendUp={true}
        />
        <StatCard
          title="Present Today"
          value="2"
          icon="✅"
          trend="66.7%"
          trendUp={true}
        />
        <StatCard
          title="On Leave"
          value="1"
          icon="🏖️"
          trend="1 pending"
          trendUp={false}
        />
        <StatCard
          title="Pending Actions"
          value="3"
          icon="⏰"
          trend="Review required"
          trendUp={false}
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <ActivityItem
            icon="👤"
            title="New employee added"
            description="Rajesh Kumar joined as Senior Developer"
            time="2 hours ago"
          />
          <ActivityItem
            icon="📅"
            title="Leave request"
            description="Priya Sharma requested leave for 3 days"
            time="5 hours ago"
          />
          <ActivityItem
            icon="✅"
            title="Attendance recorded"
            description="2 employees marked present today"
            time="Today at 9:00 AM"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard
            icon="➕"
            title="Add Employee"
            description="Onboard a new team member"
          />
          <QuickActionCard
            icon="📊"
            title="View Reports"
            description="Generate attendance & leave reports"
          />
          <QuickActionCard
            icon="💰"
            title="Process Payroll"
            description="Run monthly payroll for all employees"
          />
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  trend: string;
  trendUp: boolean;
}

function StatCard({ title, value, icon, trend, trendUp }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span
          className={`text-xs font-medium ${
            trendUp ? 'text-green-600' : 'text-gray-500'
          }`}
        >
          {trend}
        </span>
      </div>
      <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  );
}

interface ActivityItemProps {
  icon: string;
  title: string;
  description: string;
  time: string;
}

function ActivityItem({ icon, title, description, time }: ActivityItemProps) {
  return (
    <div className="flex items-start space-x-4">
      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
        <span className="text-xl">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-600">{description}</p>
        <p className="text-xs text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  icon: string;
  title: string;
  description: string;
}

function QuickActionCard({ icon, title, description }: QuickActionCardProps) {
  return (
    <button className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-left hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500">
      <span className="text-3xl mb-3 block">{icon}</span>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  );
}
