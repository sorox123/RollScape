"""
Class Abilities API

Manages martial and class abilities separate from spells.
Supports Fighter maneuvers, Monk ki abilities, Barbarian rages, Rogue features, etc.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from enum import Enum
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/abilities", tags=["abilities"])


# Enums
class AbilityType(str, Enum):
    MANEUVER = "maneuver"  # Battle Master maneuvers
    KI_ABILITY = "ki_ability"  # Monk ki abilities
    RAGE = "rage"  # Barbarian rage variants
    CHANNEL_DIVINITY = "channel_divinity"  # Cleric/Paladin
    FIGHTING_STYLE = "fighting_style"
    FEATURE = "feature"  # General class features
    PASSIVE = "passive"  # Always-on features
    REACTION = "reaction"  # Reaction abilities
    BONUS_ACTION = "bonus_action"
    ACTION = "action"


class ResourceType(str, Enum):
    NONE = "none"  # Passive/always available
    SUPERIORITY_DICE = "superiority_dice"  # Battle Master
    KI_POINTS = "ki_points"  # Monk
    RAGE_USES = "rage_uses"  # Barbarian
    CHANNEL_DIVINITY = "channel_divinity"  # Cleric/Paladin
    USES_PER_SHORT_REST = "uses_per_short_rest"
    USES_PER_LONG_REST = "uses_per_long_rest"
    DAILY = "daily"


class AbilitySource(str, Enum):
    SRD = "srd"  # Official D&D abilities
    HOMEBREW = "homebrew"  # Campaign/DM created
    WORLD = "world"  # World-specific


class RestType(str, Enum):
    NONE = "none"
    SHORT_REST = "short_rest"
    LONG_REST = "long_rest"


# Models
class Ability(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    
    # Classification
    ability_type: AbilityType
    source: AbilitySource = AbilitySource.SRD
    
    # Class/Subclass
    classes: List[str] = []  # ["fighter", "paladin"]
    subclass: Optional[str] = None  # "battle_master", "open_hand", etc.
    level_required: int = 1  # Character level needed
    
    # Resource Management
    resource_type: ResourceType = ResourceType.NONE
    resource_cost: int = 0  # How many resources to use
    uses_per_rest: Optional[int] = None  # Max uses before rest
    recharge_on: RestType = RestType.NONE
    
    # Action Economy
    action_type: str = "action"  # action, bonus_action, reaction, free, passive
    
    # Mechanics
    damage_dice: Optional[str] = None
    damage_type: Optional[str] = None
    save_type: Optional[str] = None  # str, dex, con, int, wis, cha
    attack_bonus: bool = False  # Does it add to attack rolls?
    
    # Additional effects
    duration: Optional[str] = None  # "1 minute", "until end of turn"
    range: Optional[str] = None  # "self", "30 feet", "touch"
    conditions_applied: List[str] = []  # ["frightened", "prone"]
    
    # Enhancements
    enhancement_text: Optional[str] = None  # What it enhances (damage, AC, saves)
    
    # Metadata
    campaign_id: Optional[str] = None
    world_id: Optional[str] = None
    created_by: Optional[str] = None
    tags: List[str] = []
    is_public: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class AbilityCreate(BaseModel):
    name: str
    description: str
    ability_type: AbilityType
    classes: List[str]
    subclass: Optional[str] = None
    level_required: int = 1
    resource_type: ResourceType = ResourceType.NONE
    resource_cost: int = 0
    uses_per_rest: Optional[int] = None
    recharge_on: RestType = RestType.NONE
    action_type: str = "action"
    damage_dice: Optional[str] = None
    damage_type: Optional[str] = None
    save_type: Optional[str] = None
    attack_bonus: bool = False
    duration: Optional[str] = None
    range: Optional[str] = None
    conditions_applied: List[str] = []
    enhancement_text: Optional[str] = None
    tags: List[str] = []
    is_public: bool = False


class AbilityUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    ability_type: Optional[AbilityType] = None
    classes: Optional[List[str]] = None
    subclass: Optional[str] = None
    level_required: Optional[int] = None
    resource_type: Optional[ResourceType] = None
    resource_cost: Optional[int] = None
    uses_per_rest: Optional[int] = None
    recharge_on: Optional[RestType] = None
    action_type: Optional[str] = None
    damage_dice: Optional[str] = None
    damage_type: Optional[str] = None
    save_type: Optional[str] = None
    attack_bonus: Optional[bool] = None
    duration: Optional[str] = None
    range: Optional[str] = None
    conditions_applied: Optional[List[str]] = None
    enhancement_text: Optional[str] = None
    tags: Optional[List[str]] = None
    is_public: Optional[bool] = None


class CharacterAbility(BaseModel):
    ability_id: str
    character_id: str
    source: str = "class"  # class, item, feat, racial
    item_id: Optional[str] = None  # If granted by item
    uses_remaining: Optional[int] = None
    notes: Optional[str] = None


class UseAbilityRequest(BaseModel):
    ability_id: str
    character_id: str
    target_ids: Optional[List[str]] = []
    resource_override: Optional[int] = None  # Override resource cost


# Storage
abilities: Dict[str, Ability] = {}
character_abilities: Dict[str, List[CharacterAbility]] = {}  # character_id -> abilities


# ================== ABILITY LIBRARY ==================

@router.post("/", response_model=Ability)
async def create_ability(ability_data: AbilityCreate, user_id: str = "default"):
    """Create a new homebrew ability"""
    ability = Ability(
        **ability_data.dict(),
        source=AbilitySource.HOMEBREW,
        created_by=user_id
    )
    abilities[ability.id] = ability
    return ability


@router.get("/", response_model=List[Ability])
async def get_abilities(
    ability_type: Optional[AbilityType] = None,
    class_name: Optional[str] = None,
    subclass: Optional[str] = None,
    level_required: Optional[int] = None,
    resource_type: Optional[ResourceType] = None,
    source: Optional[AbilitySource] = None,
    campaign_id: Optional[str] = None,
    search: Optional[str] = None
):
    """Get all abilities with optional filters"""
    filtered = list(abilities.values())
    
    if ability_type:
        filtered = [a for a in filtered if a.ability_type == ability_type]
    
    if class_name:
        filtered = [a for a in filtered if class_name in a.classes]
    
    if subclass:
        filtered = [a for a in filtered if a.subclass == subclass]
    
    if level_required is not None:
        filtered = [a for a in filtered if a.level_required <= level_required]
    
    if resource_type:
        filtered = [a for a in filtered if a.resource_type == resource_type]
    
    if source:
        filtered = [a for a in filtered if a.source == source]
    
    if campaign_id:
        # Include SRD + campaign-specific abilities
        filtered = [a for a in filtered if a.source == AbilitySource.SRD or a.campaign_id == campaign_id]
    
    if search:
        search_lower = search.lower()
        filtered = [a for a in filtered if 
                   search_lower in a.name.lower() or 
                   search_lower in a.description.lower()]
    
    # Sort by level, then name
    filtered.sort(key=lambda a: (a.level_required, a.name))
    
    return filtered


@router.get("/{ability_id}", response_model=Ability)
async def get_ability(ability_id: str):
    """Get specific ability by ID"""
    if ability_id not in abilities:
        raise HTTPException(status_code=404, detail="Ability not found")
    return abilities[ability_id]


@router.patch("/{ability_id}", response_model=Ability)
async def update_ability(ability_id: str, updates: AbilityUpdate):
    """Update a homebrew ability"""
    if ability_id not in abilities:
        raise HTTPException(status_code=404, detail="Ability not found")
    
    ability = abilities[ability_id]
    
    # Prevent editing SRD abilities
    if ability.source == AbilitySource.SRD:
        raise HTTPException(status_code=403, detail="Cannot modify SRD abilities")
    
    update_data = updates.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(ability, field, value)
    
    ability.updated_at = datetime.utcnow()
    return ability


@router.delete("/{ability_id}")
async def delete_ability(ability_id: str):
    """Delete a homebrew ability"""
    if ability_id not in abilities:
        raise HTTPException(status_code=404, detail="Ability not found")
    
    ability = abilities[ability_id]
    
    if ability.source == AbilitySource.SRD:
        raise HTTPException(status_code=403, detail="Cannot delete SRD abilities")
    
    # Remove from all character ability lists
    for char_id in character_abilities:
        character_abilities[char_id] = [
            ca for ca in character_abilities[char_id] 
            if ca.ability_id != ability_id
        ]
    
    del abilities[ability_id]
    return {"message": "Ability deleted successfully"}


# ================== CAMPAIGN ABILITIES ==================

@router.post("/campaigns/{campaign_id}/abilities", response_model=Ability)
async def create_campaign_ability(
    campaign_id: str,
    ability_data: AbilityCreate,
    user_id: str = "default"
):
    """Create an ability specific to a campaign"""
    ability = Ability(
        **ability_data.dict(),
        source=AbilitySource.HOMEBREW,
        campaign_id=campaign_id,
        created_by=user_id
    )
    abilities[ability.id] = ability
    return ability


@router.get("/campaigns/{campaign_id}/abilities", response_model=List[Ability])
async def get_campaign_abilities(campaign_id: str):
    """Get all abilities available in a campaign (SRD + campaign-specific)"""
    campaign_abilities = [
        a for a in abilities.values()
        if a.source == AbilitySource.SRD or a.campaign_id == campaign_id
    ]
    campaign_abilities.sort(key=lambda a: (a.level_required, a.name))
    return campaign_abilities


# ================== CHARACTER ABILITIES ==================

@router.post("/characters/{character_id}/abilities")
async def add_ability_to_character(
    character_id: str,
    ability_id: str = Query(...),
    source: str = Query("class"),
    item_id: Optional[str] = None
):
    """Add an ability to a character"""
    if ability_id not in abilities:
        raise HTTPException(status_code=404, detail="Ability not found")
    
    if character_id not in character_abilities:
        character_abilities[character_id] = []
    
    # Check if already added
    if any(ca.ability_id == ability_id for ca in character_abilities[character_id]):
        raise HTTPException(status_code=400, detail="Ability already added")
    
    ability = abilities[ability_id]
    
    char_ability = CharacterAbility(
        ability_id=ability_id,
        character_id=character_id,
        source=source,
        item_id=item_id,
        uses_remaining=ability.uses_per_rest
    )
    
    character_abilities[character_id].append(char_ability)
    return char_ability


@router.get("/characters/{character_id}/abilities")
async def get_character_abilities(character_id: str):
    """Get all abilities for a character with full details"""
    if character_id not in character_abilities:
        return []
    
    result = []
    for char_ability in character_abilities[character_id]:
        if char_ability.ability_id in abilities:
            ability = abilities[char_ability.ability_id]
            result.append({
                "ability": ability,
                "source": char_ability.source,
                "item_id": char_ability.item_id,
                "uses_remaining": char_ability.uses_remaining,
                "notes": char_ability.notes
            })
    
    return result


@router.patch("/characters/{character_id}/abilities/{ability_id}")
async def update_character_ability(
    character_id: str,
    ability_id: str,
    uses_remaining: Optional[int] = None,
    notes: Optional[str] = None
):
    """Update character's ability (uses remaining, notes)"""
    if character_id not in character_abilities:
        raise HTTPException(status_code=404, detail="Character has no abilities")
    
    char_ability = next(
        (ca for ca in character_abilities[character_id] if ca.ability_id == ability_id),
        None
    )
    
    if not char_ability:
        raise HTTPException(status_code=404, detail="Ability not found for character")
    
    if uses_remaining is not None:
        char_ability.uses_remaining = uses_remaining
    if notes is not None:
        char_ability.notes = notes
    
    return char_ability


