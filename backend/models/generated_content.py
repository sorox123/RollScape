"""AI-generated content - images and maps"""

from sqlalchemy import Column, String, ForeignKey, DateTime, Text, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import uuid
import enum


class ImageType(str, enum.Enum):
    """Type of generated image"""
    CHARACTER = "character"
    NPC = "npc"
    ITEM = "item"
    SCENE = "scene"
    MONSTER = "monster"


class MapType(str, enum.Enum):
    """Type of generated map"""
    BATTLE = "battle"
    WORLD = "world"
    DUNGEON = "dungeon"
    INTERIOR = "interior"


class GeneratedImage(Base):
    """
    AI-generated images (character portraits, NPC art, items, scenes).
    Tracks what was generated and links to campaigns/characters.
    """
    __tablename__ = "generated_images"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id = Column(String, ForeignKey("campaigns.id", ondelete="SET NULL"), index=True)
    created_by = Column(String, ForeignKey("users.id"), index=True)
    
    image_type = Column(SQLEnum(ImageType), nullable=False, index=True)
    related_id = Column(String, index=True)  # character_id, item_id, etc.
    name = Column(String(255))
    
    image_url = Column(Text, nullable=False)
    thumbnail_url = Column(Text)
    generation_prompt = Column(Text)
    style = Column(String(50))
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    campaign = relationship("Campaign")
    creator = relationship("User")
    
    def __repr__(self):
        return f"<GeneratedImage(type={self.image_type}, name={self.name})>"


class GeneratedMap(Base):
    """
    AI-generated battle maps.
    Includes grid information and metadata about features.
    """
    __tablename__ = "generated_maps"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id = Column(String, ForeignKey("campaigns.id", ondelete="SET NULL"), index=True)
    created_by = Column(String, ForeignKey("users.id"), index=True)
    
    name = Column(String(255))
    map_type = Column(SQLEnum(MapType), nullable=False, index=True)
    grid_type = Column(String(20))  # 'square', 'hexagonal', 'none'
    dimensions = Column(String(50))  # '30x40'
    
    image_url = Column(Text, nullable=False)
    thumbnail_url = Column(Text)
    map_metadata = Column(JSON)  # Features, obstacles, terrain, etc. (renamed from 'metadata' to avoid SQLAlchemy conflict)
    generation_prompt = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    campaign = relationship("Campaign")
    creator = relationship("User")
    
    def __repr__(self):
        return f"<GeneratedMap(type={self.map_type}, name={self.name}, dimensions={self.dimensions})>"
