"""
Character API endpoints.
Handles character CRUD operations.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from database import get_db
from auth import get_current_user
from schemas import (
    CharacterCreate,
    CharacterUpdate,
    CharacterResponse,
    MessageResponse
)
from models import Character, Campaign, User
from utils.sanitize import sanitize_html

router = APIRouter(prefix="/api/characters", tags=["characters"])


@router.post("/", response_model=CharacterResponse, status_code=status.HTTP_201_CREATED)
async def create_character(
    character_data: CharacterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new character.
    
    Requires authentication. Character is linked to campaign.
    """
    # Verify campaign exists
    campaign = db.query(Campaign).filter(
        Campaign.id == character_data.campaign_id
    ).first()
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    # Sanitize text fields
    character_dict = character_data.model_dump()
    character_dict['name'] = sanitize_html(character_dict['name'])
    if character_dict.get('background'):
        character_dict['background'] = sanitize_html(character_dict['background'])
    
    # Create character linked to user
    new_character = Character(
        **character_dict,
        user_id=current_user.id
    )
    
    db.add(new_character)
    db.commit()
    db.refresh(new_character)
    
    return new_character


@router.get("/campaign/{campaign_id}", response_model=List[CharacterResponse])
async def get_campaign_characters(
    campaign_id: UUID,
    include_npcs: bool = Query(False, description="Include NPCs in results"),
    db: Session = Depends(get_db)
):
    """
    Get all characters in a campaign.
    
    By default, only returns player characters.
    Set include_npcs=true to include NPCs (DM view).
    """
    # Verify campaign exists
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    query = db.query(Character).filter(
        Character.campaign_id == campaign_id,
        Character.is_active == True
    )
    
    if not include_npcs:
        from models.character import CharacterType
        query = query.filter(
            Character.character_type.in_([
                CharacterType.PLAYER,
                CharacterType.AI_PLAYER
            ])
        )
    
    characters = query.all()
    return characters


@router.get("/{character_id}", response_model=CharacterResponse)
async def get_character(
    character_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get character details by ID"""
    character = db.query(Character).filter(Character.id == character_id).first()
    
    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found"
        )
    
    # Verify user has access (owns character or is campaign DM)
    campaign = db.query(Campaign).filter(Campaign.id == character.campaign_id).first()
    if character.user_id != current_user.id and (not campaign or campaign.dm_user_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this character"
        )
    
    return character


@router.patch("/{character_id}", response_model=CharacterResponse)
async def update_character(
    character_id: UUID,
    updates: CharacterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update character details.
    
    Players can update their own characters.
    DM can update any character in their campaigns.
    """
    character = db.query(Character).filter(Character.id == character_id).first()
    
    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found"
        )
    
    # Verify user owns character or is campaign DM
    campaign = db.query(Campaign).filter(Campaign.id == character.campaign_id).first()
    if character.user_id != current_user.id and (not campaign or campaign.dm_user_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this character"
        )
    
    # Update fields with sanitization
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        # Sanitize text fields to prevent XSS
        if field in ['name', 'description', 'backstory', 'background', 'player_notes'] and isinstance(value, str):
            value = sanitize_html(value)
        setattr(character, field, value)
    
    db.commit()
    db.refresh(character)
    
    return character


@router.delete("/{character_id}", response_model=MessageResponse)
async def delete_character(
    character_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a character.
    
    Soft delete - marks character as inactive.
    """
    character = db.query(Character).filter(Character.id == character_id).first()
    
    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found"
        )
    
    # Verify user owns character or is campaign DM
    campaign = db.query(Campaign).filter(Campaign.id == character.campaign_id).first()
    if character.user_id != current_user.id and (not campaign or campaign.dm_user_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this character"
        )
    
    # Soft delete
    character.is_active = False
    
    db.commit()
    
    return MessageResponse(
        message="Character deleted successfully",
        detail=f"Character '{character.name}' has been deactivated"
    )


@router.post("/{character_id}/damage", response_model=CharacterResponse)
async def apply_damage(
    character_id: UUID,
    damage: int = Query(..., ge=0, description="Damage amount"),
    db: Session = Depends(get_db)
):
    """
    Apply damage to a character.
    
    Used during combat. Updates current HP.
    """
    character = db.query(Character).filter(Character.id == character_id).first()
    
    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found"
        )
    
    # TODO: Verify user is in the campaign
    
    # Apply damage (temp HP first, then regular HP)
    remaining_damage = damage
    
    if character.temp_hp and character.temp_hp > 0:
        if remaining_damage >= character.temp_hp:
            remaining_damage -= character.temp_hp
            character.temp_hp = 0
        else:
            character.temp_hp -= remaining_damage
            remaining_damage = 0
    
    if remaining_damage > 0:
        character.current_hp = max(0, character.current_hp - remaining_damage)
    
    db.commit()
    db.refresh(character)
    
    return character


@router.post("/{character_id}/heal", response_model=CharacterResponse)
async def apply_healing(
    character_id: UUID,
    healing: int = Query(..., ge=0, description="Healing amount"),
    db: Session = Depends(get_db)
):
    """
    Apply healing to a character.
    
    Cannot heal above max HP.
    """
    character = db.query(Character).filter(Character.id == character_id).first()
    
    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found"
        )
    
    # TODO: Verify user is in the campaign
    
    # Apply healing (cannot exceed max HP)
    character.current_hp = min(character.max_hp, character.current_hp + healing)
    
    db.commit()
    db.refresh(character)
    
    return character
