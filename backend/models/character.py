"""
Character model - Player characters and NPCs.
"""

from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from db_types import GUID, FlexJSON
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
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    
    # Ownership
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=True)  # Null for NPCs
    campaign_id = Column(GUID(), ForeignKey("campaigns.id"), nullable=False)
    
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
    subclass = Column(String(100))
    level = Column(Integer, default=1)
    multiclass = Column(FlexJSON, default=[])  # [{"class": "Fighter", "level": 3}]
    background = Column(String(100))
    alignment = Column(String(50))
    
    # Appearance
    age = Column(Integer)
    height = Column(String(20))
    weight = Column(String(20))
    eyes = Column(String(50))
    skin = Column(String(50))
    hair = Column(String(50))
    
    # Stats (stored as JSON for flexibility across rule systems)
    ability_scores = Column(FlexJSON, default={})  # {"str": 10, "dex": 14, ...}
    ability_score_improvements = Column(FlexJSON, default={})  # Track ASI history
    skills = Column(FlexJSON, default={})
    saving_throws = Column(FlexJSON, default={})
    proficiency_bonus = Column(Integer, default=2)
    
    # Combat stats
    max_hp = Column(Integer, default=10)
    current_hp = Column(Integer, default=10)
    temp_hp = Column(Integer, default=0)
    armor_class = Column(Integer, default=10)
    initiative_bonus = Column(Integer, default=0)
    speed = Column(Integer, default=30)
    
    # Death saves
    death_save_successes = Column(Integer, default=0)
    death_save_failures = Column(Integer, default=0)
    
    # Hit dice
    hit_dice_total = Column(Integer, default=1)
    hit_dice_remaining = Column(Integer, default=1)
    hit_die_type = Column(String(10), default="d8")
    
    # Passive scores
    passive_perception = Column(Integer, default=10)
    passive_investigation = Column(Integer, default=10)
    passive_insight = Column(Integer, default=10)
    
    # Features
    proficiencies = Column(FlexJSON, default=[])
    languages = Column(FlexJSON, default=[])
    features = Column(FlexJSON, default=[])
    
    # Equipment (detailed tracking)
    weapons = Column(FlexJSON, default=[])
    armor = Column(FlexJSON, default={})
    inventory = Column(FlexJSON, default=[])
    equipment = Column(FlexJSON, default=[])  # Legacy field, keeping for compatibility
    attunement_slots_used = Column(Integer, default=0)
    
    # Currency
    currency = Column(FlexJSON, default={"cp": 0, "sp": 0, "ep": 0, "gp": 0, "pp": 0})
    
    # Spellcasting
    spells = Column(FlexJSON, default=[])
    spell_slots = Column(FlexJSON, default={})  # {"1": 4, "2": 3, ...}
    spell_slots_used = Column(FlexJSON, default={})
    spellcasting_ability = Column(String(3))  # INT, WIS, CHA
    spell_save_dc = Column(Integer)
    spell_attack_bonus = Column(Integer)
    
    # Class resources (Ki, Rage, Sorcery Points, etc.)
    class_resources = Column(FlexJSON, default={})
    
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
    
    # Status effects
    inspiration = Column(Boolean, default=False)
    exhaustion_level = Column(Integer, default=0)
    conditions = Column(FlexJSON, default=[])  # ["poisoned", "charmed"]
    
    # Notes
    dm_notes = Column(Text)  # Private DM notes
    player_notes = Column(Text)  # Player's own notes
    
    # Relationships
    active_effects = relationship("CharacterEffect", back_populates="character", cascade="all, delete-orphan")
    character_spells = relationship("CharacterSpell", back_populates="character", cascade="all, delete-orphan")
    
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
