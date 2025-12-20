"""
Dice Roll Animation API
Track dice rolls with animation data for 3D overlay
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import uuid
from datetime import datetime
import random

from database import get_db
from auth import get_current_user
from models import User

router = APIRouter(prefix="/api/dice/rolls", tags=["dice-animation"])


class DiceRollRequest(BaseModel):
    """Request to roll dice with animation"""
    dice_notation: str  # e.g., "2d20+5", "1d6", "3d8+2d6"
    reason: Optional[str] = None  # "Attack Roll", "Damage", "Skill Check"
    character_id: Optional[str] = None
    campaign_id: Optional[str] = None
    texture_id: Optional[str] = None  # Which dice texture set to use
    advantage: bool = False
    disadvantage: bool = False
    # Physics parameters
    throw_force: float = 1.0  # 0.5 to 2.0
    throw_angle: float = 45.0  # degrees
    spin_intensity: float = 1.0  # 0.5 to 2.0


class DieResult(BaseModel):
    """Individual die result with physics data"""
    die_type: str  # "d4", "d6", "d8", "d10", "d12", "d20", "d100"
    value: int
    # Animation parameters
    initial_position: List[float]  # [x, y, z]
    initial_rotation: List[float]  # [rx, ry, rz] in degrees
    initial_velocity: List[float]  # [vx, vy, vz]
    angular_velocity: List[float]  # [avx, avy, avz]
    bounce_points: List[List[float]]  # Predicted bounce positions
    settle_time: float  # Time in seconds to settle
    is_critical: bool = False
    is_fumble: bool = False


class DiceRollResponse(BaseModel):
    """Complete dice roll with animation data"""
    roll_id: str
    dice_notation: str
    dice_results: List[DieResult]
    total: int
    modifier: int
    reason: Optional[str]
    character_id: Optional[str]
    campaign_id: Optional[str]
    texture_id: Optional[str]
    advantage: bool
    disadvantage: bool
    timestamp: str
    # Animation metadata
    total_animation_time: float
    camera_focus: List[float]  # Where camera should focus [x, y, z]


def parse_dice_notation(notation: str) -> tuple[List[tuple[int, int]], int]:
    """
    Parse dice notation like "2d20+5" or "3d8+2d6-1"
    Returns: ([(count, sides), ...], modifier)
    """
    dice_groups = []
    modifier = 0
    
    # Split by + and -
    parts = notation.replace('-', '+-').split('+')
    
    for part in parts:
        part = part.strip()
        if not part:
            continue
            
        if 'd' in part.lower():
            # It's a dice roll like "2d20"
            count_str, sides_str = part.lower().split('d')
            count = int(count_str) if count_str else 1
            sides = int(sides_str)
            dice_groups.append((count, sides))
        else:
            # It's a modifier like "+5" or "-3"
            modifier += int(part)
    
    return dice_groups, modifier


def generate_physics_data(die_type: str, throw_force: float, throw_angle: float, spin_intensity: float, index: int) -> dict:
    """Generate realistic physics parameters for a die"""
    
    # Starting position (slightly randomized in a line)
    x_offset = (index - 2) * 0.3  # Spread dice along x-axis
    initial_position = [
        x_offset + random.uniform(-0.1, 0.1),
        2.0 + random.uniform(-0.2, 0.2),  # Start height
        -3.0 + random.uniform(-0.1, 0.1)
    ]
    
    # Initial rotation (random)
    initial_rotation = [
        random.uniform(0, 360),
        random.uniform(0, 360),
        random.uniform(0, 360)
    ]
    
    # Throw velocity (forward and up) - angled throw like real dice rolling
    angle_rad = throw_angle * 3.14159 / 180
    base_speed = 3.5 * throw_force  # Reduced speed to stay in bounds
    
    # Angled throw - more forward than upward for natural tumbling
    horizontal_speed = base_speed * 0.6  # 60% horizontal - dice come in at angle
    vertical_speed = base_speed * 0.5    # 50% upward - balanced arc
    
    initial_velocity = [
        random.uniform(-1.2, 1.2) * throw_force,  # Moderate sideways variance
        vertical_speed,  # Upward component
        horizontal_speed * random.choice([-1, 1])  # Forward/backward
    ]
    
    # Angular velocity (spin) - increased for more dramatic tumbling
    angular_velocity = [
        random.uniform(-720, 720) * spin_intensity,
        random.uniform(-720, 720) * spin_intensity,
        random.uniform(-720, 720) * spin_intensity
    ]
    
    # Predict bounce points (simplified physics)
    bounce_points = []
    current_pos = initial_position.copy()
    current_vel = initial_velocity.copy()
    time = 0
    dt = 0.1
    gravity = -9.8
    damping = 0.85  # Reduced damping to match frontend physics better
    
    for _ in range(30):  # Simulate 3 seconds
        # Update velocity
        current_vel[1] += gravity * dt
        
        # Update position
        for i in range(3):
            current_pos[i] += current_vel[i] * dt
        
        # Bounce off ground
        if current_pos[1] <= 0:
            current_pos[1] = 0
            current_vel[1] = -current_vel[1] * damping
            current_vel[0] *= damping
            current_vel[2] *= damping
            bounce_points.append(current_pos.copy())
            
            # Stop if velocity is low enough
            if abs(current_vel[1]) < 0.5:
                break
        
        time += dt
    
    # Settle time (when die stops moving significantly)
    # Balanced timing for realistic tumbling without lingering
    settle_time = time + random.uniform(2.5, 3.5)
    
    return {
        "initial_position": initial_position,
        "initial_rotation": initial_rotation,
        "initial_velocity": initial_velocity,
        "angular_velocity": angular_velocity,
        "bounce_points": bounce_points,
        "settle_time": settle_time
    }


def roll_die(sides: int) -> int:
    """Roll a single die"""
    return random.randint(1, sides)


@router.post("/", response_model=DiceRollResponse)
async def roll_dice_with_animation(
    request: DiceRollRequest,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Roll dice and return animation data for 3D overlay
    
    Example request:
    {
        "dice_notation": "2d20+5",
        "reason": "Attack Roll",
        "texture_id": "some-uuid",
        "advantage": false,
        "throw_force": 1.2,
        "throw_angle": 45,
        "spin_intensity": 1.5
    }
    """
    
    # Parse dice notation
    dice_groups, modifier = parse_dice_notation(request.dice_notation)
    
    # Roll all dice
    all_results = []
    die_index = 0
    
    for count, sides in dice_groups:
        die_type = f"d{sides}"
        
        for _ in range(count):
            # Roll the die
            value = roll_die(sides)
            
            # Generate physics data
            physics = generate_physics_data(
                die_type,
                request.throw_force,
                request.throw_angle,
                request.spin_intensity,
                die_index
            )
            
            # Check for critical/fumble (d20 only)
            is_critical = (sides == 20 and value == 20)
            is_fumble = (sides == 20 and value == 1)
            
            die_result = DieResult(
                die_type=die_type,
                value=value,
                is_critical=is_critical,
                is_fumble=is_fumble,
                **physics
            )
            
            all_results.append(die_result)
            die_index += 1
    
    # Handle advantage/disadvantage for d20 rolls
    if request.advantage or request.disadvantage:
        # Find d20 rolls
        d20_results = [r for r in all_results if r.die_type == "d20"]
        
        if d20_results:
            if request.advantage:
                # Keep highest d20
                best = max(d20_results, key=lambda r: r.value)
                all_results = [r for r in all_results if r.die_type != "d20" or r == best]
            elif request.disadvantage:
                # Keep lowest d20
                worst = min(d20_results, key=lambda r: r.value)
                all_results = [r for r in all_results if r.die_type != "d20" or r == worst]
    
    # Calculate total
    total = sum(r.value for r in all_results) + modifier
    
    # Calculate total animation time (longest settle time)
    max_settle_time = max(r.settle_time for r in all_results) if all_results else 1.0
    
    # Camera focus point (center of dice)
    avg_x = sum(r.initial_position[0] for r in all_results) / len(all_results) if all_results else 0
    camera_focus = [avg_x, 0.5, 0]
    
    # Generate roll ID
    roll_id = str(uuid.uuid4())
    
    # TODO: Save to database for history
    
    # Total animation time needs to include the post-settle phases:
    # settle_time + 2.5s (Phase 1) + 0.5s (Phase 1.5) + 0.25s (Phase 2) + buffer
    # = settle_time + 3.25s + 0.5s buffer = settle_time + 3.75s
    total_animation_time = max_settle_time + 3.75
    
    response = DiceRollResponse(
        roll_id=roll_id,
        dice_notation=request.dice_notation,
        dice_results=all_results,
        total=total,
        modifier=modifier,
        reason=request.reason,
        character_id=request.character_id,
        campaign_id=request.campaign_id,
        texture_id=request.texture_id,
        advantage=request.advantage,
        disadvantage=request.disadvantage,
        timestamp=datetime.utcnow().isoformat(),
        total_animation_time=total_animation_time,
        camera_focus=camera_focus
    )
    
    return response


