"""
Combat API endpoints

Handles combat encounters, initiative, turns, and actions.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import uuid

from ..game_logic.combat_manager import (
    combat_manager,
    Combatant,
    Combat,
    CombatStatus,
    Condition
)


router = APIRouter(prefix="/combat", tags=["combat"])


# Request/Response Models

class CombatantCreate(BaseModel):
    character_id: Optional[str] = None
    name: str
    initiative: int
    initiative_bonus: int = 0
    max_hp: int
    current_hp: Optional[int] = None
    armor_class: int = 10
    is_npc: bool = False
    is_player: bool = True


class CombatCreate(BaseModel):
    session_id: Optional[str] = None
    description: str = ""
    combatants: List[CombatantCreate]


class DamageRequest(BaseModel):
    combatant_id: str
    amount: int
    damage_type: Optional[str] = "untyped"


class HealingRequest(BaseModel):
    combatant_id: str
    amount: int


class ConditionRequest(BaseModel):
    combatant_id: str
    condition: Condition


# Endpoints

@router.post("/create", response_model=dict)
async def create_combat(combat_data: CombatCreate):
    """
    Create a new combat encounter.
    
    Automatically sorts combatants by initiative and prepares for combat start.
    """
    try:
        # Create combat
        combat = combat_manager.create_combat(
            session_id=combat_data.session_id,
            description=combat_data.description
        )
        
        # Add combatants
        for c_data in combat_data.combatants:
            combatant = Combatant(
                character_id=c_data.character_id,
                name=c_data.name,
                initiative=c_data.initiative,
                initiative_bonus=c_data.initiative_bonus,
                max_hp=c_data.max_hp,
                current_hp=c_data.current_hp or c_data.max_hp,
                armor_class=c_data.armor_class,
                is_npc=c_data.is_npc,
                is_player=c_data.is_player
            )
            combat.add_combatant(combatant)
        
        return {
            "combat_id": combat.id,
            "status": combat.status,
            "combatants": [c.model_dump() for c in combat.combatants],
            "turn_order": combat.turn_order
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating combat: {str(e)}")


@router.post("/{combat_id}/start", response_model=dict)
async def start_combat(combat_id: str):
    """
    Start combat encounter.
    
    Sets status to ACTIVE, initializes round 1, and sets first combatant's turn.
    """
    combat = combat_manager.get_combat(combat_id)
    if not combat:
        raise HTTPException(status_code=404, detail="Combat not found")
    
    try:
        combat.start_combat()
        
        current = combat.get_current_combatant()
        
        return {
            "combat_id": combat.id,
            "status": combat.status,
            "round": combat.round_number,
            "current_turn": current.model_dump() if current else None,
            "turn_order": [
                {
                    "id": c.id,
                    "name": c.name,
                    "initiative": c.initiative
                }
                for c_id in combat.turn_order
                for c in combat.combatants if c.id == c_id
            ]
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting combat: {str(e)}")


@router.get("/{combat_id}", response_model=dict)
async def get_combat(combat_id: str):
    """
    Get current combat state.
    
    Returns full combat information including all combatants, turn order, and status.
    """
    combat = combat_manager.get_combat(combat_id)
    if not combat:
        raise HTTPException(status_code=404, detail="Combat not found")
    
    current = combat.get_current_combatant()
    
    return {
        "id": combat.id,
        "session_id": combat.session_id,
        "status": combat.status,
        "round": combat.round_number,
        "turn": combat.current_turn,
        "current_combatant": current.model_dump() if current else None,
        "combatants": [c.model_dump() for c in combat.combatants],
        "turn_order": combat.turn_order,
        "description": combat.description,
        "environment_effects": combat.environment_effects
    }


@router.post("/{combat_id}/next-turn", response_model=dict)
async def next_turn(combat_id: str):
    """
    Advance to next turn.
    
    Moves to the next combatant in initiative order. If round is complete, increments round number.
    """
    combat = combat_manager.get_combat(combat_id)
    if not combat:
        raise HTTPException(status_code=404, detail="Combat not found")
    
    try:
        result = combat.next_turn()
        
        return {
            "combat_id": combat.id,
            "round": result["round"],
            "turn": result["turn"],
            "current_combatant": result["combatant"],
            "turn_order": combat.turn_order
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error advancing turn: {str(e)}")


@router.post("/{combat_id}/damage", response_model=dict)
async def apply_damage(combat_id: str, damage_req: DamageRequest):
    """
    Apply damage to a combatant.
    
    Handles temp HP absorption and automatic unconsciousness when HP reaches 0.
    """
    combat = combat_manager.get_combat(combat_id)
    if not combat:
        raise HTTPException(status_code=404, detail="Combat not found")
    
    try:
        result = combat.apply_damage(damage_req.combatant_id, damage_req.amount)
        
        return {
            "combat_id": combat.id,
            "damage_applied": damage_req.amount,
            "damage_type": damage_req.damage_type,
            **result
        }
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error applying damage: {str(e)}")


@router.post("/{combat_id}/heal", response_model=dict)
async def apply_healing(combat_id: str, heal_req: HealingRequest):
    """
    Apply healing to a combatant.
    
    Cannot exceed max HP. Automatically removes unconscious condition if healed from 0 HP.
    """
    combat = combat_manager.get_combat(combat_id)
    if not combat:
        raise HTTPException(status_code=404, detail="Combat not found")
    
    try:
        result = combat.apply_healing(heal_req.combatant_id, heal_req.amount)
        
        return {
            "combat_id": combat.id,
            "healing_applied": heal_req.amount,
            **result
        }
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error applying healing: {str(e)}")


@router.post("/{combat_id}/condition/add", response_model=dict)
async def add_condition(combat_id: str, condition_req: ConditionRequest):
    """
    Add a condition to a combatant.
    
    Conditions affect combat actions and may have mechanical effects.
    """
    combat = combat_manager.get_combat(combat_id)
    if not combat:
        raise HTTPException(status_code=404, detail="Combat not found")
    
    combatant = combat.get_combatant(condition_req.combatant_id)
    if not combatant:
        raise HTTPException(status_code=404, detail="Combatant not found")
    
    try:
        combatant.add_condition(condition_req.condition)
        
        return {
            "combat_id": combat.id,
            "combatant_id": combatant.id,
            "combatant_name": combatant.name,
            "condition_added": condition_req.condition,
            "current_conditions": [str(c) for c in combatant.conditions]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding condition: {str(e)}")


@router.post("/{combat_id}/condition/remove", response_model=dict)
async def remove_condition(combat_id: str, condition_req: ConditionRequest):
    """
    Remove a condition from a combatant.
    """
    combat = combat_manager.get_combat(combat_id)
    if not combat:
        raise HTTPException(status_code=404, detail="Combat not found")
    
    combatant = combat.get_combatant(condition_req.combatant_id)
    if not combatant:
        raise HTTPException(status_code=404, detail="Combatant not found")
    
    try:
        combatant.remove_condition(condition_req.condition)
        
        return {
            "combat_id": combat.id,
            "combatant_id": combatant.id,
            "combatant_name": combatant.name,
            "condition_removed": condition_req.condition,
            "current_conditions": [str(c) for c in combatant.conditions]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error removing condition: {str(e)}")


@router.get("/{combat_id}/summary", response_model=dict)
async def get_combat_summary(combat_id: str):
    """
    Get concise combat summary.
    
    Useful for quick status checks without full combat data.
    """
    combat = combat_manager.get_combat(combat_id)
    if not combat:
        raise HTTPException(status_code=404, detail="Combat not found")
    
    return combat.get_summary()


@router.post("/{combat_id}/end", response_model=dict)
async def end_combat(combat_id: str):
    """
    End combat encounter.
    
    Sets status to ENDED and prevents further actions.
    """
    combat = combat_manager.get_combat(combat_id)
    if not combat:
        raise HTTPException(status_code=404, detail="Combat not found")
    
    combat.status = CombatStatus.ENDED
    
    return {
        "combat_id": combat.id,
        "status": combat.status,
        "final_round": combat.round_number,
        "summary": combat.get_summary()
    }


@router.delete("/{combat_id}", status_code=204)
async def delete_combat(combat_id: str):
    """
    Delete combat encounter.
    
    Removes combat from manager. Cannot be undone.
    """
    combat = combat_manager.get_combat(combat_id)
    if not combat:
        raise HTTPException(status_code=404, detail="Combat not found")
    
    combat_manager.delete_combat(combat_id)
    return None


@router.get("/session/{session_id}", response_model=dict)
async def get_session_combats(session_id: str):
    """
    Get all combats for a session.
    
    Returns list of combat encounters associated with the session.
    """
    combats = combat_manager.get_session_combats(session_id)
    
    return {
        "session_id": session_id,
        "combats": [
            {
                "id": c.id,
                "status": c.status,
                "round": c.round_number,
                "description": c.description,
                "combatant_count": len(c.combatants)
            }
            for c in combats
        ],
        "total": len(combats)
    }
