"""
Character model - Player characters and NPCs.
"""

from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from database import Base
import uuid
import enum


class CharacterType(str, enum.Enum):
    """Character type"""
    PLAYER = "player"
    NPC = "npc"
    AI_PLAYER = "ai_player"


class Character(Base):
    """Character model for PCs, NPCs, and AI players"""
    __tablename__ = "characters"
    
    # Primary
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    
    # Ownership
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)  # Null for NPCs
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id"), nullable=False)
    
    # Type
    character_type = Column(
        Enum(CharacterType),
        default=CharacterType.PLAYER,
        nullable=False
    )
    is_active = Column(Boolean, default=True)
    
    # Basic info
    race = Column(String(50))
    character_class = Column(String(100))  # "class" is reserved keyword
    level = Column(Integer, default=1)
    background = Column(String(100))
    alignment = Column(String(50))
    
    # Stats (stored as JSON for flexibility across rule systems)
    ability_scores = Column(JSONB, default={})  # {"str": 10, "dex": 14, ...}
    skills = Column(JSONB, default={})
    saving_throws = Column(JSONB, default={})
    
    # Combat stats
    max_hp = Column(Integer, default=10)
    current_hp = Column(Integer, default=10)
    temp_hp = Column(Integer, default=0)
    armor_class = Column(Integer, default=10)
    initiative_bonus = Column(Integer, default=0)
    speed = Column(Integer, default=30)
    
    # Features
    proficiencies = Column(JSONB, default=[])
    languages = Column(JSONB, default=[])
    features = Column(JSONB, default=[])
    equipment = Column(JSONB, default=[])
    spells = Column(JSONB, default=[])
    
    # Description
    description = Column(Text)
    backstory = Column(Text)
    personality_traits = Column(Text)
    ideals = Column(Text)
    bonds = Column(Text)
    flaws = Column(Text)
    
    # Visuals
    avatar_url = Column(String(500))
    token_url = Column(String(500))  # Battle map token
    
    # AI-specific (for AI players)
    ai_personality = Column(String(50))  # cautious, brave, witty, etc.
    ai_behavior_prompt = Column(Text)
    
    # Experience
    experience_points = Column(Integer, default=0)
    
    # Notes
    dm_notes = Column(Text)  # Private DM notes
    player_notes = Column(Text)  # Player's own notes
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Character {self.name} (Lv{self.level} {self.character_class})>"
    
    @property
    def is_player_character(self) -> bool:
        return self.character_type == CharacterType.PLAYER
    
    @property
    def is_npc(self) -> bool:
        return self.character_type == CharacterType.NPC
    
    @property
    def is_ai_controlled(self) -> bool:
        return self.character_type == CharacterType.AI_PLAYER
    
    @property
    def is_alive(self) -> bool:
        return self.current_hp > 0
    
    @property
    def is_bloodied(self) -> bool:
        """Character is below 50% HP"""
        return self.current_hp <= (self.max_hp / 2)
