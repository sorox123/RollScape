"""
Models package initialization.
Import all models here for easy access.
"""

from database import Base
from models.user import User, SubscriptionTier, SubscriptionStatus
from models.campaign import Campaign, CampaignStatus, CampaignVisibility
from models.character import Character, CharacterType
from models.game_session import GameSession, SessionStatus
from models.campaign_member import CampaignMember, MemberRole
from models.character_effect import CharacterEffect, EffectType
from models.session_log import SessionLog
from models.generated_content import GeneratedImage, GeneratedMap, ImageType, MapType
from models.spell import Spell, CharacterSpell, SpellSchool, SpellSource

# Export all models
__all__ = [
    "Base",
    "User",
    "SubscriptionTier",
    "SubscriptionStatus",
    "Campaign",
    "CampaignStatus",
    "CampaignVisibility",
    "Character",
    "CharacterType",
    "GameSession",
    "SessionStatus",
    "CampaignMember",
    "MemberRole",
    "CharacterEffect",
    "EffectType",
    "SessionLog",
    "GeneratedImage",
    "GeneratedMap",
    "ImageType",
    "MapType",
    "Spell",
    "CharacterSpell",
    "SpellSchool",
    "SpellSource",
]