@router.delete("/characters/{character_id}/abilities/{ability_id}")
async def remove_ability_from_character(character_id: str, ability_id: str):
    """Remove an ability from a character"""
    if character_id not in character_abilities:
        raise HTTPException(status_code=404, detail="Character has no abilities")
    
    original_count = len(character_abilities[character_id])
    character_abilities[character_id] = [
        ca for ca in character_abilities[character_id]
        if ca.ability_id != ability_id
    ]
    
    if len(character_abilities[character_id]) == original_count:
        raise HTTPException(status_code=404, detail="Ability not found for character")
    
    return {"message": "Ability removed from character"}


# ================== USE ABILITY ==================

@router.post("/use")
async def use_ability(request: UseAbilityRequest):
    """Use an ability (consume resources, apply effects)"""
    if request.ability_id not in abilities:
        raise HTTPException(status_code=404, detail="Ability not found")
    
    if request.character_id not in character_abilities:
        raise HTTPException(status_code=404, detail="Character has no abilities")
    
    char_ability = next(
        (ca for ca in character_abilities[request.character_id] 
         if ca.ability_id == request.ability_id),
        None
    )
    
    if not char_ability:
        raise HTTPException(status_code=404, detail="Character doesn't have this ability")
    
    ability = abilities[request.ability_id]
    
    # Check if has uses remaining
    if ability.resource_type != ResourceType.NONE:
        if char_ability.uses_remaining is not None and char_ability.uses_remaining <= 0:
            raise HTTPException(status_code=400, detail="No uses remaining")
        
        # Consume use
        if char_ability.uses_remaining is not None:
            char_ability.uses_remaining -= 1
    
    # Generate effects
    effects = []
    
    if ability.damage_dice:
        effects.append({
            "type": "damage",
            "damage_dice": ability.damage_dice,
            "damage_type": ability.damage_type
        })
    
    if ability.save_type:
        effects.append({
            "type": "saving_throw",
            "save_type": ability.save_type,
            "dc": 8 + 3 + 4  # Placeholder: 8 + proficiency + modifier
        })
    
    if ability.attack_bonus:
        effects.append({
            "type": "attack_bonus",
            "bonus": ability.resource_cost  # Often superiority dice add to attack
        })
    
    if ability.conditions_applied:
        for condition in ability.conditions_applied:
            effects.append({
                "type": "condition",
                "condition": condition,
                "duration": ability.duration
            })
    
    return {
        "ability": ability,
        "user_id": request.character_id,
        "targets": request.target_ids,
        "effects": effects,
        "uses_remaining": char_ability.uses_remaining
    }


