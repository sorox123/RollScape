"""
Inventory and equipment management system.
"""

from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from enum import Enum
import uuid


class ItemRarity(str, Enum):
    """Item rarity"""
    COMMON = "common"
    UNCOMMON = "uncommon"
    RARE = "rare"
    VERY_RARE = "very_rare"
    LEGENDARY = "legendary"
    ARTIFACT = "artifact"


class ItemType(str, Enum):
    """Item types"""
    WEAPON = "weapon"
    ARMOR = "armor"
    POTION = "potion"
    SCROLL = "scroll"
    WONDROUS = "wondrous"
    TOOL = "tool"
    GEAR = "gear"
    TREASURE = "treasure"
    CONSUMABLE = "consumable"


class EquipmentSlot(str, Enum):
    """Equipment slots"""
    MAIN_HAND = "main_hand"
    OFF_HAND = "off_hand"
    HEAD = "head"
    BODY = "body"
    HANDS = "hands"
    FEET = "feet"
    NECK = "neck"
    RING_1 = "ring_1"
    RING_2 = "ring_2"
    BACK = "back"


class Item(BaseModel):
    """Inventory item"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    item_type: ItemType
    rarity: ItemRarity = ItemRarity.COMMON
    
    # Properties
    weight: float = 0.0
    value_gp: float = 0.0
    quantity: int = 1
    max_stack: int = 99
    
    # Equipment
    equippable: bool = False
    equipment_slot: Optional[EquipmentSlot] = None
    is_equipped: bool = False
    
    # Combat
    damage_dice: Optional[str] = None  # e.g., "1d8"
    armor_class: Optional[int] = None
    
    # Magic
    is_magical: bool = False
    requires_attunement: bool = False
    is_attuned: bool = False
    charges: Optional[int] = None
    max_charges: Optional[int] = None
    
    # Consumable
    is_consumable: bool = False
    uses_remaining: Optional[int] = None
    
    # Notes
    notes: str = ""
    custom_properties: Dict = Field(default_factory=dict)
    
    def use(self) -> Dict:
        """Use consumable or charge"""
        if self.is_consumable and self.uses_remaining is not None:
            if self.uses_remaining <= 0:
                return {"success": False, "message": "No uses remaining"}
            
            self.uses_remaining -= 1
            
            # Remove if no uses left
            if self.uses_remaining == 0:
                return {
                    "success": True,
                    "message": f"Used {self.name}. Item consumed.",
                    "item_consumed": True
                }
            
            return {
                "success": True,
                "message": f"Used {self.name}. {self.uses_remaining} uses remaining.",
                "uses_remaining": self.uses_remaining
            }
        
        if self.charges is not None:
            if self.charges <= 0:
                return {"success": False, "message": "No charges remaining"}
            
            self.charges -= 1
            return {
                "success": True,
                "message": f"Used charge from {self.name}. {self.charges} charges remaining.",
                "charges": self.charges
            }
        
        return {"success": False, "message": "Item cannot be used"}
    
    def recharge(self, amount: int = 1):
        """Recharge item"""
        if self.charges is not None and self.max_charges is not None:
            self.charges = min(self.max_charges, self.charges + amount)


class Inventory(BaseModel):
    """Character inventory"""
    character_id: str
    items: List[Item] = Field(default_factory=list)
    equipped: Dict[str, str] = Field(default_factory=dict)  # slot -> item_id
    
    # Currency
    copper: int = 0
    silver: int = 0
    electrum: int = 0
    gold: int = 0
    platinum: int = 0
    
    # Capacity
    max_weight: Optional[float] = None
    
    # Attunement
    max_attunement_slots: int = 3
    
    @property
    def total_weight(self) -> float:
        """Calculate total weight"""
        return sum(item.weight * item.quantity for item in self.items)
    
    @property
    def is_encumbered(self) -> bool:
        """Check if over weight limit"""
        if self.max_weight is None:
            return False
        return self.total_weight > self.max_weight
    
    @property
    def attuned_items(self) -> List[Item]:
        """Get attuned items"""
        return [item for item in self.items if item.is_attuned]
    
    @property
    def attunement_slots_used(self) -> int:
        """Get number of attunement slots used"""
        return len(self.attuned_items)
    
    def add_item(self, item: Item) -> Dict:
        """Add item to inventory"""
        # Check for existing stackable item
        if item.quantity <= item.max_stack:
            existing = next(
                (i for i in self.items if i.name == item.name and i.quantity < i.max_stack),
                None
            )
            
            if existing:
                space_available = existing.max_stack - existing.quantity
                if item.quantity <= space_available:
                    existing.quantity += item.quantity
                    return {
                        "success": True,
                        "message": f"Added {item.quantity} {item.name} to existing stack",
                        "stacked": True
                    }
        
        # Add as new item
        self.items.append(item)
        return {
            "success": True,
            "message": f"Added {item.name} to inventory",
            "item_id": item.id
        }
    
    def remove_item(self, item_id: str, quantity: int = 1) -> Dict:
        """Remove item from inventory"""
        item = self.get_item(item_id)
        if not item:
            return {"success": False, "message": "Item not found"}
        
        if item.quantity < quantity:
            return {"success": False, "message": "Not enough quantity"}
        
        item.quantity -= quantity
        
        if item.quantity == 0:
            self.items = [i for i in self.items if i.id != item_id]
            
            # Unequip if equipped
            for slot, equipped_id in list(self.equipped.items()):
                if equipped_id == item_id:
                    del self.equipped[slot]
            
            return {
                "success": True,
                "message": f"Removed {item.name} from inventory",
                "item_removed": True
            }
        
        return {
            "success": True,
            "message": f"Removed {quantity} {item.name}. {item.quantity} remaining.",
            "quantity": item.quantity
        }
    
    def get_item(self, item_id: str) -> Optional[Item]:
        """Get item by ID"""
        return next((item for item in self.items if item.id == item_id), None)
    
    def equip_item(self, item_id: str) -> Dict:
        """Equip an item"""
        item = self.get_item(item_id)
        if not item:
            return {"success": False, "message": "Item not found"}
        
        if not item.equippable or not item.equipment_slot:
            return {"success": False, "message": "Item cannot be equipped"}
        
        # Check attunement
        if item.requires_attunement and not item.is_attuned:
            if self.attunement_slots_used >= self.max_attunement_slots:
                return {"success": False, "message": "No attunement slots available"}
        
        # Unequip existing item in slot
        if item.equipment_slot in self.equipped:
            old_item_id = self.equipped[item.equipment_slot]
            old_item = self.get_item(old_item_id)
            if old_item:
                old_item.is_equipped = False
        
        # Equip new item
        self.equipped[item.equipment_slot] = item_id
        item.is_equipped = True
        
        return {
            "success": True,
            "message": f"Equipped {item.name} to {item.equipment_slot}",
            "slot": item.equipment_slot
        }
    
    def unequip_item(self, item_id: str) -> Dict:
        """Unequip an item"""
        item = self.get_item(item_id)
        if not item:
            return {"success": False, "message": "Item not found"}
        
        if not item.is_equipped:
            return {"success": False, "message": "Item is not equipped"}
        
        # Find and remove from equipped slots
        for slot, equipped_id in list(self.equipped.items()):
            if equipped_id == item_id:
                del self.equipped[slot]
                item.is_equipped = False
                return {
                    "success": True,
                    "message": f"Unequipped {item.name} from {slot}"
                }
        
        return {"success": False, "message": "Item not found in equipment slots"}
    
    def attune_item(self, item_id: str) -> Dict:
        """Attune to magic item"""
        item = self.get_item(item_id)
        if not item:
            return {"success": False, "message": "Item not found"}
        
        if not item.requires_attunement:
            return {"success": False, "message": "Item doesn't require attunement"}
        
        if item.is_attuned:
            return {"success": False, "message": "Already attuned to this item"}
        
        if self.attunement_slots_used >= self.max_attunement_slots:
            return {"success": False, "message": "No attunement slots available"}
        
        item.is_attuned = True
        return {
            "success": True,
            "message": f"Attuned to {item.name}",
            "slots_used": self.attunement_slots_used
        }
    
    def get_equipped_items(self) -> Dict[str, Item]:
        """Get all equipped items"""
        return {
            slot: self.get_item(item_id)
            for slot, item_id in self.equipped.items()
            if self.get_item(item_id)
        }
    
    def get_total_currency_gp(self) -> float:
        """Get total currency in gold pieces"""
        return (
            self.copper / 100 +
            self.silver / 10 +
            self.electrum / 2 +
            self.gold +
            self.platinum * 10
        )


class InventoryManager:
    """Manages character inventories"""
    
    def __init__(self):
        self.inventories: Dict[str, Inventory] = {}
    
    def get_inventory(self, character_id: str) -> Inventory:
        """Get or create inventory for character"""
        if character_id not in self.inventories:
            self.inventories[character_id] = Inventory(character_id=character_id)
        return self.inventories[character_id]
    
    def delete_inventory(self, character_id: str):
        """Delete character inventory"""
        self.inventories.pop(character_id, None)


# Global inventory manager
inventory_manager = InventoryManager()
