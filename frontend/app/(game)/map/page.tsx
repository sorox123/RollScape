'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Import BattleMap with SSR disabled to avoid canvas.node issues
const BattleMap = dynamic(
  () => import('@/components/map/BattleMap').then((mod) => mod.BattleMap),
  { ssr: false }
);

interface Token {
  id: string;
  x: number;
  y: number;
  name: string;
  color: string;
  width: number;
  height: number;
  elevation?: number;
  type: 'player' | 'enemy' | 'npc';
  hp?: number;
  maxHp?: number;
  conditions?: string[];
}

export default function MapPage() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const response = await fetch('/api/users/me');
      if (response.ok) {
        const user = await response.json();
        // Allow access for any paid tier (basic, premium, dm)
        const isPaid = user.subscription_tier !== 'free';
        setHasAccess(isPaid);
      } else {
        setHasAccess(false);
      }
    } catch (error) {
      console.error('Failed to check access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <h1 className="text-3xl font-bold mb-4">Battle Map - Premium Feature</h1>
          <p className="text-gray-400 mb-6">
            The interactive Battle Map is available for subscribers. Upgrade your account to access
            tactical combat maps, token management, and real-time battle tracking.
          </p>
          <div className="space-y-3">
            <Link
              href="/pricing"
              className="block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              View Pricing Plans
            </Link>
            <Link
              href="/dashboard"
              className="block px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const [tokens, setTokens] = useState<Token[]>([
    {
      id: '1',
      x: 125,
      y: 125,
      name: 'Warrior',
      color: '#3b82f6',
      width: 1,
      height: 1,
      type: 'player',
      hp: 45,
      maxHp: 52,
    },
    {
      id: '2',
      x: 325,
      y: 125,
      name: 'Wizard',
      color: '#8b5cf6',
      width: 1,
      height: 1,
      type: 'player',
      hp: 28,
      maxHp: 28,
    },
    {
      id: '3',
      x: 225,
      y: 325,
      name: 'Rogue',
      color: '#10b981',
      width: 1,
      height: 1,
      type: 'player',
      hp: 32,
      maxHp: 40,
      conditions: ['poisoned'],
    },
    {
      id: '4',
      x: 525,
      y: 225,
      name: 'Goblin',
      color: '#ef4444',
      width: 1,
      height: 1,
      type: 'enemy',
      hp: 7,
      maxHp: 7,
    },
    {
      id: '5',
      x: 625,
      y: 325,
      name: 'Orc',
      color: '#dc2626',
      width: 2,
      height: 1,
      type: 'enemy',
      hp: 15,
      maxHp: 15,
    },
    {
      id: '6',
      x: 725,
      y: 425,
      name: 'Dragon',
      color: '#991b1b',
      width: 4,
      height: 3,
      elevation: 30,
      type: 'enemy',
      hp: 180,
      maxHp: 200,
    },
  ]);

  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);

  const handleTokenMove = (tokenId: string, x: number, y: number) => {
    setTokens((prev) =>
      prev.map((token) =>
        token.id === tokenId ? { ...token, x, y } : token
      )
    );
  };

  const handleTokenSelect = (tokenId: string | null) => {
    setSelectedTokenId(tokenId);
  };

  const selectedToken = tokens.find((t) => t.id === selectedTokenId);

  const updateTokenHP = (delta: number) => {
    if (!selectedTokenId) return;
    setTokens((prev) =>
      prev.map((token) =>
        token.id === selectedTokenId
          ? {
              ...token,
              hp: Math.max(0, Math.min(token.maxHp || 0, (token.hp || 0) + delta)),
            }
          : token
      )
    );
  };

  const addToken = () => {
    const newToken: Token = {
      id: Date.now().toString(),
      x: 425,
      y: 425,
      name: 'New Token',
      color: '#6366f1',
      width: 1,
      height: 1,
      type: 'npc',
      hp: 10,
      maxHp: 10,
    };
    setTokens([...tokens, newToken]);
  };

  const updateTokenDimension = (dimension: 'width' | 'height', value: number) => {
    if (!selectedTokenId) return;
    const clampedValue = Math.max(1, Math.min(10, value));
    setTokens((prev) =>
      prev.map((token) =>
        token.id === selectedTokenId
          ? { ...token, [dimension]: clampedValue }
          : token
      )
    );
  };

  const removeToken = () => {
    if (!selectedTokenId) return;
    setTokens((prev) => prev.filter((t) => t.id !== selectedTokenId));
    setSelectedTokenId(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-[1400px] mx-auto">
        <h1 className="text-3xl font-bold mb-6">Battle Map</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map */}
          <div className="lg:col-span-3">
            <BattleMap
              width={1200}
              height={800}
              gridSize={50}
              tokens={tokens}
              onTokenMove={handleTokenMove}
              onTokenSelect={handleTokenSelect}
              isDM={true}
            />
          </div>

          {/* Token Controls */}
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-bold mb-4">Token Controls</h2>

              {selectedToken ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Selected Token</div>
                    <div className="font-bold text-lg">{selectedToken.name}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-400 mb-1">Type</div>
                    <div className="capitalize">{selectedToken.type}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-400 mb-2">Size (squares)</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Width</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={selectedToken.width}
                          onChange={(e) => updateTokenDimension('width', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Depth</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={selectedToken.height}
                          onChange={(e) => updateTokenDimension('height', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-400 mb-2">Elevation (feet)</div>
                    <input
                      type="number"
                      min="0"
                      max="200"
                      step="5"
                      value={selectedToken.elevation || 0}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setTokens((prev) =>
                          prev.map((token) =>
                            token.id === selectedTokenId
                              ? { ...token, elevation: Math.max(0, Math.min(200, value)) }
                              : token
                          )
                        );
                      }}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      placeholder="0 (ground level)"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Flying, hovering, or elevated height
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-400 mb-1">Position</div>
                    <div className="text-sm">
                      X: {selectedToken.x}, Y: {selectedToken.y}
                    </div>
                  </div>

                  {selectedToken.hp !== undefined && (
                    <div>
                      <div className="text-sm text-gray-400 mb-2">HP</div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 bg-gray-700 rounded-full h-4 overflow-hidden">
                          <div
                            className="h-full bg-green-500 transition-all"
                            style={{
                              width: `${(selectedToken.hp / (selectedToken.maxHp || 1)) * 100}%`,
                            }}
                          />
                        </div>
                        <div className="text-sm font-bold whitespace-nowrap">
                          {selectedToken.hp} / {selectedToken.maxHp}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateTokenHP(-5)}
                          className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium"
                        >
                          -5 HP
                        </button>
                        <button
                          onClick={() => updateTokenHP(-1)}
                          className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium"
                        >
                          -1 HP
                        </button>
                        <button
                          onClick={() => updateTokenHP(1)}
                          className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium"
                        >
                          +1 HP
                        </button>
                        <button
                          onClick={() => updateTokenHP(5)}
                          className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium"
                        >
                          +5 HP
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={removeToken}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-medium"
                  >
                    Remove Token
                  </button>
                </div>
              ) : (
                <div className="text-gray-400 text-sm">
                  Select a token on the map to see controls
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-700">
                <button
                  onClick={addToken}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium"
                >
                  + Add Token
                </button>
              </div>
            </div>

            {/* Token List */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-bold mb-3">All Tokens</h3>
              <div className="space-y-2">
                {tokens.map((token) => (
                  <div
                    key={token.id}
                    onClick={() => setSelectedTokenId(token.id)}
                    className={`p-3 rounded cursor-pointer transition-colors ${
                      selectedTokenId === token.id
                        ? 'bg-blue-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: token.color }}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{token.name}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-300">
                          {token.hp !== undefined && (
                            <span>
                              {token.hp}/{token.maxHp} HP
                            </span>
                          )}
                          <span className="text-gray-500">•</span>
                          <span>{token.width}x{token.height}</span>
                          {token.elevation && token.elevation > 0 && (
                            <>
                              <span className="text-gray-500">•</span>
                              <span className="text-yellow-400">{token.elevation}ft</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 capitalize">{token.type}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
