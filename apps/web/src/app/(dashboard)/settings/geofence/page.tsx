'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { PageContainer } from '@/components/ui/page-container';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/error-banner';
import { TableLoader } from '@/components/ui/page-loader';
import { MapPin, Plus, LocateFixed, Edit2, Trash2, Power } from 'lucide-react';

const INPUT_CLASS = 'h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';

interface GeofenceZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isActive: boolean;
  allowedIpRanges: string[] | null;
}

export default function GeofencePage() {
  const toast = useToast();
  const [zones, setZones] = useState<GeofenceZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', latitude: '', longitude: '', radiusMeters: '100', allowedIpRanges: '' });

  // Edit state
  const [editingZone, setEditingZone] = useState<GeofenceZone | null>(null);
  const [editForm, setEditForm] = useState({ name: '', latitude: '', longitude: '', radiusMeters: '', allowedIpRanges: '' });

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { fetchZones(); }, []);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const data = await apiClient.request('/geofence/zones');
      setZones(Array.isArray(data) ? data : []);
    } catch (err: any) { toast.error('Failed to load zones', err.message); }
    finally { setLoading(false); }
  };

  const validateForm = (f: typeof form): boolean => {
    if (!f.name.trim()) {
      toast.error('Validation Error', 'Zone name is required');
      return false;
    }
    const lat = Number(f.latitude);
    const lng = Number(f.longitude);
    if (!f.latitude || isNaN(lat)) {
      toast.error('Validation Error', 'Please enter a valid latitude');
      return false;
    }
    if (lat < -90 || lat > 90) {
      toast.error('Validation Error', 'Latitude must be between -90 and 90');
      return false;
    }
    if (!f.longitude || isNaN(lng)) {
      toast.error('Validation Error', 'Please enter a valid longitude');
      return false;
    }
    if (lng < -180 || lng > 180) {
      toast.error('Validation Error', 'Longitude must be between -180 and 180');
      return false;
    }
    const radius = Number(f.radiusMeters);
    if (!radius || radius <= 0) {
      toast.error('Validation Error', 'Radius must be greater than 0');
      return false;
    }
    if (radius > 50000) {
      toast.error('Validation Error', 'Radius cannot exceed 50,000 meters (50km)');
      return false;
    }
    return true;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(form)) return;
    try {
      await apiClient.request('/geofence/zones', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          radiusMeters: Number(form.radiusMeters),
          allowedIpRanges: form.allowedIpRanges ? form.allowedIpRanges.split(',').map((s) => s.trim()) : undefined,
        }),
      });
      setShowCreate(false);
      toast.success('Location Added', `"${form.name}" has been added as an office location`);
      setForm({ name: '', latitude: '', longitude: '', radiusMeters: '100', allowedIpRanges: '' });
      fetchZones();
    } catch (err: any) { toast.error('Failed to create zone', err.message); }
  };

  const startEdit = (zone: GeofenceZone) => {
    setEditingZone(zone);
    setEditForm({
      name: zone.name,
      latitude: String(zone.latitude),
      longitude: String(zone.longitude),
      radiusMeters: String(zone.radiusMeters),
      allowedIpRanges: zone.allowedIpRanges ? (zone.allowedIpRanges as string[]).join(', ') : '',
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingZone) return;
    if (!validateForm(editForm)) return;
    try {
      await apiClient.request(`/geofence/zones/${editingZone.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editForm.name,
          latitude: Number(editForm.latitude),
          longitude: Number(editForm.longitude),
          radiusMeters: Number(editForm.radiusMeters),
          allowedIpRanges: editForm.allowedIpRanges ? editForm.allowedIpRanges.split(',').map((s) => s.trim()) : [],
        }),
      });
      setEditingZone(null);
      toast.success('Zone Updated', `Geofence zone "${editForm.name}" has been updated`);
      fetchZones();
    } catch (err: any) { toast.error('Failed to update zone', err.message); }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.request(`/geofence/zones/${id}`, { method: 'DELETE' });
      setDeletingId(null);
      toast.success('Zone Deleted', 'Geofence zone has been deactivated');
      fetchZones();
    } catch (err: any) { toast.error('Failed to delete zone', err.message); }
  };

  const handleToggleActive = async (zone: GeofenceZone) => {
    try {
      await apiClient.request(`/geofence/zones/${zone.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !zone.isActive }),
      });
      toast.success(zone.isActive ? 'Zone Deactivated' : 'Zone Activated', `"${zone.name}" is now ${zone.isActive ? 'inactive' : 'active'}`);
      fetchZones();
    } catch (err: any) { toast.error('Failed to toggle zone', err.message); }
  };

  const handleGetLocation = (setter: (f: any) => void, currentForm: typeof form) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setter({ ...currentForm, latitude: String(pos.coords.latitude), longitude: String(pos.coords.longitude) });
          toast.success('Location Detected', 'Your coordinates have been filled in');
        },
        () => toast.error('Location Error', 'Failed to get your location. Please check browser permissions.')
      );
    } else {
      toast.error('Not Supported', 'Geolocation is not supported by your browser');
    }
  };

  return (
    <PageContainer
      title="Office Locations"
      description="Set up work locations where employees can check in for attendance"
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Settings', href: '/settings' },
        { label: 'Office Locations' },
      ]}
      actions={
        <button onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-lg text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" />
          Add Zone
        </button>
      }
    >
      {/* Create Form Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} size="lg">
        <ModalHeader onClose={() => setShowCreate(false)}>Add Office Location</ModalHeader>
        <form onSubmit={handleCreate}>
          <ModalBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Zone Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Main Office" className={INPUT_CLASS} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Radius (meters) *</label>
                <input type="number" value={form.radiusMeters} onChange={(e) => setForm({ ...form, radiusMeters: e.target.value })}
                  className={INPUT_CLASS} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Latitude *</label>
                <input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  className={INPUT_CLASS} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Longitude *</label>
                <input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  className={INPUT_CLASS} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Office Network Addresses (comma-separated, optional)</label>
              <input type="text" value={form.allowedIpRanges} onChange={(e) => setForm({ ...form, allowedIpRanges: e.target.value })}
                placeholder="e.g. 192.168.1.0/24" className={INPUT_CLASS} />
            </div>
            <button type="button" onClick={() => handleGetLocation(setForm, form)}
              className="inline-flex items-center gap-2 border border-input bg-background text-foreground hover:bg-muted h-9 px-4 rounded-lg text-sm font-medium transition-colors">
              <LocateFixed className="h-4 w-4" />
              Use My Location
            </button>
          </ModalBody>
          <ModalFooter>
            <button type="button" onClick={() => setShowCreate(false)}
              className="border border-input bg-background text-foreground hover:bg-muted h-9 px-4 rounded-lg text-sm font-medium transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-lg text-sm font-medium transition-colors">
              Create Zone
            </button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editingZone} onClose={() => setEditingZone(null)} size="lg">
        <ModalHeader onClose={() => setEditingZone(null)}>Edit Zone: {editingZone?.name}</ModalHeader>
        <form onSubmit={handleUpdate}>
          <ModalBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Zone Name *</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className={INPUT_CLASS} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Radius (meters) *</label>
                <input type="number" value={editForm.radiusMeters} onChange={(e) => setEditForm({ ...editForm, radiusMeters: e.target.value })}
                  className={INPUT_CLASS} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Latitude *</label>
                <input type="number" step="any" value={editForm.latitude} onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                  className={INPUT_CLASS} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Longitude *</label>
                <input type="number" step="any" value={editForm.longitude} onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                  className={INPUT_CLASS} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Allowed IP Ranges (comma-separated)</label>
              <input type="text" value={editForm.allowedIpRanges} onChange={(e) => setEditForm({ ...editForm, allowedIpRanges: e.target.value })}
                className={INPUT_CLASS} />
            </div>
            <button type="button" onClick={() => handleGetLocation(setEditForm, editForm)}
              className="inline-flex items-center gap-2 border border-input bg-background text-foreground hover:bg-muted h-9 px-4 rounded-lg text-sm font-medium transition-colors">
              <LocateFixed className="h-4 w-4" />
              Use My Location
            </button>
          </ModalBody>
          <ModalFooter>
            <button type="button" onClick={() => setEditingZone(null)}
              className="border border-input bg-background text-foreground hover:bg-muted h-9 px-4 rounded-lg text-sm font-medium transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-lg text-sm font-medium transition-colors">
              Save Changes
            </button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Zones List */}
      {loading ? (
        <div className="rounded-xl border bg-card overflow-hidden">
          <TableLoader rows={4} cols={3} />
        </div>
      ) : zones.length === 0 ? (
        <div className="rounded-xl border bg-card">
          <EmptyState
            icon={<MapPin className="h-10 w-10" />}
            title="No office locations set up"
            description="Add your office locations so employees can check in when they arrive at work"
            action={{ label: 'Add Zone', onClick: () => setShowCreate(true) }}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {zones.map((z) => (
            <div key={z.id} className="rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium text-foreground">{z.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Lat: {Number(z.latitude).toFixed(6)}, Lng: {Number(z.longitude).toFixed(6)} &middot; Radius: {z.radiusMeters}m
                  </p>
                  {z.allowedIpRanges && (z.allowedIpRanges as string[]).length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">IPs: {(z.allowedIpRanges as string[]).join(', ')}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(z)}
                    title={z.isActive ? 'Deactivate' : 'Activate'}
                    className={`p-2 rounded-lg transition-colors ${z.isActive ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button onClick={() => startEdit(z)} title="Edit" className="p-2 hover:bg-muted rounded-lg text-yellow-600 dark:text-yellow-400">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {deletingId === z.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDelete(z.id)} className="text-xs px-2 py-1 bg-red-600 text-white rounded">Confirm</button>
                      <button onClick={() => setDeletingId(null)} className="text-xs px-2 py-1 border border-border rounded text-foreground">No</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeletingId(z.id)} title="Delete" className="p-2 hover:bg-muted rounded-lg text-red-600 dark:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <StatusBadge variant={getStatusVariant(z.isActive ? 'ACTIVE' : 'INACTIVE')} dot>
                    {z.isActive ? 'Active' : 'Inactive'}
                  </StatusBadge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
