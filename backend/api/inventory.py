"""
Inventory Management API

Handles character inventory, equipment slots, and item management.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from enum import Enum
import uuid

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


class ItemRarity(str, Enum):
    """Item rarity levels"""
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
    HEAD = "head"
    NECK = "neck"
    CHEST = "chest"
    BACK = "back"
    HANDS = "hands"
    WAIST = "waist"
    FEET = "feet"
    MAIN_HAND = "main_hand"
    OFF_HAND = "off_hand"
    TWO_HAND = "two_hand"
    RING_1 = "ring_1"
    RING_2 = "ring_2"


class Item(BaseModel):
    """Item model"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    item_type: ItemType
    rarity: ItemRarity = ItemRarity.COMMON
    
    # Stats
    weight: float = 0.0  # In pounds
    value: int = 0  # In gold pieces
    quantity: int = 1
    
    # Equipment properties
    equippable: bool = False
    equipment_slot: Optional[EquipmentSlot] = None
    is_equipped: bool = False
    
    # Weapon properties
    damage_dice: Optional[str] = None  # e.g., "1d8"
    damage_type: Optional[str] = None  # e.g., "slashing"
    
    # Armor properties
    armor_class: Optional[int] = None
    armor_type: Optional[str] = None  # light, medium, heavy, shield
    
    # Magic properties
    is_magical: bool = False
    requires_attunement: bool = False
    is_attuned: bool = False
    properties: List[str] = Field(default_factory=list)
    
    # Metadata
    character_id: str
    notes: str = ""


class InventoryCreate(BaseModel):
    """Create inventory item"""
    name: str
    description: str = ""
    item_type: ItemType
    rarity: ItemRarity = ItemRarity.COMMON
    weight: float = 0.0
    value: int = 0
    quantity: int = 1
    equippable: bool = False
    equipment_slot: Optional[EquipmentSlot] = None
    damage_dice: Optional[str] = None
    damage_type: Optional[str] = None
    armor_class: Optional[int] = None
    armor_type: Optional[str] = None
    is_magical: bool = False
    requires_attunement: bool = False
    properties: List[str] = Field(default_factory=list)
    notes: str = ""


class InventoryUpdate(BaseModel):
    """Update inventory item"""
    name: Optional[str] = None
    description: Optional[str] = None
    quantity: Optional[int] = None
    is_equipped: Optional[bool] = None
    is_attuned: Optional[bool] = None
    notes: Optional[str] = None


class InventorySummary(BaseModel):
    """Inventory summary"""
    total_items: int
    total_weight: float
    total_value: int
    equipped_items: int
    attuned_items: int
    by_type: Dict[str, int]
    by_rarity: Dict[str, int]


# In-memory storage (replace with database in production)
inventories: Dict[str, List[Item]] = {}


@router.post("/characters/{character_id}/items", response_model=Item)
async def add_item(character_id: str, item_data: InventoryCreate):
    """Add item to character inventory"""
    
    # Create item
    item = Item(
        character_id=character_id,
        **item_data.model_dump()
    )
    
    # Initialize inventory if needed
    if character_id not in inventories:
        inventories[character_id] = []
    
    # Add item
    inventories[character_id].append(item)
    
    return item


@router.get("/characters/{character_id}/items", response_model=List[Item])
async def get_inventory(
    character_id: str,
    item_type: Optional[ItemType] = None,
    equipped_only: bool = False
):
    """Get character inventory"""
    
    if character_id not in inventories:
        return []
    
    items = inventories[character_id]
    
    # Filter by type
    if item_type:
        items = [item for item in items if item.item_type == item_type]
    
    # Filter equipped
    if equipped_only:
        items = [item for item in items if item.is_equipped]
    
    return items


