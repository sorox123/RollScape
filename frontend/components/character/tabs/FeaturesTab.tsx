/**
 * FeaturesTab - Class features, racial traits, proficiencies
 */

'use client';

import { Character, Feature } from '@/lib/types/character';
import { useState } from 'react';

interface FeaturesTabProps {
  character: Character;
  updateCharacter: (updates: Partial<Character>) => void;
  editable: boolean;
}

export function FeaturesTab({ character, updateCharacter, editable }: FeaturesTabProps) {
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);

  const featuresBySource = character.features.reduce((acc, feature) => {
    const source = feature.source || 'Other';
    if (!acc[source]) acc[source] = [];
    acc[source].push(feature);
    return acc;
  }, {} as Record<string, Feature[]>);

  const sourceOrder = ['Class', 'Race', 'Background', 'Feat', 'Other'];
  const orderedSources = sourceOrder.filter(source => featuresBySource[source]);

  return (
    <div className="space-y-6">
      {/* Proficiencies */}
      <div>
        <h2 className="text-xl font-bold mb-4">Proficiencies</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Armor */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Armor</h3>
            {character.proficiencies.filter(p => p.includes('armor') || p.includes('shield')).length === 0 ? (
              <p className="text-sm text-gray-500">None</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {character.proficiencies
                  .filter(p => p.toLowerCase().includes('armor') || p.toLowerCase().includes('shield'))
                  .map((prof) => (
                    <span key={prof} className="px-2 py-1 bg-gray-200 text-gray-700 text-sm rounded">
                      {prof}
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* Weapons */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Weapons</h3>
            {character.proficiencies.filter(p => p.toLowerCase().includes('weapon')).length === 0 ? (
              <p className="text-sm text-gray-500">None</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {character.proficiencies
                  .filter(p => p.toLowerCase().includes('weapon'))
                  .map((prof) => (
                    <span key={prof} className="px-2 py-1 bg-gray-200 text-gray-700 text-sm rounded">
                      {prof}
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* Tools */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Tools</h3>
            {character.proficiencies.filter(p => 
              p.toLowerCase().includes('tools') || 
              p.toLowerCase().includes('kit') ||
              p.toLowerCase().includes("thieves'")
            ).length === 0 ? (
              <p className="text-sm text-gray-500">None</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {character.proficiencies
                  .filter(p => 
                    p.toLowerCase().includes('tools') || 
                    p.toLowerCase().includes('kit') ||
                    p.toLowerCase().includes("thieves'")
                  )
                  .map((prof) => (
                    <span key={prof} className="px-2 py-1 bg-gray-200 text-gray-700 text-sm rounded">
                      {prof}
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* Languages */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Languages</h3>
            {character.languages.length === 0 ? (
              <p className="text-sm text-gray-500">None</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {character.languages.map((lang) => (
                  <span key={lang} className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded">
                    {lang}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Class Resources */}
      {character.class_resources && Object.keys(character.class_resources).length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Class Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(character.class_resources).map(([key, resource]) => (
              <div key={key} className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">{resource.name}</h3>
                <div className="flex items-center justify-between mb-2">
                  {editable && (
                    <button
                      onClick={() => {
                        const updated = {
                          ...character.class_resources,
                          [key]: {
                            ...resource,
                            current: Math.max(0, resource.current - 1),
                          },
                        };
                        updateCharacter({ class_resources: updated });
                      }}
                      disabled={resource.current <= 0}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      -
                    </button>
                  )}
                  <span className="text-2xl font-bold text-gray-900 px-3">
                    {resource.current} / {resource.max}
                  </span>
                  {editable && (
                    <button
                      onClick={() => {
                        const updated = {
                          ...character.class_resources,
                          [key]: {
                            ...resource,
                            current: Math.min(resource.max, resource.current + 1),
                          },
                        };
                        updateCharacter({ class_resources: updated });
                      }}
                      disabled={resource.current >= resource.max}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  )}
                </div>
                {/* Visual progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(resource.current / resource.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features & Traits */}
      <div>
        <h2 className="text-xl font-bold mb-4">Features & Traits</h2>
        
        {character.features.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
            No features added yet
          </div>
        ) : (
          <div className="space-y-4">
            {orderedSources.map((source) => (
              <div key={source}>
                <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      source === 'Class'
                        ? 'bg-blue-500'
                        : source === 'Race'
                        ? 'bg-green-500'
                        : source === 'Background'
                        ? 'bg-yellow-500'
                        : source === 'Feat'
                        ? 'bg-purple-500'
                        : 'bg-gray-500'
                    }`}
                  />
                  {source}
                </h3>
                <div className="space-y-2">
                  {featuresBySource[source].map((feature, index) => (
                    <div
                      key={`${feature.name}-${index}`}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div
                        className="p-4 cursor-pointer"
                        onClick={() =>
                          setExpandedFeature(
                            expandedFeature === `${feature.name}-${index}`
                              ? null
                              : `${feature.name}-${index}`
                          )
                        }
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-gray-900">{feature.name}</h4>
                          <svg
                            className={`w-5 h-5 text-gray-400 transition-transform ${
                              expandedFeature === `${feature.name}-${index}` ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>

                      {expandedFeature === `${feature.name}-${index}` && (
                        <div className="px-4 pb-4 border-t border-gray-100 pt-3 bg-gray-50">
                          <p className="text-sm text-gray-700 whitespace-pre-line">
                            {feature.description}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {editable && (
          <button
            className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400"
            onClick={() => alert('Add feature functionality coming soon!')}
          >
            + Add Feature/Trait
          </button>
        )}
      </div>

      {/* Other proficiencies not categorized */}
      {character.proficiencies.filter(
        p =>
          !p.toLowerCase().includes('armor') &&
          !p.toLowerCase().includes('weapon') &&
          !p.toLowerCase().includes('tools') &&
          !p.toLowerCase().includes('kit') &&
          !p.toLowerCase().includes('shield') &&
          !p.toLowerCase().includes("thieves'")
      ).length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Other Proficiencies</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex flex-wrap gap-2">
              {character.proficiencies
                .filter(
                  p =>
                    !p.toLowerCase().includes('armor') &&
                    !p.toLowerCase().includes('weapon') &&
                    !p.toLowerCase().includes('tools') &&
                    !p.toLowerCase().includes('kit') &&
                    !p.toLowerCase().includes('shield') &&
                    !p.toLowerCase().includes("thieves'")
                )
                .map((prof) => (
                  <span key={prof} className="px-2 py-1 bg-gray-200 text-gray-700 text-sm rounded">
                    {prof}
                  </span>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
