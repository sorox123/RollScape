"""
Combat management system.
Handles initiative, turn order, HP tracking, and combat state.
"""

from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from enum import Enum
import uuid


class CombatStatus(str, Enum):
    """Combat status"""
    READY = "ready"
    ACTIVE = "active"
    PAUSED = "paused"
    ENDED = "ended"


class Condition(str, Enum):
    """Character conditions"""
    BLINDED = "blinded"
    CHARMED = "charmed"
    DEAFENED = "deafened"
    FRIGHTENED = "frightened"
    GRAPPLED = "grappled"
    INCAPACITATED = "incapacitated"
    INVISIBLE = "invisible"
    PARALYZED = "paralyzed"
    PETRIFIED = "petrified"
    POISONED = "poisoned"
    PRONE = "prone"
    RESTRAINED = "restrained"
    STUNNED = "stunned"
    UNCONSCIOUS = "unconscious"
    EXHAUSTION = "exhaustion"
    CONCENTRATION = "concentration"


class Combatant(BaseModel):
    """A combatant in combat"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    character_id: Optional[str] = None
    name: str
    initiative: int
    initiative_bonus: int = 0
    
    # HP tracking
    max_hp: int
    current_hp: int
    temp_hp: int = 0
    
    # Status
    is_npc: bool = False
    is_player: bool = True
    is_dead: bool = False
    is_stable: bool = False
    death_saves: Dict[str, int] = Field(default_factory=lambda: {"success": 0, "failure": 0})
    
    # Combat state
    armor_class: int = 10
    conditions: List[Condition] = Field(default_factory=list)
    reactions_used: int = 0
    bonus_actions_used: int = 0
    
    # Notes
    notes: str = ""
    
    @property
    def is_alive(self) -> bool:
        """Check if combatant is alive"""
        return not self.is_dead
    
    @property
    def is_bloodied(self) -> bool:
        """Check if below half HP"""
        return self.current_hp <= self.max_hp // 2
    
    @property
    def is_unconscious(self) -> bool:
        """Check if unconscious"""
        return Condition.UNCONSCIOUS in self.conditions or self.current_hp <= 0
    
    def take_damage(self, amount: int) -> Dict:
        """Apply damage"""
        if amount <= 0:
            return {"damage_taken": 0, "current_hp": self.current_hp}
        
        # Temp HP absorbs first
        if self.temp_hp > 0:
            if amount <= self.temp_hp:
                self.temp_hp -= amount
                return {
                    "damage_taken": amount,
                    "temp_hp_lost": amount,
                    "current_hp": self.current_hp,
                    "temp_hp": self.temp_hp
                }
            else:
                amount -= self.temp_hp
                self.temp_hp = 0
        
        # Apply to current HP
        self.current_hp = max(0, self.current_hp - amount)
        
        # Check for unconscious
        if self.current_hp == 0:
            if Condition.UNCONSCIOUS not in self.conditions:
                self.conditions.append(Condition.UNCONSCIOUS)
            if Condition.PRONE not in self.conditions:
                self.conditions.append(Condition.PRONE)
        
        return {
            "damage_taken": amount,
            "current_hp": self.current_hp,
            "is_unconscious": self.is_unconscious,
            "is_bloodied": self.is_bloodied
        }
    
    def heal(self, amount: int) -> Dict:
        """Apply healing"""
        if amount <= 0:
            return {"healing": 0, "current_hp": self.current_hp}
        
        old_hp = self.current_hp
        self.current_hp = min(self.max_hp, self.current_hp + amount)
        actual_healing = self.current_hp - old_hp
        
        # Remove unconscious if healed from 0
        if old_hp == 0 and self.current_hp > 0:
            self.conditions = [c for c in self.conditions if c != Condition.UNCONSCIOUS]
            self.death_saves = {"success": 0, "failure": 0}
        
        return {
            "healing": actual_healing,
            "current_hp": self.current_hp,
            "is_conscious": not self.is_unconscious
        }
    
    def add_condition(self, condition: Condition):
        """Add a condition"""
        if condition not in self.conditions:
            self.conditions.append(condition)
    
    def remove_condition(self, condition: Condition):
        """Remove a condition"""
        self.conditions = [c for c in self.conditions if c != condition]
    
    def reset_turn(self):
        """Reset turn-based resources"""
        self.reactions_used = 0
        self.bonus_actions_used = 0


class Combat(BaseModel):
    """Combat encounter"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: Optional[str] = None
    status: CombatStatus = CombatStatus.READY
    
    combatants: List[Combatant] = Field(default_factory=list)
    turn_order: List[str] = Field(default_factory=list)  # Combatant IDs in order
    current_turn: int = 0
    round_number: int = 0
    
    description: str = ""
    environment_effects: List[str] = Field(default_factory=list)
    
    def add_combatant(self, combatant: Combatant):
        """Add combatant to combat"""
        self.combatants.append(combatant)
        self._rebuild_turn_order()
    
    def remove_combatant(self, combatant_id: str):
        """Remove combatant from combat"""
        self.combatants = [c for c in self.combatants if c.id != combatant_id]
        self._rebuild_turn_order()
    
    def get_combatant(self, combatant_id: str) -> Optional[Combatant]:
        """Get combatant by ID"""
        return next((c for c in self.combatants if c.id == combatant_id), None)
    
    def _rebuild_turn_order(self):
        """Rebuild initiative order"""
        # Sort by initiative (descending), then by initiative bonus
        sorted_combatants = sorted(
            self.combatants,
            key=lambda c: (c.initiative, c.initiative_bonus),
            reverse=True
        )
        self.turn_order = [c.id for c in sorted_combatants]
    
    def start_combat(self):
        """Start combat"""
        if not self.combatants:
            raise ValueError("No combatants in combat")
        
        self._rebuild_turn_order()
        self.status = CombatStatus.ACTIVE
        self.round_number = 1
        self.current_turn = 0
    
    def next_turn(self) -> Dict:
        """Advance to next turn"""
        if self.status != CombatStatus.ACTIVE:
            raise ValueError("Combat is not active")
        
        # Reset current combatant's turn resources
        current = self.get_current_combatant()
        if current:
            current.reset_turn()
        
        # Advance turn
        self.current_turn += 1
        
        # Check if round complete
        if self.current_turn >= len(self.turn_order):
            self.current_turn = 0
            self.round_number += 1
        
        # Get new current combatant
        next_combatant = self.get_current_combatant()
        
        return {
            "round": self.round_number,
            "turn": self.current_turn,
            "combatant": next_combatant.model_dump() if next_combatant else None
        }
    
    def get_current_combatant(self) -> Optional[Combatant]:
        """Get current turn's combatant"""
        if not self.turn_order or self.current_turn >= len(self.turn_order):
            return None
        
        combatant_id = self.turn_order[self.current_turn]
        return self.get_combatant(combatant_id)
    
    def apply_damage(self, combatant_id: str, amount: int) -> Dict:
        """Apply damage to combatant"""
        combatant = self.get_combatant(combatant_id)
        if not combatant:
            raise ValueError(f"Combatant {combatant_id} not found")
        
        result = combatant.take_damage(amount)
        result["combatant"] = combatant.model_dump()
        
        # Check if combat should end
        if self._check_combat_end():
            self.status = CombatStatus.ENDED
            result["combat_ended"] = True
        
        return result
    
    def apply_healing(self, combatant_id: str, amount: int) -> Dict:
        """Apply healing to combatant"""
        combatant = self.get_combatant(combatant_id)
        if not combatant:
            raise ValueError(f"Combatant {combatant_id} not found")
        
        result = combatant.heal(amount)
        result["combatant"] = combatant.model_dump()
        return result
    
    def _check_combat_end(self) -> bool:
        """Check if combat should end"""
        # Count conscious (not unconscious and not dead) combatants
        conscious_players = [c for c in self.combatants if c.is_player and not c.is_unconscious and c.is_alive]
        conscious_npcs = [c for c in self.combatants if c.is_npc and not c.is_unconscious and c.is_alive]
        
        # End if all players or all NPCs are dead/unconscious
        return len(conscious_players) == 0 or len(conscious_npcs) == 0
    
    def get_summary(self) -> Dict:
        """Get combat summary"""
        return {
            "id": self.id,
            "status": self.status,
            "round": self.round_number,
            "turn": self.current_turn,
            "current_combatant": self.get_current_combatant().name if self.get_current_combatant() else None,
            "combatants": [
                {
                    "name": c.name,
                    "hp": f"{c.current_hp}/{c.max_hp}",
                    "is_alive": c.is_alive,
                    "conditions": [str(cond) for cond in c.conditions]
                }
                for c in self.combatants
            ]
        }


class CombatManager:
    """Manages multiple combat encounters"""
    
    def __init__(self):
        self.combats: Dict[str, Combat] = {}
    
    def create_combat(self, session_id: Optional[str] = None, description: str = "") -> Combat:
        """Create new combat"""
        combat = Combat(session_id=session_id, description=description)
        self.combats[combat.id] = combat
        return combat
    
    def get_combat(self, combat_id: str) -> Optional[Combat]:
        """Get combat by ID"""
        return self.combats.get(combat_id)
    
    def get_session_combats(self, session_id: str) -> List[Combat]:
        """Get all combats for a session"""
        return [c for c in self.combats.values() if c.session_id == session_id]
    
    def delete_combat(self, combat_id: str):
        """Delete combat"""
        self.combats.pop(combat_id, None)


# Global combat manager
combat_manager = CombatManager()
