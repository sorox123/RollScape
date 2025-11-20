'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Check, X, ArrowRight, Sparkles, Crown, Zap, Star 
} from 'lucide-react'
import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

interface SubscriptionTier {
  tier: string
  name: string
  price_monthly: number
  price_yearly: number
  savings_yearly: number
  description: string
  features: string[]
  limits: any
}

export default function PricingPage() {
  const router = useRouter()
  const [tiers, setTiers] = useState<SubscriptionTier[]>([])
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(true)
  const [currentTier, setCurrentTier] = useState('free')

  useEffect(() => {
    loadTiers()
    loadCurrentSubscription()
  }, [])

  async function loadTiers() {
    try {
      const response = await axios.get(`${API_BASE}/api/subscription/tiers`)
      setTiers(response.data.tiers)
    } catch (err) {
      console.error('Failed to load tiers:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadCurrentSubscription() {
    try {
      const response = await axios.get(`${API_BASE}/api/subscription/current?user_id=user-123`)
      setCurrentTier(response.data.subscription.tier)
    } catch (err) {
      console.error('Failed to load subscription:', err)
    }
  }

  async function handleUpgrade(tierName: string) {
    if (tierName === 'free') return

    try {
      const response = await axios.post(`${API_BASE}/api/subscription/upgrade`, {
        target_tier: tierName,
        billing_cycle: billingCycle
      })
      
      alert('Upgrade initiated! (Payment integration coming soon)')
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to upgrade')
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'free': return <Sparkles className="w-6 h-6" />
      case 'basic': return <Zap className="w-6 h-6" />
      case 'premium': return <Star className="w-6 h-6" />
      case 'ultimate': return <Crown className="w-6 h-6" />
      default: return <Sparkles className="w-6 h-6" />
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'gray'
      case 'basic': return 'blue'
      case 'premium': return 'purple'
      case 'ultimate': return 'yellow'
      default: return 'gray'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-400">Loading pricing...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your Adventure
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Start free, upgrade when you're ready for more
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-gray-700 p-1 rounded-lg">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md transition ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-md transition flex items-center gap-2 ${
                billingCycle === 'yearly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Yearly
              <span className="px-2 py-0.5 bg-green-600 text-xs rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier) => {
            const color = getTierColor(tier.tier)
            const price = billingCycle === 'yearly' ? tier.price_yearly : tier.price_monthly
            const pricePerMonth = billingCycle === 'yearly' ? tier.price_yearly / 12 : price
            const isCurrentTier = currentTier === tier.tier
            const isPremiumTier = tier.tier !== 'free'

            return (
              <div
                key={tier.tier}
                className={`relative bg-gray-800 rounded-lg border-2 overflow-hidden ${
                  tier.tier === 'premium'
                    ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                    : 'border-gray-700'
                }`}
              >
                {/* Recommended Badge */}
                {tier.tier === 'premium' && (
                  <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                    MOST POPULAR
                  </div>
                )}

                <div className="p-6">
                  {/* Icon & Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`text-${color}-400`}>
                      {getTierIcon(tier.tier)}
                    </div>
                    <h3 className="text-2xl font-bold">{tier.name}</h3>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    {tier.tier === 'free' ? (
                      <div>
                        <span className="text-4xl font-bold">Free</span>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold">
                            ${pricePerMonth.toFixed(2)}
                          </span>
                          <span className="text-gray-400">/month</span>
                        </div>
                        {billingCycle === 'yearly' && (
                          <p className="text-sm text-green-400 mt-1">
                            Billed ${tier.price_yearly}/year • Save ${tier.savings_yearly}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <p className="text-gray-400 mb-6">{tier.description}</p>

                  {/* CTA Button */}
                  {isCurrentTier ? (
                    <button
                      disabled
                      className="w-full py-3 bg-gray-700 text-gray-400 rounded-lg font-semibold cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : tier.tier === 'free' ? (
                    <button
                      onClick={() => router.push('/signup')}
                      className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition"
                    >
                      Get Started
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(tier.tier)}
                      className={`w-full py-3 bg-${color}-600 hover:bg-${color}-700 rounded-lg font-semibold flex items-center justify-center gap-2 transition`}
                    >
                      Upgrade Now
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  {/* Features List */}
                  <div className="mt-8 space-y-3">
                    {tier.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Key Limits */}
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <p className="text-xs font-semibold text-gray-400 mb-3">KEY LIMITS</p>
                    <div className="space-y-2 text-sm text-gray-400">
                      <div className="flex justify-between">
                        <span>Campaigns:</span>
                        <span className="font-semibold text-white">
                          {tier.limits.max_campaigns === 999 ? 'Unlimited' : tier.limits.max_campaigns}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>AI Images/Month:</span>
                        <span className="font-semibold text-white">
                          {tier.limits.monthly_ai_images === 0 ? 'None' : tier.limits.monthly_ai_images}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>AI Players:</span>
                        <span className="font-semibold text-white">{tier.limits.max_ai_players}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-2">Can I start with Free and upgrade later?</h3>
              <p className="text-gray-400">
                Absolutely! Start with the Free tier to explore RollScape, then upgrade anytime to unlock 
                map-based gameplay and AI image generation. Your campaigns and characters carry over.
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-2">What happens if I exceed my AI image limit?</h3>
              <p className="text-gray-400">
                Your limit resets at the start of each billing cycle. If you hit your limit, you can either 
                wait for the reset or upgrade to a higher tier with more monthly images.
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-400">
                Yes! You can cancel your subscription anytime. You'll keep premium features until the end of 
                your current billing period, then automatically downgrade to Free.
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-2">Is there a student or educator discount?</h3>
              <p className="text-gray-400">
                We're working on special pricing for students and educators! Contact support@rollscape.com 
                for more information about discounted plans.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg p-12 border border-blue-700">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Campaign?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of adventurers already playing on RollScape
          </p>
          <button
            onClick={() => router.push('/signup')}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold inline-flex items-center gap-2 transition"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
