"""
Tests for Combat System

Tests combat manager, combatants, and combat encounters.
"""

import pytest
from game_logic.combat_manager import (
    Combatant,
    Combat,
    CombatManager,
    CombatStatus,
    Condition
)


class TestCombatant:
    """Test Combatant class"""
    
    def test_create_combatant(self):
        """Test creating a combatant"""
        combatant = Combatant(
            name="Test Fighter",
            initiative=15,
            initiative_bonus=3,
            max_hp=50,
            current_hp=50,
            armor_class=18
        )
        
        assert combatant.name == "Test Fighter"
        assert combatant.initiative == 15
        assert combatant.max_hp == 50
        assert combatant.current_hp == 50
        assert combatant.armor_class == 18
        assert combatant.is_alive
        assert not combatant.is_dead
        assert not combatant.is_unconscious
    
    def test_take_damage(self):
        """Test damage application"""
        combatant = Combatant(
            name="Test Fighter",
            initiative=15,
            max_hp=50,
            current_hp=50,
            armor_class=18
        )
        
        result = combatant.take_damage(20)
        
        assert result["damage_taken"] == 20
        assert combatant.current_hp == 30
        assert combatant.is_alive
        # Note: is_bloodied checks <= max_hp // 2, which is <= 25 for max_hp=50
        # So 30 HP is not bloodied
        assert not combatant.is_bloodied
    
    def test_take_damage_with_temp_hp(self):
        """Test damage with temp HP"""
        combatant = Combatant(
            name="Test Fighter",
            initiative=15,
            max_hp=50,
            current_hp=50,
            temp_hp=10,
            armor_class=18
        )
        
        # Damage less than temp HP
        result = combatant.take_damage(5)
        assert combatant.temp_hp == 5
        assert combatant.current_hp == 50
        
        # Damage exceeding temp HP
        result = combatant.take_damage(10)
        assert combatant.temp_hp == 0
        assert combatant.current_hp == 45
    
    def test_take_damage_to_zero(self):
        """Test going unconscious"""
        combatant = Combatant(
            name="Test Fighter",
            initiative=15,
            max_hp=50,
            current_hp=10,
            armor_class=18
        )
        
        result = combatant.take_damage(10)
        
        assert combatant.current_hp == 0
        assert combatant.is_unconscious
        assert Condition.UNCONSCIOUS in combatant.conditions
        assert Condition.PRONE in combatant.conditions
    
    def test_healing(self):
        """Test healing"""
        combatant = Combatant(
            name="Test Fighter",
            initiative=15,
            max_hp=50,
            current_hp=20,
            armor_class=18
        )
        
        result = combatant.heal(15)
        
        assert result["healing"] == 15
        assert combatant.current_hp == 35
    
    def test_healing_from_unconscious(self):
        """Test healing from 0 HP"""
        combatant = Combatant(
            name="Test Fighter",
            initiative=15,
            max_hp=50,
            current_hp=0,
            armor_class=18
        )
        combatant.add_condition(Condition.UNCONSCIOUS)
        
        result = combatant.heal(10)
        
        assert combatant.current_hp == 10
        assert not combatant.is_unconscious
        assert Condition.UNCONSCIOUS not in combatant.conditions
        assert result["is_conscious"]
    
    def test_healing_cannot_exceed_max(self):
        """Test healing cap at max HP"""
        combatant = Combatant(
            name="Test Fighter",
            initiative=15,
            max_hp=50,
            current_hp=45,
            armor_class=18
        )
        
        result = combatant.heal(10)
        
        assert result["healing"] == 5  # Only healed to max
        assert combatant.current_hp == 50
    
    def test_conditions(self):
        """Test condition management"""
        combatant = Combatant(
            name="Test Fighter",
            initiative=15,
            max_hp=50,
            current_hp=50,
            armor_class=18
        )
        
        # Add conditions
        combatant.add_condition(Condition.POISONED)
        assert Condition.POISONED in combatant.conditions
        
        combatant.add_condition(Condition.BLINDED)
        assert len(combatant.conditions) == 2
        
        # Don't duplicate
        combatant.add_condition(Condition.POISONED)
        assert len(combatant.conditions) == 2
        
        # Remove condition
        combatant.remove_condition(Condition.POISONED)
        assert Condition.POISONED not in combatant.conditions
        assert len(combatant.conditions) == 1
    
    def test_bloodied_threshold(self):
        """Test bloodied status"""
        combatant = Combatant(
            name="Test Fighter",
            initiative=15,
            max_hp=50,
            current_hp=50,
            armor_class=18
        )
        
        assert not combatant.is_bloodied
        
        combatant.take_damage(25)
        assert combatant.current_hp == 25
        assert combatant.is_bloodied
        
        combatant.take_damage(1)
        assert combatant.current_hp == 24
        assert combatant.is_bloodied


