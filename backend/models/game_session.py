"""
Game session model - Individual play sessions within a campaign.
"""

from sqlalchemy import Column, String, DateTime, Integer, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from database import Base
import uuid
import enum


class SessionStatus(str, enum.Enum):
    """Game session status"""
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELED = "canceled"


class GameSession(Base):
    """Individual game session within a campaign"""
    __tablename__ = "game_sessions"
    
    # Primary
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id"), nullable=False)
    
    # Session info
    session_number = Column(Integer, nullable=False)
    title = Column(String(200))
    description = Column(Text)
    
    # Status
    status = Column(
        Enum(SessionStatus),
        default=SessionStatus.SCHEDULED,
        nullable=False
    )
    
    # Timing
    scheduled_at = Column(DateTime(timezone=True))
    started_at = Column(DateTime(timezone=True))
    ended_at = Column(DateTime(timezone=True))
    duration_minutes = Column(Integer)
    
    # Session state (stored for resuming)
    current_scene = Column(String(200))
    current_map_id = Column(UUID(as_uuid=True))  # Reference to battle map
    active_combatants = Column(JSONB, default=[])  # Initiative order
    
    # AI usage tracking
    ai_requests_count = Column(Integer, default=0)
    ai_tokens_used = Column(Integer, default=0)
    ai_images_generated = Column(Integer, default=0)
    
    # Summary (AI-generated after session)
    summary = Column(Text)
    key_events = Column(JSONB, default=[])
    npcs_met = Column(JSONB, default=[])
    items_found = Column(JSONB, default=[])
    quests_updated = Column(JSONB, default=[])
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<GameSession {self.session_number}: {self.title}>"
    
    @property
    def is_active(self) -> bool:
        return self.status == SessionStatus.IN_PROGRESS
    
    @property
    def is_completed(self) -> bool:
        return self.status == SessionStatus.COMPLETED
