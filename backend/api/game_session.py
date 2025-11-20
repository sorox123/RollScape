"""
Game session API endpoints.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

from game_logic.session_manager import session_manager, GamePhase
from game_logic.combat_manager import Combatant

router = APIRouter(prefix="/api/session", tags=["game-session"])


class CreateSessionRequest(BaseModel):
    """Request to create session"""
    campaign_id: str
    dm_user_id: str
    player_character_ids: List[str]


class PlayerActionRequest(BaseModel):
    """Request to log player action"""
    character_id: str
    character_name: str
    action_type: str
    description: str
    dice_roll: Optional[Dict] = None
    result: Optional[str] = None


class ChatMessageRequest(BaseModel):
    """Request to send chat message"""
    sender_id: str
    sender_name: str
    sender_type: str = "player"  # player, dm, system, npc
    message: str
    is_ic: bool = True


class StartCombatRequest(BaseModel):
    """Request to start combat"""
    description: str = ""
    combatants: List[Dict]


@router.post("/create", response_model=dict)
async def create_session(request: CreateSessionRequest):
    """
    Create a new game session.
    """
    try:
        session = session_manager.create_session(
            campaign_id=request.campaign_id,
            dm_user_id=request.dm_user_id,
            player_character_ids=request.player_character_ids
        )
        
        return {
            "session_id": session.session_id,
            "status": session.status,
            "message": "Session created successfully"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}", response_model=dict)
async def get_session(session_id: str):
    """
    Get session state.
    """
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return session.model_dump(mode='json')


@router.get("/{session_id}/summary", response_model=dict)
async def get_session_summary(session_id: str):
    """
    Get session summary.
    """
    summary = session_manager.get_session_summary(session_id)
    
    if "error" in summary:
        raise HTTPException(status_code=404, detail=summary["error"])
    
    return summary


@router.post("/{session_id}/start", response_model=dict)
async def start_session(session_id: str):
    """
    Start a session.
    """
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.start_session()
    session_manager.update_session(session)
    
    return {
        "message": "Session started",
        "status": session.status,
        "started_at": session.started_at.isoformat() if session.started_at else None
    }


@router.post("/{session_id}/end", response_model=dict)
async def end_session(session_id: str):
    """
    End a session.
    """
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.end_session()
    session_manager.update_session(session)
    
    return {
        "message": "Session ended",
        "status": session.status
    }


@router.post("/{session_id}/action", response_model=dict)
async def add_player_action(session_id: str, request: PlayerActionRequest):
    """
    Log a player action.
    """
    try:
        action = session_manager.add_player_action(
            session_id=session_id,
            character_id=request.character_id,
            character_name=request.character_name,
            action_type=request.action_type,
            description=request.description,
            dice_roll=request.dice_roll,
            result=request.result
        )
        
        return {
            "action_id": action.id,
            "timestamp": action.timestamp.isoformat(),
            "message": "Action logged"
        }
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{session_id}/chat", response_model=dict)
async def send_chat_message(session_id: str, request: ChatMessageRequest):
    """
    Send a chat message.
    """
    try:
        message = session_manager.add_chat_message(
            session_id=session_id,
            sender_id=request.sender_id,
            sender_name=request.sender_name,
            sender_type=request.sender_type,
            message=request.message,
            is_ic=request.is_ic
        )
        
        return {
            "message_id": message.id,
            "timestamp": message.timestamp.isoformat(),
            "message": "Message sent"
        }
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}/chat", response_model=List[dict])
async def get_chat_history(session_id: str, count: int = 50):
    """
    Get chat history.
    """
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    messages = session.get_recent_chat(count)
    return [msg.model_dump(mode='json') for msg in messages]


@router.get("/{session_id}/actions", response_model=List[dict])
async def get_action_history(session_id: str, count: int = 20):
    """
    Get action history.
    """
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    actions = session.get_recent_actions(count)
    return [action.model_dump(mode='json') for action in actions]


@router.post("/{session_id}/combat/start", response_model=dict)
async def start_combat(session_id: str, request: StartCombatRequest):
    """
    Start combat encounter.
    """
    try:
        combat = session_manager.start_combat(
            session_id=session_id,
            description=request.description
        )
        
        # Add combatants
        for combatant_data in request.combatants:
            combatant = Combatant(**combatant_data)
            combat.add_combatant(combatant)
        
        combat.start_combat()
        
        return {
            "combat_id": combat.id,
            "status": combat.status,
            "message": "Combat started",
            "turn_order": [
                {
                    "id": c.id,
                    "name": c.name,
                    "initiative": c.initiative
                }
                for c in combat.combatants
            ]
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}/combat", response_model=dict)
async def get_combat_state(session_id: str):
    """
    Get current combat state.
    """
    combat = session_manager.get_session_combat(session_id)
    if not combat:
        raise HTTPException(status_code=404, detail="No active combat")
    
    return combat.model_dump(mode='json')


@router.post("/{session_id}/combat/next-turn", response_model=dict)
async def next_combat_turn(session_id: str):
    """
    Advance to next turn in combat.
    """
    combat = session_manager.get_session_combat(session_id)
    if not combat:
        raise HTTPException(status_code=404, detail="No active combat")
    
    try:
        result = combat.next_turn()
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{session_id}/combat/end", response_model=dict)
async def end_combat(session_id: str):
    """
    End combat encounter.
    """
    try:
        session_manager.end_combat(session_id)
        return {"message": "Combat ended"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
