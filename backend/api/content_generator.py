"""
AI Content Generator API
Generate NPCs, monsters, items, locations, quests, and lore
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel, Field
import json
import uuid

from database import get_db
from auth import get_current_user
from models import User, GeneratedContent, ContentType, ContentVisibility, ContentLike
from services.content_generator_service import ContentGeneratorService
from services.openai_service import openai_service

router = APIRouter(prefix="/api/content", tags=["content-generator"])
generator_service = ContentGeneratorService(openai_service)


# Request models
class GenerateNPCRequest(BaseModel):
    prompt: str
    race: Optional[str] = None
    class_type: Optional[str] = Field(None, alias="class")
    alignment: Optional[str] = None
    level: Optional[int] = None
    location: Optional[str] = None
    personality_traits: Optional[List[str]] = None
    campaign_id: Optional[str] = None
    visibility: ContentVisibility = ContentVisibility.PRIVATE


class GenerateMonsterRequest(BaseModel):
    prompt: str
    challenge_rating: Optional[str] = None
    environment: Optional[str] = None
    size: Optional[str] = None
    monster_type: Optional[str] = None
    campaign_id: Optional[str] = None
    visibility: ContentVisibility = ContentVisibility.PRIVATE


class GenerateItemRequest(BaseModel):
    prompt: str
    item_type: Optional[str] = None
    rarity: Optional[str] = None
    requires_attunement: Optional[bool] = None
    campaign_id: Optional[str] = None
    visibility: ContentVisibility = ContentVisibility.PRIVATE


class GenerateLocationRequest(BaseModel):
    prompt: str
    location_type: Optional[str] = None
    size: Optional[str] = None
    inhabitants: Optional[str] = None
    campaign_id: Optional[str] = None
    visibility: ContentVisibility = ContentVisibility.PRIVATE


class GenerateQuestRequest(BaseModel):
    prompt: str
    party_level: Optional[int] = None
    quest_type: Optional[str] = None
    location: Optional[str] = None
    campaign_id: Optional[str] = None
    visibility: ContentVisibility = ContentVisibility.PRIVATE


@router.post("/generate/npc")
async def generate_npc(
    request: GenerateNPCRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate an NPC with AI"""
    
    # Generate content
    npc_data = await generator_service.generate_npc(
        prompt=request.prompt,
        race=request.race,
        class_type=request.class_type,
        alignment=request.alignment,
        level=request.level,
        location=request.location,
        personality_traits=request.personality_traits
    )
    
    # Save to database
    content = GeneratedContent(
        id=uuid.uuid4(),
        content_type=ContentType.NPC,
        name=npc_data.get("name", "Unnamed NPC"),
        description=npc_data.get("backstory", ""),
        content_data=json.dumps(npc_data),
        created_by_user_id=current_user.id,
        campaign_id=uuid.UUID(request.campaign_id) if request.campaign_id else None,
        visibility=request.visibility,
        prompt=request.prompt,
        model_used="gpt-4-turbo-preview"
    )
    
    db.add(content)
    db.commit()
    db.refresh(content)
    
    return content.to_dict()


