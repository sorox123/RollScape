# WebSocket Testing Instructions

## ✅ Servers Running

**Backend:** http://localhost:8000  
**Frontend:** http://localhost:3000  
**Test Page:** http://localhost:3000/test/game-session

## 🧪 How to Test

### 1. Single Player Test

The test page is now open. You should see:
- ✅ Connection status (green dot = connected)
- Player count indicator
- Chat input field
- Quick roll buttons (d20, d6)

Try these actions:
1. **Send a chat message** - Type in the bottom input and click "Send"
2. **Roll dice** - Click the "d20" or "d6" buttons
3. Watch messages appear in real-time

### 2. Multi-Player Test

To simulate multiple players, open additional browser windows:

**Option A: Open Multiple Windows**
1. Open a new browser window (Ctrl+N)
2. Navigate to: `http://localhost:3000/test/game-session`
3. Arrange windows side-by-side
4. Send messages in one window and watch them appear in the other

**Option B: Change User IDs (More Realistic)**
1. Open the file: `frontend/app/test/game-session/page.tsx`
2. Change these lines:
   ```typescript
   const [userId] = useState(1);  // Change to 2, 3, 4, etc.
   const [isDM] = useState(false); // Set to true to test DM features
   ```
3. Save the file (Next.js will auto-reload)
4. Open another window with different user ID

### 3. Test Features

#### ✅ Chat Messages
- Type a message and press Send
- All connected players see it instantly
- Shows player name and timestamp

#### ✅ Dice Rolls  
- Click "d20" or "d6" quick roll buttons
- Roll appears as a blue box with formula and result
- Shows individual die rolls and modifiers

#### ✅ DM Narration (if isDM=true)
- Type in the purple "DM Narration" input
- Press "Narrate"
- All players see purple DM message

#### ✅ Player Presence
- Watch player count update when windows connect/disconnect
- See "Player joined" and "Player left" system messages

#### ✅ Auto-Reconnection
- Stop the backend server (Ctrl+C in backend terminal)
- Watch status turn red (Disconnected)
- Restart backend: `uvicorn main:app --reload --host 0.0.0.0 --port 8000`
- Watch status turn green (Connected) after 3 seconds

### 4. Check Backend Logs

In the backend terminal, you should see:
```
✅ WebSocket connected
📨 Received event: chat_message
📤 Broadcasting to room: 1
```

### 5. Check Browser Console

Open browser DevTools (F12) and check Console:
```
🔌 Connecting to WebSocket: ws://localhost:8000/ws/game/1?token=1
✅ WebSocket connected
📨 Received event: player_joined
📤 Sent event: chat_message
```

## 🎯 What to Look For

### ✅ Success Indicators
- Green connection status
- Messages appear instantly in all windows
- Dice rolls broadcast to all players
- Player count updates correctly
- Clean reconnection after disconnects

### ❌ Potential Issues

**"Disconnected" status**
- Check backend is running on port 8000
- Check for errors in backend terminal
- Verify WebSocket endpoint: `ws://localhost:8000/ws/game/1`

**Messages not appearing**
- Check browser console for errors
- Verify all windows connected to same session_id
- Check backend logs for message processing

**Can't connect multiple players**
- Each window needs a different userId
- Or use multiple browser windows/tabs
- Check player count indicator

## 📊 Advanced Testing

### Load Test
- Open 5-10 windows with different user IDs
- Send rapid messages
- Check for lag or connection issues

### Network Conditions
- Open Chrome DevTools → Network tab
- Throttle to "Fast 3G"
- Test message latency

### Error Handling
- Stop backend while connected
- Verify auto-reconnection works
- Check message queuing during disconnect

## 🐛 Troubleshooting

**Backend won't start:**
```bash
pip install -r requirements.txt
```

**Frontend errors:**
```bash
npm install
```

**WebSocket connection fails:**
- Verify backend is on port 8000
- Check CORS settings
- Try `http://localhost:3000` instead of `127.0.0.1`

## 📝 Notes

- **Mock Mode**: Backend runs in mock mode (no database, no real Stripe)
- **Simplified Auth**: Uses userId as token for testing
- **Session ID**: Currently hardcoded to 1 for all tests
- **Character ID**: Optional, set to 1 by default

## ✨ Next Steps

After verifying WebSocket works:
1. Integrate with real game sessions
2. Add JWT authentication
3. Persist chat messages to database
4. Add combat state synchronization
5. Implement turn order management
6. Add map/token movement sync

## 🎉 You Did It!

If you can see messages appearing in real-time across multiple windows, the WebSocket system is working perfectly! You've successfully implemented real-time multiplayer for RollScape! 🎲
