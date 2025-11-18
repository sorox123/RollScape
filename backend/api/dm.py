"""
DM Agent API endpoints.
Handles AI Dungeon Master interactions.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from agents.dm_agent import DMAgent, GameContext, DMPersonality
import os

router = APIRouter(prefix="/api/dm", tags=["dm-agent"])

# Global DM agent instance (in production, this would be per-session)
_dm_agent: Optional[DMAgent] = None


def get_dm_agent() -> DMAgent:
    """Get or create DM agent instance"""
    global _dm_agent
    
    if _dm_agent is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=503,
                detail="OpenAI API key not configured. Set OPENAI_API_KEY environment variable."
            )
        _dm_agent = DMAgent(api_key=api_key)
    
    return _dm_agent


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
async def dm_respond(request: DMRequest, dm: DMAgent = Depends(get_dm_agent)):
    """
    Get DM response to player action.
    
    The DM will:
    - Interpret the player's action
    - Generate narrative response
    - Indicate if dice rolls are needed
    - Flag combat initiation
    """
    try:
        # Build context if provided
        context = None
        if request.campaign_name:
            context = GameContext(
                campaign_name=request.campaign_name,
                current_location=request.current_location,
                active_characters=request.active_characters or [],
                recent_events=request.recent_events or []
            )
        
        # Get DM response
        response = await dm.respond(request.player_input, context)
        
        return DMResponseModel(
            narrative=response.narrative,
            requires_roll=response.requires_roll,
            combat_initiated=response.combat_initiated
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DM Agent error: {str(e)}")


@router.post("/start-campaign", response_model=dict)
async def start_campaign(request: StartCampaignRequest):
    """
    Start a new campaign with an opening scene.
    
    Creates a fresh DM agent with specified personality and generates
    an engaging opening narrative.
    """
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=503,
                detail="OpenAI API key not configured"
            )
        
        # Create new DM with specified personality
        dm = DMAgent(api_key=api_key, personality=request.personality)
        
        # Generate opening scene
        opening = dm.start_campaign(request.campaign_name, request.setting)
        
        return {
            "campaign_name": request.campaign_name,
            "setting": request.setting,
            "personality": request.personality,
            "opening_narrative": opening
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting campaign: {str(e)}")


@router.post("/generate-npc", response_model=dict)
async def generate_npc(
    npc_name: str,
    npc_role: str,
    dm: DMAgent = Depends(get_dm_agent)
):
    """
    Generate an NPC description.
    
    Creates a detailed NPC with appearance, personality, and distinctive traits.
    """
    try:
        description = dm.describe_npc(npc_name, npc_role)
        
        return {
            "npc_name": npc_name,
            "npc_role": npc_role,
            "description": description
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating NPC: {str(e)}")


@router.post("/generate-encounter", response_model=dict)
async def generate_encounter(
    party_level: int,
    difficulty: str = "medium",
    dm: DMAgent = Depends(get_dm_agent)
):
    """
    Generate a combat encounter.
    
    Creates a balanced encounter appropriate for the party level and difficulty.
    """
    try:
        if difficulty not in ["easy", "medium", "hard", "deadly"]:
            raise HTTPException(status_code=400, detail="Invalid difficulty")
        
        encounter = dm.generate_encounter(party_level, difficulty)
        
        return {
            "party_level": party_level,
            "difficulty": difficulty,
            "encounter": encounter
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating encounter: {str(e)}")


@router.post("/clear-history", response_model=dict)
async def clear_history(dm: DMAgent = Depends(get_dm_agent)):
    """
    Clear the DM's conversation history.
    
    Useful for starting a new session or resetting context.
    """
    dm.clear_history()
    return {"message": "Conversation history cleared"}


@router.get("/history", response_model=List[dict])
async def get_history(dm: DMAgent = Depends(get_dm_agent)):
    """
    Get the DM's conversation history.
    
    Returns recent exchanges between players and DM.
    """
    return dm.get_history()


@router.get("/test", response_model=dict)
async def test_dm():
    """
    Test if DM agent is available.
    
    Checks if OpenAI API key is configured.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    
    return {
        "dm_available": api_key is not None,
        "message": "DM Agent ready" if api_key else "OpenAI API key not configured"
    }
