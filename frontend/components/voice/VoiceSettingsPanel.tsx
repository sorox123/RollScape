'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Volume2, Globe, ToggleLeft, ToggleRight, Keyboard as KeyboardIcon } from 'lucide-react';

interface VoiceSettings {
  enabled: boolean;
  language: string;
  continuousMode: boolean;
  pushToTalkKey: string;
  autoSubmit: boolean;
}

interface VoiceSettingsPanelProps {
  onSettingsChange?: (settings: VoiceSettings) => void;
  initialSettings?: Partial<VoiceSettings>;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'es-ES', name: 'Spanish (Spain)' },
  { code: 'es-MX', name: 'Spanish (Mexico)' },
  { code: 'fr-FR', name: 'French' },
  { code: 'de-DE', name: 'German' },
  { code: 'it-IT', name: 'Italian' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'ru-RU', name: 'Russian' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'ko-KR', name: 'Korean' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'ar-SA', name: 'Arabic' },
  { code: 'hi-IN', name: 'Hindi' },
];

const PUSH_TO_TALK_KEYS = [
  { code: ' ', name: 'Space' },
  { code: 'Control', name: 'Ctrl' },
  { code: 'Alt', name: 'Alt' },
  { code: 'Shift', name: 'Shift' },
  { code: 'Tab', name: 'Tab' },
];

export default function VoiceSettingsPanel({
  onSettingsChange,
  initialSettings = {},
}: VoiceSettingsPanelProps) {
  const [settings, setSettings] = useState<VoiceSettings>({
    enabled: initialSettings.enabled ?? true,
    language: initialSettings.language ?? 'en-US',
    continuousMode: initialSettings.continuousMode ?? false,
    pushToTalkKey: initialSettings.pushToTalkKey ?? ' ',
    autoSubmit: initialSettings.autoSubmit ?? false,
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('voiceSettings', JSON.stringify(settings));
    onSettingsChange?.(settings);
  }, [settings, onSettingsChange]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('voiceSettings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (err) {
        console.error('Error loading voice settings:', err);
      }
    }
  }, []);

  const handleToggle = (key: keyof VoiceSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (key: keyof VoiceSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-700">
        <Settings className="w-6 h-6 text-blue-500" />
        <h2 className="text-xl font-semibold text-white">Voice Input Settings</h2>
      </div>

      {/* Enable Voice Input */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Volume2 className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-white font-medium">Enable Voice Input</p>
            <p className="text-sm text-gray-400">Allow microphone access for voice commands</p>
          </div>
        </div>
        <button
          onClick={() => handleToggle('enabled')}
          className={`
            relative w-14 h-7 rounded-full transition-colors
            ${settings.enabled ? 'bg-blue-600' : 'bg-gray-700'}
          `}
        >
          <div
            className={`
              absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform
              ${settings.enabled ? 'translate-x-7' : 'translate-x-0'}
            `}
          />
        </button>
      </div>

      {/* Language Selection */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-gray-400" />
          <label className="text-white font-medium">Recognition Language</label>
        </div>
        <select
          value={settings.language}
          onChange={(e) => handleChange('language', e.target.value)}
          disabled={!settings.enabled}
          className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500">
          Select the language for speech recognition
        </p>
      </div>

      {/* Continuous Mode */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {settings.continuousMode ? (
            <ToggleRight className="w-5 h-5 text-green-500" />
          ) : (
            <ToggleLeft className="w-5 h-5 text-gray-400" />
          )}
          <div>
            <p className="text-white font-medium">Continuous Recording</p>
            <p className="text-sm text-gray-400">
              {settings.continuousMode
                ? 'Keeps listening until you stop manually'
                : 'Stops automatically after speech ends'}
            </p>
          </div>
        </div>
        <button
          onClick={() => handleToggle('continuousMode')}
          disabled={!settings.enabled}
          className={`
            relative w-14 h-7 rounded-full transition-colors
            ${settings.continuousMode ? 'bg-green-600' : 'bg-gray-700'}
            ${!settings.enabled && 'opacity-50 cursor-not-allowed'}
          `}
        >
          <div
            className={`
              absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform
              ${settings.continuousMode ? 'translate-x-7' : 'translate-x-0'}
            `}
          />
        </button>
      </div>

      {/* Push to Talk Key */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <KeyboardIcon className="w-5 h-5 text-gray-400" />
          <label className="text-white font-medium">Push-to-Talk Key</label>
        </div>
        <select
          value={settings.pushToTalkKey}
          onChange={(e) => handleChange('pushToTalkKey', e.target.value)}
          disabled={!settings.enabled}
          className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {PUSH_TO_TALK_KEYS.map((key) => (
            <option key={key.code} value={key.code}>
              {key.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500">
          Hold this key to start recording (when not in continuous mode)
        </p>
      </div>

      {/* Auto Submit */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-medium">Auto-Submit</p>
          <p className="text-sm text-gray-400">
            Automatically send message after speech ends
          </p>
        </div>
        <button
          onClick={() => handleToggle('autoSubmit')}
          disabled={!settings.enabled}
          className={`
            relative w-14 h-7 rounded-full transition-colors
            ${settings.autoSubmit ? 'bg-blue-600' : 'bg-gray-700'}
            ${!settings.enabled && 'opacity-50 cursor-not-allowed'}
          `}
        >
          <div
            className={`
              absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform
              ${settings.autoSubmit ? 'translate-x-7' : 'translate-x-0'}
            `}
          />
        </button>
      </div>

      {/* Browser Compatibility Info */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-sm text-blue-400 font-medium mb-1">Browser Compatibility</p>
        <p className="text-xs text-gray-400">
          Voice input works best in Chrome, Edge, and Safari. Firefox has limited support.
          Make sure to allow microphone permissions when prompted.
        </p>
      </div>
    </div>
  );
}
