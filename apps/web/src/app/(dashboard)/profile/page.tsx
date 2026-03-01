'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { PageContainer } from '@/components/ui/page-container';
import { User, Lock, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  // Profile update state
  const [profileData, setProfileData] = useState({ firstName: '', lastName: '', phone: '' });
  const [profileSaving, setProfileSaving] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const toast = useToast();

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const payload: { firstName?: string; lastName?: string; phone?: string } = {};
      if (profileData.firstName.trim()) payload.firstName = profileData.firstName.trim();
      if (profileData.lastName.trim()) payload.lastName = profileData.lastName.trim();
      if (profileData.phone.trim()) payload.phone = profileData.phone.trim();
      await apiClient.updateOwnProfile(payload);
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error('Update failed', err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.warning('Validation error', 'New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.warning('Validation error', 'New password must be at least 8 characters');
      return;
    }

    setPasswordSaving(true);
    try {
      await apiClient.changePassword(passwordData.currentPassword, passwordData.newPassword);
      toast.success('Password changed');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error('Password change failed', err.message || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const inputClass = 'h-10 w-full px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';

  return (
    <PageContainer
      title="My Profile"
      description="Update your personal information and password"
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Profile' },
      ]}
      className="max-w-2xl"
    >
      {/* Update Profile */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Update Profile</h2>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">First Name</label>
            <input
              type="text"
              value={profileData.firstName}
              onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
              className={inputClass}
              placeholder="Enter new first name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Last Name</label>
            <input
              type="text"
              value={profileData.lastName}
              onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
              className={inputClass}
              placeholder="Enter new last name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Phone</label>
            <input
              type="text"
              value={profileData.phone}
              onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
              className={inputClass}
              placeholder="Enter phone number"
            />
          </div>
          <button
            type="submit"
            disabled={profileSaving}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {profileSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {profileSaving ? 'Saving...' : 'Update Profile'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Current Password</label>
            <input
              type="password"
              required
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">New Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              className={inputClass}
            />
            <p className="text-xs text-muted-foreground mt-1">Minimum 8 characters</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Confirm New Password</label>
            <input
              type="password"
              required
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={passwordSaving}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {passwordSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {passwordSaving ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </PageContainer>
  );
}
