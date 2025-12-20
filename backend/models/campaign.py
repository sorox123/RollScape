"""
Campaign model - D&D campaign/game management.
"""

from sqlalchemy import Column, String, Boolean, DateTime, Enum, Integer, Text, ForeignKey

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from db_types import GUID, FlexJSON
import uuid
import enum


class CampaignStatus(str, enum.Enum):
    """Campaign lifecycle status"""
    PLANNING = "planning"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class CampaignVisibility(str, enum.Enum):
    """Campaign visibility for game browser"""
    PRIVATE = "private"
    PUBLIC = "public"
    INVITE_ONLY = "invite_only"


class Campaign(Base):
    """Campaign (game) model"""
    __tablename__ = "campaigns"
    
    # Primary
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    
    # Ownership
    dm_user_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    world_id = Column(GUID(), ForeignKey("worlds.id"), nullable=True, index=True)  # Link to world marketplace
    
    # Status
    status = Column(
        Enum(CampaignStatus),
        default=CampaignStatus.PLANNING,
        nullable=False,
        index=True
    )
    visibility = Column(
        Enum(CampaignVisibility),
        default=CampaignVisibility.PRIVATE,
        nullable=False
    )
    
    # Game settings
    rule_system = Column(String(100), default="dnd_5e")  # dnd_5e, dnd_3.5e, pathfinder, custom
    max_players = Column(Integer, default=6)
    current_session_number = Column(Integer, default=0)
    
    # AI settings
    ai_dm_enabled = Column(Boolean, default=False)
    ai_dm_personality = Column(String(50), default="balanced")  # balanced, storytelling, tactical
    ai_players_enabled = Column(Boolean, default=False)
    
    # Campaign state
    current_location = Column(String(200))
    current_chapter = Column(String(200))
    narrative_summary = Column(Text)
    
    # Archiving
    last_activity = Column(DateTime(timezone=True), default=func.now())
    archived_at = Column(DateTime(timezone=True))
    archived_s3_key = Column(String(500))
    archive_notification_sent = Column(Boolean, default=False)
    
    # Images
    banner_image_url = Column(String(500))
    thumbnail_url = Column(String(500))
    
    # Settings (JSON string)
    settings = Column(Text, default='{}')
    
    # Relationships
    members = relationship("CampaignMember", back_populates="campaign", cascade="all, delete-orphan")
    spells = relationship("Spell", back_populates="campaign", cascade="all, delete-orphan")
    generated_content = relationship("GeneratedContent", back_populates="campaign")
    lore_entries = relationship("LoreEntry", back_populates="campaign")
    world = relationship("World", back_populates="campaigns", uselist=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Campaign {self.name} (DM: {self.dm_user_id})>"
    
    @property
    def is_active(self) -> bool:
        return self.status == CampaignStatus.ACTIVE
    
    @property
    def is_archived(self) -> bool:
        return self.status == CampaignStatus.ARCHIVED
    
    @property
    def can_accept_players(self) -> bool:
        """Check if campaign is accepting new players"""
        return (
            self.status in [CampaignStatus.PLANNING, CampaignStatus.ACTIVE]
            and self.visibility in [CampaignVisibility.PUBLIC, CampaignVisibility.INVITE_ONLY]
        )
