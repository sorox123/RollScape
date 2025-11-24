/**
 * Game Session Test Page
 * 
 * Demonstrates real-time multiplayer features with WebSocket integration.
 */

'use client';

import { useState } from 'react';
import { GameChat } from '@/components/game/GameChat';

export default function GameSessionTestPage() {
  // Mock values for testing - replace with real session data
  const [sessionId] = useState(1);
  const [userId] = useState(1); // Change this to test different users
  const [characterId] = useState(1);
  const [isDM] = useState(false); // Set to true to test DM features

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Real-Time Game Session
          </h1>
          <p className="text-gray-600">
            Test WebSocket multiplayer features. Open this page in multiple browser windows
            with different userId values to simulate multiple players.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Session Info</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Session ID:</span> {sessionId}
            </div>
            <div>
              <span className="font-medium">User ID:</span> {userId}
            </div>
            <div>
              <span className="font-medium">Character ID:</span> {characterId}
            </div>
            <div>
              <span className="font-medium">Role:</span> {isDM ? 'Dungeon Master' : 'Player'}
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>💡 Testing Tip:</strong> To test multiplayer, open this page in multiple
              browser windows and change the <code className="bg-blue-100 px-1 rounded">userId</code> value
              in the code (lines 12-15). Each window will represent a different player.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Panel */}
          <div className="lg:col-span-2 h-[600px]">
            <GameChat
              sessionId={sessionId}
              userId={userId}
              characterId={characterId}
              isDM={isDM}
            />
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
                  Roll Initiative
                </button>
                <button className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm">
                  Skill Check
                </button>
                <button className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm">
                  Cast Spell
                </button>
                <button className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm">
                  Attack
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-3">WebSocket Features</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Real-time chat messaging</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Live dice roll broadcasts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>DM narration system</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Player presence tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Auto-reconnection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 font-bold">⏳</span>
                  <span>Turn order management</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 font-bold">⏳</span>
                  <span>Combat state sync</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 font-bold">⏳</span>
                  <span>Player action broadcasts</span>
                </li>
              </ul>
            </div>

            {/* Instructions */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-3">How to Test</h3>
              <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
                <li>Start the backend server</li>
                <li>Open this page in multiple windows</li>
                <li>Change userId in each window</li>
                <li>Send messages and roll dice</li>
                <li>Watch real-time updates across windows</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
