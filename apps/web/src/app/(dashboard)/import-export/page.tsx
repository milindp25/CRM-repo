'use client';

import { useState, useRef } from 'react';
import { apiClient, type ImportResult } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { Permission } from '@hrplatform/shared';
import { PageContainer } from '@/components/ui/page-container';
import { StatCard } from '@/components/ui/stat-card';
import { ErrorBanner } from '@/components/ui/error-banner';
import {
  Upload, Download, Users, Building2, CalendarDays, Palmtree,
  FileUp, FileDown, FileSpreadsheet, Loader2, CheckCircle2,
  AlertCircle, SkipForward,
} from 'lucide-react';

export default function ImportExportPage() {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [exporting, setExporting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setImporting(true);
    setError('');
    setImportResult(null);

    try {
      const result = await apiClient.importEmployees(file);
      setImportResult(result);
      if (result.errors.length === 0) {
        setSuccess(`Successfully imported ${result.imported} employees`);
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExport = async (entityType: string, filters?: Record<string, string>) => {
    setExporting(entityType);
    setError('');
    try {
      const blob = await apiClient.downloadExport(entityType, filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entityType}_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccess(`${entityType} exported successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExporting(null);
    }
  };

  const downloadTemplate = () => {
    const url = apiClient.getImportTemplateUrl('employees');
    window.open(url, '_blank');
  };

  const exportOptions = [
    { type: 'employees', label: 'Employees', description: 'All active employees with department and designation', icon: Users, iconColor: 'blue' as const, permission: Permission.VIEW_EMPLOYEES },
    { type: 'departments', label: 'Departments', description: 'All departments with head employee info', icon: Building2, iconColor: 'purple' as const, permission: Permission.VIEW_DEPARTMENTS },
    { type: 'attendance', label: 'Attendance', description: 'Attendance records for a specific month', icon: CalendarDays, iconColor: 'green' as const, permission: Permission.VIEW_ATTENDANCE },
    { type: 'leaves', label: 'Leaves', description: 'Leave applications with status and approval info', icon: Palmtree, iconColor: 'amber' as const, permission: Permission.VIEW_LEAVES },
  ];

  return (
    <RoleGate requiredPermissions={[Permission.VIEW_EMPLOYEES, Permission.MANAGE_EMPLOYEES]}>
      <PageContainer
        title="Upload & Download"
        description="Upload data from spreadsheets or download your records"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Upload & Download' },
        ]}
      >
        {/* Alerts */}
        {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}
        {success && (
          <div className="flex items-center gap-2 p-4 rounded-lg border border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/30 text-sm text-green-700 dark:text-green-300">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('import')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'import'
                ? 'bg-card shadow text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileUp className="h-4 w-4" />
            Import
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'export'
                ? 'bg-card shadow text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileDown className="h-4 w-4" />
            Export
          </button>
        </div>

        {activeTab === 'import' && (
          <div className="space-y-6">
            {/* Import Instructions */}
            <div className="rounded-xl border bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Import Employees</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-foreground mb-2">Instructions</h3>
                  <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal ml-4">
                    <li>Download the CSV template</li>
                    <li>Fill in employee data (one row per employee)</li>
                    <li>Required fields: employee_code, first_name, last_name, work_email, date_of_joining</li>
                    <li>Dates must be in YYYY-MM-DD format</li>
                    <li>Department and designation codes must match existing records</li>
                    <li>Upload the completed CSV file</li>
                  </ol>
                  <button
                    onClick={downloadTemplate}
                    className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border border-input bg-background text-foreground hover:bg-muted transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download Template
                  </button>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">Upload CSV</h3>
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                    <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImport} className="hidden" id="csv-upload" />
                    <label htmlFor="csv-upload" className="cursor-pointer">
                      {importing ? (
                        <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin mb-2" />
                      ) : (
                        <Upload className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                      )}
                      <p className="text-sm text-muted-foreground">
                        {importing ? 'Importing...' : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">CSV files only</p>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Import Results */}
            {importResult && (
              <div className="rounded-xl border bg-card p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Import Results</h2>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <StatCard
                    title="Total Rows"
                    value={importResult.total}
                    icon={FileSpreadsheet}
                    iconColor="blue"
                  />
                  <StatCard
                    title="Imported"
                    value={importResult.imported}
                    icon={CheckCircle2}
                    iconColor="green"
                  />
                  <StatCard
                    title="Skipped"
                    value={importResult.skipped}
                    icon={SkipForward}
                    iconColor="rose"
                  />
                </div>

                {importResult.errors.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <h3 className="font-medium text-foreground">Errors ({importResult.errors.length})</h3>
                    </div>
                    <div className="max-h-60 overflow-y-auto rounded-xl border bg-card overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="border-b bg-muted/30 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Row</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Field</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Error</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {importResult.errors.map((err, i) => (
                            <tr key={i} className="hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3 text-foreground">{err.row}</td>
                              <td className="px-4 py-3 font-mono text-muted-foreground text-xs">{err.field}</td>
                              <td className="px-4 py-3 text-destructive">{err.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'export' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exportOptions.map(opt => {
              const Icon = opt.icon;
              return (
                <div key={opt.type} className="rounded-xl border bg-card p-6 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 rounded-xl p-2.5 ${
                      opt.iconColor === 'blue' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400' :
                      opt.iconColor === 'purple' ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400' :
                      opt.iconColor === 'green' ? 'bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400' :
                      'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{opt.label}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{opt.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleExport(opt.type)}
                    disabled={exporting === opt.type}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {exporting === opt.type ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {exporting === opt.type ? 'Exporting...' : 'Export CSV'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </PageContainer>
    </RoleGate>
  );
}
