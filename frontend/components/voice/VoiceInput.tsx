'use client';

import React, { useEffect, useCallback } from 'react';
import { Mic, MicOff, X, Send, AlertCircle } from 'lucide-react';
import { useVoiceRecording } from '@/lib/hooks/useVoiceRecording';

interface VoiceInputProps {
  onTranscriptComplete?: (transcript: string) => void;
  onCancel?: () => void;
  language?: string;
  continuous?: boolean;
  placeholder?: string;
  showVisualFeedback?: boolean;
}

export default function VoiceInput({
  onTranscriptComplete,
  onCancel,
  language = 'en-US',
  continuous = false,
  placeholder = 'Click the microphone to start speaking...',
  showVisualFeedback = true,
}: VoiceInputProps) {
  const {
    isRecording,
    transcript,
    interimTranscript,
    error,
    isSupported,
    confidence,
    startRecording,
    stopRecording,
    resetTranscript,
    cancelRecording,
  } = useVoiceRecording({ language, continuous, interimResults: true });

  const fullTranscript = transcript + (interimTranscript ? ` ${interimTranscript}` : '');

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (transcript.trim()) {
      onTranscriptComplete?.(transcript.trim());
      resetTranscript();
    }
  }, [transcript, onTranscriptComplete, resetTranscript]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    cancelRecording();
    onCancel?.();
  }, [cancelRecording, onCancel]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter to submit (when recording is stopped and there's a transcript)
      if (e.key === 'Enter' && !isRecording && transcript.trim()) {
        e.preventDefault();
        handleSubmit();
      }
      // Escape to cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
      // Space bar to toggle recording (hold to record)
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        if (!isRecording) {
          startRecording();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Release space to stop (push-to-talk mode)
      if (e.key === ' ' && e.target === document.body && isRecording && !continuous) {
        stopRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isRecording, transcript, continuous, handleSubmit, handleCancel, startRecording, stopRecording]);

  // Browser not supported
  if (!isSupported) {
    return (
      <div className="p-6 bg-gray-800 rounded-lg border border-red-500/50">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-white mb-1">Voice Input Not Supported</h3>
            <p className="text-sm text-gray-400">
              Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari for voice input features.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Recording Indicator */}
      {isRecording && showVisualFeedback && (
        <div className="flex items-center justify-center gap-2">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-red-500 rounded-full animate-pulse"
                style={{
                  height: `${16 + Math.random() * 16}px`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
          <span className="text-sm text-red-500 font-medium animate-pulse">Recording...</span>
        </div>
      )}

      {/* Main Control */}
      <div className="relative">
        {/* Transcript Display */}
        <div className="min-h-[120px] p-4 bg-gray-900 border border-gray-700 rounded-lg mb-3">
          {fullTranscript ? (
            <div className="space-y-2">
              <p className="text-white whitespace-pre-wrap">
                {transcript}
                {interimTranscript && (
                  <span className="text-gray-500 italic">{interimTranscript}</span>
                )}
              </p>
              {confidence > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Confidence:</span>
                  <div className="flex-1 max-w-[200px] h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{Math.round(confidence * 100)}%</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">{placeholder}</p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-3 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-3">
          {/* Cancel Button */}
          <button
            onClick={handleCancel}
            className="p-3 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
            title="Cancel (Esc)"
          >
            <X className="w-5 h-5 text-gray-300" />
          </button>

          {/* Microphone Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`
              relative p-6 rounded-full transition-all duration-300
              ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 scale-110'
                  : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
              }
            `}
            title={isRecording ? 'Stop Recording' : 'Start Recording (Space)'}
          >
            {isRecording ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
            
            {/* Pulse Animation */}
            {isRecording && (
              <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
            )}
          </button>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!transcript.trim() || isRecording}
            className="p-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-full transition-colors"
            title="Submit (Enter)"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>
            <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700">Space</kbd> to record •{' '}
            <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700">Enter</kbd> to submit •{' '}
            <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700">Esc</kbd> to cancel
          </p>
        </div>
      </div>
    </div>
  );
}
