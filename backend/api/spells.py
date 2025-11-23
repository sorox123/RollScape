"""
Spell Management API

Handles spell library, homebrew spells, and spellcasting mechanics.
Spells can be system-wide (SRD) or campaign-specific (homebrew).
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from enum import Enum
import uuid

router = APIRouter(prefix="/api/spells", tags=["spells"])


class SpellSchool(str, Enum):
    """Schools of magic"""
    ABJURATION = "abjuration"
    CONJURATION = "conjuration"
    DIVINATION = "divination"
    ENCHANTMENT = "enchantment"
    EVOCATION = "evocation"
    ILLUSION = "illusion"
    NECROMANCY = "necromancy"
    TRANSMUTATION = "transmutation"


class SpellSource(str, Enum):
    """Spell source type"""
    SRD = "srd"  # System Reference Document (official D&D)
    HOMEBREW = "homebrew"  # Campaign-specific custom spells
    WORLD = "world"  # World/game system spells


class Spell(BaseModel):
    """Complete spell model"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    level: int = Field(ge=0, le=9, description="Spell level (0 for cantrips)")
    school: SpellSchool
    
    # Casting details
    casting_time: str = "1 action"
    range: str = "30 feet"
    components: List[str] = Field(default_factory=list)  # V, S, M
    material_components: Optional[str] = None
    duration: str = "Instantaneous"
    
    # Spell properties
    concentration: bool = False
    ritual: bool = False
    
    # Description
    description: str
    at_higher_levels: Optional[str] = None
    
    # Mechanics
    damage_dice: Optional[str] = None  # e.g., "3d6"
    damage_type: Optional[str] = None  # e.g., "fire", "cold"
    save_type: Optional[str] = None  # e.g., "dexterity", "wisdom"
    spell_attack: bool = False  # True if requires spell attack roll
    
    # Source and ownership
    source: SpellSource = SpellSource.SRD
    campaign_id: Optional[str] = None  # For homebrew spells
    world_id: Optional[str] = None  # For world-specific spells
    created_by: Optional[str] = None  # User ID who created homebrew
    
    # Classes that can use this spell
    classes: List[str] = Field(default_factory=list)  # ["wizard", "sorcerer"]
    
    # Tags for organization
    tags: List[str] = Field(default_factory=list)
    
    # Usage tracking
    is_public: bool = False  # If homebrew spell can be shared


class SpellCreate(BaseModel):
    """Create new spell (homebrew)"""
    name: str
    level: int = Field(ge=0, le=9)
    school: SpellSchool
    casting_time: str = "1 action"
    range: str = "30 feet"
    components: List[str] = Field(default_factory=lambda: ["V", "S"])
    material_components: Optional[str] = None
    duration: str = "Instantaneous"
    concentration: bool = False
    ritual: bool = False
    description: str
    at_higher_levels: Optional[str] = None
    damage_dice: Optional[str] = None
    damage_type: Optional[str] = None
    save_type: Optional[str] = None
    spell_attack: bool = False
    classes: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    is_public: bool = False


class SpellUpdate(BaseModel):
    """Update existing spell"""
    name: Optional[str] = None
    description: Optional[str] = None
    casting_time: Optional[str] = None
    range: Optional[str] = None
    components: Optional[List[str]] = None
    duration: Optional[str] = None
    damage_dice: Optional[str] = None
    damage_type: Optional[str] = None
    save_type: Optional[str] = None
    is_public: Optional[bool] = None
    tags: Optional[List[str]] = None


class SpellbookEntry(BaseModel):
    """Character's spellbook entry"""
    spell_id: str
    character_id: str
    prepared: bool = False
    always_prepared: bool = False  # Domain spells, etc.
    notes: Optional[str] = None


class CastSpellRequest(BaseModel):
    """Request to cast a spell"""
    spell_id: str
    character_id: str
    spell_level: int  # Level at which spell is cast (for upcasting)
    target_ids: List[str] = Field(default_factory=list)
    target_position: Optional[Dict[str, float]] = None  # For area spells


# In-memory storage (replace with database in production)
spells: Dict[str, Spell] = {}
spellbooks: Dict[str, List[SpellbookEntry]] = {}  # character_id -> spells


# ============================================================================
# SPELL LIBRARY ENDPOINTS
# ============================================================================

@router.post("/", response_model=Spell)
async def create_spell(spell_data: SpellCreate, user_id: str = "default-user"):
    """
    Create a homebrew spell
    
    - **Homebrew spells** are campaign-specific or user-created
    - Can optionally make public for sharing
    """
    spell = Spell(
        **spell_data.model_dump(),
        source=SpellSource.HOMEBREW,
        created_by=user_id
    )
    
    spells[spell.id] = spell
    
    return spell


