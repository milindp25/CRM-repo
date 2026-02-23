'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';

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

  useEffect(() => { fetchZones(); }, []);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const data = await apiClient.request('/geofence/zones');
      setZones(Array.isArray(data) ? data : []);
    } catch (err: any) { toast.error('Failed to load zones', err.message); }
    finally { setLoading(false); }
  };

  const validateForm = (): boolean => {
    if (!form.name.trim()) {
      toast.error('Validation Error', 'Zone name is required');
      return false;
    }
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (!form.latitude || isNaN(lat)) {
      toast.error('Validation Error', 'Please enter a valid latitude');
      return false;
    }
    if (lat < -90 || lat > 90) {
      toast.error('Validation Error', 'Latitude must be between -90 and 90');
      return false;
    }
    if (!form.longitude || isNaN(lng)) {
      toast.error('Validation Error', 'Please enter a valid longitude');
      return false;
    }
    if (lng < -180 || lng > 180) {
      toast.error('Validation Error', 'Longitude must be between -180 and 180');
      return false;
    }
    const radius = Number(form.radiusMeters);
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
    if (!validateForm()) return;
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
      setForm({ name: '', latitude: '', longitude: '', radiusMeters: '100', allowedIpRanges: '' });
      toast.success('Zone Created', `Geofence zone "${form.name}" has been created`);
      fetchZones();
    } catch (err: any) { toast.error('Failed to create zone', err.message); }
  };

  const handleGetLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setForm({ ...form, latitude: String(pos.coords.latitude), longitude: String(pos.coords.longitude) });
          toast.success('Location Detected', 'Your coordinates have been filled in');
        },
        () => toast.error('Location Error', 'Failed to get your location. Please check browser permissions.')
      );
    } else {
      toast.error('Not Supported', 'Geolocation is not supported by your browser');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Geofence Zones</h1>
          <p className="text-muted-foreground">Configure location-based attendance verification zones</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
          {showCreate ? 'Cancel' : 'Add Zone'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Zone Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Main Office" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Radius (meters)</label>
              <input type="number" value={form.radiusMeters} onChange={(e) => setForm({ ...form, radiusMeters: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Latitude</label>
              <input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Longitude</label>
              <input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Allowed IP Ranges (comma-separated)</label>
            <input type="text" value={form.allowedIpRanges} onChange={(e) => setForm({ ...form, allowedIpRanges: e.target.value })} placeholder="192.168.1.0/24, 10.0.0.0/8" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleGetLocation} className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted">
              Use My Location
            </button>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">Create Zone</button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : zones.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No geofence zones configured</div>
        ) : zones.map((z) => (
          <div key={z.id} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">{z.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Lat: {Number(z.latitude).toFixed(6)}, Lng: {Number(z.longitude).toFixed(6)} &middot; Radius: {z.radiusMeters}m
                </p>
                {z.allowedIpRanges && (z.allowedIpRanges as string[]).length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">IPs: {(z.allowedIpRanges as string[]).join(', ')}</p>
                )}
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${z.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                {z.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
