"""
AI Image Generation API

Endpoints for generating maps, character art, tokens, and managing image library.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime
import os

from services.dalle_service import dalle_service, ImageType
from services.service_config import openai_config, ServiceMode
from models.subscription import (
    SubscriptionTier,
    can_use_feature,
    check_quota,
    get_upgrade_prompt
)

router = APIRouter(prefix="/api/ai", tags=["AI Images"])


# Request Models
class GenerateImageRequest(BaseModel):
    prompt: str = Field(..., description="Image generation prompt")
    image_type: ImageType = Field(..., description="Type of image to generate")
    size: str = Field("1024x1024", description="Image size")
    quality: str = Field("standard", description="Image quality (standard, hd)")
    style: str = Field("vivid", description="Image style (vivid, natural)")
    campaign_id: Optional[str] = Field(None, description="Associated campaign ID")
    character_id: Optional[str] = Field(None, description="Associated character ID")


class GenerateCharacterArtRequest(BaseModel):
    character_id: str
    character_name: str
    race: str
    char_class: str
    appearance: Optional[str] = None
    background: Optional[str] = None
    alignment: Optional[str] = None
    personality: Optional[str] = None
    additional_details: Optional[str] = None
    size: str = Field("1024x1024", description="Image size")
    quality: str = Field("standard", description="Image quality")


class GenerateMapRequest(BaseModel):
    campaign_id: Optional[str] = None
    environment: str = Field(..., description="dungeon, forest, tavern, castle, etc.")
    map_style: Literal["top-down", "scenic", "isometric"] = Field("top-down")
    mood: Optional[str] = Field(None, description="dark, mysterious, bright, cheerful, etc.")
    features: Optional[List[str]] = Field(None, description="altar, traps, treasure, etc.")
    additional_details: Optional[str] = None
    size: str = Field("1024x1024", description="Image size")
    quality: str = Field("standard", description="Image quality")


class GenerateTokenRequest(BaseModel):
    creature_name: str
    creature_type: str = Field(..., description="monster, NPC, creature, etc.")
    description: Optional[str] = None
    size: str = Field("1024x1024", description="Image size")
    quality: str = Field("standard", description="Image quality")


# Response Model
class ImageGenerationResponse(BaseModel):
    id: str
    url: str
    revised_prompt: str
    original_prompt: str
    image_type: str
    size: str
    quality: str
    cost: float
    created_at: str
    is_mock: bool
    campaign_id: Optional[str] = None
    character_id: Optional[str] = None


@router.get("/status")
async def get_ai_status():
    """Check if AI image generation is available"""
    
    api_key = os.getenv("OPENAI_API_KEY")
    
    return {
        "available": api_key is not None or openai_config.mode == ServiceMode.MOCK,
        "mode": openai_config.mode.value,
        "message": "AI Image Generation ready" if api_key or openai_config.mode == ServiceMode.MOCK else "OpenAI API key not configured",
        "pricing": dalle_service.PRICING
    }


@router.post("/generate-image", response_model=ImageGenerationResponse)
async def generate_image(request: GenerateImageRequest):
    """
    Generate an image using DALL-E 3
    
    Supports:
    - Map generation (top-down or scenic views)
    - Character portraits
    - Tokens/creatures
    - NPC art
    
    Requires: Basic subscription or higher
    """
    
    # TODO: Get actual user tier from auth
    user_tier = SubscriptionTier.FREE
    
    # Check if AI image generation is allowed
    if not can_use_feature(user_tier, "ai_images"):
        upgrade_prompt = get_upgrade_prompt(user_tier, "ai_images")
        raise HTTPException(
            status_code=403,
            detail={
                "error": "subscription_required",
                "message": upgrade_prompt.message,
                "required_tier": upgrade_prompt.required_tier.value,
                "upgrade_benefits": upgrade_prompt.upgrade_benefits
            }
        )
    
    # Check quota (TODO: get actual usage from database)
    current_usage = 0  # Would query from database
    quota = check_quota(user_tier, "ai_images", current_usage)
    
    if not quota["allowed"]:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "quota_exceeded",
                "message": f"Monthly AI image limit reached ({quota['limit']} images)",
                "quota": quota,
                "resets_at": "Next month"  # TODO: Calculate actual reset date
            }
        )
    
    try:
        # Generate image
        result = await dalle_service.generate_image(
            prompt=request.prompt,
            image_type=request.image_type,
            size=request.size,
            quality=request.quality,
            style=request.style,
            user_id="user-123"  # TODO: Get from auth
        )
        
        # Add IDs
        result["id"] = f"img-{int(datetime.now().timestamp())}"
        result["campaign_id"] = request.campaign_id
        result["character_id"] = request.character_id
        
        # TODO: Save to database and file storage
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-character-art", response_model=ImageGenerationResponse)
async def generate_character_art(request: GenerateCharacterArtRequest):
    """
    Generate character art using character sheet data
    
    Automatically builds a detailed prompt from:
    - Race, class, and name
    - Physical appearance
    - Background story
    - Alignment and personality
    
    Requires: Basic subscription or higher
    """
    
    # TODO: Get actual user tier from auth
    user_tier = SubscriptionTier.FREE
    
    # Check subscription and quota
    if not can_use_feature(user_tier, "ai_images"):
        upgrade_prompt = get_upgrade_prompt(user_tier, "ai_images")
        raise HTTPException(
            status_code=403,
            detail={
                "error": "subscription_required",
                "message": upgrade_prompt.message,
                "required_tier": upgrade_prompt.required_tier.value,
                "upgrade_benefits": upgrade_prompt.upgrade_benefits
            }
        )
    
    current_usage = 0  # TODO: Query from database
    quota = check_quota(user_tier, "ai_images", current_usage)
    
    if not quota["allowed"]:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "quota_exceeded",
                "message": f"Monthly AI image limit reached ({quota['limit']} images)",
                "quota": quota
            }
        )
    
    try:
        # Build prompt from character data
        prompt = dalle_service.build_character_prompt(
            character_name=request.character_name,
            race=request.race,
            char_class=request.char_class,
            appearance=request.appearance,
            background=request.background,
            alignment=request.alignment,
            additional_details=request.additional_details or request.personality
        )
        
        # Generate image
        result = await dalle_service.generate_image(
            prompt=prompt,
            image_type="character",
            size=request.size,
            quality=request.quality,
            style="vivid",
            user_id="user-123"
        )
        
        # Add IDs
        result["id"] = f"img-char-{request.character_id}"
        result["character_id"] = request.character_id
        
        # TODO: Save to database and associate with character
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-map", response_model=ImageGenerationResponse)
async def generate_map(request: GenerateMapRequest):
    """
    Generate a battle map or scenic environment
    
    Styles:
    - top-down: Strategic battle map with grid
    - scenic: Cinematic landscape view
    - isometric: 3D-style isometric view
    
    Requires: Basic subscription or higher
    """
    
    # TODO: Get actual user tier from auth
    user_tier = SubscriptionTier.FREE
    
    # Check subscription and quota
    if not can_use_feature(user_tier, "ai_images"):
        upgrade_prompt = get_upgrade_prompt(user_tier, "ai_images")
        raise HTTPException(
            status_code=403,
            detail={
                "error": "subscription_required",
                "message": upgrade_prompt.message,
                "required_tier": upgrade_prompt.required_tier.value,
                "upgrade_benefits": upgrade_prompt.upgrade_benefits
            }
        )
    
    current_usage = 0  # TODO: Query from database
    quota = check_quota(user_tier, "ai_images", current_usage)
    
    if not quota["allowed"]:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "quota_exceeded",
                "message": f"Monthly AI image limit reached ({quota['limit']} images)",
                "quota": quota
            }
        )
    
    try:
        # Determine image type based on style
        image_type = "map_topdown" if request.map_style == "top-down" else "map_scenic"
        
        # Build prompt from map parameters
        prompt = dalle_service.build_map_prompt(
            environment=request.environment,
            style=request.map_style,
            mood=request.mood,
            features=request.features,
            additional_details=request.additional_details
        )
        
        # Adjust size for better map layouts
        size = request.size
        if request.map_style == "top-down" and size == "1024x1024":
            size = "1792x1024"  # Wider format for battle maps
        
        # Generate image
        result = await dalle_service.generate_image(
            prompt=prompt,
            image_type=image_type,
            size=size,
            quality=request.quality,
            style="natural" if request.map_style == "top-down" else "vivid",
            user_id="user-123"
        )
        
        # Add IDs
        result["id"] = f"img-map-{int(datetime.now().timestamp())}"
        result["campaign_id"] = request.campaign_id
        
        # TODO: Save to database and associate with campaign
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-token", response_model=ImageGenerationResponse)
async def generate_token(request: GenerateTokenRequest):
    """
    Generate a creature/NPC token for the battle map
    
    Creates circular tokens suitable for placing on grid-based maps.
    
    Requires: Basic subscription or higher
    """
    
    # TODO: Get actual user tier from auth
    user_tier = SubscriptionTier.FREE
    
    # Check subscription and quota
    if not can_use_feature(user_tier, "ai_images"):
        upgrade_prompt = get_upgrade_prompt(user_tier, "ai_images")
        raise HTTPException(
            status_code=403,
            detail={
                "error": "subscription_required",
                "message": upgrade_prompt.message,
                "required_tier": upgrade_prompt.required_tier.value,
                "upgrade_benefits": upgrade_prompt.upgrade_benefits
            }
        )
    
    current_usage = 0  # TODO: Query from database
    quota = check_quota(user_tier, "ai_images", current_usage)
    
    if not quota["allowed"]:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "quota_exceeded",
                "message": f"Monthly AI image limit reached ({quota['limit']} images)",
                "quota": quota
            }
        )
    
    try:
        # Build prompt
        prompt = f"{request.creature_name}, {request.creature_type}"
        if request.description:
            prompt += f", {request.description}"
        
        # Generate image
        result = await dalle_service.generate_image(
            prompt=prompt,
            image_type="token",
            size=request.size,
            quality=request.quality,
            style="natural",
            user_id="user-123"
        )
        
        # Add ID
        result["id"] = f"img-token-{int(datetime.now().timestamp())}"
        
        # TODO: Save to database
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/images/{campaign_id}")
async def get_campaign_images(
    campaign_id: str,
    image_type: Optional[str] = None,
    limit: int = 50
):
    """
    Get all generated images for a campaign
    
    Returns an image library with filtering options.
    """
    
    # TODO: Implement database query
    return {
        "campaign_id": campaign_id,
        "images": [],
        "total": 0,
        "message": "Image library not yet implemented - images will be stored here"
    }


@router.get("/images/character/{character_id}")
async def get_character_images(character_id: str):
    """Get all generated images for a character"""
    
    # TODO: Implement database query
    return {
        "character_id": character_id,
        "images": [],
        "total": 0,
        "message": "Character image library not yet implemented"
    }


@router.get("/templates/environments")
async def get_environment_templates():
    """Get predefined environment templates for quick map generation"""
    
    return {
        "environments": [
            {
                "name": "Dungeon",
                "keywords": ["dungeon", "underground", "stone walls", "torches"],
                "moods": ["dark", "mysterious", "ominous", "ancient"],
                "features": ["traps", "treasure chest", "altar", "prison cells", "secret door"]
            },
            {
                "name": "Forest",
                "keywords": ["forest", "woodland", "trees", "nature"],
                "moods": ["mystical", "peaceful", "dark", "enchanted"],
                "features": ["clearing", "stream", "ancient tree", "ruins", "cave entrance"]
            },
            {
                "name": "Tavern",
                "keywords": ["tavern", "inn", "pub", "bar"],
                "moods": ["cozy", "rowdy", "mysterious", "welcoming"],
                "features": ["fireplace", "bar counter", "tables", "stage", "rooms upstairs"]
            },
            {
                "name": "Castle",
                "keywords": ["castle", "fortress", "palace", "keep"],
                "moods": ["grand", "imposing", "abandoned", "defended"],
                "features": ["throne room", "battlements", "courtyard", "dungeon", "towers"]
            },
            {
                "name": "Cave",
                "keywords": ["cave", "cavern", "underground", "grotto"],
                "moods": ["dark", "mysterious", "dangerous", "glowing"],
                "features": ["stalactites", "underground lake", "crystal formations", "tunnels"]
            },
            {
                "name": "Town Square",
                "keywords": ["town", "city", "marketplace", "square"],
                "moods": ["bustling", "peaceful", "festive", "tense"],
                "features": ["fountain", "market stalls", "statue", "buildings", "cobblestones"]
            },
            {
                "name": "Temple",
                "keywords": ["temple", "shrine", "sanctuary", "holy place"],
                "moods": ["sacred", "abandoned", "mystical", "grand"],
                "features": ["altar", "statues", "stained glass", "pews", "holy symbol"]
            },
            {
                "name": "Mountain Pass",
                "keywords": ["mountain", "cliffs", "high altitude", "rocky"],
                "moods": ["treacherous", "scenic", "windy", "snowy"],
                "features": ["narrow path", "bridge", "avalanche", "cave", "vista"]
            }
        ]
    }


@router.get("/templates/character-styles")
async def get_character_style_templates():
    """Get style templates for character art generation"""
    
    return {
        "styles": [
            {
                "name": "Heroic Portrait",
                "description": "Epic hero pose, dramatic lighting, detailed armor and weapons",
                "keywords": ["heroic", "dramatic lighting", "detailed", "professional"]
            },
            {
                "name": "Character Bust",
                "description": "Detailed face and upper body, focus on expression and personality",
                "keywords": ["bust portrait", "facial details", "expressive", "personality"]
            },
            {
                "name": "Full Body",
                "description": "Complete character view, action pose, showing equipment",
                "keywords": ["full body", "action pose", "dynamic", "equipment visible"]
            },
            {
                "name": "Casual Portrait",
                "description": "Relaxed pose, natural lighting, character at rest",
                "keywords": ["casual", "relaxed", "natural lighting", "at ease"]
            },
            {
                "name": "Battle Ready",
                "description": "Combat stance, weapons drawn, intense expression",
                "keywords": ["combat stance", "weapons ready", "intense", "battle"]
            }
        ]
    }
