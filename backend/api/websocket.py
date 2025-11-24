"""
WebSocket API endpoints for real-time multiplayer game sessions.

Provides WebSocket endpoint for game session connections and handles
real-time events like dice rolls, chat, player actions, and game updates.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import logging
import json

from database import get_db
from models.user import User
from models.game_session import GameSession
from models.character import Character
from services.websocket_service import ws_manager, EventType

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["websocket"])


async def get_user_from_token(token: str, db: Session) -> Optional[User]:
    """
    Extract user from JWT token.
    Simplified for WebSocket - in production, use proper JWT validation.
    """
    # TODO: Implement proper JWT token validation
    # For testing: Skip database query and create a mock user
    try:
        user_id = int(token)
        # Create a mock user object for testing without database
        from types import SimpleNamespace
        mock_user = SimpleNamespace(
            id=user_id,
            username=f"TestUser{user_id}",
            display_name=f"Test User {user_id}",
            email=f"test{user_id}@example.com"
        )
        return mock_user
    except (ValueError, AttributeError):
        return None


@router.websocket("/game/{session_id}")
async def websocket_game_endpoint(
    websocket: WebSocket,
    session_id: int,
    token: str = Query(...),
    character_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for game session.
    
    Clients connect with: ws://localhost:8000/ws/game/{session_id}?token={user_id}&character_id={char_id}
    
    Events sent by client:
    - join_room: Join the game session
    - leave_room: Leave the game session
    - dice_roll: Roll dice (data: {formula, result, rolls, modifier})
    - chat_message: Send chat message (data: {message})
    - dm_narration: DM sends narration (data: {narration})
    - player_action: Player takes action (data: {action_type, details})
    - ping: Heartbeat check
    
    Events received by client:
    - room_joined: Successfully joined room
    - room_left: Successfully left room
    - player_joined: Another player joined
    - player_left: Another player left
    - player_list: List of all players in room
    - dice_roll: Someone rolled dice
    - chat_message: Chat message from player
    - dm_narration: Narration from DM
    - player_action: Action taken by player
    - turn_change: Turn order changed
    - combat_update: Combat state updated
    - error: Error message
    - pong: Response to ping
    """
    logger.info(f"🔌 WebSocket connection attempt: session_id={session_id}, token={token}")
    
    # Authenticate user
    user = await get_user_from_token(token, db)
    if not user:
        logger.error(f"❌ Invalid token: {token}")
        await websocket.close(code=4001, reason="Invalid token")
        return
    
    logger.info(f"✅ User authenticated: {user.username}")
    
    # For testing: Skip database lookups for session and character
    # TODO: In production, verify session exists and user has access
    # game_session = db.query(GameSession).filter(GameSession.id == session_id).first()
    # if not game_session:
    #     await websocket.close(code=4004, reason="Session not found")
    #     return
    
    # Mock session for testing
    campaign_id = session_id  # Use session_id as campaign_id for simplicity
    
    # Get character if provided
    character_name = None
    if character_id:
        character_name = f"Character{character_id}"
    
    # Determine if user is DM (for testing, user_id 1 is DM)
    is_dm = user.id == 1
    
    # Connect user
    await ws_manager.connect(user.id, websocket)
    
    try:
        # Auto-join the room
        await ws_manager.join_room(
            session_id=session_id,
            campaign_id=campaign_id,
            user_id=user.id,
            username=user.display_name or user.username,
            character_id=character_id,
            character_name=character_name,
            is_dm=is_dm
        )
        
        # Listen for messages
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            event = message.get("event")
            payload = message.get("data", {})
            
            logger.info(f"Received event {event} from user {user.id} in session {session_id}")
            
            # Handle events
            if event == EventType.LEAVE_ROOM:
                await ws_manager.leave_room(user.id)
                break
            
            elif event == EventType.DICE_ROLL:
                await ws_manager.handle_dice_roll(session_id, user.id, payload)
            
            elif event == EventType.CHAT_MESSAGE:
                message_text = payload.get("message", "")
                if message_text:
                    await ws_manager.handle_chat_message(session_id, user.id, message_text)
            
            elif event == EventType.DM_NARRATION:
                narration = payload.get("narration", "")
                if narration and is_dm:
                    await ws_manager.handle_dm_narration(session_id, user.id, narration)
                elif not is_dm:
                    await ws_manager.send_personal_message(user.id, {
                        "event": EventType.ERROR,
                        "data": {"message": "Only DM can send narration"}
                    })
            
            elif event == EventType.PLAYER_ACTION:
                await ws_manager.handle_player_action(session_id, user.id, payload)
            
            elif event == EventType.TURN_CHANGE:
                if is_dm:
                    await ws_manager.handle_turn_change(session_id, payload)
            
            elif event == EventType.COMBAT_UPDATE:
                if is_dm:
                    await ws_manager.handle_combat_update(session_id, payload)
            
            elif event == EventType.PING:
                await ws_manager.send_personal_message(user.id, {
                    "event": EventType.PONG,
                    "data": {"timestamp": payload.get("timestamp")}
                })
            
            else:
                logger.warning(f"Unknown event type: {event}")
    
    except WebSocketDisconnect:
        logger.info(f"User {user.id} disconnected from session {session_id}")
    except Exception as e:
        logger.error(f"Error in WebSocket connection for user {user.id}: {e}")
    finally:
        ws_manager.disconnect(user.id)


@router.get("/room/{session_id}/info")
async def get_room_info(session_id: int):
    """Get information about a game room."""
    room_info = ws_manager.get_room_info(session_id)
    if not room_info:
        return {"error": "Room not found or empty"}
    return room_info
