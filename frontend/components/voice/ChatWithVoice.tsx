'use client';

import React, { useState } from 'react';
import { Send, Mic, Keyboard } from 'lucide-react';
import { useVoiceRecording } from '@/lib/hooks/useVoiceRecording';

interface ChatWithVoiceProps {
  onSendMessage: (message: string, isVoice: boolean) => void;
  placeholder?: string;
  enableVoice?: boolean;
}

export default function ChatWithVoice({
  onSendMessage,
  placeholder = 'Type a message or use voice...',
  enableVoice = true,
}: ChatWithVoiceProps) {
  const [message, setMessage] = useState('');
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  
  const {
    isRecording,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startRecording,
    stopRecording,
    resetTranscript,
  } = useVoiceRecording({
    language: 'en-US',
    continuous: false,
    interimResults: true,
  });

  // Handle text submission
  const handleSendText = () => {
    if (message.trim()) {
      onSendMessage(message.trim(), false);
      setMessage('');
    }
  };

  // Handle voice submission
  const handleSendVoice = () => {
    if (transcript.trim()) {
      onSendMessage(transcript.trim(), true);
      resetTranscript();
      setInputMode('text');
    }
  };

  // Toggle input mode
  const handleToggleMode = () => {
    if (inputMode === 'text') {
      setInputMode('voice');
      if (isSupported) {
        startRecording();
      }
    } else {
      if (isRecording) {
        stopRecording();
      }
      setInputMode('text');
      resetTranscript();
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputMode === 'text') {
        handleSendText();
      } else {
        handleSendVoice();
      }
    }
  };

  const fullTranscript = transcript + (interimTranscript ? ` ${interimTranscript}` : '');

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      {/* Input Area */}
      <div className="space-y-3">
        {/* Mode Indicator */}
        {inputMode === 'voice' && (
          <div className="flex items-center gap-2 text-sm">
            <Mic className={`w-4 h-4 ${isRecording ? 'text-red-500 animate-pulse' : 'text-blue-500'}`} />
            <span className={isRecording ? 'text-red-400' : 'text-blue-400'}>
              {isRecording ? 'Listening...' : 'Voice mode active'}
            </span>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-2 bg-red-500/10 border border-red-500/50 rounded text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Text Input or Voice Transcript */}
        <div className="relative">
          {inputMode === 'text' ? (
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="w-full min-h-[80px] px-4 py-3 pr-24 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          ) : (
            <div className="w-full min-h-[80px] px-4 py-3 pr-24 bg-gray-900 border border-gray-700 rounded-lg">
              {fullTranscript ? (
                <p className="text-white whitespace-pre-wrap">
                  {transcript}
                  {interimTranscript && (
                    <span className="text-gray-500 italic">{interimTranscript}</span>
                  )}
                </p>
              ) : (
                <p className="text-gray-500">
                  {isRecording ? 'Listening...' : 'Click microphone to start speaking'}
                </p>
              )}
            </div>
          )}

          {/* Control Buttons */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            {/* Toggle Mode Button */}
            {enableVoice && isSupported && (
              <button
                onClick={handleToggleMode}
                className={`
                  p-2 rounded-lg transition-all
                  ${
                    inputMode === 'voice'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }
                `}
                title={inputMode === 'text' ? 'Switch to Voice Input' : 'Switch to Text Input'}
              >
                {inputMode === 'text' ? (
                  <Mic className="w-5 h-5 text-white" />
                ) : (
                  <Keyboard className="w-5 h-5 text-white" />
                )}
              </button>
            )}

            {/* Send Button */}
            <button
              onClick={inputMode === 'text' ? handleSendText : handleSendVoice}
              disabled={inputMode === 'text' ? !message.trim() : !transcript.trim()}
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
              title="Send Message (Enter)"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Voice Recording Indicator */}
        {inputMode === 'voice' && isRecording && (
          <div className="flex items-center justify-center gap-2">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-red-500 rounded-full animate-pulse"
                  style={{
                    height: `${12 + Math.random() * 12}px`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-500 text-center">
          {inputMode === 'text' ? (
            <span>Press Enter to send, Shift+Enter for new line</span>
          ) : (
            <span>Speech will be automatically captured • Click keyboard icon to switch to text</span>
          )}
        </div>
      </div>
    </div>
  );
}
