'use client';

import React, { useState } from 'react';
import { Mic, MessageSquare, Settings as SettingsIcon } from 'lucide-react';
import VoiceInput from '@/components/voice/VoiceInput';
import ChatWithVoice from '@/components/voice/ChatWithVoice';
import VoiceSettingsPanel from '@/components/voice/VoiceSettingsPanel';

export default function VoiceToTextPage() {
  const [activeTab, setActiveTab] = useState<'standalone' | 'chat' | 'settings'>('standalone');
  const [messages, setMessages] = useState<Array<{ text: string; isVoice: boolean; timestamp: Date }>>([]);
  const [voiceSettings, setVoiceSettings] = useState({
    enabled: true,
    language: 'en-US',
    continuousMode: false,
    pushToTalkKey: ' ',
    autoSubmit: false,
  });

  const handleTranscriptComplete = (transcript: string) => {
    console.log('Transcript complete:', transcript);
    alert(`Transcribed: "${transcript}"`);
  };

  const handleSendMessage = (message: string, isVoice: boolean) => {
    setMessages((prev) => [
      ...prev,
      { text: message, isVoice, timestamp: new Date() },
    ]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Mic className="w-10 h-10 text-blue-500" />
            <h1 className="text-4xl font-bold">Voice-to-Text Integration</h1>
          </div>
          <p className="text-gray-400">
            Speak naturally to interact with your game using the Web Speech API
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('standalone')}
            className={`
              px-6 py-3 font-medium transition-colors relative
              ${activeTab === 'standalone' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-300'}
            `}
          >
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Standalone Voice Input
            </div>
            {activeTab === 'standalone' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`
              px-6 py-3 font-medium transition-colors relative
              ${activeTab === 'chat' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-300'}
            `}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat with Voice
            </div>
            {activeTab === 'chat' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`
              px-6 py-3 font-medium transition-colors relative
              ${activeTab === 'settings' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-300'}
            `}
          >
            <div className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4" />
              Settings
            </div>
            {activeTab === 'settings' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'standalone' && (
            <div className="space-y-6">
              <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                <h2 className="text-xl font-semibold mb-2">Standalone Voice Input</h2>
                <p className="text-gray-400 mb-6">
                  Click the microphone button or press Space to start recording. Your speech will be
                  transcribed in real-time using the Web Speech API.
                </p>
                <VoiceInput
                  onTranscriptComplete={handleTranscriptComplete}
                  language={voiceSettings.language}
                  continuous={voiceSettings.continuousMode}
                  showVisualFeedback={true}
                />
              </div>

              {/* Features List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <h3 className="font-semibold mb-2">🎤 Real-time Transcription</h3>
                  <p className="text-sm text-gray-400">
                    See your words appear as you speak with interim results for immediate feedback.
                  </p>
                </div>
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <h3 className="font-semibold mb-2">🎯 Confidence Scoring</h3>
                  <p className="text-sm text-gray-400">
                    Visual indicator shows how confident the AI is about the transcription accuracy.
                  </p>
                </div>
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <h3 className="font-semibold mb-2">⌨️ Keyboard Shortcuts</h3>
                  <p className="text-sm text-gray-400">
                    Space to record, Enter to submit, Escape to cancel. Full keyboard navigation support.
                  </p>
                </div>
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <h3 className="font-semibold mb-2">🌐 Multi-language</h3>
                  <p className="text-sm text-gray-400">
                    Support for 14+ languages including English, Spanish, French, German, and more.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="space-y-6">
              <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                <h2 className="text-xl font-semibold mb-2">Chat with Voice Integration</h2>
                <p className="text-gray-400 mb-6">
                  Seamlessly switch between typing and voice input. Perfect for in-game chat and
                  role-playing scenarios.
                </p>
                <ChatWithVoice
                  onSendMessage={handleSendMessage}
                  enableVoice={voiceSettings.enabled}
                />
              </div>

              {/* Message History */}
              {messages.length > 0 && (
                <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                  <h3 className="text-lg font-semibold mb-4">Message History</h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-900 rounded-lg border border-gray-700"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {msg.isVoice ? (
                              <Mic className="w-4 h-4 text-blue-500" />
                            ) : (
                              <MessageSquare className="w-4 h-4 text-gray-500" />
                            )}
                            <span className="text-xs text-gray-500">
                              {msg.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400">
                            {msg.isVoice ? 'Voice' : 'Text'}
                          </span>
                        </div>
                        <p className="text-gray-300">{msg.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <VoiceSettingsPanel
                onSettingsChange={setVoiceSettings}
                initialSettings={voiceSettings}
              />
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 max-w-4xl mx-auto p-6 bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-3">About Voice-to-Text</h3>
          <div className="space-y-2 text-gray-400 text-sm">
            <p>
              <strong className="text-white">Web Speech API:</strong> Uses browser's native speech
              recognition for accurate, real-time transcription without external services.
            </p>
            <p>
              <strong className="text-white">Privacy:</strong> All speech processing happens locally
              in your browser. No audio is sent to external servers.
            </p>
            <p>
              <strong className="text-white">Browser Support:</strong> Works best in Chrome and Edge.
              Safari has good support. Firefox support is limited.
            </p>
            <p>
              <strong className="text-white">Use Cases:</strong> Perfect for D&D sessions, allowing
              players to speak their actions and dialogue naturally without typing.
            </p>
            <p>
              <strong className="text-white">Accessibility:</strong> Helps players with mobility
              challenges or those who prefer voice interaction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
