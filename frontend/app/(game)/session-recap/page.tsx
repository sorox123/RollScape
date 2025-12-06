'use client';

import React from 'react';
import SessionRecapViewer from '@/components/session/SessionRecapViewer';
import { BookOpen } from 'lucide-react';

export default function SessionRecapPage() {
  // Mock session ID for testing
  const mockSessionId = 'test-session-123';

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-10 h-10 text-purple-500" />
            <h1 className="text-4xl font-bold">Session Recap</h1>
          </div>
          <p className="text-gray-400">
            AI-powered session summaries to capture your adventure's story beats
          </p>
        </div>

        {/* Recap Viewer */}
        <SessionRecapViewer
          sessionId={mockSessionId}
          sessionTitle="The Lost Temple of Arath"
          sessionNumber={5}
        />

        {/* Info Section */}
        <div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-3">About Session Recaps</h3>
          <div className="space-y-2 text-gray-400 text-sm">
            <p>
              <strong className="text-white">Automatic Generation:</strong> AI analyzes chat messages, 
              player actions, and combat logs to create engaging narrative summaries.
            </p>
            <p>
              <strong className="text-white">Key Information:</strong> Automatically extracts important 
              NPCs, locations, decisions, and combat encounters.
            </p>
            <p>
              <strong className="text-white">Editable:</strong> All recap sections can be manually edited 
              to add details or correct information.
            </p>
            <p>
              <strong className="text-white">Exportable:</strong> Download recaps as Markdown files for 
              sharing with players or archiving.
            </p>
            <p>
              <strong className="text-white">Mock Mode:</strong> Currently running in mock mode. 
              Set OPENAI_API_KEY to use GPT-4 for real AI-generated recaps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
