'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import type { Document, DocumentFilters, DocumentPaginationResponse, CreateDocumentData } from '@/lib/api/types';
import { FeatureGate } from '@/components/common/feature-gate';
import { RoleGate } from '@/components/common/role-gate';
import { Permission } from '@hrplatform/shared';
import { useAuthContext } from '@/contexts/auth-context';
import { FileText, Upload, Download, Trash2, Edit2, Search, ChevronLeft, ChevronRight, X, File, FileSpreadsheet, Image } from 'lucide-react';

const DOCUMENT_CATEGORIES = [
  'OFFER_LETTER',
  'CONTRACT',
  'ID_PROOF',
  'CERTIFICATE',
  'POLICY',
  'PAYSLIP',
  'TAX_DOCUMENT',
  'OTHER',
];

function formatCategory(cat: string) {
  return cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('xlsx') || mimeType.includes('xls'))
    return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
  if (mimeType.includes('image')) return <Image className="w-5 h-5 text-blue-500" />;
  return <File className="w-5 h-5 text-gray-500" />;
}

export default function DocumentsPage() {
  const { user } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [meta, setMeta] = useState<DocumentPaginationResponse['meta'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);

  // Upload form
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState<CreateDocumentData>({ name: '', category: 'OTHER', description: '' });

  // Edit
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [editForm, setEditForm] = useState<Partial<CreateDocumentData>>({});

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { fetchDocuments(); }, [page, categoryFilter]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const filters: DocumentFilters = { page, limit: 20 };
      if (categoryFilter) filters.category = categoryFilter;
      if (searchQuery) filters.search = searchQuery;
      const result = await apiClient.getDocuments(filters);
      setDocuments(result.data || []);
      setMeta(result.meta || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDocuments();
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) { setError('Please select a file'); return; }
    if (!uploadForm.name.trim()) { setError('Please enter a document name'); return; }
    setUploading(true);
    setError('');
    try {
      await apiClient.uploadDocument(selectedFile, uploadForm);
      setShowUpload(false);
      setSelectedFile(null);
      setUploadForm({ name: '', category: 'OTHER', description: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSuccess('Document uploaded successfully');
      setTimeout(() => setSuccess(''), 3000);
      fetchDocuments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    try {
      await apiClient.updateDocument(editingDoc.id, editForm);
      setEditingDoc(null);
      setEditForm({});
      setSuccess('Document updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      fetchDocuments();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteDocument(id);
      setDeletingId(null);
      setSuccess('Document deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
      fetchDocuments();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDownload = (id: string) => {
    const url = apiClient.getDocumentDownloadUrl(id);
    window.open(url, '_blank');
  };

  const startEdit = (doc: Document) => {
    setEditingDoc(doc);
    setEditForm({ name: doc.name, category: doc.category, description: doc.description || '' });
  };

  const isAdmin = user?.role === 'COMPANY_ADMIN' || user?.role === 'HR_ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <FeatureGate feature="DOCUMENTS">
      <RoleGate requiredPermissions={[Permission.VIEW_EMPLOYEES, Permission.MANAGE_EMPLOYEES]}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Document Management</h1>
              <p className="text-muted-foreground mt-1">Upload, manage, and organize company documents</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowUpload(!showUpload)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                {showUpload ? <><X className="w-4 h-4" /> Cancel</> : <><Upload className="w-4 h-4" /> Upload Document</>}
              </button>
            )}
          </div>

          {error && <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">{error}</div>}
          {success && <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">{success}</div>}

          {/* Upload Form */}
          {showUpload && (
            <form onSubmit={handleUpload} className="bg-card rounded-lg shadow-md p-6 mb-6 border border-border">
              <h3 className="font-semibold text-foreground mb-4">Upload New Document</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Document Name *</label>
                  <input
                    type="text"
                    required
                    value={uploadForm.name}
                    onChange={e => setUploadForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    placeholder="e.g., Employee Handbook 2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Category *</label>
                  <select
                    value={uploadForm.category}
                    onChange={e => setUploadForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    {DOCUMENT_CATEGORIES.map(c => <option key={c} value={c}>{formatCategory(c)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">File * (max 10MB)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                  <input
                    type="text"
                    value={uploadForm.description || ''}
                    onChange={e => setUploadForm(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    placeholder="Optional description"
                  />
                </div>
              </div>
              <button type="submit" disabled={uploading} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm">
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </form>
          )}

          {/* Edit Modal */}
          {editingDoc && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <form onSubmit={handleUpdate} className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md border border-border">
                <h3 className="font-semibold text-foreground mb-4">Edit Document</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Name</label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                    <select
                      value={editForm.category || ''}
                      onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    >
                      {DOCUMENT_CATEGORIES.map(c => <option key={c} value={c}>{formatCategory(c)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                    <input
                      type="text"
                      value={editForm.description || ''}
                      onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">Save</button>
                  <button type="button" onClick={() => setEditingDoc(null)} className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted text-sm">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search documents..."
                  className="pl-9 pr-3 py-2 border border-border rounded-md text-sm bg-background text-foreground w-64"
                />
              </div>
              <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">Search</button>
            </form>
            <select
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground"
            >
              <option value="">All Categories</option>
              {DOCUMENT_CATEGORIES.map(c => <option key={c} value={c}>{formatCategory(c)}</option>)}
            </select>
          </div>

          {/* Document Table */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg shadow-md">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No documents found</p>
              {isAdmin && <p className="text-sm text-muted-foreground mt-1">Upload your first document to get started</p>}
            </div>
          ) : (
            <div className="bg-card rounded-lg shadow-md overflow-hidden border border-border">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Document</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Uploaded By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {documents.map(doc => (
                    <tr key={doc.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {getFileIcon(doc.mimeType)}
                          <div>
                            <div className="text-sm font-medium text-foreground">{doc.name}</div>
                            <div className="text-xs text-muted-foreground">{doc.fileName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                          {formatCategory(doc.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{formatFileSize(doc.fileSize)}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {doc.uploader ? `${doc.uploader.firstName} ${doc.uploader.lastName}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleDownload(doc.id)} title="Download" className="p-1.5 hover:bg-muted rounded text-blue-600 dark:text-blue-400">
                            <Download className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <>
                              <button onClick={() => startEdit(doc)} title="Edit" className="p-1.5 hover:bg-muted rounded text-yellow-600 dark:text-yellow-400">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {deletingId === doc.id ? (
                                <div className="flex items-center gap-1">
                                  <button onClick={() => handleDelete(doc.id)} className="text-xs px-2 py-1 bg-red-600 text-white rounded">Confirm</button>
                                  <button onClick={() => setDeletingId(null)} className="text-xs px-2 py-1 border border-border rounded text-foreground">No</button>
                                </div>
                              ) : (
                                <button onClick={() => setDeletingId(doc.id)} title="Delete" className="p-1.5 hover:bg-muted rounded text-red-600 dark:text-red-400">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-3 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Page {meta.currentPage} of {meta.totalPages} ({meta.totalItems} documents)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={!meta.hasPreviousPage}
                      className="p-2 border border-border rounded-md disabled:opacity-50 hover:bg-muted"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={!meta.hasNextPage}
                      className="p-2 border border-border rounded-md disabled:opacity-50 hover:bg-muted"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Delete Confirmation */}
        </div>
      </RoleGate>
    </FeatureGate>
  );
}
