"""
Quota enforcement middleware and utilities.

Checks subscription limits before expensive operations.
Returns HTTP 402 Payment Required when quotas are exceeded.
"""

from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Callable

from database import get_db
from models.user import User
from models.subscription import get_tier_limits, get_upgrade_prompt


def check_quota(user_id: str, resource: str, db: Session) -> None:
    """
    Check if user has quota remaining for a resource.
    
    Args:
        user_id: User ID to check
        resource: Resource type ("ai_images", "campaigns", "ai_players")
        db: Database session
    
    Raises:
        HTTPException: 402 Payment Required if quota exceeded
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    limits = get_tier_limits(user.subscription_tier.value)
    
    if resource == "ai_images":
        if user.monthly_ai_images_used >= limits.monthly_ai_images:
            upgrade_prompt = get_upgrade_prompt(
                user.subscription_tier.value,
                "AI image generation"
            )
            raise HTTPException(
                status_code=402,
                detail={
                    "error": "AI image quota exceeded",
                    "used": user.monthly_ai_images_used,
                    "limit": limits.monthly_ai_images,
                    "upgrade_prompt": upgrade_prompt.message,
                    "recommended_tier": upgrade_prompt.recommended_tier
                }
            )
    
    elif resource == "campaigns":
        from models.campaign import Campaign
        campaign_count = db.query(Campaign).filter(Campaign.dm_id == user_id).count()
        
        if campaign_count >= limits.max_campaigns:
            upgrade_prompt = get_upgrade_prompt(
                user.subscription_tier.value,
                "campaign creation"
            )
            raise HTTPException(
                status_code=402,
                detail={
                    "error": "Campaign limit reached",
                    "used": campaign_count,
                    "limit": limits.max_campaigns,
                    "upgrade_prompt": upgrade_prompt.message,
                    "recommended_tier": upgrade_prompt.recommended_tier
                }
            )
    
    elif resource == "ai_players":
        if user.monthly_ai_players_used >= limits.max_ai_players:
            upgrade_prompt = get_upgrade_prompt(
                user.subscription_tier.value,
                "AI players"
            )
            raise HTTPException(
                status_code=402,
                detail={
                    "error": "AI player limit reached",
                    "used": user.monthly_ai_players_used,
                    "limit": limits.max_ai_players,
                    "upgrade_prompt": upgrade_prompt.message,
                    "recommended_tier": upgrade_prompt.recommended_tier
                }
            )


def increment_usage(user_id: str, resource: str, amount: int, db: Session) -> None:
    """
    Increment usage counter for a resource.
    
    Args:
        user_id: User ID
        resource: Resource type
        amount: Amount to increment by
        db: Database session
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return
    
    if resource == "ai_images":
        user.monthly_ai_images_used += amount
    elif resource == "ai_players":
        user.monthly_ai_players_used += amount
    
    db.commit()


def check_feature_access(user_id: str, feature: str, db: Session) -> None:
    """
    Check if user has access to a premium feature.
    
    Args:
        user_id: User ID to check
        feature: Feature name ("map_based_gameplay", "ai_images", "voice_chat", etc.)
        db: Database session
    
    Raises:
        HTTPException: 402 Payment Required if feature not available
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    limits = get_tier_limits(user.subscription_tier.value)
    
    # Check feature flags
    feature_map = {
        "map_based_gameplay": limits.map_based_gameplay,
        "ai_images": limits.ai_image_generation,
        "voice_chat": limits.voice_chat,
        "animated_tokens": limits.animated_tokens,
        "fog_of_war": limits.fog_of_war,
        "dynamic_lighting": limits.dynamic_lighting,
        "priority_support": limits.priority_support,
    }
    
    has_access = feature_map.get(feature, False)
    
    if not has_access:
        upgrade_prompt = get_upgrade_prompt(
            user.subscription_tier.value,
            feature.replace("_", " ").title()
        )
        raise HTTPException(
            status_code=402,
            detail={
                "error": f"Feature not available on {user.subscription_tier.value} plan",
                "feature": feature,
                "upgrade_prompt": upgrade_prompt.message,
                "recommended_tier": upgrade_prompt.recommended_tier
            }
        )


# Dependency functions for FastAPI routes
def require_ai_image_quota(user_id: str, db: Session = Depends(get_db)):
    """Dependency: Check AI image quota before endpoint execution."""
    check_quota(user_id, "ai_images", db)


def require_campaign_quota(user_id: str, db: Session = Depends(get_db)):
    """Dependency: Check campaign quota before endpoint execution."""
    check_quota(user_id, "campaigns", db)


def require_ai_player_quota(user_id: str, db: Session = Depends(get_db)):
    """Dependency: Check AI player quota before endpoint execution."""
    check_quota(user_id, "ai_players", db)


def require_feature(feature: str):
    """Dependency factory: Check feature access before endpoint execution."""
    def check(user_id: str, db: Session = Depends(get_db)):
        check_feature_access(user_id, feature, db)
    return check


# Example usage in routes:
# @router.post("/generate-image")
# async def generate_image(
#     user_id: str,
#     db: Session = Depends(get_db),
#     _quota: None = Depends(require_ai_image_quota)
# ):
#     # Generate image...
#     increment_usage(user_id, "ai_images", 1, db)
#     return {"image_url": "..."}