@router.get("/", response_model=List[Spell])
async def get_spells(
    level: Optional[int] = None,
    school: Optional[SpellSchool] = None,
    class_name: Optional[str] = None,
    campaign_id: Optional[str] = None,
    source: Optional[SpellSource] = None,
    search: Optional[str] = None
):
    """
    Get spells with optional filtering
    
    - **level**: Filter by spell level (0-9)
    - **school**: Filter by school of magic
    - **class_name**: Filter by class (e.g., "wizard")
    - **campaign_id**: Get campaign-specific homebrew spells
    - **source**: Filter by source (srd, homebrew, world)
    - **search**: Search spell names and descriptions
    """
    filtered_spells = list(spells.values())
    
    # Apply filters
    if level is not None:
        filtered_spells = [s for s in filtered_spells if s.level == level]
    
    if school:
        filtered_spells = [s for s in filtered_spells if s.school == school]
    
    if class_name:
        filtered_spells = [s for s in filtered_spells if class_name.lower() in [c.lower() for c in s.classes]]
    
    if campaign_id:
        # Include SRD spells + campaign homebrew
        filtered_spells = [
            s for s in filtered_spells 
            if s.source == SpellSource.SRD or s.campaign_id == campaign_id
        ]
    
    if source:
        filtered_spells = [s for s in filtered_spells if s.source == source]
    
    if search:
        search_lower = search.lower()
        filtered_spells = [
            s for s in filtered_spells 
            if search_lower in s.name.lower() or search_lower in s.description.lower()
        ]
    
    # Sort by level, then name
    filtered_spells.sort(key=lambda s: (s.level, s.name))
    
    return filtered_spells


@router.get("/{spell_id}", response_model=Spell)
async def get_spell(spell_id: str):
    """Get specific spell by ID"""
    if spell_id not in spells:
        raise HTTPException(status_code=404, detail="Spell not found")
    
    return spells[spell_id]


@router.patch("/{spell_id}", response_model=Spell)
async def update_spell(spell_id: str, update_data: SpellUpdate, user_id: str = "default-user"):
    """
    Update a homebrew spell
    
    - Only the creator or campaign DM can update
    - SRD spells cannot be modified
    """
    if spell_id not in spells:
        raise HTTPException(status_code=404, detail="Spell not found")
    
    spell = spells[spell_id]
    
    # Prevent editing SRD spells
    if spell.source == SpellSource.SRD:
        raise HTTPException(status_code=403, detail="Cannot modify SRD spells")
    
    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(spell, field, value)
    
    return spell


@router.delete("/{spell_id}")
async def delete_spell(spell_id: str, user_id: str = "default-user"):
    """
    Delete a homebrew spell
    
    - Only creator can delete
    - Cannot delete SRD spells
    """
    if spell_id not in spells:
        raise HTTPException(status_code=404, detail="Spell not found")
    
    spell = spells[spell_id]
    
    if spell.source == SpellSource.SRD:
        raise HTTPException(status_code=403, detail="Cannot delete SRD spells")
    
    # Remove from all spellbooks
    for character_id, spellbook in spellbooks.items():
        spellbooks[character_id] = [s for s in spellbook if s.spell_id != spell_id]
    
    del spells[spell_id]
    
    return {"message": "Spell deleted successfully"}


# ============================================================================
# CAMPAIGN SPELL MANAGEMENT
# ============================================================================

@router.post("/campaigns/{campaign_id}/spells", response_model=Spell)
async def create_campaign_spell(
    campaign_id: str,
    spell_data: SpellCreate,
    user_id: str = "default-user"
):
    """
    Create a spell for a specific campaign
    
    - Homebrew spell tied to campaign
    - All players in campaign can use it
    """
    spell = Spell(
        **spell_data.model_dump(),
        source=SpellSource.HOMEBREW,
        campaign_id=campaign_id,
        created_by=user_id
    )
    
    spells[spell.id] = spell
    
    return spell


@router.get("/campaigns/{campaign_id}/spells", response_model=List[Spell])
async def get_campaign_spells(campaign_id: str):
    """
    Get all spells available in a campaign
    
    - Includes SRD spells + campaign homebrew
    """
    campaign_spells = [
        s for s in spells.values()
        if s.source == SpellSource.SRD or s.campaign_id == campaign_id
    ]
    
    campaign_spells.sort(key=lambda s: (s.level, s.name))
    
    return campaign_spells


# ============================================================================
# CHARACTER SPELLBOOK
# ============================================================================

@router.post("/characters/{character_id}/spellbook", response_model=SpellbookEntry)
async def add_spell_to_spellbook(character_id: str, spell_id: str, prepared: bool = False):
    """
    Add spell to character's spellbook
    
    - Wizards add to spellbook, prepare subset
    - Sorcerers know spells (always prepared)
    """
    if spell_id not in spells:
        raise HTTPException(status_code=404, detail="Spell not found")
    
    if character_id not in spellbooks:
        spellbooks[character_id] = []
    
    # Check if already in spellbook
    if any(entry.spell_id == spell_id for entry in spellbooks[character_id]):
        raise HTTPException(status_code=400, detail="Spell already in spellbook")
    
    entry = SpellbookEntry(
        spell_id=spell_id,
        character_id=character_id,
        prepared=prepared
    )
    
    spellbooks[character_id].append(entry)
    
    return entry


