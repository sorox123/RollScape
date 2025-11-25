/**
 * BiographyTab - Character backstory, personality, appearance, and notes
 */

'use client';

import { Character } from '@/lib/types/character';

interface BiographyTabProps {
  character: Character;
  updateCharacter: (updates: Partial<Character>) => void;
  editable: boolean;
}

export function BiographyTab({ character, updateCharacter, editable }: BiographyTabProps) {
  return (
    <div className="space-y-6">
      {/* Character Visuals */}
      <div>
        <h2 className="text-xl font-bold mb-4">Character Portrait</h2>
        <div className="flex gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {character.avatar_url ? (
              <img
                src={character.avatar_url}
                alt={character.name}
                className="w-32 h-32 rounded-lg object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-32 h-32 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}
            {editable && (
              <button
                className="mt-2 w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => {
                  const url = prompt('Enter avatar URL:');
                  if (url !== null) updateCharacter({ avatar_url: url });
                }}
              >
                Change Avatar
              </button>
            )}
          </div>

          {/* Physical Characteristics */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { key: 'age', label: 'Age', type: 'number' },
              { key: 'height', label: 'Height', type: 'text', placeholder: '5\' 10"' },
              { key: 'weight', label: 'Weight', type: 'text', placeholder: '170 lbs' },
              { key: 'eyes', label: 'Eyes', type: 'text', placeholder: 'Blue' },
              { key: 'skin', label: 'Skin', type: 'text', placeholder: 'Fair' },
              { key: 'hair', label: 'Hair', type: 'text', placeholder: 'Brown' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                {editable ? (
                  <input
                    type={type}
                    value={(character as any)[key] || ''}
                    onChange={(e) => updateCharacter({ [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 rounded-md">
                    {(character as any)[key] || '-'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Appearance Description */}
      <div>
        <label className="block text-lg font-bold text-gray-900 mb-2">Appearance</label>
        {editable ? (
          <textarea
            value={character.description || ''}
            onChange={(e) => updateCharacter({ description: e.target.value })}
            placeholder="Describe your character's appearance, distinctive features, clothing, mannerisms..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md h-24 resize-none"
          />
        ) : (
          <div className="px-3 py-2 bg-gray-50 rounded-md min-h-[6rem] whitespace-pre-line">
            {character.description || 'No description provided'}
          </div>
        )}
      </div>

      {/* Personality */}
      <div>
        <h2 className="text-xl font-bold mb-4">Personality</h2>
        <div className="space-y-4">
          {[
            { key: 'personality_traits', label: 'Personality Traits', placeholder: 'I am always polite and respectful...' },
            { key: 'ideals', label: 'Ideals', placeholder: 'Freedom. Chains are meant to be broken...' },
            { key: 'bonds', label: 'Bonds', placeholder: 'I would die to recover an ancient artifact...' },
            { key: 'flaws', label: 'Flaws', placeholder: 'I have a weakness for the vices of the city...' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              {editable ? (
                <textarea
                  value={(character as any)[key] || ''}
                  onChange={(e) => updateCharacter({ [key]: e.target.value })}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md h-20 resize-none"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-md min-h-[5rem] whitespace-pre-line">
                  {(character as any)[key] || '-'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Backstory */}
      <div>
        <label className="block text-lg font-bold text-gray-900 mb-2">Backstory</label>
        {editable ? (
          <textarea
            value={character.backstory || ''}
            onChange={(e) => updateCharacter({ backstory: e.target.value })}
            placeholder="Tell your character's story. Where did they come from? What drives them? What are their goals?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md h-40 resize-y"
          />
        ) : (
          <div className="px-3 py-2 bg-gray-50 rounded-md min-h-[10rem] whitespace-pre-line">
            {character.backstory || 'No backstory provided'}
          </div>
        )}
      </div>

      {/* Background */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Background</label>
        {editable ? (
          <input
            type="text"
            value={character.background || ''}
            onChange={(e) => updateCharacter({ background: e.target.value })}
            placeholder="e.g., Folk Hero, Sage, Criminal"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        ) : (
          <div className="px-3 py-2 bg-gray-50 rounded-md">
            {character.background || 'No background'}
          </div>
        )}
      </div>

      {/* Alignment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Alignment</label>
        {editable ? (
          <select
            value={character.alignment || ''}
            onChange={(e) => updateCharacter({ alignment: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select alignment</option>
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
        ) : (
          <div className="px-3 py-2 bg-gray-50 rounded-md">
            {character.alignment || 'No alignment'}
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <h2 className="text-xl font-bold mb-4">Notes</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Player Notes
              <span className="text-gray-500 ml-2 font-normal">(Visible to you)</span>
            </label>
            {editable ? (
              <textarea
                value={character.player_notes || ''}
                onChange={(e) => updateCharacter({ player_notes: e.target.value })}
                placeholder="Your private notes about this character..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md h-24 resize-y"
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-md min-h-[6rem] whitespace-pre-line">
                {character.player_notes || 'No notes'}
              </div>
            )}
          </div>

          {character.dm_notes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DM Notes
                <span className="text-purple-600 ml-2 font-normal">(From your DM)</span>
              </label>
              <div className="px-3 py-2 bg-purple-50 border border-purple-200 rounded-md min-h-[6rem] whitespace-pre-line">
                {character.dm_notes}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Personality (if character has one) */}
      {character.ai_personality && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">🤖 AI Personality</h3>
          <p className="text-sm text-blue-800">{character.ai_personality}</p>
        </div>
      )}
    </div>
  );
}
