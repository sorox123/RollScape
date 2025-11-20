"""
Subscription and Pricing API

Endpoints for viewing subscription tiers, checking limits, and managing subscriptions.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from models.subscription import (
    SubscriptionTier,
    SUBSCRIPTION_TIERS,
    get_tier_limits,
    can_use_feature,
    get_usage_limit,
    check_quota,
    get_upgrade_prompt
)

router = APIRouter(prefix="/api/subscription", tags=["Subscription"])


class UserSubscription(BaseModel):
    """User's current subscription status"""
    user_id: str
    tier: SubscriptionTier
    billing_cycle: str  # "monthly" or "yearly"
    started_at: str
    renews_at: str
    status: str  # "active", "cancelled", "expired"
    
    # Current usage
    campaigns_count: int
    ai_images_used_this_month: int
    storage_used_gb: float


class CheckLimitRequest(BaseModel):
    """Request to check if action is allowed"""
    action: str  # "create_campaign", "generate_image", "add_ai_player", etc.
    current_count: Optional[int] = None


@router.get("/tiers")
async def get_subscription_tiers():
    """
    Get all available subscription tiers with pricing and features
    """
    tiers = []
    
    for tier, data in SUBSCRIPTION_TIERS.items():
        tiers.append({
            "tier": tier.value,
            "name": data["name"],
            "price_monthly": data["price_monthly"],
            "price_yearly": data["price_yearly"],
            "savings_yearly": round(data["price_monthly"] * 12 - data["price_yearly"], 2),
            "description": data["description"],
            "features": data["features"],
            "limits": data["limits"].dict()
        })
    
    return {
        "tiers": tiers,
        "comparison": _build_comparison_table()
    }


@router.get("/current")
async def get_current_subscription(user_id: str = "user-123"):
    """
    Get user's current subscription status
    
    TODO: Get user_id from auth token
    """
    
    # TODO: Replace with database query
    # Mock data for now
    mock_subscription = UserSubscription(
        user_id=user_id,
        tier=SubscriptionTier.FREE,
        billing_cycle="monthly",
        started_at=datetime.now().isoformat(),
        renews_at=datetime.now().isoformat(),
        status="active",
        campaigns_count=1,
        ai_images_used_this_month=0,
        storage_used_gb=0.1
    )
    
    limits = get_tier_limits(mock_subscription.tier)
    tier_data = SUBSCRIPTION_TIERS[mock_subscription.tier]
    
    return {
        "subscription": mock_subscription,
        "limits": limits,
        "features": tier_data["features"],
        "usage": {
            "campaigns": check_quota(
                mock_subscription.tier,
                "campaigns",
                mock_subscription.campaigns_count
            ),
            "ai_images": check_quota(
                mock_subscription.tier,
                "ai_images",
                mock_subscription.ai_images_used_this_month
            ),
            "storage": {
                "current": mock_subscription.storage_used_gb,
                "limit": limits.storage_gb,
                "remaining": limits.storage_gb - mock_subscription.storage_used_gb,
                "percentage": round(
                    mock_subscription.storage_used_gb / limits.storage_gb * 100, 2
                )
            }
        }
    }


@router.post("/check-limit")
async def check_limit(request: CheckLimitRequest, user_id: str = "user-123"):
    """
    Check if user can perform an action based on their subscription tier
    
    Returns allowed status and upgrade prompt if blocked
    """
    
    # Get user's current tier (TODO: from database)
    current_tier = SubscriptionTier.FREE
    
    # Map actions to feature checks
    action_feature_map = {
        "generate_image": "ai_images",
        "use_map_mode": "map_mode",
        "create_campaign": "campaigns",
        "add_ai_player": "ai_players",
        "use_voice_chat": "voice_chat",
        "use_video_chat": "video_chat",
        "use_fog_of_war": "fog_of_war",
        "use_dynamic_lighting": "dynamic_lighting",
        "upload_custom_token": "custom_tokens",
        "use_animated_tokens": "animated_tokens",
    }
    
    feature = action_feature_map.get(request.action)
    
    if not feature:
        raise HTTPException(status_code=400, detail=f"Unknown action: {request.action}")
    
    # Check if feature is enabled for tier
    if feature in ["ai_images", "map_mode", "voice_chat", "video_chat", 
                   "fog_of_war", "dynamic_lighting", "custom_tokens", "animated_tokens"]:
        allowed = can_use_feature(current_tier, feature)
        
        if not allowed:
            upgrade_prompt = get_upgrade_prompt(current_tier, feature)
            return {
                "allowed": False,
                "reason": "feature_not_available",
                "upgrade_prompt": upgrade_prompt
            }
    
    # Check quota limits
    if feature in ["campaigns", "ai_players", "ai_images"] and request.current_count is not None:
        quota = check_quota(current_tier, feature, request.current_count)
        
        if not quota["allowed"]:
            upgrade_prompt = get_upgrade_prompt(
                current_tier,
                "multiple_campaigns" if feature == "campaigns" else feature
            )
            return {
                "allowed": False,
                "reason": "quota_exceeded",
                "quota": quota,
                "upgrade_prompt": upgrade_prompt
            }
        
        return {
            "allowed": True,
            "quota": quota
        }
    
    return {"allowed": True}


