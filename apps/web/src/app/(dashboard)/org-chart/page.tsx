'use client';

/**
 * Org Chart Page
 * Full-page interactive organization hierarchy view
 */

import { useState, useEffect } from 'react';
import { apiClient, type Employee, type Department } from '@/lib/api-client';
import {
  Building2,
  Users,
  User,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
  Search,
} from 'lucide-react';

export default function OrgChartPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'list' | 'reporting'>('tree');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptRes, empRes] = await Promise.allSettled([
        apiClient.getDepartmentHierarchy(),
        apiClient.getEmployees({ limit: 100 }),
      ]);

      if (deptRes.status === 'fulfilled') {
        setDepartments(deptRes.value);
      }
      if (empRes.status === 'fulfilled') {
        setEmployees(empRes.value.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  const getEmployeesByDept = (deptId: string): Employee[] => {
    return employees.filter(e => e.departmentId === deptId);
  };

  const buildReportingTree = (employees: Employee[]) => {
    const byManager: Record<string, Employee[]> = {};
    const roots: Employee[] = [];
    employees.forEach(emp => {
      if (emp.reportingManagerId) {
        if (!byManager[emp.reportingManagerId]) byManager[emp.reportingManagerId] = [];
        byManager[emp.reportingManagerId].push(emp);
      } else {
        roots.push(emp);
      }
    });
    return { roots, byManager };
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading organization chart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Organization Chart</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {departments.length} departments · {employees.length} employees
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search departments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-64"
            />
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                viewMode === 'tree'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              Tree
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('reporting')}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                viewMode === 'reporting'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              Reporting
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {departments.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">No departments yet</h3>
          <p className="text-sm text-muted-foreground">
            Create departments to see the organization chart.
          </p>
        </div>
      ) : viewMode === 'tree' ? (
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="space-y-2">
            {departments
              .filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()))
              .map((dept) => (
                <FullDepartment
                  key={dept.id}
                  department={dept}
                  level={0}
                  employees={getEmployeesByDept(dept.id)}
                  allEmployees={employees}
                  search={search}
                />
              ))}
          </div>
        </div>
      ) : viewMode === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments
            .filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()))
            .map((dept) => (
              <DepartmentCard
                key={dept.id}
                department={dept}
                employees={getEmployeesByDept(dept.id)}
              />
            ))}
        </div>
      ) : (
        /* Reporting view */
        (() => {
          const { roots, byManager } = buildReportingTree(employees);
          const filteredRoots = search
            ? roots.filter(emp =>
                `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(search.toLowerCase())
              )
            : roots;

          return filteredRoots.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-1">No reporting hierarchy found</h3>
              <p className="text-sm text-muted-foreground">
                {search ? 'No employees match your search.' : 'No employees without a reporting manager found.'}
              </p>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="space-y-1">
                {filteredRoots.map((emp) => (
                  <ReportingNode
                    key={emp.id}
                    employee={emp}
                    byManager={byManager}
                    level={0}
                    search={search}
                  />
                ))}
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}

function FullDepartment({
  department,
  level,
  employees,
  allEmployees,
  search,
}: {
  department: Department;
  level: number;
  employees: Employee[];
  allEmployees: Employee[];
  search: string;
}) {
  const [expanded, setExpanded] = useState(level < 2 || !!search);
  const [showEmployees, setShowEmployees] = useState(false);
  const hasChildren = department.children && department.children.length > 0;

  const levelColors = [
    'border-l-blue-500',
    'border-l-green-500',
    'border-l-purple-500',
    'border-l-orange-500',
    'border-l-pink-500',
  ];
  const colorClass = levelColors[level % levelColors.length];

  return (
    <div style={{ marginLeft: level > 0 ? `${level * 24}px` : '0' }}>
      <div
        className={`border-l-4 ${colorClass} bg-muted/30 rounded-r-lg px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors`}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {hasChildren ? (
              expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />
            ) : (
              <div className="w-4" />
            )}
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <div>
              <span className="font-medium text-foreground">{department.name}</span>
              <span className="ml-2 text-xs text-muted-foreground font-mono">{department.code}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); setShowEmployees(!showEmployees); }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              {employees.length} employees
            </button>
          </div>
        </div>
      </div>

      {showEmployees && employees.length > 0 && (
        <div className="ml-12 mt-1 mb-2 space-y-1">
          {employees.map((emp) => (
            <div key={emp.id} className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground">
              <User className="w-3.5 h-3.5" />
              <span className="text-foreground">{emp.firstName} {emp.lastName}</span>
              <span className="text-xs">({emp.workEmail})</span>
            </div>
          ))}
        </div>
      )}

      {expanded && hasChildren && (
        <div className="mt-1 space-y-1">
          {department.children!.map((child) => (
            <FullDepartment
              key={child.id}
              department={child}
              level={level + 1}
              employees={allEmployees.filter(e => e.departmentId === child.id)}
              allEmployees={allEmployees}
              search={search}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DepartmentCard({
  department,
  employees,
}: {
  department: Department;
  employees: Employee[];
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{department.name}</h3>
          <p className="text-xs text-muted-foreground font-mono">{department.code}</p>
        </div>
      </div>
      {department.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{department.description}</p>
      )}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {employees.length} employees
        </div>
        {!department.isActive && (
          <span className="px-2 py-0.5 bg-muted rounded text-muted-foreground">Inactive</span>
        )}
      </div>
    </div>
  );
}

const LEVEL_BADGE_COLORS: Record<number, string> = {
  0: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  1: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  2: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  3: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  4: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
  5: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
};

function ReportingNode({
  employee,
  byManager,
  level,
  search,
}: {
  employee: Employee;
  byManager: Record<string, Employee[]>;
  level: number;
  search: string;
}) {
  const reportees = byManager[employee.id] || [];
  const hasReportees = reportees.length > 0;
  const [expanded, setExpanded] = useState(level < 2);

  const filteredReportees = search
    ? reportees.filter(emp =>
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(search.toLowerCase())
      )
    : reportees;

  const designationLevel = employee.designation?.level ?? 0;
  const badgeColor = LEVEL_BADGE_COLORS[designationLevel % Object.keys(LEVEL_BADGE_COLORS).length]
    || LEVEL_BADGE_COLORS[0];

  return (
    <div style={{ marginLeft: level > 0 ? `${level * 24}px` : '0' }}>
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
          hasReportees ? 'cursor-pointer hover:bg-muted/50' : ''
        } bg-muted/20`}
        onClick={() => hasReportees && setExpanded(!expanded)}
      >
        {hasReportees ? (
          expanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          )
        ) : (
          <div className="w-4 flex-shrink-0" />
        )}

        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground">
              {employee.firstName} {employee.lastName}
            </span>
            {employee.designation && (
              <>
                <span className="text-xs text-muted-foreground">
                  {employee.designation.title}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${badgeColor}`}>
                  L{employee.designation.level}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            {employee.department && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {employee.department.name}
              </span>
            )}
            {hasReportees && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {reportees.length} direct report{reportees.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {expanded && hasReportees && (
        <div className="mt-1 space-y-1">
          {filteredReportees.map((reportee) => (
            <ReportingNode
              key={reportee.id}
              employee={reportee}
              byManager={byManager}
              level={level + 1}
              search={search}
            />
          ))}
        </div>
      )}
    </div>
  );
}
