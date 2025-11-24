'use client';

import React from 'react';
import { AlertCircle, TrendingUp } from 'lucide-react';

interface UsageQuotaProps {
  used: number;
  limit: number;
  label: string;
  icon?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

export default function UsageQuota({
  used,
  limit,
  label,
  icon,
  showUpgradePrompt = true,
}: UsageQuotaProps) {
  const isUnlimited = limit === 999 || limit === Infinity;
  const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
  const isNearLimit = percentage >= 80 && !isUnlimited;
  const isAtLimit = percentage >= 100 && !isUnlimited;

  const getBarColor = () => {
    if (isAtLimit) return 'bg-red-500';
    if (isNearLimit) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getTextColor = () => {
    if (isAtLimit) return 'text-red-500';
    if (isNearLimit) return 'text-yellow-500';
    return 'text-gray-400';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-gray-400">{icon}</span>}
          <span className="text-sm font-medium text-gray-300">{label}</span>
        </div>
        <span className={`text-sm font-semibold ${getTextColor()}`}>
          {isUnlimited ? `${used} / Unlimited` : `${used} / ${limit}`}
        </span>
      </div>

      {!isUnlimited && (
        <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full transition-all duration-300 ${getBarColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}

      {isAtLimit && showUpgradePrompt && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/50 rounded-lg mt-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-500 font-medium">Quota Exceeded</p>
            <p className="text-xs text-gray-400 mt-1">
              You've reached your {label.toLowerCase()} limit.{' '}
              <a href="/pricing" className="text-blue-500 hover:underline">
                Upgrade your plan
              </a>{' '}
              to continue.
            </p>
          </div>
        </div>
      )}

      {isNearLimit && !isAtLimit && showUpgradePrompt && (
        <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg mt-2">
          <TrendingUp className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-yellow-500 font-medium">Approaching Limit</p>
            <p className="text-xs text-gray-400 mt-1">
              You're using {Math.round(percentage)}% of your {label.toLowerCase()}.{' '}
              <a href="/pricing" className="text-blue-500 hover:underline">
                Consider upgrading
              </a>{' '}
              for more resources.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
