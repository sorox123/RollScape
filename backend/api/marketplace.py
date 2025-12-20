"""
Marketplace API - Worlds and Dice Textures
World sharing and dice texture marketplace
"""

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional, List
from pydantic import BaseModel
import uuid
from datetime import datetime

from database import get_db
from auth import get_current_user
from models import (
    User, World, WorldLike, WorldVisibility,
    DiceTexture, DiceTextureLike, DiceTexturePurchase
)

router = APIRouter(prefix="/api/marketplace", tags=["marketplace"])


# ==================== WORLD MARKETPLACE ====================

class CreateWorldRequest(BaseModel):
    name: str
    description: Optional[str] = None
    tagline: Optional[str] = None
    setting: Optional[str] = None
    lore: Optional[str] = None
    rules: Optional[str] = None
    visibility: WorldVisibility = WorldVisibility.PRIVATE
    tags: Optional[List[str]] = None
    game_system: str = "dnd5e"
    themes: Optional[List[str]] = None


class UpdateWorldRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    tagline: Optional[str] = None
    setting: Optional[str] = None
    lore: Optional[str] = None
    rules: Optional[str] = None
    visibility: Optional[WorldVisibility] = None
    tags: Optional[List[str]] = None
    themes: Optional[List[str]] = None
    cover_image_url: Optional[str] = None