class TestCombat:
    """Test Combat class"""
    
    def test_create_combat(self):
        """Test creating combat"""
        combat = Combat(description="Test Combat")
        
        assert combat.id is not None
        assert combat.status == CombatStatus.READY
        assert combat.round_number == 0
        assert len(combat.combatants) == 0
    
    def test_add_combatants(self):
        """Test adding combatants"""
        combat = Combat()
        
        fighter = Combatant(name="Fighter", initiative=15, max_hp=50, current_hp=50, armor_class=18)
        wizard = Combatant(name="Wizard", initiative=18, max_hp=30, current_hp=30, armor_class=12)
        
        combat.add_combatant(fighter)
        combat.add_combatant(wizard)
        
        assert len(combat.combatants) == 2
        assert len(combat.turn_order) == 2
        
        # Should be sorted by initiative (highest first)
        assert combat.turn_order[0] == wizard.id  # Initiative 18
        assert combat.turn_order[1] == fighter.id  # Initiative 15
    
    def test_start_combat(self):
        """Test starting combat"""
        combat = Combat()
        
        fighter = Combatant(name="Fighter", initiative=15, max_hp=50, current_hp=50, armor_class=18)
        wizard = Combatant(name="Wizard", initiative=18, max_hp=30, current_hp=30, armor_class=12)
        
        combat.add_combatant(fighter)
        combat.add_combatant(wizard)
        
        combat.start_combat()
        
        assert combat.status == CombatStatus.ACTIVE
        assert combat.round_number == 1
        assert combat.current_turn == 0
        
        # First turn should be highest initiative
        current = combat.get_current_combatant()
        assert current.name == "Wizard"
    
    def test_next_turn(self):
        """Test turn progression"""
        combat = Combat()
        
        fighter = Combatant(name="Fighter", initiative=15, max_hp=50, current_hp=50, armor_class=18, is_player=True)
        wizard = Combatant(name="Wizard", initiative=18, max_hp=30, current_hp=30, armor_class=12, is_player=True)
        orc = Combatant(name="Orc", initiative=12, max_hp=15, current_hp=15, armor_class=13, is_npc=True, is_player=False)
        
        combat.add_combatant(fighter)
        combat.add_combatant(wizard)
        combat.add_combatant(orc)
        
        combat.start_combat()
        
        # Turn 1: Wizard
        assert combat.get_current_combatant().name == "Wizard"
        
        # Turn 2: Fighter
        result = combat.next_turn()
        assert result["round"] == 1
        assert result["turn"] == 1
        assert combat.get_current_combatant().name == "Fighter"
        
        # Turn 3: Orc
        result = combat.next_turn()
        assert combat.get_current_combatant().name == "Orc"
        
        # Turn 4: Back to Wizard, Round 2
        result = combat.next_turn()
        assert result["round"] == 2
        assert result["turn"] == 0
        assert combat.get_current_combatant().name == "Wizard"
    
    def test_apply_damage_in_combat(self):
        """Test damage application during combat"""
        combat = Combat()
        
        fighter = Combatant(name="Fighter", initiative=15, max_hp=50, current_hp=50, armor_class=18, is_player=True)
        orc = Combatant(name="Orc", initiative=12, max_hp=15, current_hp=15, armor_class=13, is_npc=True, is_player=False)
        
        combat.add_combatant(fighter)
        combat.add_combatant(orc)
        
        combat.start_combat()
        
        result = combat.apply_damage(orc.id, 10)
        
        assert result["damage_taken"] == 10
        assert result["combatant"]["current_hp"] == 5
        assert not result.get("combat_ended")
    
    def test_combat_ends_when_all_enemies_dead(self):
        """Test combat ending"""
        combat = Combat()
        
        fighter = Combatant(name="Fighter", initiative=15, max_hp=50, current_hp=50, armor_class=18, is_player=True, is_npc=False)
        orc = Combatant(name="Orc", initiative=12, max_hp=15, current_hp=15, armor_class=13, is_npc=True, is_player=False)
        
        combat.add_combatant(fighter)
        combat.add_combatant(orc)
        
        combat.start_combat()
        
        # Kill the orc
        result = combat.apply_damage(orc.id, 15)
        
        assert result["combatant"]["current_hp"] == 0
        assert result.get("combat_ended")
        assert combat.status == CombatStatus.ENDED
    
    def test_apply_healing_in_combat(self):
        """Test healing during combat"""
        combat = Combat()
        
        fighter = Combatant(name="Fighter", initiative=15, max_hp=50, current_hp=20, armor_class=18)
        
        combat.add_combatant(fighter)
        combat.start_combat()
        
        result = combat.apply_healing(fighter.id, 15)
        
        assert result["healing"] == 15
        assert result["combatant"]["current_hp"] == 35
    
    def test_get_summary(self):
        """Test combat summary"""
        combat = Combat()
        
        fighter = Combatant(name="Fighter", initiative=15, max_hp=50, current_hp=30, armor_class=18, is_player=True)
        wizard = Combatant(name="Wizard", initiative=18, max_hp=30, current_hp=30, armor_class=12, is_player=True)
        
        combat.add_combatant(fighter)
        combat.add_combatant(wizard)
        
        combat.start_combat()
        
        summary = combat.get_summary()
        
        assert summary["status"] == CombatStatus.ACTIVE
        assert summary["round"] == 1
        assert summary["current_combatant"] == "Wizard"
        assert len(summary["combatants"]) == 2
    
    def test_remove_combatant(self):
        """Test removing combatant"""
        combat = Combat()
        
        fighter = Combatant(name="Fighter", initiative=15, max_hp=50, current_hp=50, armor_class=18)
        wizard = Combatant(name="Wizard", initiative=18, max_hp=30, current_hp=30, armor_class=12)
        
        combat.add_combatant(fighter)
        combat.add_combatant(wizard)
        
        assert len(combat.combatants) == 2
        
        combat.remove_combatant(fighter.id)
        
        assert len(combat.combatants) == 1
        assert len(combat.turn_order) == 1
        assert combat.get_combatant(fighter.id) is None


