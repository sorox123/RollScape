"""
Game logic package initialization.
"""

from game_logic.combat_manager import (
    Combat, Combatant, CombatStatus, Condition,
    CombatManager, combat_manager
)
from game_logic.inventory_manager import (
    Inventory, Item, ItemType, ItemRarity, EquipmentSlot,
    InventoryManager, inventory_manager
)
from game_logic.session_manager import (
    SessionState, SessionStatus, GamePhase,
    PlayerAction, ChatMessage,
    SessionManager, session_manager
)

__all__ = [
    # Combat
    "Combat", "Combatant", "CombatStatus", "Condition",
    "CombatManager", "combat_manager",
    
    # Inventory
    "Inventory", "Item", "ItemType", "ItemRarity", "EquipmentSlot",
    "InventoryManager", "inventory_manager",
    
    # Session
    "SessionState", "SessionStatus", "GamePhase",
    "PlayerAction", "ChatMessage",
    "SessionManager", "session_manager"
]
