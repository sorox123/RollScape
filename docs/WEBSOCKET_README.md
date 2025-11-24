# WebSocket Real-Time Multiplayer

Real-time multiplayer system for RollScape using WebSockets. Enables instant communication between players during game sessions.

## Overview

The WebSocket system provides:
- **Real-time chat** - Instant messaging between players
- **Live dice rolls** - Broadcast rolls to all players
- **DM narration** - Special messages from the Dungeon Master
- **Player presence** - Track who's online in the session
- **Auto-reconnection** - Automatic recovery from connection drops
- **Room management** - Isolated game sessions with player tracking

## Architecture

### Backend Components

**WebSocketManager** (`backend/services/websocket_service.py`)
- Manages all active WebSocket connections
- Handles room creation and player joining/leaving
- Broadcasts events to players in the same session
- Cleans up disconnected players and empty rooms

**WebSocket API** (`backend/api/websocket.py`)
- Provides `/ws/game/{session_id}` endpoint
- Authenticates users and validates session access
- Routes events to appropriate handlers
- Enforces DM-only permissions for certain events

### Frontend Components

**useGameSocket Hook** (`frontend/lib/hooks/useGameSocket.ts`)
- React hook for WebSocket connection management
- Type-safe event handling
- Auto-reconnection logic
- Provides methods for sending various event types

**GameChat Component** (`frontend/components/game/GameChat.tsx`)
- UI for chat messages and dice rolls
- Displays player presence
- Quick dice roll buttons
- Separate input for DM narration

## Usage

### Basic Connection

```typescript
import { useGameSocket } from '@/lib/hooks/useGameSocket';

function GameSession({ sessionId, userId, characterId }) {
  const {
    isConnected,
    players,
    sendChatMessage,
    sendDiceRoll,
  } = useGameSocket({
    sessionId,
    userId,
    characterId,
    onChatMessage: (msg) => console.log('New message:', msg),
    onDiceRoll: (roll) => console.log('Dice rolled:', roll),
  });

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>Players: {players.length}</p>
    </div>
  );
}
```

### Sending Events

```typescript
// Send a chat message
sendChatMessage("Hello, everyone!");

// Roll dice
sendDiceRoll({
  formula: "1d20+5",
  result: 18,
  rolls: [13],
  modifier: 5,
});

// DM narration (DM only)
sendDMNarration("You enter a dark cave...");

// Player action
sendPlayerAction({
  action_type: "attack",
  details: {
    target: "Goblin",
    weapon: "Longsword",
  },
});
```

### Event Handlers

```typescript
useGameSocket({
  sessionId: 1,
  userId: 123,
  
  // Connection events
  onConnected: () => console.log('Connected!'),
  onDisconnected: () => console.log('Lost connection'),
  
  // Room events
  onRoomJoined: (data) => {
    console.log('Joined room with', data.players.length, 'players');
  },
  onPlayerJoined: (data) => {
    console.log(data.player.username, 'joined');
  },
  onPlayerLeft: (data) => {
    console.log(data.player.username, 'left');
  },
  
  // Game events
  onDiceRoll: (roll) => {
    console.log(roll.player.username, 'rolled', roll.roll.result);
  },
  onChatMessage: (msg) => {
    console.log(msg.player.username, ':', msg.message);
  },
  onDMNarration: (narration) => {
    console.log('DM:', narration.narration);
  },
  
  // Combat events
  onTurnChange: (turn) => {
    console.log('Turn:', turn.turn.current_character_name);
  },
  onCombatUpdate: (combat) => {
    console.log('Combat active:', combat.combat.active);
  },
});
```

## Event Types

### Client → Server

| Event | Description | Data | DM Only |
|-------|-------------|------|---------|
| `join_room` | Join a game session | - | No |
| `leave_room` | Leave the session | - | No |
| `chat_message` | Send chat message | `{message: string}` | No |
| `dice_roll` | Broadcast dice roll | `{formula, result, rolls, modifier}` | No |
| `dm_narration` | Send DM narration | `{narration: string}` | Yes |
| `player_action` | Player takes action | `{action_type, details}` | No |
| `turn_change` | Change turn order | `{turn}` | Yes |
| `combat_update` | Update combat state | `{combat}` | Yes |
| `ping` | Heartbeat check | `{timestamp}` | No |

### Server → Client

| Event | Description | Broadcast |
|-------|-------------|-----------|
| `room_joined` | User joined room | Personal |
| `room_left` | User left room | Personal |
| `player_joined` | Another player joined | Room |
| `player_left` | Another player left | Room |
| `player_list` | List of all players | Personal |
| `dice_roll` | Someone rolled dice | Room |
| `chat_message` | Chat message received | Room |
| `dm_narration` | DM narration received | Room |
| `player_action` | Player action performed | Room |
| `turn_change` | Turn changed | Room |
| `combat_update` | Combat state updated | Room |
| `error` | Error message | Personal |
| `pong` | Heartbeat response | Personal |

## Data Structures

### Player
```typescript
interface Player {
  user_id: number;
  username: string;
  character_id?: number;
  character_name?: string;
  is_dm: boolean;
  connected_at: string;
}
```

