/**
 * useGameSocket - WebSocket hook for real-time game sessions
 * 
 * Provides real-time multiplayer functionality for D&D game sessions.
 * Handles connections, room management, and event broadcasting.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export enum EventType {
  // Connection events
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  
  // Room events
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  ROOM_JOINED = 'room_joined',
  ROOM_LEFT = 'room_left',
  
  // Player events
  PLAYER_JOINED = 'player_joined',
  PLAYER_LEFT = 'player_left',
  PLAYER_LIST = 'player_list',
  
  // Game events
  DICE_ROLL = 'dice_roll',
  CHAT_MESSAGE = 'chat_message',
  DM_NARRATION = 'dm_narration',
  PLAYER_ACTION = 'player_action',
  TURN_CHANGE = 'turn_change',
  COMBAT_UPDATE = 'combat_update',
  
  // System events
  ERROR = 'error',
  PING = 'ping',
  PONG = 'pong',
}

export interface Player {
  user_id: number;
  username: string;
  character_id?: number;
  character_name?: string;
  is_dm: boolean;
  connected_at: string;
}

export interface DiceRoll {
  formula: string;
  result: number;
  rolls: number[];
  modifier?: number;
  player?: Player;
  timestamp?: string;
}

export interface ChatMessage {
  player: Player;
  message: string;
  timestamp: string;
}

export interface DMNarration {
  narration: string;
  timestamp: string;
}

export interface PlayerAction {
  player: Player;
  action: {
    action_type: string;
    details: any;
  };
  timestamp: string;
}

export interface TurnChange {
  turn: {
    current_character_id?: number;
    current_character_name?: string;
    round?: number;
    initiative_order?: any[];
  };
  timestamp: string;
}

export interface CombatUpdate {
  combat: {
    active: boolean;
    participants?: any[];
    current_turn?: number;
  };
  timestamp: string;
}

export interface UseGameSocketOptions {
  sessionId: number;
  userId: number;
  characterId?: number;
  autoConnect?: boolean;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onRoomJoined?: (data: { session_id: number; players: Player[] }) => void;
  onPlayerJoined?: (data: { player: Player; total_players: number }) => void;
  onPlayerLeft?: (data: { player: Player; total_players: number }) => void;
  onDiceRoll?: (data: DiceRoll) => void;
  onChatMessage?: (data: ChatMessage) => void;
  onDMNarration?: (data: DMNarration) => void;
  onPlayerAction?: (data: PlayerAction) => void;
  onTurnChange?: (data: TurnChange) => void;
  onCombatUpdate?: (data: CombatUpdate) => void;
  onError?: (error: { message: string }) => void;
}

export interface UseGameSocketReturn {
  isConnected: boolean;
  players: Player[];
  sendDiceRoll: (roll: Omit<DiceRoll, 'player' | 'timestamp'>) => void;
  sendChatMessage: (message: string) => void;
  sendDMNarration: (narration: string) => void;
  sendPlayerAction: (action: { action_type: string; details: any }) => void;
  sendTurnChange: (turn: any) => void;
  sendCombatUpdate: (combat: any) => void;
  leaveRoom: () => void;
  reconnect: () => void;
}

/**
 * Hook for managing real-time game session connections.
 * 
 * @example
 * ```tsx
 * const { 
 *   isConnected, 
 *   players, 
 *   sendDiceRoll, 
 *   sendChatMessage 
 * } = useGameSocket({
 *   sessionId: 123,
 *   userId: 456,
 *   characterId: 789,
 *   onDiceRoll: (roll) => console.log('Roll:', roll),
 *   onChatMessage: (msg) => console.log('Chat:', msg),
 * });
 * ```
 */
