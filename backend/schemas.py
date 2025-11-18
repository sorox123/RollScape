"""
Pydantic schemas for API requests and responses.
These define the contract between frontend and backend.
"""

from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from models.user import SubscriptionTier, SubscriptionStatus
from models.campaign import CampaignStatus, CampaignVisibility
from models.character import CharacterType


# ============= USER SCHEMAS =============

class UserBase(BaseModel):
    """Base user fields"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    display_name: Optional[str] = Field(None, max_length=100)


class UserCreate(UserBase):
    """Schema for user registration"""
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    """Schema for updating user profile"""
    display_name: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=500)
    preferences: Optional[dict] = None


class UserResponse(UserBase):
    """Schema for user response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    display_name: Optional[str]
    avatar_url: Optional[str]
    bio: Optional[str]
    subscription_tier: SubscriptionTier
    subscription_status: SubscriptionStatus
    monthly_ai_images_used: int
    ai_image_quota: int
    ai_player_quota: int
    pdf_import_quota: int
    created_at: datetime
    last_login_at: Optional[datetime]


# ============= CAMPAIGN SCHEMAS =============

class CampaignBase(BaseModel):
    """Base campaign fields"""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    rule_system: str = Field(default="dnd_5e", max_length=100)
    max_players: int = Field(default=6, ge=1, le=20)
    visibility: CampaignVisibility = CampaignVisibility.PRIVATE


class CampaignCreate(CampaignBase):
    """Schema for creating a campaign"""
    ai_dm_enabled: bool = False
    ai_players_enabled: bool = False


class CampaignUpdate(BaseModel):
    """Schema for updating a campaign"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[CampaignStatus] = None
    visibility: Optional[CampaignVisibility] = None
    max_players: Optional[int] = Field(None, ge=1, le=20)
    current_location: Optional[str] = None
    current_chapter: Optional[str] = None
    ai_dm_personality: Optional[str] = None
    banner_image_url: Optional[str] = None


class CampaignResponse(CampaignBase):
    """Schema for campaign response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    dm_user_id: UUID
    status: CampaignStatus
    current_session_number: int
    ai_dm_enabled: bool
    ai_players_enabled: bool
    current_location: Optional[str]
    current_chapter: Optional[str]
    banner_image_url: Optional[str]
    thumbnail_url: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    last_activity: datetime


class CampaignListItem(BaseModel):
    """Lightweight schema for campaign lists"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    name: str
    description: Optional[str]
    dm_user_id: UUID
    status: CampaignStatus
    visibility: CampaignVisibility
    rule_system: str
    current_session_number: int
    thumbnail_url: Optional[str]
    created_at: datetime


# ============= CHARACTER SCHEMAS =============

class CharacterBase(BaseModel):
    """Base character fields"""
    name: str = Field(..., min_length=1, max_length=100)
    race: Optional[str] = Field(None, max_length=50)
    character_class: Optional[str] = Field(None, max_length=100)
    level: int = Field(default=1, ge=1, le=20)
    background: Optional[str] = None
    alignment: Optional[str] = None


class CharacterCreate(CharacterBase):
    """Schema for creating a character"""
    campaign_id: UUID
    character_type: CharacterType = CharacterType.PLAYER
    ability_scores: dict = Field(default_factory=dict)
    max_hp: int = Field(default=10, ge=1)
    armor_class: int = Field(default=10, ge=1)


class CharacterUpdate(BaseModel):
    """Schema for updating a character"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    level: Optional[int] = Field(None, ge=1, le=20)
    current_hp: Optional[int] = None
    temp_hp: Optional[int] = None
    max_hp: Optional[int] = None
    armor_class: Optional[int] = None
    description: Optional[str] = None
    backstory: Optional[str] = None
    avatar_url: Optional[str] = None
    equipment: Optional[list] = None
    spells: Optional[list] = None
    player_notes: Optional[str] = None


class CharacterResponse(CharacterBase):
    """Schema for character response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    user_id: Optional[UUID]
    campaign_id: UUID
    character_type: CharacterType
    is_active: bool
    ability_scores: dict
    skills: dict
    max_hp: int
    current_hp: int
    temp_hp: int
    armor_class: int
    initiative_bonus: int
    speed: int
    description: Optional[str]
    backstory: Optional[str]
    avatar_url: Optional[str]
    token_url: Optional[str]
    experience_points: int
    created_at: datetime


# ============= GAME SESSION SCHEMAS =============

class GameSessionCreate(BaseModel):
    """Schema for creating a game session"""
    campaign_id: UUID
    title: Optional[str] = None
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None


class GameSessionUpdate(BaseModel):
    """Schema for updating a game session"""
    title: Optional[str] = None
    status: Optional[str] = None
    current_scene: Optional[str] = None
    summary: Optional[str] = None


class GameSessionResponse(BaseModel):
    """Schema for game session response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    campaign_id: UUID
    session_number: int
    title: Optional[str]
    description: Optional[str]
    status: str
    scheduled_at: Optional[datetime]
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    duration_minutes: Optional[int]
    current_scene: Optional[str]
    summary: Optional[str]
    ai_requests_count: int
    ai_tokens_used: int
    ai_images_generated: int
    created_at: datetime


# ============= COMMON SCHEMAS =============

class MessageResponse(BaseModel):
    """Generic message response"""
    message: str
    detail: Optional[str] = None


class ErrorResponse(BaseModel):
    """Error response schema"""
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None


class PaginatedResponse(BaseModel):
    """Generic paginated response"""
    items: List[dict]
    total: int
    page: int
    page_size: int
    total_pages: int
