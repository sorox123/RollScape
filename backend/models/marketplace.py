"""
World Marketplace Models - Shareable worlds and dice textures
"""

from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base
from db_types import GUID


class WorldVisibility(str, enum.Enum):
    """World visibility levels"""
    PRIVATE = "private"
    UNLISTED = "unlisted"
    PUBLIC = "public"


class World(Base):
    """Shareable worlds for the marketplace"""
    __tablename__ = "worlds"
    
    id = Column(GUID(), primary_key=True)
    
    # World metadata
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    tagline = Column(String(500))  # Short pitch
    
    # Content
    setting = Column(Text)  # World setting/background
    lore = Column(Text)  # World lore
    rules = Column(Text)  # Custom rules/homebrew
    
    # Ownership & visibility
    created_by_user_id = Column(GUID(), ForeignKey("users.id"), nullable=False, index=True)
    visibility = Column(SQLEnum(WorldVisibility), default=WorldVisibility.PRIVATE, index=True)
    is_featured = Column(Boolean, default=False)
    
    # Categorization
    tags = Column(Text)  # Comma-separated tags
    game_system = Column(String(100), default="dnd5e")  # dnd5e, pathfinder, etc.
    themes = Column(Text)  # fantasy, sci-fi, horror, etc.
    
    # Content counts
    npc_count = Column(Integer, default=0)
    location_count = Column(Integer, default=0)
    quest_count = Column(Integer, default=0)
    monster_count = Column(Integer, default=0)
    item_count = Column(Integer, default=0)
    
    # Community metrics
    likes_count = Column(Integer, default=0)
    shares_count = Column(Integer, default=0)
    uses_count = Column(Integer, default=0)  # How many campaigns use this world
    rating_avg = Column(Float, default=0.0)
    rating_count = Column(Integer, default=0)
    
    # Cover image
    cover_image_url = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at = Column(DateTime)
    
    # Relationships
    creator = relationship("User", back_populates="worlds")
    campaigns = relationship("Campaign", back_populates="world")
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "tagline": self.tagline,
            "setting": self.setting,
            "lore": self.lore,
            "created_by_user_id": str(self.created_by_user_id),
            "visibility": self.visibility.value if self.visibility else None,
            "is_featured": self.is_featured,
            "tags": self.tags.split(',') if self.tags else [],
            "game_system": self.game_system,
            "themes": self.themes.split(',') if self.themes else [],
            "npc_count": self.npc_count,
            "location_count": self.location_count,
            "quest_count": self.quest_count,
            "monster_count": self.monster_count,
            "item_count": self.item_count,
            "likes_count": self.likes_count,
            "shares_count": self.shares_count,
            "uses_count": self.uses_count,
            "rating_avg": self.rating_avg,
            "rating_count": self.rating_count,
            "cover_image_url": self.cover_image_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "published_at": self.published_at.isoformat() if self.published_at else None,
        }


class WorldLike(Base):
    """Track user likes on worlds"""
    __tablename__ = "world_likes"
    
    id = Column(GUID(), primary_key=True)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False, index=True)
    world_id = Column(GUID(), ForeignKey("worlds.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class DiceTexture(Base):
    """Dice texture marketplace"""
    __tablename__ = "dice_textures"
    
    id = Column(GUID(), primary_key=True)
    
    # Texture metadata
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    preview_image_url = Column(Text, nullable=False)
    
    # Texture files (3D models or image sets for each die)
    d4_texture_url = Column(Text)
    d6_texture_url = Column(Text)
    d8_texture_url = Column(Text)
    d10_texture_url = Column(Text)
    d12_texture_url = Column(Text)
    d20_texture_url = Column(Text)
    d100_texture_url = Column(Text)
    
    # 3D model files (optional)
    d4_model_url = Column(Text)
    d6_model_url = Column(Text)
    d8_model_url = Column(Text)
    d10_model_url = Column(Text)
    d12_model_url = Column(Text)
    d20_model_url = Column(Text)
    d100_model_url = Column(Text)
    
    # Pricing & ownership
    created_by_user_id = Column(GUID(), ForeignKey("users.id"), nullable=False, index=True)
    is_free = Column(Boolean, default=True)
    price_cents = Column(Integer, default=0)  # Price in cents (e.g., 299 = $2.99)
    
    # Categorization
    tags = Column(Text)  # metal, wood, gemstone, fantasy, etc.
    style = Column(String(100))  # realistic, cartoon, minimalist, etc.
    
    # Visibility & featuring
    visibility = Column(SQLEnum(WorldVisibility), default=WorldVisibility.PUBLIC, index=True)
    is_featured = Column(Boolean, default=False)
    is_official = Column(Boolean, default=False)  # Official RollScape textures
    
    # Community metrics
    likes_count = Column(Integer, default=0)
    downloads_count = Column(Integer, default=0)
    purchases_count = Column(Integer, default=0)
    rating_avg = Column(Float, default=0.0)
    rating_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = relationship("User", back_populates="dice_textures")
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "preview_image_url": self.preview_image_url,
            "textures": {
                "d4": self.d4_texture_url,
                "d6": self.d6_texture_url,
                "d8": self.d8_texture_url,
                "d10": self.d10_texture_url,
                "d12": self.d12_texture_url,
                "d20": self.d20_texture_url,
                "d100": self.d100_texture_url,
            },
            "models": {
                "d4": self.d4_model_url,
                "d6": self.d6_model_url,
                "d8": self.d8_model_url,
                "d10": self.d10_model_url,
                "d12": self.d12_model_url,
                "d20": self.d20_model_url,
                "d100": self.d100_model_url,
            },
            "created_by_user_id": str(self.created_by_user_id),
            "is_free": self.is_free,
            "price_cents": self.price_cents,
            "price_display": f"${self.price_cents / 100:.2f}" if not self.is_free else "Free",
            "tags": self.tags.split(',') if self.tags else [],
            "style": self.style,
            "visibility": self.visibility.value if self.visibility else None,
            "is_featured": self.is_featured,
            "is_official": self.is_official,
            "likes_count": self.likes_count,
            "downloads_count": self.downloads_count,
            "purchases_count": self.purchases_count,
            "rating_avg": self.rating_avg,
            "rating_count": self.rating_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class DiceTexturePurchase(Base):
    """Track dice texture purchases"""
    __tablename__ = "dice_texture_purchases"
    
    id = Column(GUID(), primary_key=True)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False, index=True)
    texture_id = Column(GUID(), ForeignKey("dice_textures.id"), nullable=False, index=True)
    price_paid_cents = Column(Integer, nullable=False)
    stripe_payment_intent_id = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)


class DiceTextureLike(Base):
    """Track user likes on dice textures"""
    __tablename__ = "dice_texture_likes"
    
    id = Column(GUID(), primary_key=True)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False, index=True)
    texture_id = Column(GUID(), ForeignKey("dice_textures.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
