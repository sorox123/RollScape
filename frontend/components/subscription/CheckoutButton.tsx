'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { CreditCard, Loader2 } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface CheckoutButtonProps {
  tier: string;
  billingPeriod: 'monthly' | 'yearly';
  userId?: string;
  userEmail?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function CheckoutButton({
  tier,
  billingPeriod,
  userId = 'user-123', // TODO: Get from auth context
  userEmail = 'test@example.com', // TODO: Get from auth context
  className = '',
  children,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    
    try {
      const response = await axios.post(`${API_BASE}/api/payments/create-checkout`, {
        user_id: userId,
        email: userEmail,
        tier,
        billing_period: billingPeriod,
        success_url: `${window.location.origin}/dashboard?checkout=success`,
        cancel_url: `${window.location.origin}/pricing?checkout=canceled`,
      });

      if (response.data.checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.checkout_url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      alert(err.response?.data?.detail || 'Failed to create checkout session');
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={`
        flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium 
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          {children || (
            <>
              <CreditCard className="w-4 h-4" />
              Subscribe Now
            </>
          )}
        </>
      )}
    </button>
  );
}
