'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sword, Users, MessageCircle, Dice6, Settings, LogOut } from 'lucide-react'
import { apiStatus } from '@/lib/api'
import { useToast } from '@/components/ui/ToastContainer'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { DashboardCardSkeleton } from '@/components/ui/LoadingSkeleton'

export default function Dashboard() {
  const toast = useToast()
  const [serviceStatus, setServiceStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadServiceStatus()
  }, [])

  const loadServiceStatus = async () => {
    try {
      const response = await apiStatus.getServices()
      
      if (response.error) {
        toast.warning('Service Status Unavailable', 'Could not fetch service status')
        setServiceStatus({ database: false, redis: false, openai: false, supabase: false })
      } else {
        setServiceStatus(response.data || { database: false, redis: false, openai: false, supabase: false })
      }
    } catch (error) {
      console.error('Failed to load service status:', error)
      toast.error('Connection Error', 'Unable to connect to backend')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Navigation */}
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-bold">
              <span className="text-red-500">Roll</span>
              <span className="text-white">Scape</span>
            </Link>
            
            <div className="flex items-center gap-6">
              <Link href="/campaigns" className="text-slate-300 hover:text-white transition-colors">
                Campaigns
              </Link>
              <Link href="/characters" className="text-slate-300 hover:text-white transition-colors">
                Characters
              </Link>
              <Link href="/spells" className="text-slate-300 hover:text-white transition-colors">
                Spells
              </Link>
              <Link href="/my-spells" className="text-slate-300 hover:text-white transition-colors">
                My Spells
              </Link>
              <Link href="/friends" className="text-slate-300 hover:text-white transition-colors">
                Friends
              </Link>
              <Link href="/messages" className="text-slate-300 hover:text-white transition-colors">
                Messages
              </Link>
              <button className="text-slate-300 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">Welcome back, Adventurer!</p>
        </div>

        {/* Service Status */}
        {loading ? (
          <div className="bg-slate-800 rounded-lg p-6 mb-8 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">System Status</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-slate-700 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        ) : serviceStatus ? (
          <div className="bg-slate-800 rounded-lg p-6 mb-8 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">System Status</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatusCard 
                name="Mock Mode" 
                status={serviceStatus.mock_mode ? 'active' : 'inactive'}
                color={serviceStatus.mock_mode ? 'green' : 'gray'}
              />
              <StatusCard 
                name="OpenAI" 
                status={serviceStatus.services?.openai?.mode}
                color={serviceStatus.services?.openai?.mode === 'mock' ? 'yellow' : 'green'}
              />
              <StatusCard 
                name="Supabase" 
                status={serviceStatus.services?.supabase?.mode}
                color={serviceStatus.services?.supabase?.mode === 'mock' ? 'yellow' : 'green'}
              />
              <StatusCard 
                name="Redis" 
                status={serviceStatus.services?.redis?.mode}
                color={serviceStatus.services?.redis?.mode === 'mock' ? 'yellow' : 'green'}
              />
            </div>
          </div>
        ) : null}

        {/* Quick Actions Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <DashboardCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <QuickActionCard
            icon={<Sword className="w-8 h-8" />}
            title="Start New Campaign"
            description="Begin your epic adventure"
            href="/campaigns/new"
            color="red"
          />
          <QuickActionCard
            icon={<Users className="w-8 h-8" />}
            title="Join Session"
            description="Connect with your party"
            href="/sessions"
            color="blue"
          />
          <QuickActionCard
            icon={<Dice6 className="w-8 h-8" />}
            title="Roll Dice"
            description="Quick dice roller"
            href="/dice"
            color="yellow"
          />
          <QuickActionCard
            icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
            title="Spell Library"
            description="Browse & create spells"
            href="/spells"
            color="purple"
          />
          <QuickActionCard
            icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
            title="My Spells"
            description="Your homebrew collection"
            href="/my-spells"
            color="pink"
          />
          <QuickActionCard
            icon={<MessageCircle className="w-8 h-8" />}
            title="Messages"
            description="Chat with friends"
            href="/messages"
            color="blue"
          />
          <QuickActionCard
            icon={<Users className="w-8 h-8" />}
            title="Find Friends"
            description="Connect with players"
            href="/friends"
            color="green"
          />
          <QuickActionCard
            icon={<Sword className="w-8 h-8" />}
            title="Character Sheet"
            description="Manage your characters"
            href="/characters"
            color="orange"
          />
          </div>
        )}

        {/* Recent Activity (Placeholder) */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
          <p className="text-slate-400 text-center py-8">No recent activity yet. Start a campaign to get going!</p>
        </div>
      </div>
    </div>
  )
}

function StatusCard({ name, status, color }: { name: string; status: string; color: string }) {
  const colors = {
    green: 'bg-green-500/20 border-green-500 text-green-400',
    yellow: 'bg-yellow-500/20 border-yellow-500 text-yellow-400',
    red: 'bg-red-500/20 border-red-500 text-red-400',
    gray: 'bg-gray-500/20 border-gray-500 text-gray-400',
  }

  return (
    <div className={`rounded-lg p-4 border ${colors[color as keyof typeof colors] || colors.gray}`}>
      <div className="text-sm font-medium mb-1">{name}</div>
      <div className="text-xs opacity-75 uppercase">{status}</div>
    </div>
  )
}

function QuickActionCard({ icon, title, description, href, color }: {
  icon: React.ReactNode
  title: string
  description: string
  href: string
  color: string
}) {
  const colors = {
    red: 'text-red-500 hover:border-red-500',
    blue: 'text-blue-500 hover:border-blue-500',
    yellow: 'text-yellow-500 hover:border-yellow-500',
    purple: 'text-purple-500 hover:border-purple-500',
    green: 'text-green-500 hover:border-green-500',
    orange: 'text-orange-500 hover:border-orange-500',
  }

  return (
    <Link href={href}>
      <div className={`bg-slate-800 border border-slate-700 rounded-lg p-6 hover:scale-105 transition-all ${colors[color as keyof typeof colors]}`}>
        <div className="mb-4">{icon}</div>
        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
    </Link>
  )
}
