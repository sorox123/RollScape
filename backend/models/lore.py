"""
Lore Management System - Campaign knowledge and context
"""

from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base
from db_types import GUID


class LoreCategory(str, enum.Enum):
    """Categories of lore entries"""
    HISTORY = "history"
    GEOGRAPHY = "geography"
    RELIGION = "religion"
    POLITICS = "politics"
    CULTURE = "culture"
    MAGIC = "magic"
    FACTION = "faction"
    CHARACTER = "character"
    EVENT = "event"
    CUSTOM = "custom"


class LoreEntry(Base):
    """Campaign lore entries for AI context and world building"""
    __tablename__ = "lore_entries"
    
    id = Column(GUID(), primary_key=True)
    
    # Lore content
    title = Column(String(255), nullable=False, index=True)
    content = Column(Text, nullable=False)
    summary = Column(Text)  # Short summary for AI context
    
    # Categorization
    category = Column(SQLEnum(LoreCategory), nullable=False, index=True)
    tags = Column(Text)  # Comma-separated tags
    
    # Ownership
    campaign_id = Column(GUID(), ForeignKey("campaigns.id"), nullable=False, index=True)
    created_by_user_id = Column(GUID(), ForeignKey("users.id"), nullable=False, index=True)
    
    # AI integration
    importance = Column(Integer, default=5)  # 1-10 scale for AI context priority
    is_secret = Column(Boolean, default=False)  # Hidden from players
    reveal_condition = Column(Text)  # Conditions to reveal to players
    
    # Relationships
    related_npcs = Column(Text)  # Comma-separated NPC IDs
    related_locations = Column(Text)  # Comma-separated location IDs
    related_events = Column(Text)  # Comma-separated event IDs
    
    # Vector embedding for semantic search
    embedding = Column(Text)  # Store as JSON array or use vector extension
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_referenced = Column(DateTime)  # When AI last used this lore
    
    # Relationships
    campaign = relationship("Campaign", back_populates="lore_entries")
    creator = relationship("User", foreign_keys=[created_by_user_id])
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "title": self.title,
            "content": self.content,
            "summary": self.summary,
            "category": self.category.value if self.category else None,
            "tags": self.tags.split(',') if self.tags else [],
            "campaign_id": str(self.campaign_id),
            "created_by_user_id": str(self.created_by_user_id),
            "importance": self.importance,
            "is_secret": self.is_secret,
            "reveal_condition": self.reveal_condition,
            "related_npcs": self.related_npcs.split(',') if self.related_npcs else [],
            "related_locations": self.related_locations.split(',') if self.related_locations else [],
            "related_events": self.related_events.split(',') if self.related_events else [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_referenced": self.last_referenced.isoformat() if self.last_referenced else None,
        }
