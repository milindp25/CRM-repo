'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface DirectoryEmployee {
  id: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  workPhone: string | null;
  department: { name: string } | null;
  designation: { title: string } | null;
  dateOfJoining: string;
}

export default function DirectoryPage() {
  const [employees, setEmployees] = useState<DirectoryEmployee[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [anniversaries, setAnniversaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'directory' | 'celebrations'>('directory');

  useEffect(() => {
    fetchDirectory();
    fetchCelebrations();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchDirectory(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchDirectory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const data = await apiClient.request(`/social/directory?${params}`);
      setEmployees(Array.isArray(data) ? data : data?.data || []);
    } catch {} finally { setLoading(false); }
  };

  const fetchCelebrations = async () => {
    try {
      const [bd, an] = await Promise.all([
        apiClient.request('/social/directory/birthdays'),
        apiClient.request('/social/directory/anniversaries'),
      ]);
      setBirthdays(Array.isArray(bd) ? bd : []);
      setAnniversaries(Array.isArray(an) ? an : []);
    } catch {}
  };

  const tabs = [
    { id: 'directory' as const, label: 'Directory' },
    { id: 'celebrations' as const, label: 'Celebrations' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Employee Directory</h1>
        <p className="text-muted-foreground">Search and connect with your colleagues</p>
      </div>

      <div className="flex gap-2 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'directory' && (
        <>
          <input
            type="text"
            placeholder="Search by name, email, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
          />

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((emp) => (
                <div key={emp.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                      {emp.firstName[0]}{emp.lastName[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-foreground truncate">{emp.firstName} {emp.lastName}</h3>
                      <p className="text-xs text-muted-foreground truncate">{emp.designation?.title || 'No designation'}</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-sm">
                    <p className="text-muted-foreground truncate">{emp.workEmail}</p>
                    {emp.workPhone && <p className="text-muted-foreground">{emp.workPhone}</p>}
                    {emp.department && <p className="text-muted-foreground">{emp.department.name}</p>}
                  </div>
                </div>
              ))}
              {employees.length === 0 && <div className="col-span-full text-center py-8 text-muted-foreground">No employees found</div>}
            </div>
          )}
        </>
      )}

      {activeTab === 'celebrations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="text-lg font-semibold text-foreground mb-3">🎂 Birthdays This Month</h2>
            {birthdays.length === 0 ? (
              <p className="text-sm text-muted-foreground">No birthdays this month</p>
            ) : (
              <div className="space-y-2">
                {birthdays.map((b: any) => (
                  <div key={b.id} className="flex items-center gap-2 text-sm">
                    <span className="text-foreground">{b.first_name || b.firstName} {b.last_name || b.lastName}</span>
                    <span className="text-muted-foreground">- {b.date_of_birth ? new Date(b.date_of_birth).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="text-lg font-semibold text-foreground mb-3">🎉 Work Anniversaries</h2>
            {anniversaries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No anniversaries this month</p>
            ) : (
              <div className="space-y-2">
                {anniversaries.map((a: any) => (
                  <div key={a.id} className="flex items-center gap-2 text-sm">
                    <span className="text-foreground">{a.first_name || a.firstName} {a.last_name || a.lastName}</span>
                    <span className="text-muted-foreground">- {a.date_of_joining ? new Date(a.date_of_joining).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