class TestCombatManager:
    """Test CombatManager class"""
    
    def test_create_combat_via_manager(self):
        """Test creating combat through manager"""
        manager = CombatManager()
        
        combat = manager.create_combat(session_id="test-session", description="Test Combat")
        
        assert combat.id is not None
        assert combat.session_id == "test-session"
        assert combat.description == "Test Combat"
        assert manager.get_combat(combat.id) == combat
    
    def test_get_nonexistent_combat(self):
        """Test getting combat that doesn't exist"""
        manager = CombatManager()
        
        combat = manager.get_combat("nonexistent-id")
        
        assert combat is None
    
    def test_get_session_combats(self):
        """Test getting combats by session"""
        manager = CombatManager()
        
        combat1 = manager.create_combat(session_id="session-1")
        combat2 = manager.create_combat(session_id="session-1")
        combat3 = manager.create_combat(session_id="session-2")
        
        session1_combats = manager.get_session_combats("session-1")
        session2_combats = manager.get_session_combats("session-2")
        
        assert len(session1_combats) == 2
        assert len(session2_combats) == 1
        assert combat1 in session1_combats
        assert combat2 in session1_combats
        assert combat3 in session2_combats
    
    def test_delete_combat(self):
        """Test deleting combat"""
        manager = CombatManager()
        
        combat = manager.create_combat()
        combat_id = combat.id
        
        assert manager.get_combat(combat_id) is not None
        
        manager.delete_combat(combat_id)
        
        assert manager.get_combat(combat_id) is None
    
    def test_multiple_combats(self):
        """Test managing multiple combats"""
        manager = CombatManager()
        
        combat1 = manager.create_combat(description="Combat 1")
        combat2 = manager.create_combat(description="Combat 2")
        combat3 = manager.create_combat(description="Combat 3")
        
        assert len(manager.combats) == 3
        assert manager.get_combat(combat1.id).description == "Combat 1"
        assert manager.get_combat(combat2.id).description == "Combat 2"
        assert manager.get_combat(combat3.id).description == "Combat 3"


