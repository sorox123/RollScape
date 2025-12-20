"""
Lore Management API
Campaign lore system for AI context and world building
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
import uuid
from datetime import datetime

from database import get_db
from auth import get_current_user
from models import User, LoreEntry, LoreCategory, Campaign
from services.content_generator_service import ContentGeneratorService
from services.openai_service import openai_service

router = APIRouter(prefix="/api/lore", tags=["lore"])
generator_service = ContentGeneratorService(openai_service)


class CreateLoreEntryRequest(BaseModel):
    title: str
    content: str
    summary: Optional[str] = None
    category: LoreCategory
    tags: Optional[List[str]] = None
    campaign_id: str
    importance: int = 5
    is_secret: bool = False
    reveal_condition: Optional[str] = None
    related_npcs: Optional[List[str]] = None
    related_locations: Optional[List[str]] = None
    related_events: Optional[List[str]] = None


class GenerateLoreRequest(BaseModel):
    prompt: str
    category: Optional[str] = None
    campaign_id: str
    importance: int = 5
    is_secret: bool = False


class UpdateLoreEntryRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    category: Optional[LoreCategory] = None
    tags: Optional[List[str]] = None
    importance: Optional[int] = None
    is_secret: Optional[bool] = None
    reveal_condition: Optional[str] = None


@router.post("/")
async def create_lore_entry(
    request: CreateLoreEntryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new lore entry"""
    
    # Verify campaign access
    campaign = db.query(Campaign).filter(
        Campaign.id == uuid.UUID(request.campaign_id)
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Check if user is DM or member
    if campaign.dm_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the DM can create lore entries")
    
    # Create lore entry
    lore = LoreEntry(
        id=uuid.uuid4(),
        title=request.title,
        content=request.content,
        summary=request.summary or request.content[:200],
        category=request.category,
        tags=','.join(request.tags) if request.tags else None,
        campaign_id=uuid.UUID(request.campaign_id),
        created_by_user_id=current_user.id,
        importance=request.importance,
        is_secret=request.is_secret,
        reveal_condition=request.reveal_condition,
        related_npcs=','.join(request.related_npcs) if request.related_npcs else None,
        related_locations=','.join(request.related_locations) if request.related_locations else None,
        related_events=','.join(request.related_events) if request.related_events else None
    )
    
    db.add(lore)
    db.commit()
    db.refresh(lore)
    
    return lore.to_dict()


@router.post("/generate")
async def generate_lore(
    request: GenerateLoreRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate lore entry with AI"""
    
    # Verify campaign access
    campaign = db.query(Campaign).filter(
        Campaign.id == uuid.UUID(request.campaign_id)
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    if campaign.dm_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the DM can generate lore")
    
    # Get campaign context (recent lore entries)
    recent_lore = db.query(LoreEntry).filter(
        LoreEntry.campaign_id == uuid.UUID(request.campaign_id)
    ).order_by(LoreEntry.importance.desc()).limit(5).all()
    
    campaign_context = f"Campaign: {campaign.name}\n"
    campaign_context += f"Setting: {campaign.description}\n\n"
    campaign_context += "Existing Lore:\n"
    for lore in recent_lore:
        campaign_context += f"- {lore.title}: {lore.summary}\n"
    
    # Generate lore
    lore_data = await generator_service.generate_lore(
        prompt=request.prompt,
        category=request.category,
        campaign_context=campaign_context
    )
    
    # Save to database
    lore = LoreEntry(
        id=uuid.uuid4(),
        title=lore_data.get("title", "Unnamed Lore"),
        content=lore_data.get("content", ""),
        summary=lore_data.get("summary", ""),
        category=LoreCategory(lore_data.get("category", "custom")),
        tags=','.join(lore_data.get("tags", [])),
        campaign_id=uuid.UUID(request.campaign_id),
        created_by_user_id=current_user.id,
        importance=request.importance,
        is_secret=request.is_secret
    )
    
    db.add(lore)
    db.commit()
    db.refresh(lore)
    
    return {
        "lore": lore.to_dict(),
        "generated_data": lore_data
    }


@router.get("/campaigns/{campaign_id}")
async def get_campaign_lore(
    campaign_id: str,
    category: Optional[LoreCategory] = Query(None),
    include_secrets: bool = Query(False),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all lore entries for a campaign"""
    
    # Verify campaign access
    campaign = db.query(Campaign).filter(
        Campaign.id == uuid.UUID(campaign_id)
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Check if user is DM
    is_dm = campaign.dm_user_id == current_user.id
    
    query = db.query(LoreEntry).filter(
        LoreEntry.campaign_id == uuid.UUID(campaign_id)
    )
    
    # Filter secrets (only DM can see)
    if not include_secrets or not is_dm:
        query = query.filter(LoreEntry.is_secret == False)
    
    # Filter by category
    if category:
        query = query.filter(LoreEntry.category == category)
    
    # Search
    if search:
        query = query.filter(
            (LoreEntry.title.ilike(f"%{search}%")) |
            (LoreEntry.content.ilike(f"%{search}%"))
        )
    
    # Order by importance and date
    query = query.order_by(
        LoreEntry.importance.desc(),
        LoreEntry.created_at.desc()
    )
    
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    
    return {
        "items": [item.to_dict() for item in items],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/{lore_id}")
async def get_lore_entry(
    lore_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific lore entry"""
    
    lore = db.query(LoreEntry).filter(
        LoreEntry.id == uuid.UUID(lore_id)
    ).first()
    
    if not lore:
        raise HTTPException(status_code=404, detail="Lore entry not found")
    
    # Check if user can access (campaign member or DM)
    campaign = db.query(Campaign).filter(Campaign.id == lore.campaign_id).first()
    is_dm = campaign.dm_user_id == current_user.id if campaign else False
    
    # Hide secrets from players
    if lore.is_secret and not is_dm:
        raise HTTPException(status_code=403, detail="This lore is secret")
    
    # Update last_referenced timestamp
    lore.last_referenced = datetime.utcnow()
    db.commit()
    
    return lore.to_dict()


@router.patch("/{lore_id}")
async def update_lore_entry(
    lore_id: str,
    request: UpdateLoreEntryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a lore entry"""
    
    lore = db.query(LoreEntry).filter(
        LoreEntry.id == uuid.UUID(lore_id),
        LoreEntry.created_by_user_id == current_user.id
    ).first()
    
    if not lore:
        raise HTTPException(status_code=404, detail="Lore entry not found")
    
    if request.title:
        lore.title = request.title
    if request.content:
        lore.content = request.content
    if request.summary:
        lore.summary = request.summary
    if request.category:
        lore.category = request.category
    if request.tags:
        lore.tags = ','.join(request.tags)
    if request.importance is not None:
        lore.importance = request.importance
    if request.is_secret is not None:
        lore.is_secret = request.is_secret
    if request.reveal_condition:
        lore.reveal_condition = request.reveal_condition
    
    db.commit()
    db.refresh(lore)
    
    return lore.to_dict()


@router.delete("/{lore_id}")
async def delete_lore_entry(
    lore_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a lore entry"""
    
    lore = db.query(LoreEntry).filter(
        LoreEntry.id == uuid.UUID(lore_id),
        LoreEntry.created_by_user_id == current_user.id
    ).first()
    
    if not lore:
        raise HTTPException(status_code=404, detail="Lore entry not found")
    
    db.delete(lore)
    db.commit()
    
    return {"message": "Lore entry deleted successfully"}


@router.get("/campaigns/{campaign_id}/context")
async def get_lore_context_for_ai(
    campaign_id: str,
    max_entries: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get lore context for AI (prioritized by importance and recent references)"""
    
    # Verify campaign access
    campaign = db.query(Campaign).filter(
        Campaign.id == uuid.UUID(campaign_id)
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Get most important lore
    lore_entries = db.query(LoreEntry).filter(
        LoreEntry.campaign_id == uuid.UUID(campaign_id),
        LoreEntry.is_secret == False  # Don't include secrets in player-visible context
    ).order_by(
        LoreEntry.importance.desc(),
        LoreEntry.last_referenced.desc().nullslast()
    ).limit(max_entries).all()
    
    # Format for AI context
    context = f"# Campaign: {campaign.name}\n\n"
    
    for lore in lore_entries:
        context += f"## {lore.title}\n"
        context += f"Category: {lore.category.value}\n"
        context += f"{lore.summary or lore.content[:300]}\n\n"
    
    return {
        "campaign_id": campaign_id,
        "context": context,
        "lore_entries": [lore.to_dict() for lore in lore_entries]
    }
