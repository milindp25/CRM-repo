'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Calendar,
  Users,
  UserCheck,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import {
  Feature,
  FEATURE_LABELS,
  FEATURE_DESCRIPTIONS,
  SubscriptionTier,
  TIER_FEATURES,
} from '@hrplatform/shared';
import { apiClient } from '@/lib/api-client';

type Tab = 'overview' | 'features' | 'subscription';

const TIERS: SubscriptionTier[] = [
  SubscriptionTier.FREE,
  SubscriptionTier.BASIC,
  SubscriptionTier.PROFESSIONAL,
  SubscriptionTier.ENTERPRISE,
];

const STATUSES = ['TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED'];

const tierColors: Record<string, string> = {
  FREE: 'bg-gray-100 text-gray-700',
  BASIC: 'bg-blue-100 text-blue-700',
  PROFESSIONAL: 'bg-purple-100 text-purple-700',
  ENTERPRISE: 'bg-amber-100 text-amber-700',
};

const statusColors: Record<string, string> = {
  TRIAL: 'bg-yellow-100 text-yellow-700',
  ACTIVE: 'bg-green-100 text-green-700',
  EXPIRED: 'bg-red-100 text-red-700',
  SUSPENDED: 'bg-orange-100 text-orange-700',
  CANCELLED: 'bg-gray-100 text-gray-700',
};

interface CompanyDetail {
  id: string;
  companyName: string;
  companyCode: string;
  email: string;
  phone: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  featuresEnabled: string[];
  createdAt: string;
  updatedAt: string;
  _count: { users: number; employees: number };
}

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Features state
  const [enabledFeatures, setEnabledFeatures] = useState<string[]>([]);
  const [featuresSaving, setFeaturesSaving] = useState(false);
  const [featuresMessage, setFeaturesMessage] = useState('');

  // Subscription state
  const [subTier, setSubTier] = useState('');
  const [subStatus, setSubStatus] = useState('');
  const [subSaving, setSubSaving] = useState(false);
  const [subMessage, setSubMessage] = useState('');

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const result = await apiClient.getCompany(companyId);
        setCompany(result);
        setEnabledFeatures(result.featuresEnabled || []);
        setSubTier(result.subscriptionTier);
        setSubStatus(result.subscriptionStatus);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load company'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [companyId]);

  const handleFeatureToggle = (feature: string) => {
    setEnabledFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
    setFeaturesMessage('');
  };

  const handleSaveFeatures = async () => {
    setFeaturesSaving(true);
    setFeaturesMessage('');
    try {
      await apiClient.updateCompanyFeatures(companyId, enabledFeatures);
      setFeaturesMessage('Features updated successfully');
    } catch (err) {
      setFeaturesMessage(
        err instanceof Error ? err.message : 'Failed to update features'
      );
    } finally {
      setFeaturesSaving(false);
    }
  };

  const handleSaveSubscription = async () => {
    setSubSaving(true);
    setSubMessage('');
    try {
      await apiClient.updateCompanySubscription(companyId, {
        tier: subTier,
        status: subStatus,
      });
      setSubMessage('Subscription updated successfully');
      // Refresh company data
      const result = await apiClient.getCompany(companyId);
      setCompany(result);
    } catch (err) {
      setSubMessage(
        err instanceof Error ? err.message : 'Failed to update subscription'
      );
    } finally {
      setSubSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.push('/companies')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Companies
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!company) return null;

  const allFeatures = Object.values(Feature);
  const tierFeatures = TIER_FEATURES[company.subscriptionTier as SubscriptionTier] || [];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'features', label: 'Features' },
    { key: 'subscription', label: 'Subscription' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/companies')}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{company.companyName}</h1>
          <p className="text-gray-500 text-sm font-mono">{company.companyCode}</p>
        </div>
        <span
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            tierColors[company.subscriptionTier] || 'bg-gray-100 text-gray-700'
          }`}
        >
          {company.subscriptionTier}
        </span>
        <span
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            statusColors[company.subscriptionStatus] ||
            'bg-gray-100 text-gray-700'
          }`}
        >
          {company.subscriptionStatus}
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab company={company} />
      )}

      {activeTab === 'features' && (
        <FeaturesTab
          allFeatures={allFeatures}
          tierFeatures={tierFeatures}
          enabledFeatures={enabledFeatures}
          onToggle={handleFeatureToggle}
          onSave={handleSaveFeatures}
          saving={featuresSaving}
          message={featuresMessage}
          currentTier={company.subscriptionTier}
        />
      )}

      {activeTab === 'subscription' && (
        <SubscriptionTab
          tier={subTier}
          status={subStatus}
          onTierChange={setSubTier}
          onStatusChange={setSubStatus}
          onSave={handleSaveSubscription}
          saving={subSaving}
          message={subMessage}
          currentTier={company.subscriptionTier}
          currentStatus={company.subscriptionStatus}
        />
      )}
    </div>
  );
}