class TestCombatIntegration:
    """Integration tests for full combat flow"""
    
    def test_full_combat_scenario(self):
        """Test complete combat from start to finish"""
        manager = CombatManager()
        combat = manager.create_combat(description="Boss Fight")
        
        # Add combatants
        fighter = Combatant(
            name="Thorin Ironbeard",
            initiative=18,
            initiative_bonus=3,
            max_hp=47,
            current_hp=47,
            armor_class=18,
            is_player=True
        )
        wizard = Combatant(
            name="Elara Moonshadow",
            initiative=16,
            initiative_bonus=2,
            max_hp=28,
            current_hp=28,
            armor_class=14,
            is_player=True
        )
        goblin = Combatant(
            name="Goblin",
            initiative=14,
            max_hp=7,
            current_hp=7,
            armor_class=15,
            is_npc=True,
            is_player=False
        )
        
        combat.add_combatant(fighter)
        combat.add_combatant(wizard)
        combat.add_combatant(goblin)
        
        # Start combat
        combat.start_combat()
        assert combat.status == CombatStatus.ACTIVE
        assert combat.round_number == 1
        
        # Round 1, Turn 1: Fighter's turn
        current = combat.get_current_combatant()
        assert current.name == "Thorin Ironbeard"
        
        # Fighter attacks goblin
        combat.apply_damage(goblin.id, 5)
        assert goblin.current_hp == 2
        
        # Next turn: Wizard
        combat.next_turn()
        current = combat.get_current_combatant()
        assert current.name == "Elara Moonshadow"
        
        # Wizard casts magic missile on goblin
        result = combat.apply_damage(goblin.id, 3)
        assert result["combatant"]["current_hp"] == 0
        # Goblin should be unconscious (is_unconscious is in result, not in combatant dict)
        assert result["is_unconscious"]
        
        # Combat should end (all enemies dead)
        assert result.get("combat_ended")
        assert combat.status == CombatStatus.ENDED
        
        # Verify summary
        summary = combat.get_summary()
        assert summary["status"] == CombatStatus.ENDED
        assert summary["round"] == 1
    
    def test_combat_with_healing(self):
        """Test combat with damage and healing"""
        combat = Combat()
        
        fighter = Combatant(
            name="Fighter",
            initiative=15,
            max_hp=50,
            current_hp=50,
            armor_class=18,
            is_player=True
        )
        cleric = Combatant(
            name="Cleric",
            initiative=12,
            max_hp=40,
            current_hp=40,
            armor_class=16,
            is_player=True
        )
        orc = Combatant(
            name="Orc",
            initiative=10,
            max_hp=15,
            current_hp=15,
            armor_class=13,
            is_npc=True,
            is_player=False
        )
        
        combat.add_combatant(fighter)
        combat.add_combatant(cleric)
        combat.add_combatant(orc)
        
        combat.start_combat()
        
        # Fighter takes damage
        combat.apply_damage(fighter.id, 20)
        assert fighter.current_hp == 30
        
        combat.next_turn()
        
        # Cleric heals fighter
        result = combat.apply_healing(fighter.id, 10)
        assert fighter.current_hp == 40
        assert result["healing"] == 10
    
    def test_combat_with_conditions(self):
        """Test combat with conditions"""
        combat = Combat()
        
        fighter = Combatant(
            name="Fighter",
            initiative=15,
            max_hp=50,
            current_hp=50,
            armor_class=18
        )
        
        combat.add_combatant(fighter)
        combat.start_combat()
        
        # Add poisoned condition
        fighter.add_condition(Condition.POISONED)
        assert Condition.POISONED in fighter.conditions
        
        # Add blinded condition
        fighter.add_condition(Condition.BLINDED)
        assert len(fighter.conditions) == 2
        
        # Remove poisoned
        fighter.remove_condition(Condition.POISONED)
        assert Condition.POISONED not in fighter.conditions
        assert len(fighter.conditions) == 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
