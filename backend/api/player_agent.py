"""
Player Agent and Voting System API endpoints.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from database import get_db
from agents.player_agent import (
    PlayerAgent, CharacterProfile, ActionDecision,
    PlayerPersonality, create_player_agent_from_character
)
from agents.voting_system import (
    VotingSystem, VoteType, VoteStatus,
    VoteRequest, VoteCast, VoteResult
)
import os

router = APIRouter(prefix="/api/player-agent", tags=["player-agent"])


# --- Player Agent Endpoints ---

class PlayerActionRequest(BaseModel):
    """Request for AI player to decide action"""
    character_id: str
    situation: str
    available_actions: Optional[List[str]] = None
    party_context: Optional[str] = None


class NPCResponseRequest(BaseModel):
    """Request for AI player to respond to NPC"""
    character_id: str
    npc_name: str
    npc_dialogue: str
    context: Optional[str] = None


class CharacterAnalysisRequest(BaseModel):
    """Request to analyze character personality"""
    character_id: str
    character_name: str
    character_class: str
    chat_history: List[Dict] = Field(default_factory=list)
    action_history: List[str] = Field(default_factory=list)


# In-memory storage for active agents (would use Redis in production)
_active_agents: Dict[str, PlayerAgent] = {}


def get_or_create_agent(
    character_id: str,
    character_name: str,
    character_class: str,
    chat_history: List[Dict] = None,
    action_history: List[str] = None
) -> PlayerAgent:
    """Get existing agent or create new one"""
    if character_id not in _active_agents:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=503,
                detail="OpenAI API key not configured"
            )
        
        _active_agents[character_id] = create_player_agent_from_character(
            character_id=character_id,
            character_name=character_name,
            character_class=character_class,
            chat_history=chat_history or [],
            action_history=action_history or [],
            api_key=api_key
        )
    
    return _active_agents[character_id]


@router.post("/decide-action", response_model=ActionDecision)
async def decide_action(request: PlayerActionRequest):
    """
    Have AI player agent decide what action to take.
    
    The agent analyzes the situation and decides based on:
    - Character personality and history
    - Available actions
    - Party context
    - Risk tolerance
    """
    try:
        # In production, would fetch character details from database
        agent = get_or_create_agent(
            character_id=request.character_id,
            character_name="Character",  # Would fetch from DB
            character_class="Fighter"  # Would fetch from DB
        )
        
        decision = await agent.decide_action(
            situation=request.situation,
            available_actions=request.available_actions,
            party_context=request.party_context
        )
        
        return decision
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deciding action: {str(e)}")


@router.post("/respond-to-npc", response_model=dict)
async def respond_to_npc(request: NPCResponseRequest):
    """
    Have AI player respond to NPC dialogue in character.
    
    The agent responds based on:
    - Character personality
    - Relationship with the NPC (if any)
    - Current context
    """
    try:
        agent = get_or_create_agent(
            character_id=request.character_id,
            character_name="Character",
            character_class="Fighter"
        )
        
        response = await agent.respond_to_npc(
            npc_dialogue=request.npc_dialogue,
            npc_name=request.npc_name,
            context=request.context
        )
        
        return {
            "character_id": request.character_id,
            "response": response
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error responding: {str(e)}")


@router.post("/analyze-character", response_model=dict)
async def analyze_character(request: CharacterAnalysisRequest):
    """
    Analyze character personality from chat and action history.
    
    Uses LLM to identify:
    - Personality traits
    - Common phrases
    - Combat style
    - Roleplay style
    - Risk tolerance
    - Decision patterns
    """
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=503, detail="OpenAI API key not configured")
        
        agent = create_player_agent_from_character(
            character_id=request.character_id,
            character_name=request.character_name,
            character_class=request.character_class,
            chat_history=request.chat_history,
            action_history=request.action_history,
            api_key=api_key
        )
        
        analysis = agent.analyze_personality_from_history()
        
        return {
            "character_id": request.character_id,
            "character_name": request.character_name,
            "analysis": analysis
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing: {str(e)}")


@router.delete("/deactivate/{character_id}", response_model=dict)
async def deactivate_agent(character_id: str):
    """
    Deactivate AI agent for a character (e.g., when player returns).
    """
    if character_id in _active_agents:
        del _active_agents[character_id]
        return {"message": "Agent deactivated", "character_id": character_id}
    
    return {"message": "No active agent found", "character_id": character_id}


# --- Voting System Endpoints ---

@router.post("/vote/initiate", response_model=dict)
async def initiate_vote(request: VoteRequest, db: Session = Depends(get_db)):
    """
    Initiate a vote for handling an absent player.
    
    Vote types:
    - SKIP_TURN: Skip the absent player's turns this session
    - AI_CONTROL: Enable AI agent to control the character
    
    Requires majority vote from present players.
    """
    try:
        # In production, would validate session, campaign, and character IDs
        # and fetch list of present players for eligible_voters
        
        voting_system = VotingSystem(db)
        
        # Mock eligible voters (would fetch from session in production)
        eligible_voters = ["voter1", "voter2", "voter3"]  # Character IDs
        
        vote = voting_system.initiate_vote(
            session_id=request.session_id,
            campaign_id=request.campaign_id,
            absent_character_id=request.absent_character_id,
            vote_type=request.vote_type,
            initiated_by=request.initiated_by,
            eligible_voters=eligible_voters,
            reason=request.reason,
            expires_in_minutes=request.expires_in_minutes
        )
        
        return {
            "vote_id": str(vote.id),
            "status": vote.status,
            "vote_type": vote.vote_type,
            "required_votes": vote.required_votes,
            "expires_at": vote.expires_at.isoformat(),
            "message": f"Vote initiated. {vote.required_votes} votes required to pass."
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error initiating vote: {str(e)}")


@router.post("/vote/cast", response_model=VoteResult)
async def cast_vote(vote_cast: VoteCast, db: Session = Depends(get_db)):
    """
    Cast a vote on an active absentee vote.
    
    Args:
        vote_id: ID of the vote
        character_id: Character casting the vote
        vote_for: True = yes/approve, False = no/reject
    """
    try:
        voting_system = VotingSystem(db)
        
        result = voting_system.cast_vote(
            vote_id=vote_cast.vote_id,
            character_id=vote_cast.character_id,
            vote_for=vote_cast.vote_for
        )
        
        return result
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error casting vote: {str(e)}")


@router.get("/vote/status/{vote_id}", response_model=VoteResult)
async def get_vote_status(vote_id: str, db: Session = Depends(get_db)):
    """
    Get current status of a vote.
    """
    try:
        voting_system = VotingSystem(db)
        result = voting_system.get_vote_status(vote_id)
        return result
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting vote: {str(e)}")


@router.get("/vote/session/{session_id}", response_model=List[dict])
async def get_session_votes(session_id: str, db: Session = Depends(get_db)):
    """
    Get all active votes for a game session.
    """
    try:
        voting_system = VotingSystem(db)
        votes = voting_system.get_active_votes_for_session(session_id)
        
        return [
            {
                "vote_id": str(vote.id),
                "absent_character_id": str(vote.absent_character_id),
                "vote_type": vote.vote_type,
                "status": vote.status,
                "votes_for": len(vote.votes_for or []),
                "votes_against": len(vote.votes_against or []),
                "required_votes": vote.required_votes,
                "expires_at": vote.expires_at.isoformat()
            }
            for vote in votes
        ]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting votes: {str(e)}")


@router.get("/vote/ai-controlled/{session_id}", response_model=List[str])
async def get_ai_controlled(session_id: str, db: Session = Depends(get_db)):
    """
    Get list of character IDs currently under AI control in a session.
    """
    try:
        voting_system = VotingSystem(db)
        character_ids = voting_system.get_ai_controlled_characters(session_id)
        return character_ids
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting AI controlled: {str(e)}")


@router.post("/vote/deactivate-ai/{vote_id}", response_model=dict)
async def deactivate_ai_control(vote_id: str, db: Session = Depends(get_db)):
    """
    Deactivate AI control for a character (e.g., when player returns).
    """
    try:
        voting_system = VotingSystem(db)
        voting_system.deactivate_ai_control(vote_id)
        
        return {
            "message": "AI control deactivated",
            "vote_id": vote_id
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deactivating: {str(e)}")


@router.get("/test", response_model=dict)
async def test_player_agent():
    """
    Test if Player Agent system is available.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    
    return {
        "player_agent_available": api_key is not None,
        "message": "Player Agent ready" if api_key else "OpenAI API key not configured"
    }
