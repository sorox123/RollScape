'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Crown,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Image as ImageIcon,
  Users,
  FolderOpen,
  XCircle,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface SubscriptionInfo {
  id: string;
  status: string;
  tier: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
}

interface UsageInfo {
  campaigns_used: number;
  campaigns_limit: number;
  ai_images_used: number;
  ai_images_limit: number;
  ai_players_used: number;
  ai_players_limit: number;
  storage_used_gb: number;
  storage_limit_gb: number;
}

export default function SubscriptionDashboard() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [reactivating, setReactivating] = useState(false);

  useEffect(() => {
    loadSubscription();
    loadUsage();
  }, []);

  async function loadSubscription() {
    try {
      // TODO: Get customer_id from auth context
      const customerId = 'cus_mock_test@example.com';
      const response = await axios.get(`${API_BASE}/api/payments/subscription/${customerId}`);
      setSubscription(response.data);
    } catch (err) {
      console.error('Failed to load subscription:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadUsage() {
    try {
      // TODO: Get user_id from auth context
      const response = await axios.get(`${API_BASE}/api/subscription/usage?user_id=user-123`);
      setUsage(response.data);
    } catch (err) {
      console.error('Failed to load usage:', err);
    }
  }

  async function handleCancelSubscription() {
    if (!subscription || !window.confirm('Are you sure you want to cancel your subscription? You\'ll keep access until the end of your billing period.')) {
      return;
    }

    setCanceling(true);
    try {
      await axios.post(`${API_BASE}/api/payments/cancel-subscription`, {
        subscription_id: subscription.id,
        immediate: false, // Cancel at period end
      });
      
      alert('Subscription canceled. You\'ll keep access until ' + new Date(subscription.current_period_end).toLocaleDateString());
      loadSubscription();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to cancel subscription');
    } finally {
      setCanceling(false);
    }
  }

  async function handleReactivateSubscription() {
    if (!subscription) return;

    setReactivating(true);
    try {
      await axios.post(`${API_BASE}/api/payments/reactivate-subscription/${subscription.id}`);
      
      alert('Subscription reactivated successfully!');
      loadSubscription();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to reactivate subscription');
    } finally {
      setReactivating(false);
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-500/10 text-green-500 border-green-500/50',
      canceled: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50',
      past_due: 'bg-red-500/10 text-red-500 border-red-500/50',
      trialing: 'bg-blue-500/10 text-blue-500 border-blue-500/50',
    };
    return styles[status as keyof typeof styles] || styles.active;
  };

  const getTierName = (tier: string) => {
    const names: Record<string, string> = {
      free: 'Free',
      basic: 'Basic',
      premium: 'Premium',
      ultimate: 'Ultimate',
    };
    return names[tier] || tier;
  };

  const UsageBar = ({ used, limit, label, icon: Icon }: { used: number; limit: number; label: string; icon: any }) => {
    const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
    const isUnlimited = limit === 999;
    const isNearLimit = percentage >= 80 && !isUnlimited;
    const isAtLimit = percentage >= 100 && !isUnlimited;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium">{label}</span>
          </div>
          <span className={`text-sm font-semibold ${isAtLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-500' : 'text-gray-400'}`}>
            {isUnlimited ? `${used} / Unlimited` : `${used} / ${limit}`}
          </span>
        </div>
        {!isUnlimited && (
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-blue-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
        {isAtLimit && (
          <p className="text-xs text-red-500">
            You've reached your limit. <a href="/pricing" className="underline">Upgrade</a> to continue.
          </p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Active Subscription</h3>
          <p className="text-gray-400 mb-6">
            You're currently on the Free plan. Upgrade to unlock premium features!
          </p>
          <a
            href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
          >
            View Pricing
            <TrendingUp className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Subscription Status Card */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-yellow-500" />
            <div>
              <h2 className="text-2xl font-bold">{getTierName(subscription.tier)} Plan</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(subscription.status)}`}>
                  {subscription.status.toUpperCase()}
                </span>
                {subscription.cancel_at_period_end && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium border bg-yellow-500/10 text-yellow-500 border-yellow-500/50">
                    CANCELS ON {new Date(subscription.current_period_end).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {subscription.cancel_at_period_end ? (
            <button
              onClick={handleReactivateSubscription}
              disabled={reactivating}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-medium transition"
            >
              {reactivating ? 'Reactivating...' : 'Reactivate'}
            </button>
          ) : (
            <button
              onClick={handleCancelSubscription}
              disabled={canceling}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-medium transition"
            >
              {canceling ? 'Canceling...' : 'Cancel Subscription'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-400">Current Period</p>
              <p className="font-semibold">
                {new Date(subscription.current_period_start).toLocaleDateString()} - {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-lg">
            <CreditCard className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm text-gray-400">Next Billing Date</p>
              <p className="font-semibold">
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {subscription.cancel_at_period_end && (
          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-500">Subscription Ending</p>
              <p className="text-sm text-gray-300 mt-1">
                Your subscription will end on {new Date(subscription.current_period_end).toLocaleDateString()}.
                You'll be downgraded to the Free plan but keep all your campaigns and characters.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Usage Card */}
      {usage && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Current Usage
          </h3>

          <div className="space-y-6">
            <UsageBar
              used={usage.campaigns_used}
              limit={usage.campaigns_limit}
              label="Active Campaigns"
              icon={FolderOpen}
            />
            <UsageBar
              used={usage.ai_images_used}
              limit={usage.ai_images_limit}
              label="AI Images This Month"
              icon={ImageIcon}
            />
            <UsageBar
              used={usage.ai_players_used}
              limit={usage.ai_players_limit}
              label="AI Players per Campaign"
              icon={Users}
            />
            <UsageBar
              used={usage.storage_used_gb}
              limit={usage.storage_limit_gb}
              label="Storage"
              icon={CreditCard}
            />
          </div>

          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              Usage quotas reset on {new Date(subscription.current_period_end).toLocaleDateString()}.
              Need more? <a href="/pricing" className="text-blue-500 hover:underline">Upgrade your plan</a>
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/pricing"
            className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-center"
          >
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <p className="font-medium">Upgrade Plan</p>
            <p className="text-xs text-gray-400 mt-1">Get more features</p>
          </a>
          
          <button
            onClick={() => {/* TODO: Open invoices modal */}}
            className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-center"
          >
            <CreditCard className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <p className="font-medium">View Invoices</p>
            <p className="text-xs text-gray-400 mt-1">Download receipts</p>
          </button>
          
          <button
            onClick={() => {/* TODO: Open payment method modal */}}
            className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-center"
          >
            <CreditCard className="w-6 h-6 mx-auto mb-2 text-purple-500" />
            <p className="font-medium">Payment Method</p>
            <p className="text-xs text-gray-400 mt-1">Update card info</p>
          </button>
        </div>
      </div>
    </div>
  );
}
