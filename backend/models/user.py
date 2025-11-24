"""
User model - Core authentication and profile management.
"""

from sqlalchemy import Column, String, Boolean, DateTime, Enum, Integer

from sqlalchemy.sql import func
from database import Base
from db_types import GUID, FlexJSON
import uuid
import enum


class SubscriptionTier(str, enum.Enum):
    """Subscription tier enumeration - Aligned with Stripe payment tiers"""
    FREE = "free"
    BASIC = "basic"
    PREMIUM = "premium"
    ULTIMATE = "ultimate"


class SubscriptionStatus(str, enum.Enum):
    """Subscription status"""
    ACTIVE = "active"
    CANCELED = "canceled"
    PAST_DUE = "past_due"
    TRIALING = "trialing"


class User(Base):
    """User model for authentication and profile"""
    __tablename__ = "users"
    
    # Primary
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    
    # Profile
    display_name = Column(String(100))
    avatar_url = Column(String(500))
    bio = Column(String(500))
    
    # Authentication (Supabase handles this, but we track state)
    email_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Subscription
    subscription_tier = Column(
        Enum(SubscriptionTier), 
        default=SubscriptionTier.FREE,
        nullable=False
    )
    subscription_status = Column(
        Enum(SubscriptionStatus),
        default=SubscriptionStatus.ACTIVE
    )
    stripe_customer_id = Column(String(100), unique=True)
    stripe_subscription_id = Column(String(100))  # Track active Stripe subscription
    subscription_started_at = Column(DateTime(timezone=True))
    subscription_ends_at = Column(DateTime(timezone=True))
    current_period_end = Column(DateTime(timezone=True))  # Current billing period end
    
    # Usage tracking (monthly quotas)
    monthly_ai_images_used = Column(Integer, default=0)
    monthly_ai_players_used = Column(Integer, default=0)
    pdf_imports_count = Column(Integer, default=0)
    quota_reset_date = Column(DateTime(timezone=True))
    
    # Preferences
    preferences = Column(String, default='{}')  # JSON string
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login_at = Column(DateTime(timezone=True))
    
    def __repr__(self):
        return f"<User {self.username} ({self.subscription_tier})>"
    
    @property
    def is_free_tier(self) -> bool:
        return self.subscription_tier == SubscriptionTier.FREE
    
    @property
    def is_basic_tier(self) -> bool:
        return self.subscription_tier == SubscriptionTier.BASIC
    
    @property
    def is_premium_tier(self) -> bool:
        return self.subscription_tier == SubscriptionTier.PREMIUM
    
    @property
    def is_ultimate_tier(self) -> bool:
        return self.subscription_tier == SubscriptionTier.ULTIMATE
    
    @property
    def ai_image_quota(self) -> int:
        """Monthly AI image generation quota"""
        quotas = {
            SubscriptionTier.FREE: 0,
            SubscriptionTier.BASIC: 25,
            SubscriptionTier.PREMIUM: 100,
            SubscriptionTier.ULTIMATE: 500
        }
        return quotas.get(self.subscription_tier, 0)
    
    @property
    def ai_player_quota(self) -> int:
        """AI player limit per campaign"""
        quotas = {
            SubscriptionTier.FREE: 2,
            SubscriptionTier.BASIC: 4,
            SubscriptionTier.PREMIUM: 6,
            SubscriptionTier.ULTIMATE: 10
        }
        return quotas.get(self.subscription_tier, 0)
    
    @property
    def campaign_quota(self) -> int:
        """Active campaign limit"""
        quotas = {
            SubscriptionTier.FREE: 1,
            SubscriptionTier.BASIC: 3,
            SubscriptionTier.PREMIUM: 10,
            SubscriptionTier.ULTIMATE: 999  # Unlimited
        }
        return quotas.get(self.subscription_tier, 0)
    
    @property
    def pdf_import_quota(self) -> int:
        """PDF rulebook import limit"""
        quotas = {
            SubscriptionTier.FREE: 0,
            SubscriptionTier.BASIC: 3,
            SubscriptionTier.PREMIUM: 10,
            SubscriptionTier.ULTIMATE: 999  # Unlimited
        }
        return quotas.get(self.subscription_tier, 0)