@router.post("/upgrade")
async def upgrade_subscription(
    target_tier: SubscriptionTier,
    billing_cycle: str,
    user_id: str = "user-123"
):
    """
    Upgrade user's subscription
    
    TODO: Integrate with payment processor (Stripe, Paddle, etc.)
    """
    
    # Validate target tier
    if target_tier == SubscriptionTier.FREE:
        raise HTTPException(
            status_code=400,
            detail="Cannot upgrade to free tier. Use /downgrade endpoint instead."
        )
    
    # Validate billing cycle
    if billing_cycle not in ["monthly", "yearly"]:
        raise HTTPException(
            status_code=400,
            detail="Billing cycle must be 'monthly' or 'yearly'"
        )
    
    tier_data = SUBSCRIPTION_TIERS[target_tier]
    price = tier_data["price_yearly"] if billing_cycle == "yearly" else tier_data["price_monthly"]
    
    # TODO: Create checkout session with payment processor
    # TODO: Update user subscription in database
    
    return {
        "message": "Subscription upgrade initiated",
        "tier": target_tier,
        "billing_cycle": billing_cycle,
        "price": price,
        "next_steps": "Payment processing would happen here with Stripe/Paddle"
    }


@router.post("/downgrade")
async def downgrade_subscription(user_id: str = "user-123"):
    """
    Downgrade user's subscription to free tier
    
    Takes effect at end of current billing period
    """
    
    # TODO: Update subscription status in database
    # Set status to "cancelled" but keep active until renews_at date
    
    return {
        "message": "Subscription will be downgraded to Free tier at end of billing period",
        "effective_date": datetime.now().isoformat(),
        "note": "You'll retain premium features until your current billing period ends"
    }


@router.get("/compare/{tier1}/{tier2}")
async def compare_tiers(tier1: SubscriptionTier, tier2: SubscriptionTier):
    """Compare two subscription tiers side by side"""
    
    tier1_data = SUBSCRIPTION_TIERS[tier1]
    tier2_data = SUBSCRIPTION_TIERS[tier2]
    
    return {
        "tier1": {
            "tier": tier1.value,
            "name": tier1_data["name"],
            "price_monthly": tier1_data["price_monthly"],
            "features": tier1_data["features"],
            "limits": tier1_data["limits"].dict()
        },
        "tier2": {
            "tier": tier2.value,
            "name": tier2_data["name"],
            "price_monthly": tier2_data["price_monthly"],
            "features": tier2_data["features"],
            "limits": tier2_data["limits"].dict()
        },
        "differences": _get_tier_differences(tier1_data["limits"], tier2_data["limits"])
    }


def _build_comparison_table():
    """Build feature comparison table for all tiers"""
    features = [
        {"name": "Active Campaigns", "key": "max_campaigns"},
        {"name": "Characters per Campaign", "key": "max_characters_per_campaign"},
        {"name": "AI Dungeon Master", "key": "ai_dm_enabled"},
        {"name": "AI Players", "key": "max_ai_players"},
        {"name": "AI Image Generation", "key": "ai_image_generation"},
        {"name": "Monthly AI Images", "key": "monthly_ai_images"},
        {"name": "Text Mode", "key": "text_mode_enabled"},
        {"name": "Map Mode", "key": "map_mode_enabled"},
        {"name": "Map Size", "key": "max_map_size"},
        {"name": "Custom Tokens", "key": "custom_tokens"},
        {"name": "Animated Tokens", "key": "animated_tokens"},
        {"name": "Fog of War", "key": "fog_of_war"},
        {"name": "Dynamic Lighting", "key": "dynamic_lighting"},
        {"name": "Voice Chat", "key": "voice_chat"},
        {"name": "Video Chat", "key": "video_chat"},
        {"name": "Storage", "key": "storage_gb"},
        {"name": "Priority Support", "key": "priority_support"},
    ]
    
    comparison = []
    for feature in features:
        row = {"feature": feature["name"]}
        for tier in SubscriptionTier:
            limits = get_tier_limits(tier)
            value = getattr(limits, feature["key"])
            row[tier.value] = value
        comparison.append(row)
    
    return comparison


def _get_tier_differences(limits1, limits2):
    """Get differences between two tier limit sets"""
    differences = []
    
    for field in limits1.__fields__:
        val1 = getattr(limits1, field)
        val2 = getattr(limits2, field)
        
        if val1 != val2:
            differences.append({
                "feature": field,
                "tier1_value": val1,
                "tier2_value": val2
            })
    
    return differences
