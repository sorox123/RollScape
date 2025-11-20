import Link from 'next/link'
import { Sword, Users, Book, MessageCircle, Dice6 } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-4">
            <span className="text-red-500">Roll</span>Scape
          </h1>
          <p className="text-2xl text-slate-300 mb-2">
            AI-Powered D&D Virtual Tabletop
          </p>
          <p className="text-lg text-slate-400">
            Your complete platform for epic adventures
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <FeatureCard
            icon={<Sword className="w-12 h-12 text-red-500" />}
            title="AI Dungeon Master"
            description="Powered by GPT-4, experience dynamic storytelling with adaptive personalities"
            link="/campaigns"
          />
          <FeatureCard
            icon={<Users className="w-12 h-12 text-blue-500" />}
            title="Multiplayer Sessions"
            description="Play with friends in real-time with voice chat and synchronized gameplay"
            link="/sessions"
          />
          <FeatureCard
            icon={<Book className="w-12 h-12 text-green-500" />}
            title="Character Management"
            description="Create and manage detailed character sheets with automatic calculations"
            link="/characters"
          />
          <FeatureCard
            icon={<MessageCircle className="w-12 h-12 text-purple-500" />}
            title="Social Network"
            description="Add friends, create groups, and message other players"
            link="/friends"
          />
          <FeatureCard
            icon={<Dice6 className="w-12 h-12 text-yellow-500" />}
            title="Advanced Dice Roller"
            description="Roll any combination with advantage, disadvantage, and modifiers"
            link="/dice"
          />
          <FeatureCard
            icon={<Sword className="w-12 h-12 text-orange-500" />}
            title="Combat Tracker"
            description="Manage initiative, HP, conditions, and turn order effortlessly"
            link="/combat"
          />
        </div>

        {/* CTA Buttons */}
        <div className="flex justify-center gap-4">
          <Link
            href="/dashboard"
            className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-lg transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/about"
            className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold text-lg transition-colors"
          >
            Learn More
          </Link>
        </div>

        {/* Status Badge */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-green-400 font-medium">All systems operational (Mock Mode)</span>
          </div>
        </div>
      </div>
    </main>
  )
}

function FeatureCard({ icon, title, description, link }: {
  icon: React.ReactNode
  title: string
  description: string
  link: string
}) {
  return (
    <Link href={link} className="block">
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-all hover:scale-105">
        <div className="mb-4">{icon}</div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-400">{description}</p>
      </div>
    </Link>
  )
}
