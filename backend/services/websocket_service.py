"""
WebSocket service for real-time multiplayer game sessions.

Manages WebSocket connections, game rooms, player presence, and broadcasts
real-time events like dice rolls, chat messages, and game state updates.
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, Set, Optional, Any, List
from fastapi import WebSocket, WebSocketDisconnect
from enum import Enum

logger = logging.getLogger(__name__)


class EventType(str, Enum):
    """WebSocket event types."""
    # Connection events
    CONNECT = "connect"
    DISCONNECT = "disconnect"
    
    # Room events
    JOIN_ROOM = "join_room"
    LEAVE_ROOM = "leave_room"
    ROOM_JOINED = "room_joined"
    ROOM_LEFT = "room_left"
    
    # Player events
    PLAYER_JOINED = "player_joined"
    PLAYER_LEFT = "player_left"
    PLAYER_LIST = "player_list"
    
    # Game events
    DICE_ROLL = "dice_roll"
    CHAT_MESSAGE = "chat_message"
    DM_NARRATION = "dm_narration"
    PLAYER_ACTION = "player_action"
    TURN_CHANGE = "turn_change"
    COMBAT_UPDATE = "combat_update"
    
    # System events
    ERROR = "error"
    PING = "ping"
    PONG = "pong"


class Player:
    """Represents a connected player."""
    
    def __init__(
        self,
        user_id: int,
        username: str,
        character_id: Optional[int] = None,
        character_name: Optional[str] = None,
        is_dm: bool = False
    ):
        self.user_id = user_id
        self.username = username
        self.character_id = character_id
        self.character_name = character_name
        self.is_dm = is_dm
        self.connected_at = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert player to dictionary."""
        return {
            "user_id": self.user_id,
            "username": self.username,
            "character_id": self.character_id,
            "character_name": self.character_name,
            "is_dm": self.is_dm,
            "connected_at": self.connected_at.isoformat()
        }


class GameRoom:
    """Represents a game session room."""
    
    def __init__(self, session_id: int, campaign_id: int):
        self.session_id = session_id
        self.campaign_id = campaign_id
        self.players: Dict[int, Player] = {}  # user_id -> Player
        self.connections: Dict[int, WebSocket] = {}  # user_id -> WebSocket
        self.created_at = datetime.utcnow()
    
    def add_player(self, user_id: int, player: Player, websocket: WebSocket):
        """Add a player to the room."""
        self.players[user_id] = player
        self.connections[user_id] = websocket
        logger.info(f"Player {player.username} joined room {self.session_id}")
    
    def remove_player(self, user_id: int):
        """Remove a player from the room."""
        player = self.players.pop(user_id, None)
        self.connections.pop(user_id, None)
        if player:
            logger.info(f"Player {player.username} left room {self.session_id}")
    
    def get_player_list(self) -> List[Dict[str, Any]]:
        """Get list of all players in the room."""
        return [player.to_dict() for player in self.players.values()]
    
    def is_empty(self) -> bool:
        """Check if room has no players."""
        return len(self.players) == 0