# ================== REST ==================

@router.post("/characters/{character_id}/rest")
async def character_rest(character_id: str, rest_type: RestType):
    """Restore ability uses after rest"""
    if character_id not in character_abilities:
        return {"message": "No abilities to restore"}
    
    restored_count = 0
    
    for char_ability in character_abilities[character_id]:
        if char_ability.ability_id in abilities:
            ability = abilities[char_ability.ability_id]
            
            # Restore if this ability recharges on this rest type
            should_restore = (
                (rest_type == RestType.SHORT_REST and ability.recharge_on in [RestType.SHORT_REST, RestType.LONG_REST]) or
                (rest_type == RestType.LONG_REST and ability.recharge_on == RestType.LONG_REST)
            )
            
            if should_restore and ability.uses_per_rest is not None:
                char_ability.uses_remaining = ability.uses_per_rest
                restored_count += 1
    
    return {
        "message": f"Restored {restored_count} abilities",
        "rest_type": rest_type
    }


# ================== STATISTICS ==================

@router.get("/stats/summary")
async def get_ability_stats():
    """Get statistics about the ability library"""
    total = len(abilities)
    by_type = {}
    by_class = {}
    by_source = {}
    by_resource = {}
    
    for ability in abilities.values():
        # By type
        by_type[ability.ability_type] = by_type.get(ability.ability_type, 0) + 1
        
        # By class
        for cls in ability.classes:
            by_class[cls] = by_class.get(cls, 0) + 1
        
        # By source
        by_source[ability.source] = by_source.get(ability.source, 0) + 1
        
        # By resource
        by_resource[ability.resource_type] = by_resource.get(ability.resource_type, 0) + 1
    
    return {
        "total_abilities": total,
        "by_type": by_type,
        "by_class": by_class,
        "by_source": by_source,
        "by_resource": by_resource,
        "srd_count": by_source.get(AbilitySource.SRD, 0),
        "homebrew_count": by_source.get(AbilitySource.HOMEBREW, 0)
    }
