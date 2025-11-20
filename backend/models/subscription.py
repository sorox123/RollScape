"""
Subscription and Pricing Models

Defines subscription tiers, feature limits, and quota management.
"""

from enum import Enum
from typing import Dict, Any, Optional
from pydantic import BaseModel


class SubscriptionTier(str, Enum):
    """Subscription tier levels"""
    FREE = "free"
    BASIC = "basic"
    PREMIUM = "premium"
    ULTIMATE = "ultimate"


class FeatureLimits(BaseModel):
    """Feature limits per subscription tier"""
    
    # Campaign limits
    max_campaigns: int
    max_characters_per_campaign: int
    
    # AI Features
    ai_dm_enabled: bool
    ai_player_enabled: bool
    max_ai_players: int
    ai_image_generation: bool
    monthly_ai_images: int
    
    # Gameplay modes
    text_mode_enabled: bool
    map_mode_enabled: bool
    
    # Map features
    max_map_size: str  # "small", "medium", "large", "unlimited"
    custom_tokens: bool
    animated_tokens: bool
    fog_of_war: bool
    dynamic_lighting: bool
    
    # Communication
    voice_chat: bool
    video_chat: bool
    
    # Storage
    storage_gb: int
    
    # Support
    priority_support: bool


# Subscription tier definitions
SUBSCRIPTION_TIERS: Dict[SubscriptionTier, Dict[str, Any]] = {
    SubscriptionTier.FREE: {
        "name": "Free",
        "price_monthly": 0.00,
        "price_yearly": 0.00,
        "description": "Get started with text-based D&D",
        "limits": FeatureLimits(
            # Campaigns
            max_campaigns=1,
            max_characters_per_campaign=4,
            
            # AI Features
            ai_dm_enabled=True,
            ai_player_enabled=True,
            max_ai_players=2,
            ai_image_generation=False,
            monthly_ai_images=0,
            
            # Gameplay modes
            text_mode_enabled=True,
            map_mode_enabled=False,
            
            # Map features
            max_map_size="none",
            custom_tokens=False,
            animated_tokens=False,
            fog_of_war=False,
            dynamic_lighting=False,
            
            # Communication
            voice_chat=False,
            video_chat=False,
            
            # Storage
            storage_gb=1,
            
            # Support
            priority_support=False
        ),
        "features": [
            "1 Active Campaign",
            "Text-Based Gameplay Only",
            "1 AI Dungeon Master",
            "Up to 2 AI Players",
            "Up to 4 Characters per Campaign",
            "Basic Character Sheets",
            "Dice Roller",
            "Chat Messaging",
            "1 GB Storage"
        ]
    },
    
    SubscriptionTier.BASIC: {
        "name": "Basic",
        "price_monthly": 9.99,
        "price_yearly": 99.99,  # ~2 months free
        "description": "Unlock maps and limited AI art generation",
        "limits": FeatureLimits(
            # Campaigns
            max_campaigns=3,
            max_characters_per_campaign=6,
            
            # AI Features
            ai_dm_enabled=True,
            ai_player_enabled=True,
            max_ai_players=4,
            ai_image_generation=True,
            monthly_ai_images=25,
            
            # Gameplay modes
            text_mode_enabled=True,
            map_mode_enabled=True,
            
            # Map features
            max_map_size="medium",
            custom_tokens=True,
            animated_tokens=False,
            fog_of_war=True,
            dynamic_lighting=False,
            
            # Communication
            voice_chat=True,
            video_chat=False,
            
            # Storage
            storage_gb=5,
            
            # Support
            priority_support=False
        ),
        "features": [
            "3 Active Campaigns",
            "Text & Map-Based Gameplay",
            "1 AI Dungeon Master",
            "Up to 4 AI Players",
            "Up to 6 Characters per Campaign",
            "25 AI Images per Month",
            "Custom Token Upload",
            "Fog of War",
            "Voice Chat",
            "5 GB Storage"
        ]
    },
    
    SubscriptionTier.PREMIUM: {
        "name": "Premium",
        "price_monthly": 19.99,
        "price_yearly": 199.99,  # ~2 months free
        "description": "Full features with generous AI generation",
        "limits": FeatureLimits(
            # Campaigns
            max_campaigns=10,
            max_characters_per_campaign=8,
            
            # AI Features
            ai_dm_enabled=True,
            ai_player_enabled=True,
            max_ai_players=6,
            ai_image_generation=True,
            monthly_ai_images=100,
            
            # Gameplay modes
            text_mode_enabled=True,
            map_mode_enabled=True,
            
            # Map features
            max_map_size="large",
            custom_tokens=True,
            animated_tokens=True,
            fog_of_war=True,
            dynamic_lighting=True,
            
            # Communication
            voice_chat=True,
            video_chat=True,
            
            # Storage
            storage_gb=25,
            
            # Support
            priority_support=True
        ),
        "features": [
            "10 Active Campaigns",
            "Text & Map-Based Gameplay",
            "1 AI Dungeon Master",
            "Up to 6 AI Players",
            "Up to 8 Characters per Campaign",
            "100 AI Images per Month",
            "Custom & Animated Tokens",
            "Dynamic Lighting & Fog of War",
            "Voice & Video Chat",
            "Priority Support",
            "25 GB Storage"
        ]
    },
    
    SubscriptionTier.ULTIMATE: {
        "name": "Ultimate",
        "price_monthly": 39.99,
        "price_yearly": 399.99,  # ~2 months free
        "description": "Unlimited campaigns and AI generation for serious DMs",
        "limits": FeatureLimits(
            # Campaigns
            max_campaigns=999,  # Effectively unlimited
            max_characters_per_campaign=12,
            
            # AI Features
            ai_dm_enabled=True,
            ai_player_enabled=True,
            max_ai_players=10,
            ai_image_generation=True,
            monthly_ai_images=500,
            
            # Gameplay modes
            text_mode_enabled=True,
            map_mode_enabled=True,
            
            # Map features
            max_map_size="unlimited",
            custom_tokens=True,
            animated_tokens=True,
            fog_of_war=True,
            dynamic_lighting=True,
            
            # Communication
            voice_chat=True,
            video_chat=True,
            
            # Storage
            storage_gb=100,
            
            # Support
            priority_support=True
        ),
        "features": [
            "Unlimited Campaigns",
            "Text & Map-Based Gameplay",
            "1 AI Dungeon Master",
            "Up to 10 AI Players",
            "Up to 12 Characters per Campaign",
            "500 AI Images per Month",
            "Custom & Animated Tokens",
            "Dynamic Lighting & Fog of War",
            "Voice & Video Chat",
            "Priority Support",
            "100 GB Storage",
            "Early Access to New Features"
        ]
    }
}


