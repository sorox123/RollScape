"""Character effects - buffs, debuffs, conditions"""

from sqlalchemy import Column, String, ForeignKey, DateTime, Integer, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import uuid
import enum


class EffectType(str, enum.Enum):
    """Type of effect on character"""
    BUFF = "buff"
    DEBUFF = "debuff"
    CONDITION = "condition"


class CharacterEffect(Base):
    """
    Active effects on characters (buffs, debuffs, conditions).
    Tracks duration and what stats are modified.
    """
    __tablename__ = "character_effects"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    character_id = Column(String, ForeignKey("characters.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(String, ForeignKey("game_sessions.id", ondelete="CASCADE"), nullable=True)
    
    name = Column(String(255), nullable=False)
    effect_type = Column(SQLEnum(EffectType), nullable=False)
    source = Column(String(255))  # Who/what applied it
    
    # Duration
    duration_type = Column(String(20))  # 'rounds', 'minutes', 'hours', 'until_save'
    duration_remaining = Column(Integer)
    
    # What it does (JSON object with stat modifiers)
    # Example: {"ac": 2, "speed": -10, "advantage_on": ["stealth"]}
    effects = Column(JSON, nullable=False)
    
    applied_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    character = relationship("Character", back_populates="active_effects")
    session = relationship("GameSession")
    
    def __repr__(self):
        return f"<CharacterEffect(name={self.name}, type={self.effect_type}, character_id={self.character_id})>"
