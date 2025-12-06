"""
Spell models for D&D 5e spell library and homebrew spells.
Supports SRD spells, campaign homebrew, and player custom spells.
"""

from sqlalchemy import Column, String, Integer, Boolean, Text, ForeignKey, DateTime, Enum, Table
from sqlalchemy.orm import relationship
from database import Base
from db_types import GUID
import uuid
from datetime import datetime
import enum


class SpellSchool(str, enum.Enum):
    """Schools of magic"""
    ABJURATION = "abjuration"
    CONJURATION = "conjuration"
    DIVINATION = "divination"
    ENCHANTMENT = "enchantment"
    EVOCATION = "evocation"
    ILLUSION = "illusion"
    NECROMANCY = "necromancy"
    TRANSMUTATION = "transmutation"


class SpellSource(str, enum.Enum):
    """Spell source type"""
    SRD = "srd"  # System Reference Document (official D&D)
    HOMEBREW = "homebrew"  # User-created or campaign-specific
    WORLD = "world"  # World/game system spells


class Spell(Base):
    """
    Spell model for spell library.
    Stores SRD spells, campaign homebrew, and player custom spells.
    """
    __tablename__ = "spells"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    
    # Basic Info
    name = Column(String(100), nullable=False)
    level = Column(Integer, nullable=False)  # 0-9 (0 = cantrip)
    school = Column(Enum(SpellSchool), nullable=False)
    
    # Casting Details
    casting_time = Column(String(50), nullable=False, default="1 action")
    range = Column(String(50), nullable=False, default="30 feet")
    # Components stored as comma-separated: "V,S,M"
    components = Column(String(10), nullable=False, default="V,S")
    material_components = Column(String(500), nullable=True)
    duration = Column(String(50), nullable=False, default="Instantaneous")
    
    # Spell Properties
    concentration = Column(Boolean, default=False)
    ritual = Column(Boolean, default=False)
    
    # Description
    description = Column(Text, nullable=False)
    at_higher_levels = Column(Text, nullable=True)
    
    # Mechanics
    damage_dice = Column(String(20), nullable=True)  # e.g., "3d6", "8d8"
    damage_type = Column(String(20), nullable=True)  # e.g., "fire", "cold", "healing"
    save_type = Column(String(20), nullable=True)  # e.g., "dexterity", "wisdom"
    spell_attack = Column(Boolean, default=False)  # Requires spell attack roll
    
    # Source and Ownership
    source = Column(Enum(SpellSource), nullable=False, default=SpellSource.SRD)
    campaign_id = Column(GUID(), ForeignKey("campaigns.id"), nullable=True)
    world_id = Column(String(100), nullable=True)  # For future world system
    created_by_user_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    
    # Classes that can use this spell (stored as comma-separated)
    # e.g., "wizard,sorcerer,warlock"
    classes = Column(String(200), nullable=False, default="")
    
    # Tags for organization (comma-separated)
    # e.g., "damage,fire,aoe"
    tags = Column(String(200), nullable=False, default="")
    
    # Sharing
    is_public = Column(Boolean, default=False)  # Homebrew spells can be shared
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    campaign = relationship("Campaign", back_populates="spells")
    created_by = relationship("User", back_populates="created_spells")
    character_spells = relationship("CharacterSpell", back_populates="spell", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Spell(name='{self.name}', level={self.level}, school='{self.school}')>"
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": str(self.id),
            "name": self.name,
            "level": self.level,
            "school": self.school.value,
            "casting_time": self.casting_time,
            "range": self.range,
            "components": self.components.split(",") if self.components else [],
            "material_components": self.material_components,
            "duration": self.duration,
            "concentration": self.concentration,
            "ritual": self.ritual,
            "description": self.description,
            "at_higher_levels": self.at_higher_levels,
            "damage_dice": self.damage_dice,
            "damage_type": self.damage_type,
            "save_type": self.save_type,
            "spell_attack": self.spell_attack,
            "source": self.source.value,
            "campaign_id": str(self.campaign_id) if self.campaign_id else None,
            "world_id": self.world_id,
            "created_by_user_id": str(self.created_by_user_id) if self.created_by_user_id else None,
            "classes": self.classes.split(",") if self.classes else [],
            "tags": self.tags.split(",") if self.tags else [],
            "is_public": self.is_public,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class CharacterSpell(Base):
    """
    Character's spellbook entry.
    Links characters to spells they know/have prepared.
    """
    __tablename__ = "character_spells"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    
    # Foreign Keys
    character_id = Column(GUID(), ForeignKey("characters.id"), nullable=False)
    spell_id = Column(GUID(), ForeignKey("spells.id"), nullable=False)
    
    # Spell State
    prepared = Column(Boolean, default=False)  # For wizards who prepare spells
    always_prepared = Column(Boolean, default=False)  # Domain spells, racial, etc.
    
    # Source of spell knowledge
    source = Column(String(50), default="class")  # class, item, feat, racial, multiclass
    item_id = Column(GUID(), nullable=True)  # If from magic item
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Metadata
    learned_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    character = relationship("Character", back_populates="character_spells")
    spell = relationship("Spell", back_populates="character_spells")
    
    def __repr__(self):
        return f"<CharacterSpell(character_id='{self.character_id}', spell_id='{self.spell_id}')>"
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": str(self.id),
            "character_id": str(self.character_id),
            "spell_id": str(self.spell_id),
            "prepared": self.prepared,
            "always_prepared": self.always_prepared,
            "source": self.source,
            "item_id": str(self.item_id) if self.item_id else None,
            "notes": self.notes,
            "learned_at": self.learned_at.isoformat() if self.learned_at else None,
        }