def get_tier_limits(tier: SubscriptionTier) -> FeatureLimits:
    """Get feature limits for a subscription tier"""
    return SUBSCRIPTION_TIERS[tier]["limits"]


def can_use_feature(tier: SubscriptionTier, feature: str) -> bool:
    """Check if a feature is available for a tier"""
    limits = get_tier_limits(tier)
    
    feature_checks = {
        "ai_dm": limits.ai_dm_enabled,
        "ai_player": limits.ai_player_enabled,
        "ai_images": limits.ai_image_generation,
        "map_mode": limits.map_mode_enabled,
        "text_mode": limits.text_mode_enabled,
        "voice_chat": limits.voice_chat,
        "video_chat": limits.video_chat,
        "fog_of_war": limits.fog_of_war,
        "dynamic_lighting": limits.dynamic_lighting,
        "custom_tokens": limits.custom_tokens,
        "animated_tokens": limits.animated_tokens,
        "priority_support": limits.priority_support,
    }
    
    return feature_checks.get(feature, False)


def get_usage_limit(tier: SubscriptionTier, resource: str) -> int:
    """Get usage limit for a resource"""
    limits = get_tier_limits(tier)
    
    usage_limits = {
        "campaigns": limits.max_campaigns,
        "characters": limits.max_characters_per_campaign,
        "ai_players": limits.max_ai_players,
        "ai_images": limits.monthly_ai_images,
        "storage": limits.storage_gb,
    }
    
    return usage_limits.get(resource, 0)


def check_quota(
    tier: SubscriptionTier,
    resource: str,
    current_usage: int
) -> Dict[str, Any]:
    """
    Check if user is within quota for a resource
    
    Returns:
        {
            "allowed": bool,
            "current": int,
            "limit": int,
            "remaining": int,
            "percentage": float
        }
    """
    limit = get_usage_limit(tier, resource)
    remaining = max(0, limit - current_usage)
    percentage = (current_usage / limit * 100) if limit > 0 else 0
    
    return {
        "allowed": current_usage < limit,
        "current": current_usage,
        "limit": limit,
        "remaining": remaining,
        "percentage": round(percentage, 2)
    }


class UpgradePrompt(BaseModel):
    """Upgrade prompt when user hits a limit"""
    feature: str
    current_tier: SubscriptionTier
    required_tier: SubscriptionTier
    message: str
    upgrade_benefits: list[str]


def get_upgrade_prompt(
    current_tier: SubscriptionTier,
    blocked_feature: str
) -> UpgradePrompt:
    """Generate an upgrade prompt when a feature is blocked"""
    
    prompts = {
        "ai_images": {
            "required_tier": SubscriptionTier.BASIC,
            "message": "AI Image Generation requires a Basic subscription or higher",
            "benefits": [
                "Generate character portraits from your character sheet",
                "Create custom battle maps and scenic environments",
                "25 AI-generated images per month (Basic tier)",
                "Save and reuse generated images"
            ]
        },
        "map_mode": {
            "required_tier": SubscriptionTier.BASIC,
            "message": "Map-Based Gameplay requires a Basic subscription or higher",
            "benefits": [
                "Interactive battle maps with tokens",
                "Fog of War for exploration",
                "Grid-based tactical combat",
                "Custom token upload"
            ]
        },
        "multiple_campaigns": {
            "required_tier": SubscriptionTier.BASIC,
            "message": "Free tier is limited to 1 active campaign",
            "benefits": [
                "Run up to 3 campaigns simultaneously (Basic)",
                "Perfect for different groups or story arcs",
                "All AI features available per campaign"
            ]
        },
        "ai_players": {
            "required_tier": SubscriptionTier.BASIC,
            "message": "Free tier is limited to 2 AI players",
            "benefits": [
                "Up to 4 AI players (Basic tier)",
                "Fill out your party automatically",
                "AI players with unique personalities"
            ]
        }
    }
    
    prompt_data = prompts.get(blocked_feature, {
        "required_tier": SubscriptionTier.BASIC,
        "message": f"This feature requires a subscription",
        "benefits": ["Unlock all premium features"]
    })
    
    return UpgradePrompt(
        feature=blocked_feature,
        current_tier=current_tier,
        required_tier=prompt_data["required_tier"],
        message=prompt_data["message"],
        upgrade_benefits=prompt_data["benefits"]
    )
