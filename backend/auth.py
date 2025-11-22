"""
Mock authentication for development.
Provides a test user without requiring Supabase.

In production, this will validate JWT tokens from Supabase.
"""

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from config import settings
import uuid


# Mock user ID (consistent across restarts)
MOCK_USER_ID = "00000000-0000-0000-0000-000000000001"


async def get_current_user(
    db: Session = Depends(get_db),
    authorization: str = Header(None)
) -> User:
    """
    Get current authenticated user.
    
    In MOCK_MODE: Returns test user (creates if needed)
    In production: Validates JWT token from Supabase
    
    Args:
        db: Database session
        authorization: Authorization header (Bearer token)
        
    Returns:
        User: Current authenticated user
        
    Raises:
        HTTPException: If authentication fails
    """
    if settings.mock_mode:
        # Get or create mock user for development
        user = db.query(User).filter(User.id == MOCK_USER_ID).first()
        
        if not user:
            # Create test user
            user = User(
                id=MOCK_USER_ID,
                email="test@rollscape.dev",
                username="testuser",
                display_name="Test User",
                subscription_tier="free",
                subscription_status="active",
                monthly_ai_images_used=0,
                monthly_ai_players_used=0,
                pdf_imports_count=0
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"✅ Created mock user: {user.username} ({user.email})")
        
        return user
    else:
        # Production mode - validate JWT token
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=401,
                detail={
                    "error": "authentication_required",
                    "message": "No authorization token provided. Set MOCK_MODE=true for development.",
                    "hint": "Include 'Authorization: Bearer <token>' header"
                }
            )
        
        # Extract token
        token = authorization.replace("Bearer ", "")
        
        # TODO: Validate JWT token with Supabase
        # from supabase import create_client
        # supabase = create_client(settings.supabase_url, settings.supabase_key)
        # user_data = supabase.auth.get_user(token)
        
        raise HTTPException(
            status_code=501,
            detail={
                "error": "not_implemented",
                "message": "Production authentication not implemented yet",
                "hint": "Use MOCK_MODE=true for development"
            }
        )


async def get_optional_user(
    db: Session = Depends(get_db),
    authorization: str = Header(None)
) -> User | None:
    """
    Get user if authenticated, None otherwise.
    
    Useful for endpoints that work differently for logged-in users
    but don't require authentication.
    
    Args:
        db: Database session
        authorization: Authorization header (optional)
        
    Returns:
        User or None: Current user if authenticated, None otherwise
    """
    try:
        return await get_current_user(db, authorization)
    except HTTPException:
        return None


def require_subscription_tier(required_tier: str):
    """
    Dependency that checks if user has required subscription tier.
    
    Tiers (in order): free < creator < master
    
    Usage:
        @router.post("/premium-feature")
        async def premium_feature(
            user: User = Depends(require_subscription_tier("creator"))
        ):
            # Only creator and master tier users can access
            ...
    
    Args:
        required_tier: Minimum tier required ('free', 'creator', 'master')
        
    Returns:
        Dependency function that validates tier
    """
    tier_hierarchy = {"free": 0, "creator": 1, "master": 2}
    
    async def check_tier(user: User = Depends(get_current_user)) -> User:
        user_tier_level = tier_hierarchy.get(user.subscription_tier, 0)
        required_tier_level = tier_hierarchy.get(required_tier, 0)
        
        if user_tier_level < required_tier_level:
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "insufficient_subscription",
                    "message": f"This feature requires {required_tier} tier subscription",
                    "current_tier": user.subscription_tier,
                    "required_tier": required_tier
                }
            )
        
        return user
    
    return check_tier
