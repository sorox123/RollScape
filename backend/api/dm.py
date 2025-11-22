"""
DM Agent API endpoints.
Handles AI Dungeon Master interactions.

Now supports MOCK_MODE for free development!
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from services.service_factory import ServiceFactory, get_ai_service
from config import settings
import os

router = APIRouter(prefix="/api/dm", tags=["dm-agent"])


def get_dm_service():
    """Get DM service (mock or real based on configuration)"""
    return get_ai_service()


class DMRequest(BaseModel):
    """Request to the DM"""
    player_input: str = Field(..., description="What the player says or does")
    campaign_name: Optional[str] = Field(None, description="Campaign name for context")
    current_location: Optional[str] = None
    active_characters: Optional[List[str]] = None
    recent_events: Optional[List[str]] = None


class DMResponseModel(BaseModel):
    """DM's response"""
    narrative: str
    requires_roll: Optional[str] = None
    combat_initiated: bool = False


class StartCampaignRequest(BaseModel):
    """Request to start a new campaign"""
    campaign_name: str = Field(..., description="Name of the campaign")
    setting: str = Field(default="fantasy", description="Genre/setting")
    personality: str = Field(default="balanced", description="DM personality style")


@router.post("/respond", response_model=DMResponseModel)
async def dm_respond(request: DMRequest, dm_service = Depends(get_dm_service)):
    """
    Get DM response to player action.
    
    The DM will:
    - Interpret the player's action
    - Generate narrative response
    - Indicate if dice rolls are needed
    - Flag combat initiation
    
    Works in both MOCK_MODE (free) and production mode (paid).
    """
    try:
        # Build context dict if provided
        context = {}
        if request.campaign_name:
            context = {
                "campaign_name": request.campaign_name,
                "current_location": request.current_location,
                "active_characters": request.active_characters or [],
                "recent_events": request.recent_events or []
            }
        
        # Get DM response (works with both mock and real service)
        response = await dm_service.generate_dm_response(
            request.player_input,
            context=context if context else None
        )
        
        return DMResponseModel(
            narrative=response["narrative"],
            requires_roll=response.get("requires_roll"),
            combat_initiated=response.get("combat_initiated", False)
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DM Agent error: {str(e)}")


@router.post("/start-campaign", response_model=dict)
async def start_campaign(request: StartCampaignRequest, dm_service = Depends(get_dm_service)):
    """
    Start a new campaign with an opening scene.
    
    Generates an engaging opening narrative for your campaign.
    Works in both MOCK_MODE (free) and production mode (paid).
    """
    try:
        # Generate opening scene
        opening = await dm_service.generate_campaign_opening(
            request.campaign_name,
            request.setting,
            request.personality
        )
        
        return {
            "campaign_name": request.campaign_name,
            "setting": request.setting,
            "personality": request.personality,
            "opening_narrative": opening,
            "mock_mode": settings.mock_mode
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting campaign: {str(e)}")


@router.post("/generate-npc", response_model=dict)
async def generate_npc(
    npc_name: str,
    npc_role: str,
    dm_service = Depends(get_dm_service)
):
    """
    Generate an NPC description.
    
    Creates a detailed NPC with appearance, personality, and distinctive traits.
    Works in both MOCK_MODE (free) and production mode (paid).
    """
    try:
        description = await dm_service.generate_npc_description(npc_name, npc_role)
        
        return {
            "npc_name": npc_name,
            "npc_role": npc_role,
            "description": description,
            "mock_mode": settings.mock_mode
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating NPC: {str(e)}")


@router.post("/generate-encounter", response_model=dict)
async def generate_encounter(
    party_level: int,
    difficulty: str = "medium",
    dm_service = Depends(get_dm_service)
):
    """
    Generate a combat encounter.
    
    Creates a balanced encounter appropriate for the party level and difficulty.
    Works in both MOCK_MODE (free) and production mode (paid).
    """
    try:
        if difficulty not in ["easy", "medium", "hard", "deadly"]:
            raise HTTPException(status_code=400, detail="Invalid difficulty")
        
        encounter = await dm_service.generate_encounter(party_level, difficulty)
        
        return {
            "party_level": party_level,
            "difficulty": difficulty,
            "encounter": encounter,
            "mock_mode": settings.mock_mode
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating encounter: {str(e)}")


@router.post("/clear-history", response_model=dict)
async def clear_history(dm_service = Depends(get_dm_service)):
    """
    Clear the DM's conversation history.
    
    Useful for starting a new session or resetting context.
    """
    dm_service.clear_history()
    return {"message": "Conversation history cleared", "mock_mode": settings.mock_mode}


@router.get("/history", response_model=List[dict])
async def get_history(dm_service = Depends(get_dm_service)):
    """
    Get the DM's conversation history.
    
    Returns recent exchanges between players and DM.
    """
    return dm_service.get_conversation_history()


@router.get("/stats", response_model=dict)
async def get_stats(dm_service = Depends(get_dm_service)):
    """
    Get DM usage statistics.
    
    Shows API call counts and costs (always $0 in mock mode).
    """
    stats = dm_service.get_stats()
    stats["mode_info"] = ServiceFactory.get_mode_info()
    return stats


@router.get("/test", response_model=dict)
async def test_dm():
    """
    Test DM service availability and check mode.
    
    Shows whether you're in MOCK_MODE (free) or production mode (paid).
    """
    mode_info = ServiceFactory.get_mode_info()
    
    return {
        "dm_available": True,
        "message": f"DM Agent ready in {mode_info['mode_name']}",
        "mock_mode": settings.mock_mode,
        "mode_info": mode_info,
        "cost_warning": mode_info["cost_warning"]
    }