function OverviewTab({ company }: { company: CompanyDetail }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Company Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Company Information
        </h3>
        <div className="space-y-4">
          <InfoRow
            icon={<Building2 className="w-4 h-4" />}
            label="Company Name"
            value={company.companyName}
          />
          <InfoRow
            icon={<Building2 className="w-4 h-4" />}
            label="Company Code"
            value={company.companyCode}
          />
          <InfoRow
            icon={<Mail className="w-4 h-4" />}
            label="Email"
            value={company.email || 'Not provided'}
          />
          <InfoRow
            icon={<Phone className="w-4 h-4" />}
            label="Phone"
            value={company.phone || 'Not provided'}
          />
          <InfoRow
            icon={<Calendar className="w-4 h-4" />}
            label="Created"
            value={new Date(company.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          />
          <InfoRow
            icon={<Calendar className="w-4 h-4" />}
            label="Last Updated"
            value={new Date(company.updatedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {company._count.users}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 text-white">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">
                {company._count.employees}
              </p>
            </div>
          </div>
        </div>

        {/* Subscription Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            Subscription
          </h3>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                tierColors[company.subscriptionTier] ||
                'bg-gray-100 text-gray-700'
              }`}
            >
              {company.subscriptionTier}
            </span>
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                statusColors[company.subscriptionStatus] ||
                'bg-gray-100 text-gray-700'
              }`}
            >
              {company.subscriptionStatus}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            {company.featuresEnabled?.length || 0} features enabled
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-gray-400 mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function FeaturesTab({
  allFeatures,
  tierFeatures,
  enabledFeatures,
  onToggle,
  onSave,
  saving,
  message,
  currentTier,
}: {
  allFeatures: Feature[];
  tierFeatures: Feature[];
  enabledFeatures: string[];
  onToggle: (feature: string) => void;
  onSave: () => void;
  saving: boolean;
  message: string;
  currentTier: string;
}) {
  const isSuccess = message.toLowerCase().includes('success');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Feature Management
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Toggle features for this company. Features included in the{' '}
            <span className="font-medium">{currentTier}</span> tier are marked.
          </p>
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Features
        </button>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
            isSuccess
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {isSuccess ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-200">
        {allFeatures.map((feature) => {
          const isEnabled = enabledFeatures.includes(feature);
          const isTierFeature = tierFeatures.includes(feature);
          return (
            <div
              key={feature}
              className="flex items-center justify-between px-6 py-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">
                    {FEATURE_LABELS[feature] || feature}
                  </p>
                  {isTierFeature && (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full font-medium">
                      Included in {currentTier}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {FEATURE_DESCRIPTIONS[feature] || ''}
                </p>
              </div>
              <button
                onClick={() => onToggle(feature)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ml-4 ${
                  isEnabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SubscriptionTab({
  tier,
  status,
  onTierChange,
  onStatusChange,
  onSave,
  saving,
  message,
  currentTier,
  currentStatus,
}: {
  tier: string;
  status: string;
  onTierChange: (tier: string) => void;
  onStatusChange: (status: string) => void;
  onSave: () => void;
  saving: boolean;
  message: string;
  currentTier: string;
  currentStatus: string;
}) {
  const isSuccess = message.toLowerCase().includes('success');
  const hasChanges = tier !== currentTier || status !== currentStatus;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          Subscription Management
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Update the subscription tier and status for this company.
        </p>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
            isSuccess
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {isSuccess ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Current Values */}
        <div className="flex items-center gap-3 pb-6 border-b border-gray-200">
          <span className="text-sm text-gray-500">Current:</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              tierColors[currentTier] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {currentTier}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              statusColors[currentStatus] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {currentStatus}
          </span>
        </div>

        {/* Tier Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Subscription Tier
          </label>
          <select
            value={tier}
            onChange={(e) => onTierChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Status Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Subscription Status
          </label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={onSave}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