export function useGameSocket(options: UseGameSocketOptions): UseGameSocketReturn {
  const {
    sessionId,
    userId,
    characterId,
    autoConnect = true,
    onConnected,
    onDisconnected,
    onRoomJoined,
    onPlayerJoined,
    onPlayerLeft,
    onDiceRoll,
    onChatMessage,
    onDMNarration,
    onPlayerAction,
    onTurnChange,
    onCombatUpdate,
    onError,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // WebSocket connection
  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    // Construct WebSocket URL
    const wsUrl = `ws://localhost:8080/ws/game/${sessionId}?token=${userId}${
      characterId ? `&character_id=${characterId}` : ''
    }`;

    console.log('🔌 Connecting to WebSocket:', wsUrl);

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      onConnected?.();
    };

    ws.onclose = (event) => {
      console.log('❌ WebSocket disconnected:', event.code, event.reason);
      setIsConnected(false);
      setPlayers([]);
      onDisconnected?.();

      // Auto-reconnect after 5 seconds (increased to reduce spam)
      if (autoConnect && event.code !== 1000) { // Don't reconnect if intentional close
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect...');
          connect();
        }, 5000);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      console.error('❌ Error details:', {
        type: error.type,
        target: error.target,
        currentTarget: error.currentTarget
      });
      onError?.({ message: 'Connection error' });
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { event: eventType, data } = message;

        console.log('📨 Received event:', eventType, data);

        switch (eventType) {
          case EventType.ROOM_JOINED:
            setPlayers(data.players || []);
            onRoomJoined?.(data);
            break;

          case EventType.PLAYER_JOINED:
            setPlayers((prev) => [...prev, data.player]);
            onPlayerJoined?.(data);
            break;

          case EventType.PLAYER_LEFT:
            setPlayers((prev) => prev.filter((p) => p.user_id !== data.player.user_id));
            onPlayerLeft?.(data);
            break;

          case EventType.DICE_ROLL:
            onDiceRoll?.(data);
            break;

          case EventType.CHAT_MESSAGE:
            onChatMessage?.(data);
            break;

          case EventType.DM_NARRATION:
            onDMNarration?.(data);
            break;

          case EventType.PLAYER_ACTION:
            onPlayerAction?.(data);
            break;

          case EventType.TURN_CHANGE:
            onTurnChange?.(data);
            break;

          case EventType.COMBAT_UPDATE:
            onCombatUpdate?.(data);
            break;

          case EventType.ERROR:
            onError?.(data);
            break;

          default:
            console.warn('Unknown event type:', eventType);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
  }, [
    sessionId,
    userId,
    characterId,
    autoConnect,
    onConnected,
    onDisconnected,
    onRoomJoined,
    onPlayerJoined,
    onPlayerLeft,
    onDiceRoll,
    onChatMessage,
    onDMNarration,
    onPlayerAction,
    onTurnChange,
    onCombatUpdate,
    onError,
  ]);

  // Send message helper
  const sendMessage = useCallback((event: EventType, data?: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ event, data });
      socketRef.current.send(message);
      console.log('📤 Sent event:', event, data);
    } else {
      console.warn('Cannot send message - WebSocket not connected');
    }
  }, []);

  // Public API methods
  const sendDiceRoll = useCallback(
    (roll: Omit<DiceRoll, 'player' | 'timestamp'>) => {
      sendMessage(EventType.DICE_ROLL, roll);
    },
    [sendMessage]
  );

  const sendChatMessage = useCallback(
    (message: string) => {
      sendMessage(EventType.CHAT_MESSAGE, { message });
    },
    [sendMessage]
  );

  const sendDMNarration = useCallback(
    (narration: string) => {
      sendMessage(EventType.DM_NARRATION, { narration });
    },
    [sendMessage]
  );

  const sendPlayerAction = useCallback(
    (action: { action_type: string; details: any }) => {
      sendMessage(EventType.PLAYER_ACTION, action);
    },
    [sendMessage]
  );

  const sendTurnChange = useCallback(
    (turn: any) => {
      sendMessage(EventType.TURN_CHANGE, turn);
    },
    [sendMessage]
  );

  const sendCombatUpdate = useCallback(
    (combat: any) => {
      sendMessage(EventType.COMBAT_UPDATE, combat);
    },
    [sendMessage]
  );

  const leaveRoom = useCallback(() => {
    sendMessage(EventType.LEAVE_ROOM);
    socketRef.current?.close();
  }, [sendMessage]);

  const reconnect = useCallback(() => {
    socketRef.current?.close();
    connect();
  }, [connect]);

  // Connect on mount if autoConnect is true
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      socketRef.current?.close();
    };
  }, [autoConnect, connect]);

  return {
    isConnected,
    players,
    sendDiceRoll,
    sendChatMessage,
    sendDMNarration,
    sendPlayerAction,
    sendTurnChange,
    sendCombatUpdate,
    leaveRoom,
    reconnect,
  };
}
