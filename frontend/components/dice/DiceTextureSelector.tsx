"use client";

import { useState, useEffect } from 'react';
import { Sparkles, Download, Heart, ShoppingCart, Search } from 'lucide-react';

interface DiceTexture {
  id: string;
  name: string;
  description: string;
  preview_image_url: string;
  is_free: boolean;
  price_cents: number;
  price_display: string;
  tags: string[];
  style: string;
  is_featured: boolean;
  is_official: boolean;
  likes_count: number;
  downloads_count: number;
  rating_avg: number;
}

interface DiceTextureSelectorProps {
  selectedTextureId?: string;
  onSelectTexture: (textureId: string) => void;
  onClose: () => void;
}

export default function DiceTextureSelector({ selectedTextureId, onSelectTexture, onClose }: DiceTextureSelectorProps) {
  const [textures, setTextures] = useState<DiceTexture[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterFree, setFilterFree] = useState(false);
  const [filterOfficial, setFilterOfficial] = useState(false);

  useEffect(() => {
    fetchTextures();
  }, [search, filterFree, filterOfficial]);

  async function fetchTextures() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterFree) params.append('free_only', 'true');
      if (filterOfficial) params.append('official_only', 'true');
      
      const response = await fetch(`/api/marketplace/dice-textures?${params}`);
      const data = await response.json();
      setTextures(data.textures || []);
    } catch (error) {
      console.error('Failed to fetch textures:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-purple-500 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 to-pink-900 p-6 border-b border-purple-500">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Dice Texture Marketplace
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-red-400 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search textures..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={() => setFilterFree(!filterFree)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterFree
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Free Only
            </button>

            <button
              onClick={() => setFilterOfficial(!filterOfficial)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterOfficial
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Official
            </button>
          </div>
        </div>

        {/* Texture Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : textures.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No textures found</p>
              <p className="text-sm mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {textures.map((texture) => (
                <div
                  key={texture.id}
                  onClick={() => onSelectTexture(texture.id)}
                  className={`
                    bg-gray-800 rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-105 hover:shadow-xl
                    ${selectedTextureId === texture.id ? 'ring-4 ring-purple-500' : ''}
                    ${texture.is_featured ? 'border-2 border-yellow-500' : ''}
                  `}
                >
                  {/* Preview Image */}
                  <div className="aspect-video bg-gray-700 relative">
                    {texture.preview_image_url ? (
                      <img
                        src={texture.preview_image_url}
                        alt={texture.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Sparkles className="w-12 h-12 text-gray-600" />
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2 right-2 flex gap-2">
                      {texture.is_official && (
                        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                          Official
                        </span>
                      )}
                      {texture.is_featured && (
                        <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                          Featured
                        </span>
                      )}
                    </div>

                    {/* Selected Checkmark */}
                    {selectedTextureId === texture.id && (
                      <div className="absolute inset-0 bg-purple-900 bg-opacity-50 flex items-center justify-center">
                        <div className="bg-purple-600 rounded-full p-3">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="text-white font-semibold mb-1 truncate">{texture.name}</h3>
                    
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                      {texture.description || 'No description'}
                    </p>

                    {/* Tags */}
                    {texture.tags && texture.tags.length > 0 && (
                      <div className="flex gap-1 mb-3 flex-wrap">
                        {texture.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {texture.likes_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {texture.downloads_count}
                        </span>
                      </div>
                      {texture.rating_avg > 0 && (
                        <span className="flex items-center gap-1">
                          ⭐ {texture.rating_avg.toFixed(1)}
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between">
                      {texture.is_free ? (
                        <span className="text-green-400 font-semibold">FREE</span>
                      ) : (
                        <span className="text-purple-400 font-semibold flex items-center gap-1">
                          <ShoppingCart className="w-4 h-4" />
                          {texture.price_display}
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTexture(texture.id);
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-800 p-4 border-t border-gray-700 flex justify-between items-center">
          <div className="text-gray-400 text-sm">
            {textures.length} texture{textures.length !== 1 ? 's' : ''} available
          </div>
          <button
            onClick={onClose}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