@router.get("/presets")
async def get_common_roll_presets():
    """Get common D&D roll presets"""
    return {
        "presets": [
            {
                "name": "d20 (Ability Check)",
                "notation": "1d20",
                "icon": "🎲",
                "category": "ability"
            },
            {
                "name": "d20 + Modifier",
                "notation": "1d20+5",
                "icon": "🎯",
                "category": "ability"
            },
            {
                "name": "Advantage",
                "notation": "2d20",
                "icon": "⬆️",
                "category": "ability",
                "advantage": True
            },
            {
                "name": "Disadvantage",
                "notation": "2d20",
                "icon": "⬇️",
                "category": "ability",
                "disadvantage": True
            },
            {
                "name": "2d6 (Greatsword)",
                "notation": "2d6",
                "icon": "⚔️",
                "category": "damage"
            },
            {
                "name": "1d8 (Longsword)",
                "notation": "1d8",
                "icon": "🗡️",
                "category": "damage"
            },
            {
                "name": "1d6 (Shortsword)",
                "notation": "1d6",
                "icon": "🔪",
                "category": "damage"
            },
            {
                "name": "8d6 (Fireball)",
                "notation": "8d6",
                "icon": "🔥",
                "category": "spell"
            },
            {
                "name": "4d6 Drop Lowest",
                "notation": "4d6",
                "icon": "👤",
                "category": "character_creation"
            },
            {
                "name": "1d100 (Percentile)",
                "notation": "1d100",
                "icon": "💯",
                "category": "special"
            }
        ]
    }
