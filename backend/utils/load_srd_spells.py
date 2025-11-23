"""
SRD Spell Loader

Loads D&D 5e SRD (System Reference Document) spells into the spell library.
These are the free, open-source spells from the official rules.
"""

from api.spells import spells, Spell, SpellSchool, SpellSource


def load_srd_spells():
    """Load basic SRD spells"""
    
    srd_spell_data = [
        # Cantrips (Level 0)
        {
            "name": "Fire Bolt",
            "level": 0,
            "school": SpellSchool.EVOCATION,
            "casting_time": "1 action",
            "range": "120 feet",
            "components": ["V", "S"],
            "duration": "Instantaneous",
            "description": "You hurl a mote of fire at a creature or object within range. Make a ranged spell attack against the target. On a hit, the target takes 1d10 fire damage. A flammable object hit by this spell ignites if it isn't being worn or carried.",
            "at_higher_levels": "This spell's damage increases by 1d10 when you reach 5th level (2d10), 11th level (3d10), and 17th level (4d10).",
            "damage_dice": "1d10",
            "damage_type": "fire",
            "spell_attack": True,
            "classes": ["wizard", "sorcerer"],
            "tags": ["damage", "ranged"]
        },
        {
            "name": "Mage Hand",
            "level": 0,
            "school": SpellSchool.CONJURATION,
            "casting_time": "1 action",
            "range": "30 feet",
            "components": ["V", "S"],
            "duration": "1 minute",
            "description": "A spectral, floating hand appears at a point you choose within range. The hand lasts for the duration or until you dismiss it as an action. The hand vanishes if it is ever more than 30 feet away from you or if you cast this spell again. You can use your action to control the hand.",
            "classes": ["wizard", "sorcerer", "warlock", "bard"],
            "tags": ["utility"]
        },
        {
            "name": "Light",
            "level": 0,
            "school": SpellSchool.EVOCATION,
            "casting_time": "1 action",
            "range": "Touch",
            "components": ["V", "M"],
            "material_components": "A firefly or phosphorescent moss",
            "duration": "1 hour",
            "description": "You touch one object that is no larger than 10 feet in any dimension. Until the spell ends, the object sheds bright light in a 20-foot radius and dim light for an additional 20 feet. The light can be colored as you like.",
            "classes": ["wizard", "sorcerer", "cleric", "bard"],
            "tags": ["utility", "light"]
        },
        {
            "name": "Prestidigitation",
            "level": 0,
            "school": SpellSchool.TRANSMUTATION,
            "casting_time": "1 action",
            "range": "10 feet",
            "components": ["V", "S"],
            "duration": "Up to 1 hour",
            "description": "This spell is a minor magical trick that novice spellcasters use for practice. You create one of several minor effects within range.",
            "classes": ["wizard", "sorcerer", "warlock", "bard"],
            "tags": ["utility"]
        },
        
        # Level 1 Spells
        {
            "name": "Magic Missile",
            "level": 1,
            "school": SpellSchool.EVOCATION,
            "casting_time": "1 action",
            "range": "120 feet",
            "components": ["V", "S"],
            "duration": "Instantaneous",
            "description": "You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range. A dart deals 1d4 + 1 force damage to its target. The darts all strike simultaneously, and you can direct them to hit one creature or several.",
            "at_higher_levels": "When you cast this spell using a spell slot of 2nd level or higher, the spell creates one more dart for each slot level above 1st.",
            "damage_dice": "1d4+1",
            "damage_type": "force",
            "spell_attack": False,  # Auto-hit
            "classes": ["wizard", "sorcerer"],
            "tags": ["damage", "auto-hit"]
        },
        {
            "name": "Shield",
            "level": 1,
            "school": SpellSchool.ABJURATION,
            "casting_time": "1 reaction",
            "range": "Self",
            "components": ["V", "S"],
            "duration": "1 round",
            "description": "An invisible barrier of magical force appears and protects you. Until the start of your next turn, you have a +5 bonus to AC, including against the triggering attack, and you take no damage from magic missile.",
            "classes": ["wizard", "sorcerer"],
            "tags": ["defense", "reaction"]
        },
        {
            "name": "Cure Wounds",
            "level": 1,
            "school": SpellSchool.EVOCATION,
            "casting_time": "1 action",
            "range": "Touch",
            "components": ["V", "S"],
            "duration": "Instantaneous",
            "description": "A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier. This spell has no effect on undead or constructs.",
            "at_higher_levels": "When you cast this spell using a spell slot of 2nd level or higher, the healing increases by 1d8 for each slot level above 1st.",
            "damage_dice": "1d8",
            "damage_type": "healing",
            "classes": ["cleric", "druid", "paladin", "bard", "ranger"],
            "tags": ["healing", "touch"]
        },
        {
            "name": "Detect Magic",
            "level": 1,
            "school": SpellSchool.DIVINATION,
            "casting_time": "1 action",
            "range": "Self",
            "components": ["V", "S"],
            "duration": "Concentration, up to 10 minutes",
            "concentration": True,
            "ritual": True,
            "description": "For the duration, you sense the presence of magic within 30 feet of you. If you sense magic in this way, you can use your action to see a faint aura around any visible creature or object in the area that bears magic.",
            "classes": ["wizard", "sorcerer", "bard", "cleric", "druid", "paladin", "ranger"],
            "tags": ["detection", "ritual"]
        },
        
        # Level 2 Spells
        {
            "name": "Scorching Ray",
            "level": 2,
            "school": SpellSchool.EVOCATION,
            "casting_time": "1 action",
            "range": "120 feet",
            "components": ["V", "S"],
            "duration": "Instantaneous",
            "description": "You create three rays of fire and hurl them at targets within range. You can hurl them at one target or several. Make a ranged spell attack for each ray. On a hit, the target takes 2d6 fire damage.",
            "at_higher_levels": "When you cast this spell using a spell slot of 3rd level or higher, you create one additional ray for each slot level above 2nd.",
            "damage_dice": "2d6",
            "damage_type": "fire",
            "spell_attack": True,
            "classes": ["wizard", "sorcerer"],
            "tags": ["damage", "fire"]
        },
        {
            "name": "Hold Person",
            "level": 2,
            "school": SpellSchool.ENCHANTMENT,
            "casting_time": "1 action",
            "range": "60 feet",
            "components": ["V", "S", "M"],
            "material_components": "A small, straight piece of iron",
            "duration": "Concentration, up to 1 minute",
            "concentration": True,
            "description": "Choose a humanoid that you can see within range. The target must succeed on a Wisdom saving throw or be paralyzed for the duration. At the end of each of its turns, the target can make another Wisdom saving throw.",
            "at_higher_levels": "When you cast this spell using a spell slot of 3rd level or higher, you can target one additional humanoid for each slot level above 2nd.",
            "save_type": "wisdom",
            "classes": ["wizard", "sorcerer", "bard", "cleric", "druid", "warlock"],
            "tags": ["control", "debuff"]
        },
        
        # Level 3 Spells
        {
            "name": "Fireball",
            "level": 3,
            "school": SpellSchool.EVOCATION,
            "casting_time": "1 action",
            "range": "150 feet",
            "components": ["V", "S", "M"],
            "material_components": "A tiny ball of bat guano and sulfur",
            "duration": "Instantaneous",
            "description": "A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame. Each creature in a 20-foot-radius sphere centered on that point must make a Dexterity saving throw. A target takes 8d6 fire damage on a failed save, or half as much damage on a successful one.",
            "at_higher_levels": "When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d6 for each slot level above 3rd.",
            "damage_dice": "8d6",
            "damage_type": "fire",
            "save_type": "dexterity",
            "classes": ["wizard", "sorcerer"],
            "tags": ["damage", "aoe", "fire"]
        },
        {
            "name": "Counterspell",
            "level": 3,
            "school": SpellSchool.ABJURATION,
            "casting_time": "1 reaction",
            "range": "60 feet",
            "components": ["S"],
            "duration": "Instantaneous",
            "description": "You attempt to interrupt a creature in the process of casting a spell. If the creature is casting a spell of 3rd level or lower, its spell fails and has no effect. If it is casting a spell of 4th level or higher, make an ability check using your spellcasting ability.",
            "at_higher_levels": "When you cast this spell using a spell slot of 4th level or higher, the interrupted spell has no effect if its level is less than or equal to the level of the spell slot you used.",
            "classes": ["wizard", "sorcerer", "warlock"],
            "tags": ["reaction", "control"]
        },
        {
            "name": "Fly",
            "level": 3,
            "school": SpellSchool.TRANSMUTATION,
            "casting_time": "1 action",
            "range": "Touch",
            "components": ["V", "S", "M"],
            "material_components": "A wing feather from any bird",
            "duration": "Concentration, up to 10 minutes",
            "concentration": True,
            "description": "You touch a willing creature. The target gains a flying speed of 60 feet for the duration. When the spell ends, the target falls if it is still aloft, unless it can stop the fall.",
            "at_higher_levels": "When you cast this spell using a spell slot of 4th level or higher, you can target one additional creature for each slot level above 3rd.",
            "classes": ["wizard", "sorcerer", "warlock"],
            "tags": ["buff", "movement"]
        },
        
        # Level 4 Spells
        {
            "name": "Polymorph",
            "level": 4,
            "school": SpellSchool.TRANSMUTATION,
            "casting_time": "1 action",
            "range": "60 feet",
            "components": ["V", "S", "M"],
            "material_components": "A caterpillar cocoon",
            "duration": "Concentration, up to 1 hour",
            "concentration": True,
            "description": "This spell transforms a creature that you can see within range into a new form. An unwilling creature must make a Wisdom saving throw to avoid the effect. The spell has no effect on a shapechanger or a creature with 0 hit points.",
            "save_type": "wisdom",
            "classes": ["wizard", "sorcerer", "bard", "druid"],
            "tags": ["transformation", "control"]
        },
        
        # Level 5 Spells
        {
            "name": "Cone of Cold",
            "level": 5,
            "school": SpellSchool.EVOCATION,
            "casting_time": "1 action",
            "range": "Self (60-foot cone)",
            "components": ["V", "S", "M"],
            "material_components": "A small crystal or glass cone",
            "duration": "Instantaneous",
            "description": "A blast of cold air erupts from your hands. Each creature in a 60-foot cone must make a Constitution saving throw. A creature takes 8d8 cold damage on a failed save, or half as much damage on a successful one.",
            "at_higher_levels": "When you cast this spell using a spell slot of 6th level or higher, the damage increases by 1d8 for each slot level above 5th.",
            "damage_dice": "8d8",
            "damage_type": "cold",
            "save_type": "constitution",
            "classes": ["wizard", "sorcerer"],
            "tags": ["damage", "aoe", "cold"]
        },
    ]
    
    # Load spells
    loaded_count = 0
    for spell_data in srd_spell_data:
        spell = Spell(
            **spell_data,
            source=SpellSource.SRD
        )
        spells[spell.id] = spell
        loaded_count += 1
    
    print(f"✅ Loaded {loaded_count} SRD spells")
    return loaded_count


if __name__ == "__main__":
    count = load_srd_spells()
    print(f"\nTotal SRD spells in library: {count}")
    
    # Print summary
    by_level = {}
    for spell in spells.values():
        by_level[spell.level] = by_level.get(spell.level, 0) + 1
    
    print("\nSpells by level:")
    for level in sorted(by_level.keys()):
        level_name = "Cantrips" if level == 0 else f"Level {level}"
        print(f"  {level_name}: {by_level[level]}")
