# WebSocket Testing Guide

## Quick Start

### 1. Start the Backend
```bash
cd backend
python main.py
```
The backend should start on `http://localhost:8000`

### 2. Start the Frontend
```bash
cd frontend
npm run dev
```
The frontend should start on `http://localhost:3000`

### 3. Open the Test Page
Navigate to: `http://localhost:3000/test/game-session`

## Testing Real-Time Multiplayer

### Multi-Window Testing

To test multiplayer features, you need to simulate multiple players:

1. **Open Multiple Browser Windows**
   - Open the test page in 2-4 browser windows
   - Arrange them side-by-side to see real-time updates

2. **Change User IDs**
   - In each window, open the browser dev console (F12)
   - In the source code (`app/test/game-session/page.tsx`), modify:
   ```typescript
   const [userId] = useState(1);  // Change to 2, 3, 4 for each window
   ```
   - Alternatively, you can create separate test pages for each user

3. **Test Features**

#### Chat Messages
- Type a message in one window
- Press "Send"
- Watch it appear in all other windows instantly

#### Dice Rolls
- Click "d20" or "d6" quick roll buttons
- Or use the chat to send custom rolls
- All players see the roll with formula and results

#### DM Narration (if isDM = true)
- Set `isDM` to `true` in one window
- Type narration text
- Press "Narrate"
- All players see the purple DM message

#### Player Presence
- Watch the player count update as you open/close windows
- See "Player joined" and "Player left" notifications
- Connection status indicator shows green when connected

## WebSocket Events Reference

### Client → Server Events

```typescript
// Join a room (auto-sent on connection)
{
  event: "join_room",
  data: {}
}

// Send chat message
{
  event: "chat_message",
  data: {
    message: "Hello, world!"
  }
}

// Roll dice
{
  event: "dice_roll",
  data: {
    formula: "1d20+5",
    result: 18,
    rolls: [13],
    modifier: 5
  }
}

// DM narration (DM only)
{
  event: "dm_narration",
  data: {
    narration: "You enter a dark cave..."
  }
}

// Player action
{
  event: "player_action",
  data: {
    action_type: "attack",
    details: {
      target: "Goblin",
      weapon: "Longsword"
    }
  }
}

// Leave room
{
  event: "leave_room",
  data: {}
}
```

### Server → Client Events

```typescript
// Room joined successfully
{
  event: "room_joined",
  data: {
    session_id: 1,
    campaign_id: 1,
    player: { ... },
    players: [...]
  }
}

// Player joined the room
{
  event: "player_joined",
  data: {
    player: {
      user_id: 2,
      username: "Alice",
      character_name: "Elara",
      is_dm: false
    },
    total_players: 3
  }
}

// Player left the room
{
  event: "player_left",
  data: {
    player: { ... },
    total_players: 2
  }
}

// Dice roll broadcast
{
  event: "dice_roll",
  data: {
    player: { ... },
    roll: {
      formula: "1d20+5",
      result: 18,
      rolls: [13],
      modifier: 5
    },
    timestamp: "2024-01-15T10:30:00Z"
  }
}

// Chat message
{
  event: "chat_message",
  data: {
    player: { ... },
    message: "Let's explore the dungeon!",
    timestamp: "2024-01-15T10:30:00Z"
  }
}

// DM narration
{
  event: "dm_narration",
  data: {
    narration: "The ancient door creaks open...",
    timestamp: "2024-01-15T10:30:00Z"
  }
}
```

## Troubleshooting

### Connection Issues

**Problem:** "Disconnected" status shown
- **Check:** Backend server is running on port 8000
- **Check:** WebSocket endpoint is accessible at `ws://localhost:8000/ws/game/1`
- **Check:** Browser console for error messages
- **Solution:** Restart backend server and refresh frontend

**Problem:** "Invalid token" error
- **Issue:** User ID authentication
- **Solution:** Currently using simplified auth (userId as token). Ensure userId is a valid integer.

**Problem:** Auto-reconnection loop
- **Check:** Backend logs for connection errors
- **Solution:** Set `autoConnect={false}` to disable reconnection
- **Solution:** Fix any backend errors causing disconnections

### Message Issues

**Problem:** Messages not appearing
- **Check:** Both windows are connected (green status)
- **Check:** Browser console for WebSocket errors
- **Check:** Backend logs for message processing
- **Solution:** Check network tab for WebSocket frames

**Problem:** Duplicate messages
- **Issue:** Multiple WebSocket connections
- **Solution:** Ensure only one socket per component
- **Solution:** Check useEffect cleanup in useGameSocket hook

### Performance Issues

**Problem:** Lag or delay in messages
- **Check:** Backend server performance
- **Check:** Number of active connections
- **Solution:** Monitor backend logs for slow processing
- **Solution:** Optimize message handling if needed

## Advanced Testing

### Load Testing
```bash
# Test with many simultaneous connections
# Open 10+ browser windows with different user IDs
# Send rapid messages to test throughput
```

### Network Conditions
```bash
# Use Chrome DevTools Network tab
# Throttle connection to "Fast 3G" or "Slow 3G"
# Test reconnection behavior
```

### Error Handling
```bash
# Stop backend server while connected
# Verify auto-reconnection after 3 seconds
# Check that messages queue during disconnect
```

## Integration with Real Game Sessions

To use WebSockets in actual game sessions:

1. **Update Token Authentication**
   - Replace simplified auth with JWT validation
   - Implement proper token extraction in `get_user_from_token()`

2. **Connect to Existing Sessions**
   - Fetch real session data from API
   - Load character information
   - Verify user has access to session/campaign

3. **Persist Messages**
   - Save chat messages to database
   - Store dice roll history
   - Log important game events

4. **Integrate with Combat System**
   - Broadcast turn changes
   - Sync combat state
   - Update initiative order

5. **Add Map/Token Sync**
   - Broadcast token movements
   - Update map markers
   - Sync fog of war changes

## Next Steps

Planned WebSocket features:
- ⏳ Turn order management
- ⏳ Combat state synchronization
- ⏳ Initiative tracking
- ⏳ Map/token movement sync
- ⏳ Spell/ability usage broadcasts
- ⏳ Inventory updates
- ⏳ Character sheet changes

## Monitoring

### Backend Logs
Watch backend console for:
```
✅ WebSocket connected
📨 Received event: chat_message
📤 Broadcasting to room: 1
❌ WebSocket disconnected
```

### Browser Console
Watch browser console for:
```
🔌 Connecting to WebSocket: ws://localhost:8000/ws/game/1
✅ WebSocket connected
📨 Received event: player_joined
📤 Sent event: chat_message
```

## Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review backend logs for errors
3. Check browser console for WebSocket frames
4. Verify both servers are running
5. Test with simple messages first before complex events
