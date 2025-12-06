'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  User, Wand2, ArrowLeft, Info, Download, 
  RefreshCw, Sparkles, Image as ImageIcon
} from 'lucide-react'
import { useToast } from '@/components/ui/ToastContainer'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Button from '@/components/ui/Button'
import TextArea from '@/components/ui/TextArea'
import { apiAIImages, apiCharacters } from '@/lib/api'

interface CharacterStyle {
  name: string
  description: string
  keywords: string[]
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
  character_id?: string
}

interface Character {
  id: string
  name: string
  race: string
  class: string
  level: number
  appearance?: string
  background?: string
  alignment?: string
  personality_traits?: string
}

export default function CharacterArtPage() {
  const router = useRouter()
  const toast = useToast()
  const searchParams = useSearchParams()
  const characterIdFromUrl = searchParams?.get('characterId') || null

  const [styles, setStyles] = useState<CharacterStyle[]>([])
  const [selectedStyle, setSelectedStyle] = useState<CharacterStyle | null>(null)
  
  // Character selection
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  
  // Form state
  const [characterName, setCharacterName] = useState('')
  const [race, setRace] = useState('')
  const [charClass, setCharClass] = useState('')
  const [appearance, setAppearance] = useState('')
  const [background, setBackground] = useState('')
  const [alignment, setAlignment] = useState('')
  const [personality, setPersonality] = useState('')
  const [additionalDetails, setAdditionalDetails] = useState('')
  const [size, setSize] = useState('1024x1024')
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard')
  
  // Generation state
  const [generating, setGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewPrompt, setPreviewPrompt] = useState('')

  useEffect(() => {
    loadStyles()
    loadCharacters()
  }, [])

  useEffect(() => {
    if (characterIdFromUrl && characters.length > 0) {
      const char = characters.find(c => c.id === characterIdFromUrl)
      if (char) selectCharacter(char)
    }
  }, [characterIdFromUrl, characters])

  async function loadStyles() {
    try {
      const response = await axios.get(`${API_BASE}/api/ai/templates/character-styles`)
      setStyles(response.data.styles)
    } catch (err) {
      console.error('Failed to load styles:', err)
    }
  }

  async function loadCharacters() {
    try {
      const campaignId = 'demo-campaign-id' // TODO: Get from context
      const response = await apiCharacters.getCampaignCharacters(campaignId, false)
      
      if (response.error) {
        toast.warning('No Characters', 'Create characters in the Characters page first')
        setCharacters([])
      } else {
        setCharacters(response.data || [])
      }
    } catch (err) {
      console.error('Failed to load characters:', err)
      toast.error('Failed to Load', 'Could not load your characters')
      setCharacters([])
    }
  }

  function selectCharacter(char: Character) {
    setSelectedCharacter(char)
    setCharacterName(char.name)
    setRace(char.race)
    setCharClass(char.class)
    setAppearance(char.appearance || '')
    setBackground(char.background || '')
    setAlignment(char.alignment || '')
    setPersonality(char.personality_traits || '')
  }

  function buildPromptPreview() {
    let prompt = `${race} ${charClass} named ${characterName}`
    
    if (appearance) prompt += `, ${appearance}`
    if (alignment) prompt += `, ${alignment} alignment`
    if (background) {
      const bgSummary = background.length > 200 ? background.substring(0, 200) + '...' : background
      prompt += `, ${bgSummary}`
    }
    if (additionalDetails) prompt += `, ${additionalDetails}`
    if (selectedStyle) prompt += `, ${selectedStyle.keywords.join(', ')}`
    
    setPreviewPrompt(prompt)
    setShowPreview(true)
  }

  async function generateArt() {
    if (!characterName.trim() || !race.trim() || !charClass.trim()) {
      toast.error('Missing Info', 'Please fill in character name, race, and class')
      return
    }

    setGenerating(true)
    setError(null)

    try {
      const response = await apiAIImages.generateCharacterArt({
        character_id: selectedCharacter?.id || `char-${Date.now()}`,
        character_name: characterName,
        race,
        char_class: charClass,
        appearance: appearance || undefined,
        background: background || undefined,
        alignment: alignment || undefined,
        personality: personality || undefined,
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
        toast.success('Art Generated!', `${characterName} portrait created successfully`)
      }
    } catch (err: any) {
      console.error('Failed to generate character art:', err)
      const errorMsg = 'Failed to generate character art'
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
                  <User className="w-8 h-8" />
                  AI Character Art Generator
                </h1>
                <p className="text-gray-400 mt-1">
                  Generate character portraits using your character sheet
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
            {/* Character Selection */}
            {characters.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Select Character
                </h2>
                
                <div className="space-y-2">
                  {characters.map((char) => (
                    <button
                      key={char.id}
                      onClick={() => selectCharacter(char)}
                      className={`w-full p-4 rounded-lg text-left transition ${
                        selectedCharacter?.id === char.id
                          ? 'bg-blue-600 border-2 border-blue-400'
                          : 'bg-gray-700 hover:bg-gray-600 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-lg">{char.name}</p>
                          <p className="text-sm text-gray-300">
                            Level {char.level} {char.race} {char.class}
                          </p>
                        </div>
                        {selectedCharacter?.id === char.id && (
                          <Sparkles className="w-5 h-5 text-blue-300" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Basic Info */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Character Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Character Name *</label>
                  <input
                    type="text"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    placeholder="Thorin Ironforge"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Race *</label>
                    <input
                      type="text"
                      value={race}
                      onChange={(e) => setRace(e.target.value)}
                      placeholder="Elf, Dwarf, Human..."
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Class *</label>
                    <input
                      type="text"
                      value={charClass}
                      onChange={(e) => setCharClass(e.target.value)}
                      placeholder="Wizard, Fighter, Rogue..."
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Alignment</label>
                  <select
                    value={alignment}
                    onChange={(e) => setAlignment(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                  >
                    <option value="">Select alignment...</option>
                    <option value="Lawful Good">Lawful Good</option>
                    <option value="Neutral Good">Neutral Good</option>
                    <option value="Chaotic Good">Chaotic Good</option>
                    <option value="Lawful Neutral">Lawful Neutral</option>
                    <option value="True Neutral">True Neutral</option>
                    <option value="Chaotic Neutral">Chaotic Neutral</option>
                    <option value="Lawful Evil">Lawful Evil</option>
                    <option value="Neutral Evil">Neutral Evil</option>
                    <option value="Chaotic Evil">Chaotic Evil</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Art Style */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Art Style
              </h2>
              
              <div className="space-y-2">
                {styles.map((style) => (
                  <button
                    key={style.name}
                    onClick={() => setSelectedStyle(style)}
                    className={`w-full p-4 rounded-lg text-left transition ${
                      selectedStyle?.name === style.name
                        ? 'bg-blue-600 border-2 border-blue-400'
                        : 'bg-gray-700 hover:bg-gray-600 border-2 border-transparent'
                    }`}
                  >
                    <p className="font-semibold">{style.name}</p>
                    <p className="text-sm text-gray-300">{style.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Physical Appearance */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Physical Appearance</h2>
              
              <textarea
                value={appearance}
                onChange={(e) => setAppearance(e.target.value)}
                placeholder="Describe physical features: hair color, eye color, build, scars, clothing, armor, weapons..."
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                rows={3}
              />
            </div>

            {/* Background & Personality */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Background & Personality</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Background Story</label>
                  <textarea
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    placeholder="Brief backstory (the AI will use key details to inform the art style)"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Personality Traits</label>
                  <input
                    type="text"
                    value={personality}
                    onChange={(e) => setPersonality(e.target.value)}
                    placeholder="Brave, cunning, cheerful, brooding..."
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Additional Settings */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Additional Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Extra Details</label>
                  <textarea
                    value={additionalDetails}
                    onChange={(e) => setAdditionalDetails(e.target.value)}
                    placeholder="Any other details (pose, lighting, mood, specific items...)"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Size</label>
                    <select
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                    >
                      <option value="1024x1024">Square (1024x1024)</option>
                      <option value="1024x1792">Portrait (1024x1792)</option>
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
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={buildPromptPreview}
                className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
              >
                <Info className="w-5 h-5" />
                Preview Prompt
              </button>

              <button
                onClick={generateArt}
                disabled={generating || !characterName.trim() || !race.trim() || !charClass.trim()}
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
                    Generate Character Art
                  </>
                )}
              </button>
            </div>

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
                Generated Art
              </h2>

              {generatedImage ? (
                <div className="space-y-4">
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                    <img
                      src={generatedImage.url}
                      alt={`${characterName} portrait`}
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
                      <span className="text-sm text-gray-400">Character:</span>
                      <span className="font-semibold">{characterName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Cost:</span>
                      <span className="font-semibold">${generatedImage.cost.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Size:</span>
                      <span className="font-semibold">{generatedImage.size}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-900 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">AI-Enhanced Prompt:</p>
                    <p className="text-sm">{generatedImage.revised_prompt}</p>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={generatedImage.url}
                      download={`${characterName.replace(/\s+/g, '_')}.png`}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center justify-center gap-2 transition"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                    <button
                      onClick={generateArt}
                      className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center gap-2 transition"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Regenerate
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <User className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">
                    Fill in character details and click Generate to create character art
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Prompt Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full border border-gray-700">
            <h2 className="text-2xl font-bold mb-4">Prompt Preview</h2>
            <div className="bg-gray-900 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{previewPrompt}</p>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              The AI will enhance this prompt with style-specific details and fantasy art guidance.
            </p>
            <button
              onClick={() => setShowPreview(false)}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