@router.get("/characters/{character_id}/items/{item_id}", response_model=Item)
async def get_item(character_id: str, item_id: str):
    """Get specific item"""
    
    if character_id not in inventories:
        raise HTTPException(status_code=404, detail="Character inventory not found")
    
    item = next((item for item in inventories[character_id] if item.id == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return item


@router.patch("/characters/{character_id}/items/{item_id}", response_model=Item)
async def update_item(character_id: str, item_id: str, update_data: InventoryUpdate):
    """Update item"""
    
    if character_id not in inventories:
        raise HTTPException(status_code=404, detail="Character inventory not found")
    
    item = next((item for item in inventories[character_id] if item.id == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(item, field, value)
    
    return item


@router.delete("/characters/{character_id}/items/{item_id}")
async def delete_item(character_id: str, item_id: str):
    """Delete item"""
    
    if character_id not in inventories:
        raise HTTPException(status_code=404, detail="Character inventory not found")
    
    inventories[character_id] = [
        item for item in inventories[character_id] if item.id != item_id
    ]
    
    return {"message": "Item deleted successfully"}


@router.post("/characters/{character_id}/items/{item_id}/equip")
async def equip_item(character_id: str, item_id: str):
    """Equip item"""
    
    if character_id not in inventories:
        raise HTTPException(status_code=404, detail="Character inventory not found")
    
    item = next((item for item in inventories[character_id] if item.id == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if not item.equippable:
        raise HTTPException(status_code=400, detail="Item is not equippable")
    
    if not item.equipment_slot:
        raise HTTPException(status_code=400, detail="Item has no equipment slot")
    
    # Unequip items in the same slot
    for inv_item in inventories[character_id]:
        if inv_item.equipment_slot == item.equipment_slot and inv_item.is_equipped:
            inv_item.is_equipped = False
    
    # Handle two-handed weapons
    if item.equipment_slot == EquipmentSlot.TWO_HAND:
        for inv_item in inventories[character_id]:
            if inv_item.equipment_slot in [EquipmentSlot.MAIN_HAND, EquipmentSlot.OFF_HAND] and inv_item.is_equipped:
                inv_item.is_equipped = False
    
    # Equip item
    item.is_equipped = True
    
    return {
        "message": "Item equipped successfully",
        "item": item
    }


@router.post("/characters/{character_id}/items/{item_id}/unequip")
async def unequip_item(character_id: str, item_id: str):
    """Unequip item"""
    
    if character_id not in inventories:
        raise HTTPException(status_code=404, detail="Character inventory not found")
    
    item = next((item for item in inventories[character_id] if item.id == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    item.is_equipped = False
    
    return {
        "message": "Item unequipped successfully",
        "item": item
    }


@router.post("/characters/{character_id}/items/{item_id}/attune")
async def attune_item(character_id: str, item_id: str):
    """Attune to item"""
    
    if character_id not in inventories:
        raise HTTPException(status_code=404, detail="Character inventory not found")
    
    item = next((item for item in inventories[character_id] if item.id == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if not item.requires_attunement:
        raise HTTPException(status_code=400, detail="Item does not require attunement")
    
    # Check attunement limit (max 3 items)
    attuned_count = sum(1 for inv_item in inventories[character_id] if inv_item.is_attuned)
    if attuned_count >= 3:
        raise HTTPException(status_code=400, detail="Maximum attunement slots (3) reached")
    
    item.is_attuned = True
    
    return {
        "message": "Item attuned successfully",
        "item": item
    }


@router.post("/characters/{character_id}/items/{item_id}/unattune")
async def unattune_item(character_id: str, item_id: str):
    """Break attunement with item"""
    
    if character_id not in inventories:
        raise HTTPException(status_code=404, detail="Character inventory not found")
    
    item = next((item for item in inventories[character_id] if item.id == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    item.is_attuned = False
    
    return {
        "message": "Attunement broken successfully",
        "item": item
    }


@router.get("/characters/{character_id}/summary", response_model=InventorySummary)
async def get_inventory_summary(character_id: str):
    """Get inventory summary statistics"""
    
    if character_id not in inventories:
        return InventorySummary(
            total_items=0,
            total_weight=0.0,
            total_value=0,
            equipped_items=0,
            attuned_items=0,
            by_type={},
            by_rarity={}
        )
    
    items = inventories[character_id]
    
    # Calculate totals
    total_weight = sum(item.weight * item.quantity for item in items)
    total_value = sum(item.value * item.quantity for item in items)
    equipped_items = sum(1 for item in items if item.is_equipped)
    attuned_items = sum(1 for item in items if item.is_attuned)
    
    # Count by type
    by_type: Dict[str, int] = {}
    for item in items:
        item_type = item.item_type.value
        by_type[item_type] = by_type.get(item_type, 0) + item.quantity
    
    # Count by rarity
    by_rarity: Dict[str, int] = {}
    for item in items:
        rarity = item.rarity.value
        by_rarity[rarity] = by_rarity.get(rarity, 0) + item.quantity
    
    return InventorySummary(
        total_items=len(items),
        total_weight=round(total_weight, 2),
        total_value=total_value,
        equipped_items=equipped_items,
        attuned_items=attuned_items,
        by_type=by_type,
        by_rarity=by_rarity
    )


@router.post("/characters/{character_id}/items/{item_id}/split")
async def split_item(character_id: str, item_id: str, quantity: int):
    """Split item stack into new item"""
    
    if character_id not in inventories:
        raise HTTPException(status_code=404, detail="Character inventory not found")
    
    item = next((item for item in inventories[character_id] if item.id == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if quantity <= 0 or quantity >= item.quantity:
        raise HTTPException(status_code=400, detail="Invalid split quantity")
    
    # Create new item with split quantity
    new_item = Item(
        character_id=character_id,
        name=item.name,
        description=item.description,
        item_type=item.item_type,
        rarity=item.rarity,
        weight=item.weight,
        value=item.value,
        quantity=quantity,
        equippable=item.equippable,
        equipment_slot=item.equipment_slot,
        damage_dice=item.damage_dice,
        damage_type=item.damage_type,
        armor_class=item.armor_class,
        armor_type=item.armor_type,
        is_magical=item.is_magical,
        requires_attunement=item.requires_attunement,
        properties=item.properties.copy(),
        notes=item.notes
    )
    
    # Reduce original quantity
    item.quantity -= quantity
    
    # Add new item
    inventories[character_id].append(new_item)
    
    return {
        "message": "Item split successfully",
        "original_item": item,
        "new_item": new_item
    }