class WebSocketManager:
    """Manages WebSocket connections and game rooms."""
    
    def __init__(self):
        # Active connections: user_id -> WebSocket
        self.active_connections: Dict[int, WebSocket] = {}
        
        # Game rooms: session_id -> GameRoom
        self.rooms: Dict[int, GameRoom] = {}
        
        # User to room mapping: user_id -> session_id
        self.user_rooms: Dict[int, int] = {}
    
    async def connect(self, user_id: int, websocket: WebSocket):
        """Accept a WebSocket connection."""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        logger.info(f"User {user_id} connected via WebSocket")
    
    def disconnect(self, user_id: int):
        """Disconnect a user."""
        # Remove from their room if they're in one
        if user_id in self.user_rooms:
            session_id = self.user_rooms[user_id]
            if session_id in self.rooms:
                self.rooms[session_id].remove_player(user_id)
                
                # Clean up empty rooms
                if self.rooms[session_id].is_empty():
                    del self.rooms[session_id]
                    logger.info(f"Room {session_id} closed (empty)")
            
            del self.user_rooms[user_id]
        
        # Remove connection
        self.active_connections.pop(user_id, None)
        logger.info(f"User {user_id} disconnected")
    
    async def join_room(
        self,
        session_id: int,
        campaign_id: int,
        user_id: int,
        username: str,
        character_id: Optional[int] = None,
        character_name: Optional[str] = None,
        is_dm: bool = False
    ):
        """Add a user to a game room."""
        # Create room if it doesn't exist
        if session_id not in self.rooms:
            self.rooms[session_id] = GameRoom(session_id, campaign_id)
            logger.info(f"Created room {session_id} for campaign {campaign_id}")
        
        room = self.rooms[session_id]
        websocket = self.active_connections.get(user_id)
        
        if not websocket:
            logger.error(f"No WebSocket connection for user {user_id}")
            return
        
        # Create player and add to room
        player = Player(user_id, username, character_id, character_name, is_dm)
        room.add_player(user_id, player, websocket)
        self.user_rooms[user_id] = session_id
        
        # Notify the user they joined
        await self.send_personal_message(user_id, {
            "event": EventType.ROOM_JOINED,
            "data": {
                "session_id": session_id,
                "campaign_id": campaign_id,
                "player": player.to_dict(),
                "players": room.get_player_list()
            }
        })
        
        # Notify other players
        await self.broadcast_to_room(session_id, {
            "event": EventType.PLAYER_JOINED,
            "data": {
                "player": player.to_dict(),
                "total_players": len(room.players)
            }
        }, exclude_user=user_id)
    
    async def leave_room(self, user_id: int):
        """Remove a user from their current room."""
        if user_id not in self.user_rooms:
            return
        
        session_id = self.user_rooms[user_id]
        room = self.rooms.get(session_id)
        
        if not room:
            del self.user_rooms[user_id]
            return
        
        player = room.players.get(user_id)
        room.remove_player(user_id)
        del self.user_rooms[user_id]
        
        # Notify the user they left
        await self.send_personal_message(user_id, {
            "event": EventType.ROOM_LEFT,
            "data": {"session_id": session_id}
        })
        
        # Notify other players
        if player:
            await self.broadcast_to_room(session_id, {
                "event": EventType.PLAYER_LEFT,
                "data": {
                    "player": player.to_dict(),
                    "total_players": len(room.players)
                }
            })
        
        # Clean up empty room
        if room.is_empty():
            del self.rooms[session_id]
            logger.info(f"Room {session_id} closed (empty)")
    
    async def send_personal_message(self, user_id: int, message: Dict[str, Any]):
        """Send a message to a specific user."""
        websocket = self.active_connections.get(user_id)
        if websocket:
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Error sending message to user {user_id}: {e}")
    
    async def broadcast_to_room(
        self,
        session_id: int,
        message: Dict[str, Any],
        exclude_user: Optional[int] = None
    ):
        """Broadcast a message to all users in a room."""
        room = self.rooms.get(session_id)
        if not room:
            return
        
        disconnected = []
        for user_id, websocket in room.connections.items():
            if exclude_user and user_id == exclude_user:
                continue
            
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to user {user_id}: {e}")
                disconnected.append(user_id)
        
        # Clean up disconnected users
        for user_id in disconnected:
            self.disconnect(user_id)
    
    async def handle_dice_roll(
        self,
        session_id: int,
        user_id: int,
        roll_data: Dict[str, Any]
    ):
        """Broadcast a dice roll to all players in the room."""
        room = self.rooms.get(session_id)
        if not room:
            return
        
        player = room.players.get(user_id)
        if not player:
            return
        
        await self.broadcast_to_room(session_id, {
            "event": EventType.DICE_ROLL,
            "data": {
                "player": player.to_dict(),
                "roll": roll_data,
                "timestamp": datetime.utcnow().isoformat()
            }
        })
    
    async def handle_chat_message(
        self,
        session_id: int,
        user_id: int,
        message: str
    ):
        """Broadcast a chat message to all players in the room."""
        room = self.rooms.get(session_id)
        if not room:
            return
        
        player = room.players.get(user_id)
        if not player:
            return
        
        await self.broadcast_to_room(session_id, {
            "event": EventType.CHAT_MESSAGE,
            "data": {
                "player": player.to_dict(),
                "message": message,
                "timestamp": datetime.utcnow().isoformat()
            }
        })
    
    async def handle_dm_narration(
        self,
        session_id: int,
        user_id: int,
        narration: str
    ):
        """Broadcast DM narration to all players in the room."""
        room = self.rooms.get(session_id)
        if not room:
            return
        
        player = room.players.get(user_id)
        if not player or not player.is_dm:
            logger.warning(f"Non-DM user {user_id} attempted to send narration")
            return
        
        await self.broadcast_to_room(session_id, {
            "event": EventType.DM_NARRATION,
            "data": {
                "narration": narration,
                "timestamp": datetime.utcnow().isoformat()
            }
        })
    
    async def handle_player_action(
        self,
        session_id: int,
        user_id: int,
        action_data: Dict[str, Any]
    ):
        """Broadcast a player action to all players in the room."""
        room = self.rooms.get(session_id)
        if not room:
            return
        
        player = room.players.get(user_id)
        if not player:
            return
        
        await self.broadcast_to_room(session_id, {
            "event": EventType.PLAYER_ACTION,
            "data": {
                "player": player.to_dict(),
                "action": action_data,
                "timestamp": datetime.utcnow().isoformat()
            }
        })
    
    async def handle_turn_change(
        self,
        session_id: int,
        turn_data: Dict[str, Any]
    ):
        """Broadcast a turn change to all players in the room."""
        await self.broadcast_to_room(session_id, {
            "event": EventType.TURN_CHANGE,
            "data": {
                "turn": turn_data,
                "timestamp": datetime.utcnow().isoformat()
            }
        })
    
    async def handle_combat_update(
        self,
        session_id: int,
        combat_data: Dict[str, Any]
    ):
        """Broadcast a combat update to all players in the room."""
        await self.broadcast_to_room(session_id, {
            "event": EventType.COMBAT_UPDATE,
            "data": {
                "combat": combat_data,
                "timestamp": datetime.utcnow().isoformat()
            }
        })
    
    def get_room_info(self, session_id: int) -> Optional[Dict[str, Any]]:
        """Get information about a room."""
        room = self.rooms.get(session_id)
        if not room:
            return None
        
        return {
            "session_id": room.session_id,
            "campaign_id": room.campaign_id,
            "players": room.get_player_list(),
            "player_count": len(room.players),
            "created_at": room.created_at.isoformat()
        }


# Global WebSocket manager instance
ws_manager = WebSocketManager()
