'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  TrendingUp,
  DollarSign,
  Building2,
  Puzzle,
  FileText,
  Clock,
} from 'lucide-react';

export default function RevenuePage() {
  const [revenue, setRevenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRevenue();
  }, []);

  async function loadRevenue() {
    try {
      const data = await apiClient.getRevenueSummary();
      setRevenue(data);
    } catch (err) {
      console.error('Failed to load revenue:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading revenue data...</div>
      </div>
    );
  }

  if (!revenue) {
    return (
      <div className="text-center text-gray-500 py-12">
        Failed to load revenue data
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Revenue Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Platform revenue overview and billing metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Monthly Recurring Revenue</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${revenue.mrr.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Base: ${revenue.baseMRR.toFixed(2)} + Add-ons: ${revenue.addonMRR.toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Annual Recurring Revenue</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${revenue.arr.toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Paying Companies</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {revenue.totalCompaniesWithBilling}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-100">
              <Puzzle className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-sm text-gray-500">Active Add-ons</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {revenue.totalActiveAddons}
          </p>
        </div>
      </div>

      {/* Revenue by Tier & Invoice Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Tier */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Tier</h2>
          {revenue.revenueByTier.length === 0 ? (
            <p className="text-gray-500 text-sm">No revenue data yet</p>
          ) : (
            <div className="space-y-3">
              {revenue.revenueByTier.map((item: any) => {
                const percentage = revenue.baseMRR > 0
                  ? ((item.amount / revenue.baseMRR) * 100).toFixed(1)
                  : '0';
                return (
                  <div key={item.tier}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{item.tier}</span>
                      <span className="text-gray-900 font-semibold">
                        ${item.amount.toFixed(2)}/mo
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, parseFloat(percentage))}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{percentage}% of base MRR</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Invoice Summary */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Summary</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
              <FileText className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Paid Invoices</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${revenue.invoicesSummary.totalPaid.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">
                  {revenue.invoicesSummary.paidCount} invoices
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-lg">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-500">Pending Invoices</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${revenue.invoicesSummary.totalPending.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">
                  {revenue.invoicesSummary.pendingCount} invoices
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
