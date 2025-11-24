'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Download, 
  Edit2, 
  Save, 
  X, 
  RefreshCw, 
  Users, 
  MapPin, 
  Lightbulb, 
  Swords,
  Calendar,
  Sparkles
} from 'lucide-react';

interface SessionRecap {
  recap_text: string;
  key_events: string[];
  npcs_met: string[];
  locations_visited: string[];
  decisions_made: string[];
  combat_encounters: string[];
  generated_at?: string;
  updated_at?: string;
}

interface SessionRecapViewerProps {
  sessionId: string;
  sessionTitle?: string;
  sessionNumber?: number;
  onClose?: () => void;
}

export default function SessionRecapViewer({ 
  sessionId, 
  sessionTitle = 'Untitled Session',
  sessionNumber,
  onClose 
}: SessionRecapViewerProps) {
  const [recap, setRecap] = useState<SessionRecap | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedRecap, setEditedRecap] = useState<SessionRecap | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRecap();
  }, [sessionId]);

  const fetchRecap = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/session/${sessionId}/recap`);
      if (response.ok) {
        const data = await response.json();
        setRecap(data);
        setEditedRecap(data);
      } else {
        setRecap(null);
      }
    } catch (error) {
      console.error('Error fetching recap:', error);
      setRecap(null);
    } finally {
      setLoading(false);
    }
  };

  const generateRecap = async () => {
    try {
      setGenerating(true);
      const response = await fetch(
        `http://localhost:8000/api/session/${sessionId}/recap/generate`,
        { method: 'POST' }
      );

      if (response.ok) {
        const data = await response.json();
        setRecap(data.recap);
        setEditedRecap(data.recap);
        alert('Recap generated successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error generating recap:', error);
      alert('Error generating recap');
    } finally {
      setGenerating(false);
    }
  };

  const saveRecap = async () => {
    if (!editedRecap) return;

    try {
      setSaving(true);
      const response = await fetch(
        `http://localhost:8000/api/session/${sessionId}/recap`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editedRecap),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRecap(data.recap);
        setEditing(false);
        alert('Recap saved successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error saving recap:', error);
      alert('Error saving recap');
    } finally {
      setSaving(false);
    }
  };

  const exportToMarkdown = () => {
    if (!recap) return;

    const markdown = `# ${sessionTitle}${sessionNumber ? ` - Session ${sessionNumber}` : ''}

## Session Recap

${recap.recap_text}

## Key Events
${recap.key_events.map((event, i) => `${i + 1}. ${event}`).join('\n')}

## NPCs Encountered
${recap.npcs_met.map(npc => `- ${npc}`).join('\n')}

## Locations Visited
${recap.locations_visited.map(loc => `- ${loc}`).join('\n')}

## Important Decisions
${recap.decisions_made.map((decision, i) => `${i + 1}. ${decision}`).join('\n')}

## Combat Encounters
${recap.combat_encounters.map((combat, i) => `${i + 1}. ${combat}`).join('\n')}

---
*Generated on ${recap.generated_at ? new Date(recap.generated_at).toLocaleDateString() : 'Unknown'}*
`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${sessionNumber || sessionId}-recap.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleArrayEdit = (field: keyof SessionRecap, index: number, value: string) => {
    if (!editedRecap) return;
    const array = [...(editedRecap[field] as string[])];
    array[index] = value;
    setEditedRecap({ ...editedRecap, [field]: array });
  };

  const handleArrayAdd = (field: keyof SessionRecap) => {
    if (!editedRecap) return;
    const array = [...(editedRecap[field] as string[]), ''];
    setEditedRecap({ ...editedRecap, [field]: array });
  };

  const handleArrayRemove = (field: keyof SessionRecap, index: number) => {
    if (!editedRecap) return;
    const array = (editedRecap[field] as string[]).filter((_, i) => i !== index);
    setEditedRecap({ ...editedRecap, [field]: array });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading recap...</div>
      </div>
    );
  }

  if (!recap) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Recap Available</h3>
        <p className="text-gray-400 mb-6">
          Generate an AI-powered recap of this session to capture key moments and story beats.
        </p>
        <button
          onClick={generateRecap}
          disabled={generating}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 rounded-lg transition-all font-medium mx-auto"
        >
          {generating ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Recap
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-purple-500" />
            <div>
              <h2 className="text-2xl font-bold text-white">Session Recap</h2>
              <p className="text-gray-400 text-sm">
                {sessionTitle}
                {sessionNumber && ` - Session ${sessionNumber}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!editing ? (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Edit Recap"
                >
                  <Edit2 className="w-5 h-5 text-gray-400" />
                </button>
                <button
                  onClick={exportToMarkdown}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Export to Markdown"
                >
                  <Download className="w-5 h-5 text-gray-400" />
                </button>
                <button
                  onClick={generateRecap}
                  disabled={generating}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Regenerate Recap"
                >
                  <RefreshCw className={`w-5 h-5 text-gray-400 ${generating ? 'animate-spin' : ''}`} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={saveRecap}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditedRecap(recap);
                  }}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors ml-2"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>
        </div>
        {recap.generated_at && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="w-4 h-4" />
            Generated {new Date(recap.generated_at).toLocaleString()}
            {recap.updated_at && recap.updated_at !== recap.generated_at && (
              <span className="ml-2">
                • Updated {new Date(recap.updated_at).toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Narrative Recap */}
        <section>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-500" />
            Story Summary
          </h3>
          {editing ? (
            <textarea
              value={editedRecap?.recap_text || ''}
              onChange={(e) => setEditedRecap({ ...editedRecap!, recap_text: e.target.value })}
              className="w-full h-40 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter narrative recap..."
            />
          ) : (
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                {recap.recap_text}
              </p>
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Key Events */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Key Events
            </h3>
            {editing ? (
              <div className="space-y-2">
                {editedRecap?.key_events.map((event, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={event}
                      onChange={(e) => handleArrayEdit('key_events', i, e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={() => handleArrayRemove('key_events', i)}
                      className="p-2 hover:bg-gray-700 rounded"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleArrayAdd('key_events')}
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  + Add Event
                </button>
              </div>
            ) : (
              <ul className="space-y-2">
                {recap.key_events.map((event, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300">
                    <span className="text-purple-500 mt-1">•</span>
                    <span>{event}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* NPCs Met */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              NPCs Encountered
            </h3>
            {editing ? (
              <div className="space-y-2">
                {editedRecap?.npcs_met.map((npc, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={npc}
                      onChange={(e) => handleArrayEdit('npcs_met', i, e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={() => handleArrayRemove('npcs_met', i)}
                      className="p-2 hover:bg-gray-700 rounded"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleArrayAdd('npcs_met')}
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  + Add NPC
                </button>
              </div>
            ) : (
              <ul className="space-y-1">
                {recap.npcs_met.map((npc, i) => (
                  <li key={i} className="px-3 py-2 bg-gray-900 rounded text-gray-300 text-sm">
                    {npc}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Locations Visited */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-500" />
              Locations Visited
            </h3>
            {editing ? (
              <div className="space-y-2">
                {editedRecap?.locations_visited.map((loc, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={loc}
                      onChange={(e) => handleArrayEdit('locations_visited', i, e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={() => handleArrayRemove('locations_visited', i)}
                      className="p-2 hover:bg-gray-700 rounded"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleArrayAdd('locations_visited')}
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  + Add Location
                </button>
              </div>
            ) : (
              <ul className="space-y-1">
                {recap.locations_visited.map((loc, i) => (
                  <li key={i} className="px-3 py-2 bg-gray-900 rounded text-gray-300 text-sm">
                    {loc}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Decisions Made */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-orange-500" />
              Important Decisions
            </h3>
            {editing ? (
              <div className="space-y-2">
                {editedRecap?.decisions_made.map((decision, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={decision}
                      onChange={(e) => handleArrayEdit('decisions_made', i, e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={() => handleArrayRemove('decisions_made', i)}
                      className="p-2 hover:bg-gray-700 rounded"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleArrayAdd('decisions_made')}
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  + Add Decision
                </button>
              </div>
            ) : (
              <ul className="space-y-2">
                {recap.decisions_made.map((decision, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>{decision}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Combat Encounters */}
        {recap.combat_encounters && recap.combat_encounters.length > 0 && (
          <section>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Swords className="w-5 h-5 text-red-500" />
              Combat Encounters
            </h3>
            {editing ? (
              <div className="space-y-2">
                {editedRecap?.combat_encounters.map((combat, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={combat}
                      onChange={(e) => handleArrayEdit('combat_encounters', i, e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={() => handleArrayRemove('combat_encounters', i)}
                      className="p-2 hover:bg-gray-700 rounded"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleArrayAdd('combat_encounters')}
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  + Add Combat
                </button>
              </div>
            ) : (
              <ul className="space-y-2">
                {recap.combat_encounters.map((combat, i) => (
                  <li key={i} className="px-4 py-3 bg-gray-900 rounded border-l-4 border-red-500 text-gray-300">
                    {combat}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
