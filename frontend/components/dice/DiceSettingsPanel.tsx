"use client";

import React from 'react';
import { Settings, Volume2, VolumeX, Zap, Wind, Camera, Sparkles } from 'lucide-react';

interface DiceSettingsPanelProps {
  settings: DiceSettings;
  onSettingsChange: (settings: DiceSettings) => void;
  onClose: () => void;
}

export interface DiceSettings {
  use3DOverlay: boolean;
  animateRolls: boolean;   // Toggle between animated physics and instant results
  throwForce: number;      // 0.5 to 2.0
  spinIntensity: number;   // 0.5 to 2.0
  cameraAngle: 'top' | 'side' | 'dynamic';
  showTrails: boolean;
  soundEnabled: boolean;
  soundVolume: number;     // 0.0 to 1.0
  hapticEnabled: boolean;
  particleEffects: boolean;
  shadowQuality: 'low' | 'medium' | 'high';
  antialiasing: boolean;
}

export const DEFAULT_DICE_SETTINGS: DiceSettings = {
  use3DOverlay: true,
  animateRolls: true,
  throwForce: 1.0,
  spinIntensity: 1.0,
  cameraAngle: 'top',
  showTrails: false,
  soundEnabled: true,
  soundVolume: 0.7,
  hapticEnabled: true,
  particleEffects: true,
  shadowQuality: 'medium',
  antialiasing: true,
};

export default function DiceSettingsPanel({ settings, onSettingsChange, onClose }: DiceSettingsPanelProps) {
  const updateSetting = <K extends keyof DiceSettings>(key: K, value: DiceSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full border border-purple-500 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 to-pink-900 p-6 border-b border-purple-500">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Dice Settings
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-red-400 transition-colors text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Settings Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          
          {/* 3D Overlay Toggle */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Enable 3D Dice Overlay
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  Show realistic 3D dice animation when rolling
                </p>
              </div>
              <button
                onClick={() => updateSetting('use3DOverlay', !settings.use3DOverlay)}
                className={`
                  relative inline-flex h-8 w-14 items-center rounded-full transition-colors
                  ${settings.use3DOverlay ? 'bg-purple-600' : 'bg-gray-600'}
                `}
              >
                <span
                  className={`
                    inline-block h-6 w-6 transform rounded-full bg-white transition-transform
                    ${settings.use3DOverlay ? 'translate-x-7' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
          </div>

          {/* Animate Rolls Toggle */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Animate Dice Rolls
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  Enable physics animation (disable for instant results)
                </p>
              </div>
              <button
                onClick={() => updateSetting('animateRolls', !settings.animateRolls)}
                className={`
                  relative inline-flex h-8 w-14 items-center rounded-full transition-colors
                  ${settings.animateRolls ? 'bg-purple-600' : 'bg-gray-600'}
                `}
              >
                <span
                  className={`
                    inline-block h-6 w-6 transform rounded-full bg-white transition-transform
                    ${settings.animateRolls ? 'translate-x-7' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
          </div>

          {/* Physics Settings */}
          <div className="bg-gray-800 rounded-lg p-4 space-y-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Physics Settings
            </h3>

            {/* Throw Force */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-gray-300 text-sm">Throw Force</label>
                <span className="text-purple-400 font-mono">{settings.throwForce.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.throwForce}
                onChange={(e) => updateSetting('throwForce', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Gentle</span>
                <span>Aggressive</span>
              </div>
            </div>

            {/* Spin Intensity */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-gray-300 text-sm flex items-center gap-1">
                  <Wind className="w-4 h-4" />
                  Spin Intensity
                </label>
                <span className="text-purple-400 font-mono">{settings.spinIntensity.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.spinIntensity}
                onChange={(e) => updateSetting('spinIntensity', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Slow</span>
                <span>Fast</span>
              </div>
            </div>
          </div>

          {/* Camera Settings */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-white font-semibold flex items-center gap-2 mb-3">
              <Camera className="w-5 h-5" />
              Camera Angle
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {(['top', 'side', 'dynamic'] as const).map((angle) => (
                <button
                  key={angle}
                  onClick={() => updateSetting('cameraAngle', angle)}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-all
                    ${settings.cameraAngle === angle
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }
                  `}
                >
                  {angle.charAt(0).toUpperCase() + angle.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Effects */}
          <div className="bg-gray-800 rounded-lg p-4 space-y-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Visual Effects
            </h3>

            <ToggleSetting
              label="Motion Trails"
              description="Show motion blur trails behind dice"
              checked={settings.showTrails}
              onChange={(checked) => updateSetting('showTrails', checked)}
            />

            <ToggleSetting
              label="Particle Effects"
              description="Show sparkles and particles on critical hits"
              checked={settings.particleEffects}
              onChange={(checked) => updateSetting('particleEffects', checked)}
            />

            <ToggleSetting
              label="Antialiasing"
              description="Smooth edges (may impact performance)"
              checked={settings.antialiasing}
              onChange={(checked) => updateSetting('antialiasing', checked)}
            />

            {/* Shadow Quality */}
            <div>
              <label className="text-gray-300 text-sm block mb-2">Shadow Quality</label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map((quality) => (
                  <button
                    key={quality}
                    onClick={() => updateSetting('shadowQuality', quality)}
                    className={`
                      px-3 py-1 rounded text-sm font-medium transition-all
                      ${settings.shadowQuality === quality
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }
                    `}
                  >
                    {quality.charAt(0).toUpperCase() + quality.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Audio Settings */}
          <div className="bg-gray-800 rounded-lg p-4 space-y-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              Sound Effects
            </h3>

            <ToggleSetting
              label="Enable Sound"
              description="Play dice rolling sound effects"
              checked={settings.soundEnabled}
              onChange={(checked) => updateSetting('soundEnabled', checked)}
            />

            {settings.soundEnabled && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-gray-300 text-sm">Volume</label>
                  <span className="text-purple-400 font-mono">{Math.round(settings.soundVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.soundVolume}
                  onChange={(e) => updateSetting('soundVolume', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>
            )}
          </div>

          {/* Haptic Feedback (Mobile) */}
          {typeof navigator !== 'undefined' && 'vibrate' in navigator && (
            <div className="bg-gray-800 rounded-lg p-4">
              <ToggleSetting
                label="Haptic Feedback"
                description="Vibrate on roll (mobile devices)"
                checked={settings.hapticEnabled}
                onChange={(checked) => updateSetting('hapticEnabled', checked)}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-800 p-4 border-t border-gray-700 flex justify-between items-center">
          <button
            onClick={() => onSettingsChange(DEFAULT_DICE_SETTINGS)}
            className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
          >
            Reset to Defaults
          </button>
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

// Helper component for toggle settings
function ToggleSetting({ 
  label, 
  description, 
  checked, 
  onChange 
}: { 
  label: string; 
  description: string; 
  checked: boolean; 
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="text-gray-300 text-sm font-medium">{label}</div>
        <div className="text-gray-500 text-xs mt-0.5">{description}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0
          ${checked ? 'bg-purple-600' : 'bg-gray-600'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  );
}
