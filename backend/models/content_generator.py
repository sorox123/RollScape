"""
AI Content Generator Models - NPCs, Monsters, Items, Locations
"""

from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base
from db_types import GUID


class ContentType(str, enum.Enum):
    """Type of generated content"""
    NPC = "npc"
    MONSTER = "monster"
    ITEM = "item"
    LOCATION = "location"
    QUEST = "quest"
    LORE = "lore"


class ContentVisibility(str, enum.Enum):
    """Content visibility levels"""
    PRIVATE = "private"
    CAMPAIGN = "campaign"
    WORLD = "world"
    PUBLIC = "public"


class GeneratedContent(Base):
    """AI-generated content (NPCs, monsters, items, locations, etc.)"""
    __tablename__ = "generated_content"
    
    id = Column(GUID(), primary_key=True)
    
    # Content metadata
    content_type = Column(SQLEnum(ContentType), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    
    # Content data (JSON structure varies by type)
    content_data = Column(Text, nullable=False)  # JSON string
    
    # Ownership & visibility
    created_by_user_id = Column(GUID(), ForeignKey("users.id"), nullable=False, index=True)
    campaign_id = Column(GUID(), ForeignKey("campaigns.id"), nullable=True, index=True)
    world_id = Column(GUID(), nullable=True, index=True)  # For world marketplace
    visibility = Column(SQLEnum(ContentVisibility), default=ContentVisibility.PRIVATE, index=True)
    
    # AI generation metadata
    prompt = Column(Text)  # Original prompt used
    model_used = Column(String(100))  # e.g., "gpt-4-turbo-preview"
    generation_tokens = Column(Integer)
    
    # Tags and categorization
    tags = Column(Text)  # Comma-separated tags
    challenge_rating = Column(String(20))  # For monsters
    rarity = Column(String(50))  # For items
    item_type = Column(String(100))  # weapon, armor, potion, etc.
    
    # Community features
    is_featured = Column(Boolean, default=False)
    is_public = Column(Boolean, default=False)
    likes_count = Column(Integer, default=0)
    uses_count = Column(Integer, default=0)
    
    # Image generation
    image_url = Column(Text)
    image_prompt = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = relationship("User", back_populates="generated_content", foreign_keys=[created_by_user_id])
    campaign = relationship("Campaign", back_populates="generated_content")
    
    def to_dict(self):
        """Convert to dictionary"""
        import json
        
        return {
            "id": str(self.id),
            "content_type": self.content_type.value if self.content_type else None,
            "name": self.name,
            "description": self.description,
            "content_data": json.loads(self.content_data) if self.content_data else {},
            "created_by_user_id": str(self.created_by_user_id) if self.created_by_user_id else None,
            "campaign_id": str(self.campaign_id) if self.campaign_id else None,
            "world_id": str(self.world_id) if self.world_id else None,
            "visibility": self.visibility.value if self.visibility else None,
            "prompt": self.prompt,
            "model_used": self.model_used,
            "tags": self.tags.split(',') if self.tags else [],
            "challenge_rating": self.challenge_rating,
            "rarity": self.rarity,
            "item_type": self.item_type,
            "is_featured": self.is_featured,
            "is_public": self.is_public,
            "likes_count": self.likes_count,
            "uses_count": self.uses_count,
            "image_url": self.image_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class ContentLike(Base):
    """Track user likes on generated content"""
    __tablename__ = "content_likes"
    
    id = Column(GUID(), primary_key=True)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False, index=True)
    content_id = Column(GUID(), ForeignKey("generated_content.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "content_id": str(self.content_id),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
