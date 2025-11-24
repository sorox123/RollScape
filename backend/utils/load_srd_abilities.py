"""
Load D&D 5e SRD Abilities

Loads official martial class abilities, maneuvers, ki abilities, etc.
"""

from api.abilities import (
    abilities, Ability, AbilityType, ResourceType, 
    AbilitySource, RestType
)


def load_srd_abilities():
    """Load SRD abilities into the abilities dictionary"""
    
    srd_abilities = [
        # ============ BATTLE MASTER MANEUVERS (Fighter) ============
        Ability(
            id="srd-maneuver-precision-attack",
            name="Precision Attack",
            description="When you make a weapon attack roll against a creature, you can expend one superiority die to add it to the roll. You can use this maneuver before or after making the attack roll, but before any effects of the attack are applied.",
            ability_type=AbilityType.MANEUVER,
            source=AbilitySource.SRD,
            classes=["fighter"],
            subclass="battle_master",
            level_required=3,
            resource_type=ResourceType.SUPERIORITY_DICE,
            resource_cost=1,
            recharge_on=RestType.SHORT_REST,
            action_type="free",
            attack_bonus=True,
            tags=["accuracy", "attack"]
        ),
        
        Ability(
            id="srd-maneuver-riposte",
            name="Riposte",
            description="When a creature misses you with a melee attack, you can use your reaction and expend one superiority die to make a melee weapon attack against the creature. If you hit, you add the superiority die to the attack's damage roll.",
            ability_type=AbilityType.MANEUVER,
            source=AbilitySource.SRD,
            classes=["fighter"],
            subclass="battle_master",
            level_required=3,
            resource_type=ResourceType.SUPERIORITY_DICE,
            resource_cost=1,
            recharge_on=RestType.SHORT_REST,
            action_type="reaction",
            damage_dice="1d8",
            damage_type="weapon",
            tags=["reaction", "damage"]
        ),
        
        Ability(
            id="srd-maneuver-trip-attack",
            name="Trip Attack",
            description="When you hit a creature with a weapon attack, you can expend one superiority die to attempt to knock the target down. You add the superiority die to the attack's damage roll, and if the target is Large or smaller, it must make a Strength saving throw. On a failed save, you knock the target prone.",
            ability_type=AbilityType.MANEUVER,
            source=AbilitySource.SRD,
            classes=["fighter"],
            subclass="battle_master",
            level_required=3,
            resource_type=ResourceType.SUPERIORITY_DICE,
            resource_cost=1,
            recharge_on=RestType.SHORT_REST,
            action_type="free",
            damage_dice="1d8",
            damage_type="weapon",
            save_type="strength",
            conditions_applied=["prone"],
            tags=["control", "damage"]
        ),
        
        Ability(
            id="srd-maneuver-disarming-attack",
            name="Disarming Attack",
            description="When you hit a creature with a weapon attack, you can expend one superiority die to attempt to disarm the target, forcing it to drop one item of your choice that it's holding. You add the superiority die to the attack's damage roll, and the target must make a Strength saving throw. On a failed save, it drops the object you choose.",
            ability_type=AbilityType.MANEUVER,
            source=AbilitySource.SRD,
            classes=["fighter"],
            subclass="battle_master",
            level_required=3,
            resource_type=ResourceType.SUPERIORITY_DICE,
            resource_cost=1,
            recharge_on=RestType.SHORT_REST,
            action_type="free",
            damage_dice="1d8",
            damage_type="weapon",
            save_type="strength",
            tags=["control", "damage", "disarm"]
        ),
        
        Ability(
            id="srd-maneuver-menacing-attack",
            name="Menacing Attack",
            description="When you hit a creature with a weapon attack, you can expend one superiority die to attempt to frighten the target. You add the superiority die to the attack's damage roll, and the target must make a Wisdom saving throw. On a failed save, it is frightened of you until the end of your next turn.",
            ability_type=AbilityType.MANEUVER,
            source=AbilitySource.SRD,
            classes=["fighter"],
            subclass="battle_master",
            level_required=3,
            resource_type=ResourceType.SUPERIORITY_DICE,
            resource_cost=1,
            recharge_on=RestType.SHORT_REST,
            action_type="free",
            damage_dice="1d8",
            damage_type="weapon",
            save_type="wisdom",
            conditions_applied=["frightened"],
            duration="Until end of your next turn",
            tags=["control", "damage", "fear"]
        ),
        
        # ============ MONK KI ABILITIES ============
        Ability(
            id="srd-ki-flurry-of-blows",
            name="Flurry of Blows",
            description="Immediately after you take the Attack action on your turn, you can spend 1 ki point to make two unarmed strikes as a bonus action.",
            ability_type=AbilityType.KI_ABILITY,
            source=AbilitySource.SRD,
            classes=["monk"],
            level_required=2,
            resource_type=ResourceType.KI_POINTS,
            resource_cost=1,
            recharge_on=RestType.SHORT_REST,
            action_type="bonus_action",
            tags=["attack", "unarmed"]
        ),
        
        Ability(
            id="srd-ki-patient-defense",
            name="Patient Defense",
            description="You can spend 1 ki point to take the Dodge action as a bonus action on your turn.",
            ability_type=AbilityType.KI_ABILITY,
            source=AbilitySource.SRD,
            classes=["monk"],
            level_required=2,
            resource_type=ResourceType.KI_POINTS,
            resource_cost=1,
            recharge_on=RestType.SHORT_REST,
            action_type="bonus_action",
            duration="Until start of your next turn",
            tags=["defense", "dodge"]
        ),
        
        Ability(
            id="srd-ki-step-of-the-wind",
            name="Step of the Wind",
            description="You can spend 1 ki point to take the Disengage or Dash action as a bonus action on your turn, and your jump distance is doubled for the turn.",
            ability_type=AbilityType.KI_ABILITY,
            source=AbilitySource.SRD,
            classes=["monk"],
            level_required=2,
            resource_type=ResourceType.KI_POINTS,
            resource_cost=1,
            recharge_on=RestType.SHORT_REST,
            action_type="bonus_action",
            duration="This turn",
            tags=["mobility", "disengage", "dash"]
        ),
        
        Ability(
            id="srd-ki-stunning-strike",
            name="Stunning Strike",
            description="When you hit another creature with a melee weapon attack, you can spend 1 ki point to attempt a stunning strike. The target must succeed on a Constitution saving throw or be stunned until the end of your next turn.",
            ability_type=AbilityType.KI_ABILITY,
            source=AbilitySource.SRD,
            classes=["monk"],
            level_required=5,
            resource_type=ResourceType.KI_POINTS,
            resource_cost=1,
            recharge_on=RestType.SHORT_REST,
            action_type="free",
            save_type="constitution",
            conditions_applied=["stunned"],
            duration="Until end of your next turn",
            tags=["control", "stun"]
        ),
        
        # ============ BARBARIAN RAGE ============
        Ability(
            id="srd-barbarian-rage",
            name="Rage",
            description="On your turn, you can enter a rage as a bonus action. While raging, you gain resistance to bludgeoning, piercing, and slashing damage, advantage on Strength checks and saves, and bonus damage to melee attacks using Strength. Your rage lasts for 1 minute.",
            ability_type=AbilityType.RAGE,
            source=AbilitySource.SRD,
            classes=["barbarian"],
            level_required=1,
            resource_type=ResourceType.RAGE_USES,
            resource_cost=1,
            recharge_on=RestType.LONG_REST,
            action_type="bonus_action",
            duration="1 minute",
            enhancement_text="Resistance to physical damage, advantage on Strength checks/saves, +2 damage to melee attacks",
            tags=["buff", "damage", "defense"]
        ),
        
        # ============ ROGUE FEATURES ============
        Ability(
            id="srd-rogue-sneak-attack",
            name="Sneak Attack",
            description="Once per turn, you can deal an extra 1d6 damage to one creature you hit with an attack if you have advantage on the attack roll. The attack must use a finesse or ranged weapon. You don't need advantage if another enemy of the target is within 5 feet of it.",
            ability_type=AbilityType.FEATURE,
            source=AbilitySource.SRD,
            classes=["rogue"],
            level_required=1,
            resource_type=ResourceType.NONE,
            action_type="free",
            damage_dice="1d6",
            damage_type="weapon",
            tags=["damage", "sneak attack"]
        ),
        
        Ability(
            id="srd-rogue-cunning-action",
            name="Cunning Action",
            description="You can take a bonus action on each of your turns in combat. This action can be used only to take the Dash, Disengage, or Hide action.",
            ability_type=AbilityType.FEATURE,
            source=AbilitySource.SRD,
            classes=["rogue"],
            level_required=2,
            resource_type=ResourceType.NONE,
            action_type="bonus_action",
            tags=["mobility", "stealth"]
        ),
        
        Ability(
            id="srd-rogue-uncanny-dodge",
            name="Uncanny Dodge",
            description="When an attacker that you can see hits you with an attack, you can use your reaction to halve the attack's damage against you.",
            ability_type=AbilityType.REACTION,
            source=AbilitySource.SRD,
            classes=["rogue"],
            level_required=5,
            resource_type=ResourceType.NONE,
            action_type="reaction",
            enhancement_text="Halve damage from one attack",
            tags=["defense", "reaction"]
        ),
        
        # ============ PALADIN FEATURES ============
        Ability(
            id="srd-paladin-divine-smite",
            name="Divine Smite",
            description="When you hit a creature with a melee weapon attack, you can expend one spell slot to deal radiant damage to the target, in addition to the weapon's damage. The extra damage is 2d8 for a 1st-level spell slot, plus 1d8 for each spell level higher than 1st, to a maximum of 5d8. The damage increases by 1d8 if the target is an undead or fiend.",
            ability_type=AbilityType.FEATURE,
            source=AbilitySource.SRD,
            classes=["paladin"],
            level_required=2,
            resource_type=ResourceType.NONE,  # Uses spell slots
            action_type="free",
            damage_dice="2d8",
            damage_type="radiant",
            tags=["damage", "radiant", "smite"]
        ),
        
        Ability(
            id="srd-paladin-lay-on-hands",
            name="Lay on Hands",
            description="You have a pool of healing power that can restore hit points equal to your paladin level × 5. As an action, you can touch a creature and restore a number of hit points from your pool. Alternatively, you can expend 5 hit points to cure one disease or neutralize one poison.",
            ability_type=AbilityType.FEATURE,
            source=AbilitySource.SRD,
            classes=["paladin"],
            level_required=1,
            resource_type=ResourceType.DAILY,
            action_type="action",
            range="Touch",
            enhancement_text="Restore hit points or cure disease/poison",
            tags=["healing", "cure"]
        ),
        
        # ============ FIGHTER FEATURES ============
        Ability(
            id="srd-fighter-second-wind",
            name="Second Wind",
            description="You have a limited well of stamina that you can draw on to protect yourself from harm. On your turn, you can use a bonus action to regain hit points equal to 1d10 + your fighter level. Once you use this feature, you must finish a short or long rest before you can use it again.",
            ability_type=AbilityType.FEATURE,
            source=AbilitySource.SRD,
            classes=["fighter"],
            level_required=1,
            resource_type=ResourceType.USES_PER_SHORT_REST,
            uses_per_rest=1,
            recharge_on=RestType.SHORT_REST,
            action_type="bonus_action",
            enhancement_text="Heal 1d10 + fighter level",
            tags=["healing", "self-heal"]
        ),
        
        Ability(
            id="srd-fighter-action-surge",
            name="Action Surge",
            description="You can push yourself beyond your normal limits for a moment. On your turn, you can take one additional action. Once you use this feature, you must finish a short or long rest before you can use it again.",
            ability_type=AbilityType.FEATURE,
            source=AbilitySource.SRD,
            classes=["fighter"],
            level_required=2,
            resource_type=ResourceType.USES_PER_SHORT_REST,
            uses_per_rest=1,
            recharge_on=RestType.SHORT_REST,
            action_type="free",
            enhancement_text="Gain an additional action on your turn",
            tags=["action economy", "burst"]
        ),
        
        # ============ RANGER FEATURES ============
        Ability(
            id="srd-ranger-hunters-mark",
            name="Hunter's Mark",
            description="You choose a creature you can see within 90 feet and mystically mark it as your quarry. Until the spell ends, you deal an extra 1d6 damage to the target whenever you hit it with a weapon attack. If it drops to 0 hit points, you can use a bonus action to move the mark to a new creature.",
            ability_type=AbilityType.FEATURE,
            source=AbilitySource.SRD,
            classes=["ranger"],
            level_required=1,
            resource_type=ResourceType.NONE,  # Uses spell slot
            action_type="bonus_action",
            duration="1 hour (Concentration)",
            range="90 feet",
            damage_dice="1d6",
            damage_type="weapon",
            tags=["damage", "concentration", "tracking"]
        ),
        
        # ============ CLERIC CHANNEL DIVINITY ============
        Ability(
            id="srd-cleric-turn-undead",
            name="Turn Undead",
            description="As an action, you present your holy symbol and speak a prayer censuring the undead. Each undead that can see or hear you within 30 feet of you must make a Wisdom saving throw. If the creature fails its saving throw, it is turned for 1 minute or until it takes any damage.",
            ability_type=AbilityType.CHANNEL_DIVINITY,
            source=AbilitySource.SRD,
            classes=["cleric"],
            level_required=2,
            resource_type=ResourceType.CHANNEL_DIVINITY,
            uses_per_rest=1,
            recharge_on=RestType.SHORT_REST,
            action_type="action",
            range="30 feet",
            save_type="wisdom",
            conditions_applied=["turned"],
            duration="1 minute",
            tags=["control", "undead"]
        ),
        
        # ============ PASSIVE FEATURES ============
        Ability(
            id="srd-fighter-extra-attack",
            name="Extra Attack",
            description="You can attack twice, instead of once, whenever you take the Attack action on your turn.",
            ability_type=AbilityType.PASSIVE,
            source=AbilitySource.SRD,
            classes=["fighter", "barbarian", "paladin", "ranger", "monk"],
            level_required=5,
            resource_type=ResourceType.NONE,
            action_type="passive",
            enhancement_text="Make 2 attacks when you take the Attack action",
            tags=["passive", "attack"]
        ),
        
        Ability(
            id="srd-barbarian-unarmored-defense",
            name="Unarmored Defense",
            description="While you are not wearing any armor, your Armor Class equals 10 + your Dexterity modifier + your Constitution modifier. You can use a shield and still gain this benefit.",
            ability_type=AbilityType.PASSIVE,
            source=AbilitySource.SRD,
            classes=["barbarian", "monk"],
            level_required=1,
            resource_type=ResourceType.NONE,
            action_type="passive",
            enhancement_text="AC = 10 + DEX + CON",
            tags=["passive", "defense", "ac"]
        ),
    ]
    
    # Add all abilities to the dictionary
    for ability in srd_abilities:
        abilities[ability.id] = ability
    
    print(f"\n{'='*60}")
    print(f"📖 SRD Abilities Loaded")
    print(f"{'='*60}")
    print(f"Total Abilities: {len(srd_abilities)}")
    print(f"\nBy Type:")
    by_type = {}
    for a in srd_abilities:
        by_type[a.ability_type] = by_type.get(a.ability_type, 0) + 1
    for ability_type, count in sorted(by_type.items()):
        print(f"  - {ability_type}: {count}")
    
    print(f"\nBy Class:")
    by_class = {}
    for a in srd_abilities:
        for cls in a.classes:
            by_class[cls] = by_class.get(cls, 0) + 1
    for cls, count in sorted(by_class.items()):
        print(f"  - {cls}: {count}")
    print(f"{'='*60}\n")
    
    return len(srd_abilities)


if __name__ == "__main__":
    # Test loading
    load_srd_abilities()
    print(f"\n✅ Successfully loaded {len(abilities)} abilities")