@router.post("/generate/monster")
async def generate_monster(
    request: GenerateMonsterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a monster with AI"""
    
    monster_data = await generator_service.generate_monster(
        prompt=request.prompt,
        challenge_rating=request.challenge_rating,
        environment=request.environment,
        size=request.size,
        monster_type=request.monster_type
    )
    
    content = GeneratedContent(
        id=uuid.uuid4(),
        content_type=ContentType.MONSTER,
        name=monster_data.get("name", "Unnamed Monster"),
        description=monster_data.get("description", ""),
        content_data=json.dumps(monster_data),
        created_by_user_id=current_user.id,
        campaign_id=uuid.UUID(request.campaign_id) if request.campaign_id else None,
        visibility=request.visibility,
        prompt=request.prompt,
        model_used="gpt-4-turbo-preview",
        challenge_rating=monster_data.get("challenge_rating")
    )
    
    db.add(content)
    db.commit()
    db.refresh(content)
    
    return content.to_dict()


@router.post("/generate/item")
async def generate_item(
    request: GenerateItemRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a magic item with AI"""
    
    item_data = await generator_service.generate_item(
        prompt=request.prompt,
        item_type=request.item_type,
        rarity=request.rarity,
        requires_attunement=request.requires_attunement
    )
    
    content = GeneratedContent(
        id=uuid.uuid4(),
        content_type=ContentType.ITEM,
        name=item_data.get("name", "Unnamed Item"),
        description=item_data.get("description", ""),
        content_data=json.dumps(item_data),
        created_by_user_id=current_user.id,
        campaign_id=uuid.UUID(request.campaign_id) if request.campaign_id else None,
        visibility=request.visibility,
        prompt=request.prompt,
        model_used="gpt-4-turbo-preview",
        rarity=item_data.get("rarity"),
        item_type=item_data.get("type")
    )
    
    db.add(content)
    db.commit()
    db.refresh(content)
    
    return content.to_dict()


@router.post("/generate/location")
async def generate_location(
    request: GenerateLocationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a location with AI"""
    
    location_data = await generator_service.generate_location(
        prompt=request.prompt,
        location_type=request.location_type,
        size=request.size,
        inhabitants=request.inhabitants
    )
    
    content = GeneratedContent(
        id=uuid.uuid4(),
        content_type=ContentType.LOCATION,
        name=location_data.get("name", "Unnamed Location"),
        description=location_data.get("description", ""),
        content_data=json.dumps(location_data),
        created_by_user_id=current_user.id,
        campaign_id=uuid.UUID(request.campaign_id) if request.campaign_id else None,
        visibility=request.visibility,
        prompt=request.prompt,
        model_used="gpt-4-turbo-preview"
    )
    
    db.add(content)
    db.commit()
    db.refresh(content)
    
    return content.to_dict()


@router.post("/generate/quest")
async def generate_quest(
    request: GenerateQuestRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a quest with AI"""
    
    quest_data = await generator_service.generate_quest(
        prompt=request.prompt,
        party_level=request.party_level,
        quest_type=request.quest_type,
        location=request.location
    )
    
    content = GeneratedContent(
        id=uuid.uuid4(),
        content_type=ContentType.QUEST,
        name=quest_data.get("title", "Unnamed Quest"),
        description=quest_data.get("summary", ""),
        content_data=json.dumps(quest_data),
        created_by_user_id=current_user.id,
        campaign_id=uuid.UUID(request.campaign_id) if request.campaign_id else None,
        visibility=request.visibility,
        prompt=request.prompt,
        model_used="gpt-4-turbo-preview"
    )
    
    db.add(content)
    db.commit()
    db.refresh(content)
    
    return content.to_dict()


@router.get("/")
async def list_content(
    content_type: Optional[ContentType] = Query(None),
    campaign_id: Optional[str] = Query(None),
    visibility: Optional[ContentVisibility] = Query(None),
    search: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List generated content with filters"""
    
    query = db.query(GeneratedContent)
    
    # Filter by content type
    if content_type:
        query = query.filter(GeneratedContent.content_type == content_type)
    
    # Filter by campaign
    if campaign_id:
        query = query.filter(GeneratedContent.campaign_id == uuid.UUID(campaign_id))
    
    # Filter by visibility (show own private content + public content)
    if visibility:
        query = query.filter(GeneratedContent.visibility == visibility)
    else:
        query = query.filter(
            (GeneratedContent.created_by_user_id == current_user.id) |
            (GeneratedContent.visibility == ContentVisibility.PUBLIC)
        )
    
    # Search by name
    if search:
        query = query.filter(GeneratedContent.name.ilike(f"%{search}%"))
    
    # Filter by tags
    if tags:
        tag_list = tags.split(',')
        for tag in tag_list:
            query = query.filter(GeneratedContent.tags.like(f"%{tag.strip()}%"))
    
    # Order by creation date
    query = query.order_by(GeneratedContent.created_at.desc())
    
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    
    return {
        "items": [item.to_dict() for item in items],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/{content_id}")
async def get_content(
    content_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific generated content by ID"""
    
    content = db.query(GeneratedContent).filter(
        GeneratedContent.id == uuid.UUID(content_id)
    ).first()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Check permissions
    if content.visibility == ContentVisibility.PRIVATE and content.created_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this content")
    
    return content.to_dict()


@router.patch("/{content_id}")
async def update_content(
    content_id: str,
    name: Optional[str] = None,
    description: Optional[str] = None,
    visibility: Optional[ContentVisibility] = None,
    tags: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update generated content metadata"""
    
    content = db.query(GeneratedContent).filter(
        GeneratedContent.id == uuid.UUID(content_id),
        GeneratedContent.created_by_user_id == current_user.id
    ).first()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    if name:
        content.name = name
    if description:
        content.description = description
    if visibility:
        content.visibility = visibility
    if tags:
        content.tags = tags
    
    db.commit()
    db.refresh(content)
    
    return content.to_dict()


@router.delete("/{content_id}")
async def delete_content(
    content_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete generated content"""
    
    content = db.query(GeneratedContent).filter(
        GeneratedContent.id == uuid.UUID(content_id),
        GeneratedContent.created_by_user_id == current_user.id
    ).first()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    db.delete(content)
    db.commit()
    
    return {"message": "Content deleted successfully"}


@router.post("/{content_id}/like")
async def like_content(
    content_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Like generated content"""
    
    content = db.query(GeneratedContent).filter(
        GeneratedContent.id == uuid.UUID(content_id)
    ).first()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Check if already liked
    existing_like = db.query(ContentLike).filter(
        ContentLike.user_id == current_user.id,
        ContentLike.content_id == uuid.UUID(content_id)
    ).first()
    
    if existing_like:
        raise HTTPException(status_code=400, detail="Already liked")
    
    # Create like
    like = ContentLike(
        id=uuid.uuid4(),
        user_id=current_user.id,
        content_id=uuid.UUID(content_id)
    )
    
    content.likes_count += 1
    
    db.add(like)
    db.commit()
    
    return {"message": "Content liked successfully", "likes_count": content.likes_count}


@router.delete("/{content_id}/like")
async def unlike_content(
    content_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unlike generated content"""
    
    like = db.query(ContentLike).filter(
        ContentLike.user_id == current_user.id,
        ContentLike.content_id == uuid.UUID(content_id)
    ).first()
    
    if not like:
        raise HTTPException(status_code=404, detail="Like not found")
    
    content = db.query(GeneratedContent).filter(
        GeneratedContent.id == uuid.UUID(content_id)
    ).first()
    
    if content:
        content.likes_count = max(0, content.likes_count - 1)
    
    db.delete(like)
    db.commit()
    
    return {"message": "Content unliked successfully"}
