'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText, Upload, ArrowLeft, CheckCircle, AlertCircle,
  Download, User, Heart, Shield, Brain, Zap
} from 'lucide-react'
import { useToast } from '@/components/ui/ToastContainer'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Button from '@/components/ui/Button'
import { apiClient } from '@/lib/api'

interface CharacterData {
  name?: string
  race?: string
  char_class?: string
  level?: number
  background?: string
  alignment?: string
  strength?: number
  dexterity?: number
  constitution?: number
  intelligence?: number
  wisdom?: number
  charisma?: number
  armor_class?: number
  max_hp?: number
  current_hp?: number
  speed?: number
  proficiency_bonus?: number
  proficiencies?: string
  languages?: string
  features?: string
  traits?: string
  equipment?: string
  confidence: number
}

export default function PDFImportPage() {
  const router = useRouter()
  const toast = useToast()
  
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [characterData, setCharacterData] = useState<CharacterData | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    
    if (!selectedFile) return
    
    if (!selectedFile.name.endsWith('.pdf')) {
      toast.error('Invalid File', 'Please select a PDF file')
      return
    }
    
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File Too Large', 'Maximum file size is 10MB')
      return
    }
    
    setFile(selectedFile)
    setCharacterData(null)
    setError(null)
  }

  async function uploadPDF() {
    if (!file) return
    
    setUploading(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await apiClient.post<CharacterData>(
        '/api/pdf/import-character',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      
      setCharacterData(response.data)
      
      const confidence = response.data.confidence * 100
      if (confidence >= 70) {
        toast.success('Import Successful!', `Extracted ${confidence.toFixed(0)}% of character data`)
      } else if (confidence >= 40) {
        toast.warning('Partial Success', `Extracted ${confidence.toFixed(0)}% of character data`)
      } else {
        toast.info('Low Confidence', `Only extracted ${confidence.toFixed(0)}% of character data`)
      }
    } catch (err: any) {
      console.error('Failed to import PDF:', err)
      const errorDetail = err.response?.data?.detail
      
      if (typeof errorDetail === 'object' && errorDetail.error === 'low_confidence') {
        setError(errorDetail.message)
        toast.warning('Low Confidence', errorDetail.message)
      } else {
        const errorMsg = typeof errorDetail === 'string' ? errorDetail : 'Failed to import PDF'
        setError(errorMsg)
        toast.error('Import Failed', errorMsg)
      }
    } finally {
      setUploading(false)
    }
  }

  function createCharacter() {
    if (!characterData) return
    
    // Navigate to character creation with pre-filled data
    const params = new URLSearchParams()
    if (characterData.name) params.append('name', characterData.name)
    if (characterData.race) params.append('race', characterData.race)
    if (characterData.char_class) params.append('class', characterData.char_class)
    if (characterData.level) params.append('level', characterData.level.toString())
    
    router.push(`/characters/new?${params.toString()}`)
    toast.success('Data Ready', 'Character form pre-filled with imported data')
  }

  const confidencePercent = characterData ? characterData.confidence * 100 : 0
  const confidenceColor = confidencePercent >= 70 ? 'text-green-400' : confidencePercent >= 40 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/characters')}
                className="p-2 hover:bg-gray-700 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <FileText className="w-8 h-8" />
                  Import Character from PDF
                </h1>
                <p className="text-gray-400 mt-1">
                  Upload a D&D 5e character sheet PDF to automatically extract character data
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload */}
          <div className="space-y-6">
            {/* Upload Area */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload PDF
              </h2>

              <div className="space-y-4">
                <label className="block">
                  <div className="relative border-2 border-dashed border-gray-600 rounded-lg p-8 hover:border-blue-500 transition cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    
                    <div className="text-center">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                      
                      {file ? (
                        <>
                          <p className="text-lg font-semibold text-white mb-1">{file.name}</p>
                          <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                        </>
                      ) : (
                        <>
                          <p className="text-lg font-semibold text-white mb-1">
                            Drop PDF here or click to browse
                          </p>
                          <p className="text-sm text-gray-400">Maximum file size: 10MB</p>
                        </>
                      )}
                    </div>
                  </div>
                </label>

                <Button
                  onClick={uploadPDF}
                  disabled={!file || uploading}
                  loading={uploading}
                  variant="primary"
                  size="lg"
                  fullWidth
                  icon={<Upload className="w-5 h-5" />}
                >
                  {uploading ? 'Extracting Data...' : 'Extract Character Data'}
                </Button>
              </div>

              {error && (
                <div className="mt-4 bg-red-900/50 border border-red-700 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-200 text-sm">{error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Supported Formats */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Supported Formats</h2>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">D&D 5e Official Character Sheet</p>
                    <p className="text-sm text-gray-400">Wizards of the Coast PDF</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Form-Fillable PDFs</p>
                    <p className="text-sm text-gray-400">Common D&D character sheets</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400 mb-2"><strong>Tips:</strong></p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Ensure PDF text is selectable (not scanned images)</li>
                  <li>• Use standard field labels for best results</li>
                  <li>• Higher quality PDFs yield better extraction</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Extracted Data
              </h2>

              {characterData ? (
                <div className="space-y-6">
                  {/* Confidence Score */}
                  <div className="bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Extraction Confidence</span>
                      <span className={`text-2xl font-bold ${confidenceColor}`}>
                        {confidencePercent.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          confidencePercent >= 70
                            ? 'bg-green-500'
                            : confidencePercent >= 40
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${confidencePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div>
                    <h3 className="font-semibold mb-3">Basic Information</h3>
                    <div className="space-y-2">
                      {characterData.name && (
                        <DataField label="Name" value={characterData.name} icon={<User className="w-4 h-4" />} />
                      )}
                      {characterData.race && (
                        <DataField label="Race" value={characterData.race} />
                      )}
                      {characterData.char_class && (
                        <DataField label="Class" value={characterData.char_class} />
                      )}
                      {characterData.level && (
                        <DataField label="Level" value={characterData.level.toString()} />
                      )}
                      {characterData.background && (
                        <DataField label="Background" value={characterData.background} />
                      )}
                      {characterData.alignment && (
                        <DataField label="Alignment" value={characterData.alignment} />
                      )}
                    </div>
                  </div>

                  {/* Ability Scores */}
                  {(characterData.strength || characterData.dexterity || characterData.constitution ||
                    characterData.intelligence || characterData.wisdom || characterData.charisma) && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        Ability Scores
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {characterData.strength && <AbilityScore label="STR" value={characterData.strength} />}
                        {characterData.dexterity && <AbilityScore label="DEX" value={characterData.dexterity} />}
                        {characterData.constitution && <AbilityScore label="CON" value={characterData.constitution} />}
                        {characterData.intelligence && <AbilityScore label="INT" value={characterData.intelligence} />}
                        {characterData.wisdom && <AbilityScore label="WIS" value={characterData.wisdom} />}
                        {characterData.charisma && <AbilityScore label="CHA" value={characterData.charisma} />}
                      </div>
                    </div>
                  )}

                  {/* Combat Stats */}
                  {(characterData.armor_class || characterData.max_hp || characterData.speed) && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Combat Stats
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {characterData.armor_class && (
                          <div className="bg-gray-900 rounded-lg p-3 text-center">
                            <Shield className="w-4 h-4 mx-auto mb-1 text-blue-400" />
                            <div className="text-2xl font-bold">{characterData.armor_class}</div>
                            <div className="text-xs text-gray-400">AC</div>
                          </div>
                        )}
                        {characterData.max_hp && (
                          <div className="bg-gray-900 rounded-lg p-3 text-center">
                            <Heart className="w-4 h-4 mx-auto mb-1 text-red-400" />
                            <div className="text-2xl font-bold">{characterData.max_hp}</div>
                            <div className="text-xs text-gray-400">HP</div>
                          </div>
                        )}
                        {characterData.speed && (
                          <div className="bg-gray-900 rounded-lg p-3 text-center">
                            <Zap className="w-4 h-4 mx-auto mb-1 text-yellow-400" />
                            <div className="text-2xl font-bold">{characterData.speed}</div>
                            <div className="text-xs text-gray-400">Speed</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    onClick={createCharacter}
                    variant="success"
                    size="lg"
                    fullWidth
                    icon={<CheckCircle className="w-5 h-5" />}
                  >
                    Create Character with This Data
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">
                    Upload a PDF to see extracted character data
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

function DataField({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-gray-900 rounded">
      <span className="text-sm text-gray-400 flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

function AbilityScore({ label, value }: { label: string; value: number }) {
  const modifier = Math.floor((value - 10) / 2)
  const modifierStr = modifier >= 0 ? `+${modifier}` : modifier.toString()
  
  return (
    <div className="bg-gray-900 rounded-lg p-3 text-center">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-blue-400">{modifierStr}</div>
    </div>
  )
}