### Dice Roll
```typescript
interface DiceRoll {
  formula: string;        // e.g., "1d20+5"
  result: number;         // Total result
  rolls: number[];        // Individual die results
  modifier?: number;      // Modifier applied
  player?: Player;        // Who rolled (server adds)
  timestamp?: string;     // When rolled (server adds)
}
```

### Chat Message
```typescript
interface ChatMessage {
  player: Player;
  message: string;
  timestamp: string;
}
```

### DM Narration
```typescript
interface DMNarration {
  narration: string;
  timestamp: string;
}
```

## Room Management

### Room Lifecycle

1. **Room Creation**
   - First player joins → Room created automatically
   - Room assigned to specific session_id and campaign_id

2. **Player Joining**
   - Player connects via WebSocket
   - Auto-joins room on connection
   - Other players notified via `player_joined` event

3. **Player Leaving**
   - Player disconnects → Automatically removed from room
   - Other players notified via `player_left` event
   - If DM leaves, room continues for other players

4. **Room Cleanup**
   - Last player leaves → Room automatically deleted
   - No manual cleanup needed

### Room Information

Get current room status:
```typescript
GET /ws/room/{session_id}/info

Response:
{
  "session_id": 1,
  "campaign_id": 1,
  "players": [...],
  "player_count": 3,
  "created_at": "2024-01-15T10:00:00Z"
}
```

## Authentication

### Current Implementation (Testing)
Uses simplified authentication where `userId` is passed as token:
```
ws://localhost:8000/ws/game/{session_id}?token={user_id}&character_id={char_id}
```

### Production Implementation (TODO)
Replace with JWT token validation:

```python
async def get_user_from_token(token: str, db: Session) -> Optional[User]:
    """Validate JWT token and extract user."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        user = db.query(User).filter(User.id == user_id).first()
        return user
    except JWTError:
        return None
```

Then connect with:
```
ws://localhost:8000/ws/game/{session_id}?token={jwt_token}&character_id={char_id}
```

## Error Handling

### Connection Errors

**Invalid Token**
```json
{
  "code": 4001,
  "reason": "Invalid token"
}
```

**Session Not Found**
```json
{
  "code": 4004,
  "reason": "Session not found"
}
```

**Permission Denied**
```json
{
  "event": "error",
  "data": {
    "message": "Only DM can send narration"
  }
}
```

### Auto-Reconnection

The frontend hook automatically reconnects:
- Detects disconnection
- Waits 3 seconds
- Attempts reconnection
- Repeats until `autoConnect` disabled

Disable auto-reconnection:
```typescript
useGameSocket({
  sessionId: 1,
  userId: 123,
  autoConnect: false, // Manual connection control
});
```

## Testing

See [WEBSOCKET_TESTING.md](WEBSOCKET_TESTING.md) for comprehensive testing guide.

Quick test:
1. Start backend: `python backend/main.py`
2. Start frontend: `npm run dev`
3. Navigate to: `http://localhost:3000/test/game-session`
4. Open in multiple windows with different user IDs
5. Test chat, dice rolls, and DM narration

## Performance Considerations

### Scalability
- Current implementation: In-memory room management
- Single server limitation
- For production: Consider Redis for room state
- For high scale: Use Redis Pub/Sub or message queue

### Connection Limits
- FastAPI handles ~1000 concurrent WebSocket connections
- Each room can support 10-20 players comfortably
- Monitor server resources with many active sessions

### Message Size
- Keep messages small (< 1KB recommended)
- Large data should use REST API instead
- Consider compression for heavy traffic

## Future Enhancements

### Planned Features
- [ ] Turn order management
- [ ] Combat state synchronization
- [ ] Initiative tracker integration
- [ ] Map/token movement sync
- [ ] Spell/ability usage broadcasts
- [ ] Inventory update notifications
- [ ] Character sheet change propagation
- [ ] Voice chat integration
- [ ] Video chat support

### Persistence
- [ ] Save chat history to database
- [ ] Store dice roll history
- [ ] Log important game events
- [ ] Replay session functionality

### Advanced Features
- [ ] Private messages (whispers)
- [ ] Typing indicators
- [ ] Read receipts
- [ ] Reaction emojis
- [ ] File/image sharing
- [ ] Poll/voting system

## Troubleshooting

### Common Issues

**"Cannot connect to WebSocket"**
- Verify backend is running on port 8000
- Check CORS settings allow WebSocket upgrade
- Ensure no firewall blocking WebSocket connections

**"Messages not appearing"**
- Verify both clients connected to same session_id
- Check browser console for WebSocket errors
- Verify backend logs show message processing

**"Frequent disconnections"**
- Check network stability
- Monitor backend resource usage
- Review connection timeout settings

**"High latency"**
- Check server performance
- Verify no network congestion
- Consider geographic proximity to server

## Contributing

When adding new WebSocket events:

1. Add event type to `EventType` enum (backend and frontend)
2. Create handler method in `WebSocketManager`
3. Add event routing in WebSocket endpoint
4. Update TypeScript types in `useGameSocket.ts`
5. Add event handler in `GameChat` or relevant component
6. Update documentation and testing guide

## License

Part of the RollScape project. See main LICENSE file.
