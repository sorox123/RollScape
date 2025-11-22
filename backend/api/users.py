"""
User API endpoints.
Handles user registration, profiles, and subscription management.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Path
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from database import get_db
from auth import get_current_user as get_authenticated_user
from schemas import UserCreate, UserUpdate, UserResponse, MessageResponse
from models import User

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.
    
    Note: In production, this will integrate with Supabase Auth.
    For now, returns mock data for development.
    """
    # TODO: Integrate with Supabase Auth
    # TODO: Hash password
    # TODO: Send verification email
    
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or username already exists"
        )
    
    # Create new user (password handling will be done by Supabase)
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        display_name=user_data.display_name or user_data.username,
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_authenticated_user)
):
    """
    Get current authenticated user.
    
    In mock mode: Returns test user (auto-created).
    In production: Uses Supabase Auth token.
    """
    return current_user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID = Path(..., description="User UUID"),
    db: Session = Depends(get_db)
):
    """Get user by ID (public profile view)"""
    # FastAPI handles UUID validation automatically - invalid UUIDs return 422
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.patch("/me", response_model=UserResponse)
async def update_profile(
    updates: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_authenticated_user)
):
    """
    Update current user's profile.
    
    Note: Requires authentication.
    """
    # Update fields
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.get("/me/quota", response_model=dict)
async def get_quota_status(
    current_user: User = Depends(get_authenticated_user)
):
    """
    Get current user's quota usage and limits.
    """
    from models.user import SubscriptionTier
    
    # Define tier limits
    tier_limits = {
        SubscriptionTier.FREE: {
            "ai_images": 5,
            "ai_players": 1,
            "pdf_imports": 0
        },
        SubscriptionTier.CREATOR: {
            "ai_images": 50,
            "ai_players": 3,
            "pdf_imports": 3
        },
        SubscriptionTier.MASTER: {
            "ai_images": -1,  # unlimited
            "ai_players": -1,
            "pdf_imports": -1
        }
    }
    
    limits = tier_limits.get(current_user.subscription_tier, tier_limits[SubscriptionTier.FREE])
    
    return {
        "tier": current_user.subscription_tier,
        "status": current_user.subscription_status,
        "usage": {
            "ai_images": current_user.monthly_ai_images_used,
            "ai_players": current_user.monthly_ai_players_used,
            "pdf_imports": current_user.pdf_imports_count
        },
        "limits": limits,
        "reset_date": current_user.quota_reset_date
    }
