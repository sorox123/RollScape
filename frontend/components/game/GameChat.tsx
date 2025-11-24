/**
 * GameChat - Real-time chat component for game sessions
 * 
 * Displays chat messages, dice rolls, and DM narration in real-time.
 * Uses WebSocket connection for instant message delivery.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useGameSocket, ChatMessage, DiceRoll, DMNarration } from '@/lib/hooks/useGameSocket';

interface GameChatProps {
  sessionId: number;
  userId: number;
  characterId?: number;
  isDM?: boolean;
}

type MessageItem = 
  | { type: 'chat'; data: ChatMessage }
  | { type: 'dice'; data: DiceRoll }
  | { type: 'narration'; data: DMNarration }
  | { type: 'system'; data: { message: string; timestamp: string } };

export function GameChat({ sessionId, userId, characterId, isDM = false }: GameChatProps) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [narrationInput, setNarrationInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    isConnected,
    players,
    sendChatMessage,
    sendDMNarration,
    sendDiceRoll,
  } = useGameSocket({
    sessionId,
    userId,
    characterId,
    autoConnect: true,
    onConnected: () => {
      addSystemMessage('Connected to game session');
    },
    onDisconnected: () => {
      addSystemMessage('Disconnected from game session');
    },
    onRoomJoined: (data) => {
      addSystemMessage(`Joined game with ${data.players.length} players`);
    },
    onPlayerJoined: (data) => {
      addSystemMessage(`${data.player.username} joined the game`);
    },
    onPlayerLeft: (data) => {
      addSystemMessage(`${data.player.username} left the game`);
    },
    onChatMessage: (data) => {
      setMessages((prev) => [...prev, { type: 'chat', data }]);
    },
    onDiceRoll: (data) => {
      setMessages((prev) => [...prev, { type: 'dice', data }]);
    },
    onDMNarration: (data) => {
      setMessages((prev) => [...prev, { type: 'narration', data }]);
    },
  });

  const addSystemMessage = (message: string) => {
    setMessages((prev) => [
      ...prev,
      {
        type: 'system',
        data: { message, timestamp: new Date().toISOString() },
      },
    ]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      sendChatMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const handleSendNarration = (e: React.FormEvent) => {
    e.preventDefault();
    if (narrationInput.trim() && isDM) {
      sendDMNarration(narrationInput.trim());
      setNarrationInput('');
    }
  };

  const handleQuickRoll = (formula: string) => {
    // Parse dice formula (e.g., "1d20+5")
    const match = formula.match(/(\d+)d(\d+)([+-]\d+)?/);
    if (match) {
      const [, numDice, numSides, modifier] = match;
      const rolls: number[] = [];
      let total = 0;

      for (let i = 0; i < parseInt(numDice); i++) {
        const roll = Math.floor(Math.random() * parseInt(numSides)) + 1;
        rolls.push(roll);
        total += roll;
      }

      const mod = modifier ? parseInt(modifier) : 0;
      total += mod;

      sendDiceRoll({
        formula,
        result: total,
        rolls,
        modifier: mod || undefined,
      });
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-white border rounded-lg shadow">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Game Chat</h3>
            <p className="text-sm text-gray-600">
              {isConnected ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Connected · {players.length} player{players.length !== 1 ? 's' : ''}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Disconnected
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleQuickRoll('1d20')}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              d20
            </button>
            <button
              onClick={() => handleQuickRoll('1d6')}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              d6
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((item, index) => (
          <div key={index}>
            {item.type === 'chat' && (
              <div className="flex gap-2">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-semibold">
                  {item.data.player.username[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-sm">
                      {item.data.player.character_name || item.data.player.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(item.data.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800">{item.data.message}</p>
                </div>
              </div>
            )}

            {item.type === 'dice' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-semibold text-sm text-blue-900">
                    {item.data.player?.character_name || item.data.player?.username || 'Player'}
                  </span>
                  <span className="text-xs text-blue-600">rolled {item.data.formula}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-blue-900">{item.data.result}</span>
                  <span className="text-sm text-blue-600">
                    ({item.data.rolls.join(', ')}
                    {item.data.modifier !== undefined && item.data.modifier !== 0 && (
                      <> {item.data.modifier > 0 ? '+' : ''}{item.data.modifier}</>
                    )})
                  </span>
                </div>
              </div>
            )}

            {item.type === 'narration' && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-purple-900 uppercase">DM</span>
                  <span className="text-xs text-purple-600">
                    {formatTime(item.data.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-purple-900 italic">{item.data.narration}</p>
              </div>
            )}

            {item.type === 'system' && (
              <div className="text-center">
                <span className="text-xs text-gray-500 italic">{item.data.message}</span>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t space-y-2">
        {isDM && (
          <form onSubmit={handleSendNarration} className="flex gap-2">
            <input
              type="text"
              value={narrationInput}
              onChange={(e) => setNarrationInput(e.target.value)}
              placeholder="DM Narration..."
              className="flex-1 px-3 py-2 border border-purple-300 rounded bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={!isConnected}
            />
            <button
              type="submit"
              disabled={!isConnected || !narrationInput.trim()}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Narrate
            </button>
          </form>
        )}

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!isConnected || !inputMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
