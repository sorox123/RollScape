"""
Game session state management.
Handles complete game state including combat, inventory, and player actions.
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum
import uuid

from game_logic.combat_manager import Combat, CombatManager
from game_logic.inventory_manager import Inventory, InventoryManager
from services.redis_service import redis_service


class SessionStatus(str, Enum):
    """Session status"""
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    PAUSED = "paused"
    COMPLETED = "completed"


class GamePhase(str, Enum):
    """Current phase of gameplay"""
    ROLEPLAY = "roleplay"
    EXPLORATION = "exploration"
    COMBAT = "combat"
    DOWNTIME = "downtime"


class PlayerAction(BaseModel):
    """A player action"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    character_id: str
    character_name: str
    action_type: str  # move, attack, spell, skill_check, etc.
    description: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    dice_roll: Optional[Dict] = None
    result: Optional[str] = None


class ChatMessage(BaseModel):
    """Chat message"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    sender_name: str
    sender_type: str  # player, dm, system, npc
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    is_ic: bool = True  # In-character


class SessionState(BaseModel):
    """Complete game session state"""
    session_id: str
    campaign_id: str
    status: SessionStatus = SessionStatus.SCHEDULED
    phase: GamePhase = GamePhase.ROLEPLAY
    
    # Participants
    dm_user_id: str
    player_character_ids: List[str] = Field(default_factory=list)
    active_player_ids: List[str] = Field(default_factory=list)  # Currently online
    
    # Game state
    current_location: str = ""
    current_scene: str = ""
    active_combat_id: Optional[str] = None
    active_npcs: List[Dict] = Field(default_factory=list)
    
    # History
    action_history: List[PlayerAction] = Field(default_factory=list)
    chat_history: List[ChatMessage] = Field(default_factory=list)
    
    # Session tracking
    started_at: Optional[datetime] = None
    last_activity: datetime = Field(default_factory=datetime.utcnow)
    
    # Metadata
    notes: str = ""
    custom_data: Dict[str, Any] = Field(default_factory=dict)
    
    def add_action(self, action: PlayerAction):
        """Add player action"""
        self.action_history.append(action)
        self.last_activity = datetime.utcnow()
        
        # Keep last 100 actions
        if len(self.action_history) > 100:
            self.action_history = self.action_history[-100:]
    
    def add_chat_message(self, message: ChatMessage):
        """Add chat message"""
        self.chat_history.append(message)
        self.last_activity = datetime.utcnow()
        
        # Keep last 200 messages
        if len(self.chat_history) > 200:
            self.chat_history = self.chat_history[-200:]
    
    def start_session(self):
        """Start the session"""
        self.status = SessionStatus.IN_PROGRESS
        self.started_at = datetime.utcnow()
        self.last_activity = datetime.utcnow()
    
    def end_session(self):
        """End the session"""
        self.status = SessionStatus.COMPLETED
        self.last_activity = datetime.utcnow()
    
    def enter_combat(self, combat_id: str):
        """Enter combat phase"""
        self.phase = GamePhase.COMBAT
        self.active_combat_id = combat_id
        self.last_activity = datetime.utcnow()
    
    def exit_combat(self):
        """Exit combat phase"""
        self.phase = GamePhase.ROLEPLAY
        self.active_combat_id = None
        self.last_activity = datetime.utcnow()
    
    def get_recent_chat(self, count: int = 50) -> List[ChatMessage]:
        """Get recent chat messages"""
        return self.chat_history[-count:]
    
    def get_recent_actions(self, count: int = 20) -> List[PlayerAction]:
        """Get recent actions"""
        return self.action_history[-count:]


class SessionManager:
    """Manages game sessions"""
    
    def __init__(self):
        self.sessions: Dict[str, SessionState] = {}
        self.combat_manager = CombatManager()
        self.inventory_manager = InventoryManager()
        self.use_redis = not redis_service.is_mock
    
    def create_session(
        self,
        campaign_id: str,
        dm_user_id: str,
        player_character_ids: List[str]
    ) -> SessionState:
        """Create new session"""
        session_id = str(uuid.uuid4())
        
        session = SessionState(
            session_id=session_id,
            campaign_id=campaign_id,
            dm_user_id=dm_user_id,
            player_character_ids=player_character_ids
        )
        
        self.sessions[session_id] = session
        self._save_session(session)
        
        return session
    
    def get_session(self, session_id: str) -> Optional[SessionState]:
        """Get session by ID"""
        # Check memory cache
        if session_id in self.sessions:
            return self.sessions[session_id]
        
        # Check Redis
        if self.use_redis:
            state_dict = redis_service.get_session_state(session_id)
            if state_dict:
                session = SessionState(**state_dict)
                self.sessions[session_id] = session
                return session
        
        return None
    
    def update_session(self, session: SessionState):
        """Update session state"""
        session.last_activity = datetime.utcnow()
        self.sessions[session.session_id] = session
        self._save_session(session)
    
    def _save_session(self, session: SessionState):
        """Save session to Redis (if available)"""
        if self.use_redis:
            redis_service.set_session_state(
                session.session_id,
                session.model_dump(mode='json')
            )
    
    def add_player_action(
        self,
        session_id: str,
        character_id: str,
        character_name: str,
        action_type: str,
        description: str,
        dice_roll: Optional[Dict] = None,
        result: Optional[str] = None
    ) -> PlayerAction:
        """Add player action to session"""
        session = self.get_session(session_id)
        if not session:
            raise ValueError("Session not found")
        
        action = PlayerAction(
            character_id=character_id,
            character_name=character_name,
            action_type=action_type,
            description=description,
            dice_roll=dice_roll,
            result=result
        )
        
        session.add_action(action)
        self.update_session(session)
        
        return action
    
    def add_chat_message(
        self,
        session_id: str,
        sender_id: str,
        sender_name: str,
        sender_type: str,
        message: str,
        is_ic: bool = True
    ) -> ChatMessage:
        """Add chat message to session"""
        session = self.get_session(session_id)
        if not session:
            raise ValueError("Session not found")
        
        chat_msg = ChatMessage(
            sender_id=sender_id,
            sender_name=sender_name,
            sender_type=sender_type,
            message=message,
            is_ic=is_ic
        )
        
        session.add_chat_message(chat_msg)
        self.update_session(session)
        
        return chat_msg
    
    def start_combat(
        self,
        session_id: str,
        description: str = ""
    ) -> Combat:
        """Start combat in session"""
        session = self.get_session(session_id)
        if not session:
            raise ValueError("Session not found")
        
        combat = self.combat_manager.create_combat(
            session_id=session_id,
            description=description
        )
        
        session.enter_combat(combat.id)
        self.update_session(session)
        
        return combat
    
    def end_combat(self, session_id: str):
        """End combat in session"""
        session = self.get_session(session_id)
        if not session:
            raise ValueError("Session not found")
        
        session.exit_combat()
        self.update_session(session)
    
    def get_session_combat(self, session_id: str) -> Optional[Combat]:
        """Get active combat for session"""
        session = self.get_session(session_id)
        if not session or not session.active_combat_id:
            return None
        
        return self.combat_manager.get_combat(session.active_combat_id)
    
    def get_character_inventory(self, character_id: str) -> Inventory:
        """Get character inventory"""
        return self.inventory_manager.get_inventory(character_id)
    
    def get_session_summary(self, session_id: str) -> Dict:
        """Get session summary"""
        session = self.get_session(session_id)
        if not session:
            return {"error": "Session not found"}
        
        summary = {
            "session_id": session_id,
            "status": session.status,
            "phase": session.phase,
            "location": session.current_location,
            "scene": session.current_scene,
            "active_players": len(session.active_player_ids),
            "total_players": len(session.player_character_ids),
            "chat_messages": len(session.chat_history),
            "actions": len(session.action_history),
            "last_activity": session.last_activity.isoformat() if session.last_activity else None
        }
        
        # Add combat info if active
        if session.active_combat_id:
            combat = self.combat_manager.get_combat(session.active_combat_id)
            if combat:
                summary["combat"] = combat.get_summary()
        
        return summary


# Global session manager
session_manager = SessionManager()
