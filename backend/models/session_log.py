"""Session logs - record of all actions in a game session"""

from sqlalchemy import Column, String, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import uuid


class SessionLog(Base):
    """
    Log of all actions in a game session.
    Records chat messages, dice rolls, combat actions, DM narration, etc.
    """
    __tablename__ = "session_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("game_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    
    log_type = Column(String(50), nullable=False, index=True)  # 'chat', 'action', 'roll', 'narrative', 'system'
    actor_type = Column(String(20))  # 'player', 'dm', 'ai_player', 'ai_dm', 'system'
    actor_id = Column(String)  # user_id or character_id
    actor_name = Column(String(255))
    
    content = Column(Text, nullable=False)
    log_metadata = Column(JSON)  # Roll results, action details, etc. (renamed from 'metadata' to avoid SQLAlchemy conflict)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    session = relationship("GameSession", back_populates="logs")
    
    def __repr__(self):
        return f"<SessionLog(type={self.log_type}, actor={self.actor_name}, session_id={self.session_id})>"
