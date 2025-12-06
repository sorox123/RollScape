'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Map, Image as ImageIcon, Wand2, ArrowLeft, Info, 
  Download, RefreshCw, Plus, Sparkles
} from 'lucide-react'
import { useToast } from '@/components/ui/ToastContainer'
import Button from '@/components/ui/Button'
import { apiAIImages } from '@/lib/api'

interface Environment {
  name: string
  keywords: string[]
  moods: string[]
  features: string[]
}

interface GeneratedImage {
  id: string
  url: string
  revised_prompt: string
  original_prompt: string
  image_type: string
  size: string
  quality: string
  cost: number
  created_at: string
  is_mock: boolean
}

export default function MapGeneratorPage() {
  const router = useRouter()
  const toast = useToast()
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | null>(null)
  
  // Form state
  const [customEnvironment, setCustomEnvironment] = useState('')
  const [mapStyle, setMapStyle] = useState<'top-down' | 'scenic' | 'isometric'>('top-down')
  const [mood, setMood] = useState('')
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [additionalDetails, setAdditionalDetails] = useState('')
  const [size, setSize] = useState('1024x1024')
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard')
  
  // Generation state
  const [generating, setGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadEnvironments()
  }, [])

  async function loadEnvironments() {
    try {
      const response = await apiAIImages.getEnvironmentTemplates()
      
      if (response.error) {
        toast.warning('Templates Unavailable', 'Could not load environment templates')
        setEnvironments([])
      } else {
        setEnvironments(response.data?.environments || [])
      }
    } catch (err) {
      console.error('Failed to load environments:', err)
      toast.error('Load Failed', 'Could not load templates')
      setEnvironments([])
    }
  }

  function selectEnvironment(env: Environment) {
    setSelectedEnvironment(env)
    setCustomEnvironment(env.name)
    if (env.moods.length > 0) setMood(env.moods[0])
    setSelectedFeatures([])
  }

  function toggleFeature(feature: string) {
    setSelectedFeatures(prev =>
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    )
  }

  async function generateMap() {
    if (!customEnvironment.trim()) {
      toast.error('Missing Info', 'Please enter an environment type')
      return
    }

    setGenerating(true)
    setError(null)

    try {
      const response = await apiAIImages.generateMap({
        environment: customEnvironment,
        map_style: mapStyle,
        mood: mood || undefined,
        features: selectedFeatures.length > 0 ? selectedFeatures : undefined,
        additional_details: additionalDetails || undefined,
        size,
        quality,
      })

      if (response.error) {
        const detail = response.error.detail
        if (typeof detail === 'object' && detail.error === 'subscription_required') {
          toast.warning('Subscription Required', detail.message)
        } else if (typeof detail === 'object' && detail.error === 'quota_exceeded') {
          toast.error('Quota Exceeded', detail.message)
        } else {
          toast.error('Generation Failed', response.error.error || 'Unknown error')
        }
        setError(response.error.error || 'Failed to generate')
      } else {
        setGeneratedImage(response.data!)
        toast.success('Map Generated!', `${customEnvironment} map created successfully`)
      }
    } catch (err: any) {
      console.error('Failed to generate map:', err)
      const errorMsg = 'Failed to generate map'
      setError(errorMsg)
      toast.error('Generation Failed', errorMsg)
    } finally {
      setGenerating(false)
    }
  }

  const estimatedCost = quality === 'hd' 
    ? (size === '1024x1024' ? 0.08 : 0.12)
    : (size === '1024x1024' ? 0.04 : 0.08)

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-700 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Map className="w-8 h-8" />
                  AI Map Generator
                </h1>
                <p className="text-gray-400 mt-1">
                  Create battle maps and scenic environments for your campaign
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-400">Estimated Cost</p>
              <p className="text-2xl font-bold text-blue-400">${estimatedCost.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Configuration */}
          <div className="space-y-6">
            {/* Map Style */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Wand2 className="w-5 h-5" />
                Map Style
              </h2>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setMapStyle('top-down')}
                  className={`p-4 rounded-lg border-2 transition ${
                    mapStyle === 'top-down'
                      ? 'border-blue-500 bg-blue-600/20'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="text-center">
                    <Map className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-semibold">Top-Down</p>
                    <p className="text-xs text-gray-400">Battle Map</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setMapStyle('scenic')}
                  className={`p-4 rounded-lg border-2 transition ${
                    mapStyle === 'scenic'
                      ? 'border-blue-500 bg-blue-600/20'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="text-center">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-semibold">Scenic</p>
                    <p className="text-xs text-gray-400">Landscape</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setMapStyle('isometric')}
                  className={`p-4 rounded-lg border-2 transition ${
                    mapStyle === 'isometric'
                      ? 'border-blue-500 bg-blue-600/20'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="text-center">
                    <Sparkles className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-semibold">Isometric</p>
                    <p className="text-xs text-gray-400">3D View</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Environment Templates */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Quick Templates</h2>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                {environments.map((env) => (
                  <button
                    key={env.name}
                    onClick={() => selectEnvironment(env)}
                    className={`p-3 rounded-lg text-left transition ${
                      selectedEnvironment?.name === env.name
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <p className="font-semibold">{env.name}</p>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Environment Type
                </label>
                <input
                  type="text"
                  value={customEnvironment}
                  onChange={(e) => setCustomEnvironment(e.target.value)}
                  placeholder="dungeon, forest, tavern, castle..."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                />
              </div>
            </div>

            {/* Mood & Features */}
            {selectedEnvironment && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-semibold mb-4">Atmosphere & Features</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Mood</label>
                    <select
                      value={mood}
                      onChange={(e) => setMood(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                    >
                      <option value="">Select mood...</option>
                      {selectedEnvironment.moods.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Features (select multiple)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedEnvironment.features.map((feature) => (
                        <button
                          key={feature}
                          onClick={() => toggleFeature(feature)}
                          className={`px-3 py-1 rounded-full text-sm transition ${
                            selectedFeatures.includes(feature)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 hover:bg-gray-600'
                          }`}
                        >
                          {feature}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Details */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Additional Details</h2>
              
              <textarea
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                placeholder="Add any extra details (lighting, specific objects, story context...)"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                rows={3}
              />

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Size</label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                  >
                    <option value="1024x1024">Square (1024x1024)</option>
                    <option value="1792x1024">Wide (1792x1024)</option>
                    <option value="1024x1792">Tall (1024x1792)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Quality</label>
                  <select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value as 'standard' | 'hd')}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                  >
                    <option value="standard">Standard</option>
                    <option value="hd">HD (Higher Cost)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateMap}
              disabled={generating || !customEnvironment.trim()}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-lg flex items-center justify-center gap-2 transition"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Generate Map
                </>
              )}
            </button>

            {error && (
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
                <p className="text-red-200">{error}</p>
              </div>
            )}
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 sticky top-4">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Preview
              </h2>

              {generatedImage ? (
                <div className="space-y-4">
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                    <img
                      src={generatedImage.url}
                      alt="Generated map"
                      className="w-full h-auto"
                    />
                    {generatedImage.is_mock && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-600 rounded text-xs font-semibold">
                        MOCK MODE
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Cost:</span>
                      <span className="font-semibold">${generatedImage.cost.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Size:</span>
                      <span className="font-semibold">{generatedImage.size}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Quality:</span>
                      <span className="font-semibold">{generatedImage.quality}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-900 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">AI-Enhanced Prompt:</p>
                    <p className="text-sm">{generatedImage.revised_prompt}</p>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={generatedImage.url}
                      download
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center justify-center gap-2 transition"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                    <button
                      onClick={generateMap}
                      className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center gap-2 transition"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Regenerate
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">
                    Configure your map settings and click Generate to create your map
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
