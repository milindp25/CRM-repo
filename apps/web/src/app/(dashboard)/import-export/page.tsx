'use client';

import { useState, useRef } from 'react';
import { apiClient, type ImportResult } from '@/lib/api-client';
import { RoleGate } from '@/components/common/role-gate';
import { Permission } from '@hrplatform/shared';

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
    { type: 'employees', label: 'Employees', description: 'All active employees with department and designation', icon: '👥', permission: Permission.VIEW_EMPLOYEES },
    { type: 'departments', label: 'Departments', description: 'All departments with head employee info', icon: '🏢', permission: Permission.VIEW_DEPARTMENTS },
    { type: 'attendance', label: 'Attendance', description: 'Attendance records for a specific month', icon: '📅', permission: Permission.VIEW_ATTENDANCE },
    { type: 'leaves', label: 'Leaves', description: 'Leave applications with status and approval info', icon: '🌴', permission: Permission.VIEW_LEAVES },
  ];

  return (
    <RoleGate requiredPermissions={[Permission.VIEW_EMPLOYEES, Permission.MANAGE_EMPLOYEES]}>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Import & Export</h1>
          <p className="text-gray-600 mt-1">Bulk import data from CSV files or export your data</p>
        </div>

        {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}
        {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">{success}</div>}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          <button onClick={() => setActiveTab('import')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'import' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>
            Import
          </button>
          <button onClick={() => setActiveTab('export')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'export' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>
            Export
          </button>
        </div>

        {activeTab === 'import' && (
          <div className="space-y-6">
            {/* Import Instructions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Employees</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Instructions</h3>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal ml-4">
                    <li>Download the CSV template</li>
                    <li>Fill in employee data (one row per employee)</li>
                    <li>Required fields: employee_code, first_name, last_name, work_email, date_of_joining</li>
                    <li>Dates must be in YYYY-MM-DD format</li>
                    <li>Department and designation codes must match existing records</li>
                    <li>Upload the completed CSV file</li>
                  </ol>
                  <button onClick={downloadTemplate}
                    className="mt-4 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-sm font-medium">
                    Download Template
                  </button>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Upload CSV</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImport} className="hidden" id="csv-upload" />
                    <label htmlFor="csv-upload" className="cursor-pointer">
                      <div className="text-4xl mb-2">📄</div>
                      <p className="text-sm text-gray-600">
                        {importing ? 'Importing...' : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">CSV files only</p>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Import Results */}
            {importResult && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Results</h2>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-700">{importResult.total}</div>
                    <div className="text-sm text-blue-600">Total Rows</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-700">{importResult.imported}</div>
                    <div className="text-sm text-green-600">Imported</div>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-700">{importResult.skipped}</div>
                    <div className="text-sm text-red-600">Skipped</div>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Errors ({importResult.errors.length})</h3>
                    <div className="max-h-60 overflow-y-auto border rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-500">Row</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-500">Field</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-500">Error</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {importResult.errors.map((err, i) => (
                            <tr key={i} className="hover:bg-red-50">
                              <td className="px-3 py-2 text-gray-700">{err.row}</td>
                              <td className="px-3 py-2 font-mono text-gray-600">{err.field}</td>
                              <td className="px-3 py-2 text-red-600">{err.message}</td>
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
            {exportOptions.map(opt => (
              <div key={opt.type} className="bg-white rounded-lg shadow-md p-6 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{opt.icon}</div>
                  <div>
                    <h3 className="font-medium text-gray-900">{opt.label}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{opt.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleExport(opt.type)}
                  disabled={exporting === opt.type}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium whitespace-nowrap"
                >
                  {exporting === opt.type ? 'Exporting...' : 'Export CSV'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </RoleGate>
  );
}
