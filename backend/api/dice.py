"""
Dice rolling API endpoints.
Core D&D mechanic - roll dice with various notations.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional
import random
import re

router = APIRouter(prefix="/api/dice", tags=["dice"])


class DiceRoll(BaseModel):
    """Single die roll result"""
    die_type: int
    result: int
    
    
class DiceRollRequest(BaseModel):
    """Request to roll dice"""
    notation: str = Field(
        ..., 
        description="Dice notation (e.g., '2d20', '1d6+3', '4d6kh3')",
        examples=["2d20", "1d6+3", "4d6kh3"]
    )
    advantage: Optional[bool] = Field(
        False, 
        description="Roll with advantage (2d20, keep highest)"
    )
    disadvantage: Optional[bool] = Field(
        False,
        description="Roll with disadvantage (2d20, keep lowest)"
    )


class DiceRollResponse(BaseModel):
    """Response with roll results"""
    notation: str
    rolls: List[DiceRoll]
    modifier: int
    total: int
    details: str
    is_critical: bool = False
    is_fumble: bool = False


def parse_dice_notation(notation: str) -> tuple:
    """
    Parse dice notation like '2d20', '1d6+3', '4d6kh3'
    
    Returns: (num_dice, die_type, modifier, keep_highest, keep_lowest)
    """
    notation = notation.lower().strip()
    
    # Pattern: NdX+M or NdXkhY or NdXklY
    pattern = r'(\d+)?d(\d+)(kh(\d+)|kl(\d+))?([+-]\d+)?'
    match = re.match(pattern, notation)
    
    if not match:
        raise ValueError(f"Invalid dice notation: {notation}")
    
    num_dice = int(match.group(1) or 1)
    die_type = int(match.group(2))
    keep_highest = int(match.group(4)) if match.group(4) else None
    keep_lowest = int(match.group(5)) if match.group(5) else None
    modifier = int(match.group(6) or 0)
    
    if die_type < 2 or die_type > 100:
        raise ValueError("Die type must be between 2 and 100")
    
    if num_dice < 1 or num_dice > 100:
        raise ValueError("Number of dice must be between 1 and 100")
    
    return num_dice, die_type, modifier, keep_highest, keep_lowest


def roll_dice(num_dice: int, die_type: int) -> List[int]:
    """Roll N dice of type D"""
    return [random.randint(1, die_type) for _ in range(num_dice)]


@router.post("/roll", response_model=DiceRollResponse)
async def roll_dice_endpoint(request: DiceRollRequest):
    """
    Roll dice using standard D&D notation.
    
    Examples:
    - `2d20`: Roll 2 twenty-sided dice
    - `1d6+3`: Roll 1d6 and add 3
    - `4d6kh3`: Roll 4d6, keep highest 3
    - `2d20kl1`: Roll 2d20, keep lowest 1 (disadvantage)
    
    You can also use advantage/disadvantage flags for d20 rolls.
    """
    try:
        # Handle advantage/disadvantage
        if request.advantage and request.disadvantage:
            raise HTTPException(
                status_code=400,
                detail="Cannot have both advantage and disadvantage"
            )
        
        if request.advantage or request.disadvantage:
            # Override notation for advantage/disadvantage
            num_dice = 2
            die_type = 20
            modifier = 0
            keep_highest = 1 if request.advantage else None
            keep_lowest = 1 if request.disadvantage else None
        else:
            # Parse notation
            num_dice, die_type, modifier, keep_highest, keep_lowest = parse_dice_notation(
                request.notation
            )
        
        # Roll the dice
        results = roll_dice(num_dice, die_type)
        
        # Apply keep highest/lowest
        kept_results = results.copy()
        if keep_highest:
            kept_results = sorted(results, reverse=True)[:keep_highest]
        elif keep_lowest:
            kept_results = sorted(results)[:keep_lowest]
        
        # Calculate total
        total = sum(kept_results) + modifier
        
        # Create roll objects
        roll_objects = [
            DiceRoll(die_type=die_type, result=r)
            for r in results
        ]
        
        # Build details string
        if keep_highest:
            details = f"Rolled {results}, kept highest {keep_highest}: {kept_results}"
        elif keep_lowest:
            details = f"Rolled {results}, kept lowest {keep_lowest}: {kept_results}"
        else:
            details = f"Rolled {results}"
        
        if modifier != 0:
            details += f" {'+' if modifier > 0 else ''}{modifier}"
        
        details += f" = {total}"
        
        # Check for critical/fumble (d20 only)
        is_critical = die_type == 20 and max(results) == 20
        is_fumble = die_type == 20 and min(results) == 1
        
        return DiceRollResponse(
            notation=request.notation,
            rolls=roll_objects,
            modifier=modifier,
            total=total,
            details=details,
            is_critical=is_critical,
            is_fumble=is_fumble
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/roll/{notation}", response_model=DiceRollResponse)
async def quick_roll(notation: str):
    """
    Quick roll endpoint using URL path.
    
    Example: GET /api/dice/roll/2d20
    """
    request = DiceRollRequest(notation=notation)
    return await roll_dice_endpoint(request)


@router.post("/roll/ability", response_model=DiceRollResponse)
async def roll_ability_check(
    modifier: int = Query(0, description="Ability modifier"),
    advantage: bool = Query(False),
    disadvantage: bool = Query(False)
):
    """
    Roll a d20 ability check with modifier.
    
    Shortcut for common ability checks.
    """
    notation = f"1d20{'+' if modifier >= 0 else ''}{modifier}"
    request = DiceRollRequest(
        notation=notation,
        advantage=advantage,
        disadvantage=disadvantage
    )
    return await roll_dice_endpoint(request)


@router.post("/roll/attack", response_model=dict)
async def roll_attack(
    attack_bonus: int = Query(..., description="Attack bonus"),
    damage_dice: str = Query(..., description="Damage dice (e.g., '1d8+3')"),
    advantage: bool = Query(False),
    disadvantage: bool = Query(False)
):
    """
    Roll an attack: d20 + bonus to hit, then damage.
    
    Returns both attack roll and damage roll.
    """
    # Attack roll
    attack_notation = f"1d20{'+' if attack_bonus >= 0 else ''}{attack_bonus}"
    attack_request = DiceRollRequest(
        notation=attack_notation,
        advantage=advantage,
        disadvantage=disadvantage
    )
    attack_roll = await roll_dice_endpoint(attack_request)
    
    # Damage roll
    damage_request = DiceRollRequest(notation=damage_dice)
    damage_roll = await roll_dice_endpoint(damage_request)
    
    # Critical hit: double damage dice
    if attack_roll.is_critical:
        crit_damage_request = DiceRollRequest(notation=damage_dice)
        crit_damage_roll = await roll_dice_endpoint(crit_damage_request)
        damage_roll.total += crit_damage_roll.total - damage_roll.modifier
        damage_roll.details += f" + CRITICAL {crit_damage_roll.details}"
    
    return {
        "attack": attack_roll,
        "damage": damage_roll,
        "is_critical": attack_roll.is_critical,
        "is_fumble": attack_roll.is_fumble
    }
