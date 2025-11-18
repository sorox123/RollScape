"""
User API endpoints.
Handles user registration, profiles, and subscription management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from database import get_db
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
async def get_current_user(db: Session = Depends(get_db)):
    """
    Get current authenticated user.
    
    Note: In production, this will use Supabase Auth token.
    For now, returns mock data for development.
    """
    # TODO: Get user from auth token
    # TODO: Integrate with Supabase Auth
    
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Authentication not yet implemented. Set up Supabase first."
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: UUID, db: Session = Depends(get_db)):
    """Get user by ID (public profile view)"""
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
    db: Session = Depends(get_db)
):
    """
    Update current user's profile.
    
    Note: Requires authentication.
    """
    # TODO: Get current user from auth token
    
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Authentication not yet implemented"
    )


@router.get("/me/quota", response_model=dict)
async def get_quota_status(db: Session = Depends(get_db)):
    """
    Get current user's quota usage and limits.
    """
    # TODO: Get current user from auth token
    
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Authentication not yet implemented"
    )
