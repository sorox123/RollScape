"""
Campaign API endpoints.
Handles campaign CRUD operations and campaign management.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from database import get_db
from schemas import (
    CampaignCreate, 
    CampaignUpdate, 
    CampaignResponse, 
    CampaignListItem,
    MessageResponse
)
from models import Campaign, CampaignStatus, CampaignVisibility

router = APIRouter(prefix="/api/campaigns", tags=["campaigns"])


@router.post("/", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign(
    campaign_data: CampaignCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new campaign.
    
    Requires authentication. User becomes the DM.
    """
    # TODO: Get current user from auth token
    # For now, raise not implemented
    
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Authentication required. Set up Supabase Auth first."
    )


@router.get("/", response_model=List[CampaignListItem])
async def list_campaigns(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: Optional[CampaignStatus] = None,
    visibility: Optional[CampaignVisibility] = None,
    db: Session = Depends(get_db)
):
    """
    List campaigns.
    
    - Public campaigns are visible to all
    - Private campaigns only visible to members
    - Can filter by status and visibility
    """
    query = db.query(Campaign)
    
    # Apply filters
    if status_filter:
        query = query.filter(Campaign.status == status_filter)
    
    if visibility:
        query = query.filter(Campaign.visibility == visibility)
    else:
        # Default: only show public and invite-only campaigns
        query = query.filter(
            Campaign.visibility.in_([
                CampaignVisibility.PUBLIC,
                CampaignVisibility.INVITE_ONLY
            ])
        )
    
    # Only show active/planning campaigns by default
    if not status_filter:
        query = query.filter(
            Campaign.status.in_([
                CampaignStatus.PLANNING,
                CampaignStatus.ACTIVE
            ])
        )
    
    campaigns = query.offset(skip).limit(limit).all()
    return campaigns


@router.get("/my-campaigns", response_model=List[CampaignResponse])
async def get_my_campaigns(
    db: Session = Depends(get_db)
):
    """
    Get all campaigns where user is DM or player.
    
    Requires authentication.
    """
    # TODO: Get current user from auth token
    # TODO: Query campaigns where user is DM or member
    
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Authentication required"
    )


@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(
    campaign_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get campaign details by ID.
    
    Public campaigns visible to all.
    Private campaigns require membership.
    """
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    # TODO: Check if user has access (if private)
    if campaign.visibility == CampaignVisibility.PRIVATE:
        # TODO: Verify user is DM or member
        pass
    
    return campaign


@router.patch("/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: UUID,
    updates: CampaignUpdate,
    db: Session = Depends(get_db)
):
    """
    Update campaign details.
    
    Only the DM can update campaign settings.
    """
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    # TODO: Verify user is the DM
    
    # Update fields
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(campaign, field, value)
    
    db.commit()
    db.refresh(campaign)
    
    return campaign


@router.delete("/{campaign_id}", response_model=MessageResponse)
async def delete_campaign(
    campaign_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Delete (archive) a campaign.
    
    Only the DM can delete their campaign.
    """
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    # TODO: Verify user is the DM
    
    # Soft delete: set status to archived
    campaign.status = CampaignStatus.ARCHIVED
    
    db.commit()
    
    return MessageResponse(
        message="Campaign archived successfully",
        detail=f"Campaign '{campaign.name}' has been archived"
    )


@router.post("/{campaign_id}/join", response_model=MessageResponse)
async def join_campaign(
    campaign_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Request to join a campaign.
    
    - Public campaigns: auto-join
    - Invite-only: create join request for DM approval
    """
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    if not campaign.can_accept_players:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campaign is not accepting new players"
        )
    
    # TODO: Check if user already in campaign
    # TODO: Add user to campaign_members table
    # TODO: Handle invite-only logic
    
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Campaign membership not yet implemented"
    )
