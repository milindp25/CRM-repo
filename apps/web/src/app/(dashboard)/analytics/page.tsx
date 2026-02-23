'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface OverviewData {
  totalEmployees: number;
  activeEmployees: number;
  attritionRate: number;
  avgTenureMonths: number;
  pendingLeaves: number;
  todayAttendance: { present: number; total: number } | number;
  openPositions: number;
  monthlyPayrollCost: number;
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [tabData, setTabData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchOverview(); }, []);
  useEffect(() => { if (activeTab !== 'overview') fetchTabData(); }, [activeTab]);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const data = await apiClient.request('/analytics/overview');
      setOverview(data);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const fetchTabData = async () => {
    try {
      setLoading(true);
      const endpoints: Record<string, string> = {
        headcount: '/analytics/headcount',
        attrition: '/analytics/attrition',
        leave: '/analytics/leave-utilization',
        attendance: '/analytics/attendance',
        payroll: '/analytics/payroll-costs',
        diversity: '/analytics/diversity',
        recruitment: '/analytics/recruitment',
        training: '/analytics/training',
      };
      const data = await apiClient.request(endpoints[activeTab]);
      setTabData(data);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'headcount', label: 'Headcount' },
    { id: 'attrition', label: 'Attrition' },
    { id: 'leave', label: 'Leave' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'payroll', label: 'Payroll' },
    { id: 'diversity', label: 'Diversity' },
    { id: 'recruitment', label: 'Recruitment' },
    { id: 'training', label: 'Training' },
  ];

  const kpiCard = (label: string, value: string | number, subtitle?: string, color?: string) => (
    <div className="bg-card border border-border rounded-lg p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${color || 'text-foreground'} mt-1`}>{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">HR Analytics</h1>
        <p className="text-muted-foreground">Data-driven insights across your organization</p>
      </div>

      {error && <div className="p-3 bg-destructive/10 text-destructive rounded-lg">{error}</div>}

      <div className="flex gap-1 overflow-x-auto border-b border-border pb-px">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading analytics...</div>
      ) : activeTab === 'overview' && overview ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpiCard('Total Employees', overview.totalEmployees)}
          {kpiCard('Active Employees', overview.activeEmployees, undefined, 'text-green-600 dark:text-green-400')}
          {kpiCard('Attrition Rate', `${(overview.attritionRate || 0).toFixed(1)}%`, 'Last 12 months', overview.attritionRate > 15 ? 'text-red-600' : 'text-foreground')}
          {kpiCard('Avg Tenure', `${((overview.avgTenureMonths || 0) / 12).toFixed(1)} yrs`)}
          {kpiCard('Pending Leaves', overview.pendingLeaves)}
          {kpiCard('Today Attendance', typeof overview.todayAttendance === 'object' ? `${overview.todayAttendance.present}/${overview.todayAttendance.total}` : overview.todayAttendance)}
          {kpiCard('Open Positions', overview.openPositions)}
          {kpiCard('Monthly Payroll', `$${(overview.monthlyPayrollCost || 0).toLocaleString()}`, undefined, 'text-blue-600 dark:text-blue-400')}
        </div>
      ) : tabData ? (
        <div className="space-y-4">
          {/* Render tab-specific data as cards */}
          {typeof tabData === 'object' && !Array.isArray(tabData) && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(tabData).map(([key, value]) => {
                if (typeof value === 'number' || typeof value === 'string') {
                  return kpiCard(key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()), typeof value === 'number' ? Number(value).toLocaleString() : value);
                }
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                  return kpiCard(key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()), JSON.stringify(value).replace(/[{}"]/g, '').replace(/,/g, ', '));
                }
                return null;
              })}
            </div>
          )}
          {/* Render arrays as tables */}
          {Object.entries(tabData).map(([key, value]) => {
            if (Array.isArray(value) && value.length > 0) {
              const cols = Object.keys(value[0]);
              return (
                <div key={key} className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-muted/50">
                    <h3 className="text-sm font-medium text-foreground">{key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}</h3>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr>{cols.map((c) => <th key={c} className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{c}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {value.slice(0, 20).map((row: any, i: number) => (
                        <tr key={i}>{cols.map((c) => <td key={c} className="px-4 py-2 text-sm text-foreground">{typeof row[c] === 'number' ? Number(row[c]).toLocaleString() : String(row[c] ?? '-')}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }
            return null;
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">No data available</div>
      )}
    </div>
  );
}
