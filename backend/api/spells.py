"""
Spell Management API

Handles spell library, homebrew spells, and spellcasting mechanics.
Spells can be system-wide (SRD) or campaign-specific (homebrew).
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Optional as OptionalType
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
import uuid

from database import get_db
from models.spell import Spell, CharacterSpell, SpellSchool, SpellSource
from models.user import User
from auth import get_current_user

router = APIRouter(prefix="/api/spells", tags=["spells"])


class SpellResponse(BaseModel):
    """Spell response model"""
    id: str
    name: str
    level: int
    school: str
    casting_time: str
    range: str
    components: List[str]
    material_components: Optional[str]
    duration: str
    concentration: bool
    ritual: bool
    description: str
    at_higher_levels: Optional[str]
    damage_dice: Optional[str]
    damage_type: Optional[str]
    save_type: Optional[str]
    spell_attack: bool
    source: str
    campaign_id: Optional[str]
    world_id: Optional[str]
    created_by_user_id: Optional[str]
    classes: List[str]
    tags: List[str]
    is_public: bool
    created_at: Optional[str]
    updated_at: Optional[str]


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
    source: str = "class"  # class, item, feat, racial, multiclass
    item_id: Optional[str] = None  # If granted by magic item
    notes: Optional[str] = None


class CastSpellRequest(BaseModel):
    """Request to cast a spell"""
    spell_id: str
    character_id: str
    spell_level: int  # Level at which spell is cast (for upcasting)
    target_ids: List[str] = Field(default_factory=list)
    target_position: Optional[Dict[str, float]] = None  # For area spells


# ============================================================================
# SPELL LIBRARY ENDPOINTS
# ============================================================================

@router.post("/", response_model=SpellResponse)
async def create_spell(
    spell_data: SpellCreate, 
    db: Session = Depends(get_db),
    current_user: OptionalType[User] = Depends(get_current_user)
):
    """
    Create a homebrew spell
    
    - **Homebrew spells** are user-created or campaign-specific
    - Can optionally make public for sharing
    """
    # Convert lists to comma-separated strings
    spell_dict = spell_data.model_dump()
    if isinstance(spell_dict.get('components'), list):
        spell_dict['components'] = ','.join(spell_dict['components'])
    if isinstance(spell_dict.get('classes'), list):
        spell_dict['classes'] = ','.join(spell_dict['classes'])
    if isinstance(spell_dict.get('tags'), list):
        spell_dict['tags'] = ','.join(spell_dict['tags'])
    
    spell = Spell(
        **spell_dict,
        source=SpellSource.HOMEBREW,
        created_by_user_id=current_user.id if current_user else None
    )
    
    db.add(spell)
    db.commit()
    db.refresh(spell)
    
    return spell.to_dict()


@router.get("/", response_model=List[SpellResponse])
async def get_spells(
    level: Optional[int] = None,
    school: Optional[SpellSchool] = None,
    class_name: Optional[str] = None,
    campaign_id: Optional[str] = None,
    source: Optional[SpellSource] = None,
    search: Optional[str] = None,
    concentration: Optional[bool] = None,
    ritual: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """
    Get spells with optional filtering
    
    - **level**: Filter by spell level (0-9)
    - **school**: Filter by school of magic
    - **class_name**: Filter by class (e.g., "wizard")
    - **campaign_id**: Get campaign-specific homebrew spells
    - **source**: Filter by source (srd, homebrew, world)
    - **search**: Search spell names and descriptions
    - **concentration**: Filter by concentration requirement
    - **ritual**: Filter by ritual casting
    """
    query = db.query(Spell)
    
    # Apply filters
    if level is not None:
        query = query.filter(Spell.level == level)
    
    if school:
        query = query.filter(Spell.school == school)
    
    if class_name:
        # Search in comma-separated classes string
        query = query.filter(Spell.classes.contains(class_name.lower()))
    
    if campaign_id:
        # Include SRD spells + campaign homebrew
        query = query.filter(
            or_(
                Spell.source == SpellSource.SRD,
                Spell.campaign_id == campaign_id
            )
        )
    
    if source:
        query = query.filter(Spell.source == source)
    
    if concentration is not None:
        query = query.filter(Spell.concentration == concentration)
    
    if ritual is not None:
        query = query.filter(Spell.ritual == ritual)
    
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            or_(
                Spell.name.ilike(search_term),
                Spell.description.ilike(search_term)
            )
        )
    
    # Sort by level, then name
    query = query.order_by(Spell.level, Spell.name)
    
    spells = query.all()
    return [spell.to_dict() for spell in spells]


@router.get("/{spell_id}", response_model=SpellResponse)
async def get_spell(spell_id: str, db: Session = Depends(get_db)):
    """Get specific spell by ID"""
    spell = db.query(Spell).filter(Spell.id == spell_id).first()
    
    if not spell:
        raise HTTPException(status_code=404, detail="Spell not found")
    
    return spell.to_dict()


@router.patch("/{spell_id}", response_model=SpellResponse)
async def update_spell(
    spell_id: str, 
    update_data: SpellUpdate, 
    db: Session = Depends(get_db),
    current_user: OptionalType[User] = Depends(get_current_user)
):
    """
    Update a homebrew spell
    
    - Only the creator can update
    - SRD spells cannot be modified
    """
    spell = db.query(Spell).filter(Spell.id == spell_id).first()
    
    if not spell:
        raise HTTPException(status_code=404, detail="Spell not found")
    
    # Prevent editing SRD spells
    if spell.source == SpellSource.SRD:
        raise HTTPException(status_code=403, detail="Cannot modify SRD spells")
    
    # Check ownership (skip if no user authenticated - mock mode)
    if current_user and spell.created_by_user_id and spell.created_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own spells")
    
    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        if field == 'components' and isinstance(value, list):
            value = ','.join(value)
        if field == 'tags' and isinstance(value, list):
            value = ','.join(value)
        setattr(spell, field, value)
    
    db.commit()
    db.refresh(spell)
    
    return spell.to_dict()


@router.delete("/{spell_id}")
async def delete_spell(
    spell_id: str, 
    db: Session = Depends(get_db),
    current_user: OptionalType[User] = Depends(get_current_user)
):
    """
    Delete a homebrew spell
    
    - Only creator can delete
    - Cannot delete SRD spells
    """
    spell = db.query(Spell).filter(Spell.id == spell_id).first()
    
    if not spell:
        raise HTTPException(status_code=404, detail="Spell not found")
    
    if spell.source == SpellSource.SRD:
        raise HTTPException(status_code=403, detail="Cannot delete SRD spells")
    
    # Check ownership (skip if no user authenticated - mock mode)
    if current_user and spell.created_by_user_id and spell.created_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own spells")
    
    # Delete spell (cascade will remove from spellbooks)
    db.delete(spell)
    db.commit()
    
    return {"message": "Spell deleted successfully"}


# ============================================================================
# CAMPAIGN SPELL MANAGEMENT
# ============================================================================

@router.post("/campaigns/{campaign_id}/spells", response_model=SpellResponse)
async def create_campaign_spell(
    campaign_id: str,
    spell_data: SpellCreate,
    db: Session = Depends(get_db),
    current_user: OptionalType[User] = Depends(get_current_user)
):
    """
    Create a spell for a specific campaign
    
    - Homebrew spell tied to campaign
    - All players in campaign can use it
    """
    # Convert lists to comma-separated strings
    spell_dict = spell_data.model_dump()
    if isinstance(spell_dict.get('components'), list):
        spell_dict['components'] = ','.join(spell_dict['components'])
    if isinstance(spell_dict.get('classes'), list):
        spell_dict['classes'] = ','.join(spell_dict['classes'])
    if isinstance(spell_dict.get('tags'), list):
        spell_dict['tags'] = ','.join(spell_dict['tags'])
    
    spell = Spell(
        **spell_dict,
        source=SpellSource.HOMEBREW,
        campaign_id=campaign_id,
        created_by_user_id=current_user.id if current_user else None
    )
    
    db.add(spell)
    db.commit()
    db.refresh(spell)
    
    return spell.to_dict()


@router.get("/campaigns/{campaign_id}/spells", response_model=List[SpellResponse])
async def get_campaign_spells(campaign_id: str, db: Session = Depends(get_db)):
    """
    Get all spells available in a campaign
    
    - Includes SRD spells + campaign homebrew
    """
    spells_query = db.query(Spell).filter(
        or_(
            Spell.source == SpellSource.SRD,
            Spell.campaign_id == campaign_id
        )
    ).order_by(Spell.level, Spell.name)
    
    campaign_spells = spells_query.all()
    return [spell.to_dict() for spell in campaign_spells]


# ============================================================================
# CHARACTER SPELLBOOK
# ============================================================================

class AddSpellRequest(BaseModel):
    """Request to add spell to spellbook"""
    spell_id: str
    prepared: bool = False
    source: str = "class"
    item_id: Optional[str] = None


@router.post("/characters/{character_id}/spellbook")
async def add_spell_to_spellbook(
    character_id: str, 
    request: AddSpellRequest,
    db: Session = Depends(get_db)
):
    """
    Add spell to character's spellbook
    
    - Wizards add to spellbook, prepare subset
    - Sorcerers know spells (always prepared)
    - Supports spells from items, feats, racial abilities
    - Martial classes can have spells from magic items (e.g., Fighter with Wand of Fireballs)
    """
    # Check spell exists
    spell = db.query(Spell).filter(Spell.id == request.spell_id).first()
    if not spell:
        raise HTTPException(status_code=404, detail="Spell not found")
    
    # Check if already in spellbook from same source
    existing = db.query(CharacterSpell).filter(
        and_(
            CharacterSpell.character_id == character_id,
            CharacterSpell.spell_id == request.spell_id,
            CharacterSpell.source == request.source
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Spell already in spellbook from this source")
    
    # Create entry
    entry = CharacterSpell(
        character_id=character_id,
        spell_id=request.spell_id,
        prepared=request.prepared,
        source=request.source,
        item_id=request.item_id
    )
    
    db.add(entry)
    db.commit()
    db.refresh(entry)
    
    return entry.to_dict()


@router.get("/characters/{character_id}/spellbook", response_model=List[Dict])
async def get_character_spellbook(
    character_id: str,
    prepared_only: bool = False,
    db: Session = Depends(get_db)
):
    """
    Get character's spellbook with full spell details
    
    - Returns spell entries with complete spell data
    - Can filter to prepared spells only
    """
    query = db.query(CharacterSpell).filter(CharacterSpell.character_id == character_id)
    
    if prepared_only:
        query = query.filter(
            or_(
                CharacterSpell.prepared == True,
                CharacterSpell.always_prepared == True
            )
        )
    
    entries = query.all()
    
    # Enrich with spell details
    result = []
    for entry in entries:
        spell = db.query(Spell).filter(Spell.id == entry.spell_id).first()
        if spell:
            result.append({
                "spell": spell.to_dict(),
                "prepared": entry.prepared,
                "always_prepared": entry.always_prepared,
                "source": entry.source,
                "notes": entry.notes,
                "learned_at": entry.learned_at.isoformat() if entry.learned_at else None
            })
    
    return result


class UpdateSpellbookRequest(BaseModel):
    """Request to update spellbook entry"""
    prepared: Optional[bool] = None
    notes: Optional[str] = None


@router.patch("/characters/{character_id}/spellbook/{spell_id}")
async def update_spellbook_entry(
    character_id: str,
    spell_id: str,
    request: UpdateSpellbookRequest,
    db: Session = Depends(get_db)
):
    """
    Update spellbook entry (prepare/unprepare, add notes)
    """
    entry = db.query(CharacterSpell).filter(
        and_(
            CharacterSpell.character_id == character_id,
            CharacterSpell.spell_id == spell_id
        )
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Spell not in spellbook")
    
    if request.prepared is not None:
        entry.prepared = request.prepared
    
    if request.notes is not None:
        entry.notes = request.notes
    
    db.commit()
    db.refresh(entry)
    
    return {"message": "Spellbook entry updated", "entry": entry.to_dict()}


@router.delete("/characters/{character_id}/spellbook/{spell_id}")
async def remove_spell_from_spellbook(
    character_id: str, 
    spell_id: str,
    db: Session = Depends(get_db)
):
    """Remove spell from character's spellbook"""
    entry = db.query(CharacterSpell).filter(
        and_(
            CharacterSpell.character_id == character_id,
            CharacterSpell.spell_id == spell_id
        )
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Spell not in spellbook")
    
    db.delete(entry)
    db.commit()
    
    return {"message": "Spell removed from spellbook"}


# ============================================================================
# SPELLCASTING
# ============================================================================

@router.post("/cast")
async def cast_spell(cast_request: CastSpellRequest, db: Session = Depends(get_db)):
    """
    Cast a spell
    
    - Validates spell exists and character knows it
    - Returns spell effects and results
    - Integrates with combat system if in combat
    """
    spell = db.query(Spell).filter(Spell.id == cast_request.spell_id).first()
    
    if not spell:
        raise HTTPException(status_code=404, detail="Spell not found")
    
    # Verify character knows the spell
    character_spell = db.query(CharacterSpell).filter(
        and_(
            CharacterSpell.character_id == cast_request.character_id,
            CharacterSpell.spell_id == cast_request.spell_id
        )
    ).first()
    
    if not character_spell:
        raise HTTPException(status_code=403, detail="Character doesn't know this spell")
    
    # Calculate spell effects
    result = {
        "spell": spell.to_dict(),
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
async def get_spell_stats(db: Session = Depends(get_db)):
    """Get spell library statistics"""
    all_spells = db.query(Spell).all()
    total_spells = len(all_spells)
    by_level = {}
    by_school = {}
    by_source = {}
    
    for spell in all_spells:
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