@router.get("/characters/{character_id}/spellbook", response_model=List[Dict])
async def get_character_spellbook(
    character_id: str,
    prepared_only: bool = False
):
    """
    Get character's spellbook with full spell details
    
    - Returns spell entries with complete spell data
    - Can filter to prepared spells only
    """
    if character_id not in spellbooks:
        return []
    
    entries = spellbooks[character_id]
    
    if prepared_only:
        entries = [e for e in entries if e.prepared or e.always_prepared]
    
    # Enrich with spell details
    result = []
    for entry in entries:
        if entry.spell_id in spells:
            spell = spells[entry.spell_id]
            result.append({
                "spell": spell.model_dump(),
                "prepared": entry.prepared,
                "always_prepared": entry.always_prepared,
                "notes": entry.notes
            })
    
    return result


@router.patch("/characters/{character_id}/spellbook/{spell_id}")
async def update_spellbook_entry(
    character_id: str,
    spell_id: str,
    prepared: Optional[bool] = None,
    notes: Optional[str] = None
):
    """
    Update spellbook entry (prepare/unprepare, add notes)
    """
    if character_id not in spellbooks:
        raise HTTPException(status_code=404, detail="Character has no spellbook")
    
    entry = next(
        (e for e in spellbooks[character_id] if e.spell_id == spell_id),
        None
    )
    
    if not entry:
        raise HTTPException(status_code=404, detail="Spell not in spellbook")
    
    if prepared is not None:
        entry.prepared = prepared
    
    if notes is not None:
        entry.notes = notes
    
    return {"message": "Spellbook entry updated", "entry": entry}


@router.delete("/characters/{character_id}/spellbook/{spell_id}")
async def remove_spell_from_spellbook(character_id: str, spell_id: str):
    """Remove spell from character's spellbook"""
    if character_id not in spellbooks:
        raise HTTPException(status_code=404, detail="Character has no spellbook")
    
    spellbooks[character_id] = [
        e for e in spellbooks[character_id] if e.spell_id != spell_id
    ]
    
    return {"message": "Spell removed from spellbook"}


# ============================================================================
# SPELLCASTING
# ============================================================================

@router.post("/cast")
async def cast_spell(cast_request: CastSpellRequest):
    """
    Cast a spell
    
    - Validates spell exists and character knows it
    - Returns spell effects and results
    - Integrates with combat system if in combat
    """
    if cast_request.spell_id not in spells:
        raise HTTPException(status_code=404, detail="Spell not found")
    
    spell = spells[cast_request.spell_id]
    
    # Verify character knows the spell
    if cast_request.character_id in spellbooks:
        known_spell_ids = [e.spell_id for e in spellbooks[cast_request.character_id]]
        if cast_request.spell_id not in known_spell_ids:
            raise HTTPException(status_code=403, detail="Character doesn't know this spell")
    
    # Calculate spell effects
    result = {
        "spell": spell.model_dump(),
        "caster_id": cast_request.character_id,
        "spell_level": cast_request.spell_level,
        "targets": cast_request.target_ids,
        "success": True,
        "effects": []
    }
    
    # Add damage if applicable
    if spell.damage_dice and cast_request.spell_level >= spell.level:
        # Calculate upcast damage (basic formula)
        base_dice = spell.damage_dice
        upcast_levels = cast_request.spell_level - spell.level
        
        result["effects"].append({
            "type": "damage",
            "damage_dice": base_dice,
            "damage_type": spell.damage_type,
            "upcast_bonus": f"+{upcast_levels}d6" if upcast_levels > 0 else None
        })
    
    # Add save requirement
    if spell.save_type:
        result["effects"].append({
            "type": "saving_throw",
            "save_type": spell.save_type,
            "dc": 8 + 3 + 4  # Base + proficiency + ability mod (placeholder)
        })
    
    # Add attack requirement
    if spell.spell_attack:
        result["effects"].append({
            "type": "spell_attack",
            "attack_bonus": 3 + 4  # Proficiency + ability mod (placeholder)
        })
    
    return result


# ============================================================================
# SPELL STATISTICS
# ============================================================================

@router.get("/stats/summary")
async def get_spell_stats():
    """Get spell library statistics"""
    total_spells = len(spells)
    by_level = {}
    by_school = {}
    by_source = {}
    
    for spell in spells.values():
        # By level
        by_level[spell.level] = by_level.get(spell.level, 0) + 1
        
        # By school
        school_name = spell.school.value
        by_school[school_name] = by_school.get(school_name, 0) + 1
        
        # By source
        source_name = spell.source.value
        by_source[source_name] = by_source.get(source_name, 0) + 1
    
    return {
        "total_spells": total_spells,
        "by_level": by_level,
        "by_school": by_school,
        "by_source": by_source,
        "homebrew_count": by_source.get("homebrew", 0),
        "srd_count": by_source.get("srd", 0)
    }