@router.post("/worlds")
async def create_world(
    request: CreateWorldRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new world for the marketplace"""
    
    world = World(
        id=uuid.uuid4(),
        name=request.name,
        description=request.description,
        tagline=request.tagline,
        setting=request.setting,
        lore=request.lore,
        rules=request.rules,
        created_by_user_id=current_user.id,
        visibility=request.visibility,
        tags=','.join(request.tags) if request.tags else None,
        game_system=request.game_system,
        themes=','.join(request.themes) if request.themes else None
    )
    
    db.add(world)
    db.commit()
    db.refresh(world)
    
    return world.to_dict()


@router.get("/worlds")
async def browse_worlds(
    search: Optional[str] = Query(None),
    game_system: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),
    themes: Optional[str] = Query(None),
    featured_only: bool = Query(False),
    sort_by: str = Query("popular", regex="^(popular|recent|top_rated)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(24, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Browse public worlds in the marketplace"""
    
    query = db.query(World).filter(World.visibility == WorldVisibility.PUBLIC)
    
    # Featured only
    if featured_only:
        query = query.filter(World.is_featured == True)
    
    # Search
    if search:
        query = query.filter(
            or_(
                World.name.ilike(f"%{search}%"),
                World.description.ilike(f"%{search}%"),
                World.tagline.ilike(f"%{search}%")
            )
        )
    
    # Filter by game system
    if game_system:
        query = query.filter(World.game_system == game_system)
    
    # Filter by tags
    if tags:
        tag_list = tags.split(',')
        for tag in tag_list:
            query = query.filter(World.tags.like(f"%{tag.strip()}%"))
    
    # Filter by themes
    if themes:
        theme_list = themes.split(',')
        for theme in theme_list:
            query = query.filter(World.themes.like(f"%{theme.strip()}%"))
    
    # Sorting
    if sort_by == "popular":
        query = query.order_by(World.uses_count.desc(), World.likes_count.desc())
    elif sort_by == "recent":
        query = query.order_by(World.published_at.desc().nullslast(), World.created_at.desc())
    elif sort_by == "top_rated":
        query = query.order_by(World.rating_avg.desc(), World.rating_count.desc())
    
    total = query.count()
    worlds = query.offset(skip).limit(limit).all()
    
    return {
        "worlds": [world.to_dict() for world in worlds],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/worlds/my")
async def get_my_worlds(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get worlds created by current user"""
    
    query = db.query(World).filter(World.created_by_user_id == current_user.id)
    query = query.order_by(World.created_at.desc())
    
    total = query.count()
    worlds = query.offset(skip).limit(limit).all()
    
    return {
        "worlds": [world.to_dict() for world in worlds],
        "total": total
    }


@router.get("/worlds/{world_id}")
async def get_world(
    world_id: str,
    db: Session = Depends(get_db)
):
    """Get world details"""
    
    world = db.query(World).filter(World.id == uuid.UUID(world_id)).first()
    
    if not world:
        raise HTTPException(status_code=404, detail="World not found")
    
    if world.visibility == WorldVisibility.PRIVATE:
        raise HTTPException(status_code=403, detail="This world is private")
    
    return world.to_dict()


@router.patch("/worlds/{world_id}")
async def update_world(
    world_id: str,
    request: UpdateWorldRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update world details"""
    
    world = db.query(World).filter(
        World.id == uuid.UUID(world_id),
        World.created_by_user_id == current_user.id
    ).first()
    
    if not world:
        raise HTTPException(status_code=404, detail="World not found")
    
    if request.name:
        world.name = request.name
    if request.description is not None:
        world.description = request.description
    if request.tagline is not None:
        world.tagline = request.tagline
    if request.setting is not None:
        world.setting = request.setting
    if request.lore is not None:
        world.lore = request.lore
    if request.rules is not None:
        world.rules = request.rules
    if request.visibility:
        world.visibility = request.visibility
        # Set published_at when first published
        if request.visibility == WorldVisibility.PUBLIC and not world.published_at:
            world.published_at = datetime.utcnow()
    if request.tags:
        world.tags = ','.join(request.tags)
    if request.themes:
        world.themes = ','.join(request.themes)
    if request.cover_image_url:
        world.cover_image_url = request.cover_image_url
    
    db.commit()
    db.refresh(world)
    
    return world.to_dict()


@router.delete("/worlds/{world_id}")
async def delete_world(
    world_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a world"""
    
    world = db.query(World).filter(
        World.id == uuid.UUID(world_id),
        World.created_by_user_id == current_user.id
    ).first()
    
    if not world:
        raise HTTPException(status_code=404, detail="World not found")
    
    db.delete(world)
    db.commit()
    
    return {"message": "World deleted successfully"}


@router.post("/worlds/{world_id}/like")
async def like_world(
    world_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Like a world"""
    
    world = db.query(World).filter(World.id == uuid.UUID(world_id)).first()
    
    if not world:
        raise HTTPException(status_code=404, detail="World not found")
    
    # Check if already liked
    existing_like = db.query(WorldLike).filter(
        WorldLike.user_id == current_user.id,
        WorldLike.world_id == uuid.UUID(world_id)
    ).first()
    
    if existing_like:
        raise HTTPException(status_code=400, detail="Already liked")
    
    like = WorldLike(
        id=uuid.uuid4(),
        user_id=current_user.id,
        world_id=uuid.UUID(world_id)
    )
    
    world.likes_count += 1
    
    db.add(like)
    db.commit()
    
    return {"message": "World liked", "likes_count": world.likes_count}


@router.delete("/worlds/{world_id}/like")
async def unlike_world(
    world_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unlike a world"""
    
    like = db.query(WorldLike).filter(
        WorldLike.user_id == current_user.id,
        WorldLike.world_id == uuid.UUID(world_id)
    ).first()
    
    if not like:
        raise HTTPException(status_code=404, detail="Like not found")
    
    world = db.query(World).filter(World.id == uuid.UUID(world_id)).first()
    if world:
        world.likes_count = max(0, world.likes_count - 1)
    
    db.delete(like)
    db.commit()
    
    return {"message": "World unliked"}


@router.post("/worlds/{world_id}/use")
async def use_world(
    world_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Track that a campaign is using this world"""
    
    world = db.query(World).filter(World.id == uuid.UUID(world_id)).first()
    
    if not world:
        raise HTTPException(status_code=404, detail="World not found")
    
    world.uses_count += 1
    db.commit()
    
    return {"message": "World use tracked", "uses_count": world.uses_count}


# ==================== DICE TEXTURE MARKETPLACE ====================

class CreateDiceTextureRequest(BaseModel):
    name: str
    description: Optional[str] = None
    preview_image_url: str
    is_free: bool = True
    price_cents: int = 0
    tags: Optional[List[str]] = None
    style: Optional[str] = None
    visibility: WorldVisibility = WorldVisibility.PUBLIC


class UpdateDiceTextureRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    preview_image_url: Optional[str] = None
    is_free: Optional[bool] = None
    price_cents: Optional[int] = None
    tags: Optional[List[str]] = None
    style: Optional[str] = None
    visibility: Optional[WorldVisibility] = None
    d4_texture_url: Optional[str] = None
    d6_texture_url: Optional[str] = None
    d8_texture_url: Optional[str] = None
    d10_texture_url: Optional[str] = None
    d12_texture_url: Optional[str] = None
    d20_texture_url: Optional[str] = None
    d100_texture_url: Optional[str] = None


@router.post("/dice-textures")
async def create_dice_texture(
    request: CreateDiceTextureRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new dice texture for marketplace"""
    
    texture = DiceTexture(
        id=uuid.uuid4(),
        name=request.name,
        description=request.description,
        preview_image_url=request.preview_image_url,
        created_by_user_id=current_user.id,
        is_free=request.is_free,
        price_cents=request.price_cents if not request.is_free else 0,
        tags=','.join(request.tags) if request.tags else None,
        style=request.style,
        visibility=request.visibility
    )
    
    db.add(texture)
    db.commit()
    db.refresh(texture)
    
    return texture.to_dict()


@router.get("/dice-textures")
async def browse_dice_textures(
    search: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),
    style: Optional[str] = Query(None),
    free_only: bool = Query(False),
    featured_only: bool = Query(False),
    official_only: bool = Query(False),
    sort_by: str = Query("popular", regex="^(popular|recent|top_rated|price_low|price_high)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(24, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Browse dice textures in marketplace"""
    
    query = db.query(DiceTexture).filter(DiceTexture.visibility == WorldVisibility.PUBLIC)
    
    # Filters
    if featured_only:
        query = query.filter(DiceTexture.is_featured == True)
    
    if official_only:
        query = query.filter(DiceTexture.is_official == True)
    
    if free_only:
        query = query.filter(DiceTexture.is_free == True)
    
    if search:
        query = query.filter(
            or_(
                DiceTexture.name.ilike(f"%{search}%"),
                DiceTexture.description.ilike(f"%{search}%")
            )
        )
    
    if tags:
        tag_list = tags.split(',')
        for tag in tag_list:
            query = query.filter(DiceTexture.tags.like(f"%{tag.strip()}%"))
    
    if style:
        query = query.filter(DiceTexture.style == style)
    
    # Sorting
    if sort_by == "popular":
        query = query.order_by(DiceTexture.downloads_count.desc())
    elif sort_by == "recent":
        query = query.order_by(DiceTexture.created_at.desc())
    elif sort_by == "top_rated":
        query = query.order_by(DiceTexture.rating_avg.desc())
    elif sort_by == "price_low":
        query = query.order_by(DiceTexture.price_cents.asc())
    elif sort_by == "price_high":
        query = query.order_by(DiceTexture.price_cents.desc())
    
    total = query.count()
    textures = query.offset(skip).limit(limit).all()
    
    return {
        "textures": [texture.to_dict() for texture in textures],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/dice-textures/my")
async def get_my_dice_textures(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get dice textures created by current user"""
    
    textures = db.query(DiceTexture).filter(
        DiceTexture.created_by_user_id == current_user.id
    ).order_by(DiceTexture.created_at.desc()).all()
    
    return {"textures": [texture.to_dict() for texture in textures]}


@router.get("/dice-textures/purchased")
async def get_purchased_textures(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get dice textures purchased by current user"""
    
    purchases = db.query(DiceTexturePurchase).filter(
        DiceTexturePurchase.user_id == current_user.id
    ).all()
    
    texture_ids = [p.texture_id for p in purchases]
    textures = db.query(DiceTexture).filter(DiceTexture.id.in_(texture_ids)).all()
    
    return {"textures": [texture.to_dict() for texture in textures]}


@router.get("/dice-textures/{texture_id}")
async def get_dice_texture(
    texture_id: str,
    db: Session = Depends(get_db)
):
    """Get dice texture details"""
    
    texture = db.query(DiceTexture).filter(
        DiceTexture.id == uuid.UUID(texture_id)
    ).first()
    
    if not texture:
        raise HTTPException(status_code=404, detail="Dice texture not found")
    
    return texture.to_dict()


@router.patch("/dice-textures/{texture_id}")
async def update_dice_texture(
    texture_id: str,
    request: UpdateDiceTextureRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update dice texture"""
    
    texture = db.query(DiceTexture).filter(
        DiceTexture.id == uuid.UUID(texture_id),
        DiceTexture.created_by_user_id == current_user.id
    ).first()
    
    if not texture:
        raise HTTPException(status_code=404, detail="Dice texture not found")
    
    if request.name:
        texture.name = request.name
    if request.description is not None:
        texture.description = request.description
    if request.preview_image_url:
        texture.preview_image_url = request.preview_image_url
    if request.is_free is not None:
        texture.is_free = request.is_free
    if request.price_cents is not None:
        texture.price_cents = request.price_cents if not texture.is_free else 0
    if request.tags:
        texture.tags = ','.join(request.tags)
    if request.style:
        texture.style = request.style
    if request.visibility:
        texture.visibility = request.visibility
    
    # Update texture URLs
    if request.d4_texture_url:
        texture.d4_texture_url = request.d4_texture_url
    if request.d6_texture_url:
        texture.d6_texture_url = request.d6_texture_url
    if request.d8_texture_url:
        texture.d8_texture_url = request.d8_texture_url
    if request.d10_texture_url:
        texture.d10_texture_url = request.d10_texture_url
    if request.d12_texture_url:
        texture.d12_texture_url = request.d12_texture_url
    if request.d20_texture_url:
        texture.d20_texture_url = request.d20_texture_url
    if request.d100_texture_url:
        texture.d100_texture_url = request.d100_texture_url
    
    db.commit()
    db.refresh(texture)
    
    return texture.to_dict()


@router.delete("/dice-textures/{texture_id}")
async def delete_dice_texture(
    texture_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete dice texture"""
    
    texture = db.query(DiceTexture).filter(
        DiceTexture.id == uuid.UUID(texture_id),
        DiceTexture.created_by_user_id == current_user.id
    ).first()
    
    if not texture:
        raise HTTPException(status_code=404, detail="Dice texture not found")
    
    db.delete(texture)
    db.commit()
    
    return {"message": "Dice texture deleted"}


@router.post("/dice-textures/{texture_id}/like")
async def like_dice_texture(
    texture_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Like a dice texture"""
    
    texture = db.query(DiceTexture).filter(
        DiceTexture.id == uuid.UUID(texture_id)
    ).first()
    
    if not texture:
        raise HTTPException(status_code=404, detail="Dice texture not found")
    
    # Check if already liked
    existing_like = db.query(DiceTextureLike).filter(
        DiceTextureLike.user_id == current_user.id,
        DiceTextureLike.texture_id == uuid.UUID(texture_id)
    ).first()
    
    if existing_like:
        raise HTTPException(status_code=400, detail="Already liked")
    
    like = DiceTextureLike(
        id=uuid.uuid4(),
        user_id=current_user.id,
        texture_id=uuid.UUID(texture_id)
    )
    
    texture.likes_count += 1
    
    db.add(like)
    db.commit()
    
    return {"message": "Dice texture liked", "likes_count": texture.likes_count}


@router.delete("/dice-textures/{texture_id}/like")
async def unlike_dice_texture(
    texture_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unlike a dice texture"""
    
    like = db.query(DiceTextureLike).filter(
        DiceTextureLike.user_id == current_user.id,
        DiceTextureLike.texture_id == uuid.UUID(texture_id)
    ).first()
    
    if not like:
        raise HTTPException(status_code=404, detail="Like not found")
    
    texture = db.query(DiceTexture).filter(
        DiceTexture.id == uuid.UUID(texture_id)
    ).first()
    if texture:
        texture.likes_count = max(0, texture.likes_count - 1)
    
    db.delete(like)
    db.commit()
    
    return {"message": "Dice texture unliked"}


@router.post("/dice-textures/{texture_id}/download")
async def download_dice_texture(
    texture_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download/purchase a dice texture"""
    
    texture = db.query(DiceTexture).filter(
        DiceTexture.id == uuid.UUID(texture_id)
    ).first()
    
    if not texture:
        raise HTTPException(status_code=404, detail="Dice texture not found")
    
    # Check if already purchased
    existing_purchase = db.query(DiceTexturePurchase).filter(
        DiceTexturePurchase.user_id == current_user.id,
        DiceTexturePurchase.texture_id == uuid.UUID(texture_id)
    ).first()
    
    if existing_purchase:
        return {
            "message": "Already purchased",
            "texture": texture.to_dict()
        }
    
    # For free textures, just track download
    if texture.is_free:
        purchase = DiceTexturePurchase(
            id=uuid.uuid4(),
            user_id=current_user.id,
            texture_id=uuid.UUID(texture_id),
            price_paid_cents=0
        )
        
        texture.downloads_count += 1
        
        db.add(purchase)
        db.commit()
        
        return {
            "message": "Dice texture downloaded",
            "texture": texture.to_dict()
        }
    
    # For paid textures, require Stripe payment
    # This would integrate with Stripe - placeholder for now
    return {
        "message": "Payment required",
        "price_cents": texture.price_cents,
        "texture_id": texture_id
    }
