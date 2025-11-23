"""
Test Spell System API

Tests spell library, homebrew creation, and spellbook management
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_get_all_spells():
    """Test getting all spells (SRD)"""
    print("\n🧪 Testing: Get All Spells")
    
    response = requests.get(f"{BASE_URL}/api/spells/")
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        spells = response.json()
        print(f"✅ Found {len(spells)} spells")
        print("\nSample spells:")
        for spell in spells[:5]:
            print(f"   - {spell['name']} (Level {spell['level']}, {spell['school']})")
        return spells
    else:
        print(f"❌ Error: {response.text}")
        return []


def test_filter_spells_by_level():
    """Test filtering spells by level"""
    print("\n🧪 Testing: Filter Spells by Level")
    
    response = requests.get(f"{BASE_URL}/api/spells/?level=1")
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        spells = response.json()
        print(f"✅ Found {len(spells)} level 1 spells")
        for spell in spells:
            print(f"   - {spell['name']}")
    else:
        print(f"❌ Error: {response.text}")


def test_filter_spells_by_class():
    """Test filtering spells by class"""
    print("\n🧪 Testing: Filter Spells by Class (Wizard)")
    
    response = requests.get(f"{BASE_URL}/api/spells/?class_name=wizard")
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        spells = response.json()
        print(f"✅ Found {len(spells)} wizard spells")
        print("\nFirst 5 wizard spells:")
        for spell in spells[:5]:
            print(f"   - {spell['name']} (Level {spell['level']})")
    else:
        print(f"❌ Error: {response.text}")


def test_search_spells():
    """Test searching spells"""
    print("\n🧪 Testing: Search Spells (fire)")
    
    response = requests.get(f"{BASE_URL}/api/spells/?search=fire")
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        spells = response.json()
        print(f"✅ Found {len(spells)} spells matching 'fire'")
        for spell in spells:
            print(f"   - {spell['name']}")
    else:
        print(f"❌ Error: {response.text}")


def test_create_homebrew_spell():
    """Test creating a homebrew spell"""
    print("\n🧪 Testing: Create Homebrew Spell")
    
    homebrew_data = {
        "name": "Arcane Explosion",
        "level": 2,
        "school": "evocation",
        "casting_time": "1 action",
        "range": "Self (15-foot radius)",
        "components": ["V", "S"],
        "duration": "Instantaneous",
        "concentration": False,
        "ritual": False,
        "description": "You release a burst of arcane energy. All creatures within 15 feet of you must make a Dexterity saving throw, taking 3d6 force damage on a failed save, or half as much on a successful one.",
        "at_higher_levels": "When you cast this spell using a spell slot of 3rd level or higher, the damage increases by 1d6 for each slot level above 2nd.",
        "damage_dice": "3d6",
        "damage_type": "force",
        "save_type": "dexterity",
        "spell_attack": False,
        "classes": ["wizard", "sorcerer"],
        "tags": ["homebrew", "aoe", "force"],
        "is_public": False
    }
    
    response = requests.post(
        f"{BASE_URL}/api/spells/",
        json=homebrew_data
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        spell = response.json()
        print(f"✅ Created homebrew spell: {spell['name']}")
        print(f"   ID: {spell['id']}")
        print(f"   Source: {spell['source']}")
        print(f"   Damage: {spell['damage_dice']} {spell['damage_type']}")
        return spell['id']
    else:
        print(f"❌ Error: {response.text}")
        return None


def test_create_campaign_spell(campaign_id):
    """Test creating a campaign-specific spell"""
    print("\n🧪 Testing: Create Campaign Spell")
    
    campaign_spell_data = {
        "name": "Shadowmeld",
        "level": 1,
        "school": "illusion",
        "casting_time": "1 bonus action",
        "range": "Self",
        "components": ["S"],
        "duration": "1 minute",
        "concentration": True,
        "ritual": False,
        "description": "You become invisible while in dim light or darkness. The spell ends if you enter bright light or if you attack or cast a spell.",
        "classes": ["wizard", "warlock", "rogue"],
        "tags": ["stealth", "campaign-specific"],
        "is_public": False
    }
    
    response = requests.post(
        f"{BASE_URL}/api/spells/campaigns/{campaign_id}/spells",
        json=campaign_spell_data
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        spell = response.json()
        print(f"✅ Created campaign spell: {spell['name']}")
        print(f"   Campaign ID: {spell['campaign_id']}")
        print(f"   Source: {spell['source']}")
        return spell['id']
    else:
        print(f"❌ Error: {response.text}")
        return None


def test_add_to_spellbook(character_id, spell_id):
    """Test adding spell to character spellbook"""
    print("\n🧪 Testing: Add Spell to Spellbook")
    
    response = requests.post(
        f"{BASE_URL}/api/spells/characters/{character_id}/spellbook?spell_id={spell_id}&prepared=true"
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        entry = response.json()
        print(f"✅ Added spell to spellbook")
        print(f"   Prepared: {entry['prepared']}")
    else:
        print(f"❌ Error: {response.text}")


def test_get_spellbook(character_id):
    """Test getting character spellbook"""
    print("\n🧪 Testing: Get Character Spellbook")
    
    response = requests.get(
        f"{BASE_URL}/api/spells/characters/{character_id}/spellbook"
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        spellbook = response.json()
        print(f"✅ Character has {len(spellbook)} spells in spellbook:")
        for entry in spellbook:
            spell = entry['spell']
            prepared = "✓" if entry['prepared'] else "✗"
            print(f"   [{prepared}] {spell['name']} (Level {spell['level']})")
    else:
        print(f"❌ Error: {response.text}")


def test_get_prepared_spells(character_id):
    """Test getting only prepared spells"""
    print("\n🧪 Testing: Get Prepared Spells Only")
    
    response = requests.get(
        f"{BASE_URL}/api/spells/characters/{character_id}/spellbook?prepared_only=true"
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        spellbook = response.json()
        print(f"✅ Character has {len(spellbook)} prepared spells:")
        for entry in spellbook:
            spell = entry['spell']
            print(f"   - {spell['name']} (Level {spell['level']})")
    else:
        print(f"❌ Error: {response.text}")


def test_cast_spell(character_id, spell_id):
    """Test casting a spell"""
    print("\n🧪 Testing: Cast Spell")
    
    cast_data = {
        "spell_id": spell_id,
        "character_id": character_id,
        "spell_level": 1,
        "target_ids": ["target-1", "target-2"]
    }
    
    response = requests.post(
        f"{BASE_URL}/api/spells/cast",
        json=cast_data
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Cast {result['spell']['name']}")
        print(f"   Caster: {result['caster_id']}")
        print(f"   Targets: {len(result['targets'])}")
        print(f"   Effects:")
        for effect in result['effects']:
            print(f"      - {effect}")
    else:
        print(f"❌ Error: {response.text}")


def test_spell_stats():
    """Test getting spell statistics"""
    print("\n🧪 Testing: Spell Statistics")
    
    response = requests.get(f"{BASE_URL}/api/spells/stats/summary")
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        stats = response.json()
        print(f"✅ Spell Library Stats:")
        print(f"   Total Spells: {stats['total_spells']}")
        print(f"   SRD Spells: {stats.get('srd_count', 0)}")
        print(f"   Homebrew Spells: {stats.get('homebrew_count', 0)}")
        print(f"\n   By Level: {stats['by_level']}")
        print(f"   By School: {stats['by_school']}")
    else:
        print(f"❌ Error: {response.text}")


def main():
    """Run all tests"""
    print("="*60)
    print("🪄 SPELL SYSTEM TESTS")
    print("="*60)
    
    character_id = "test-wizard-123"
    campaign_id = "test-campaign-456"
    
    try:
        # Test getting SRD spells
        all_spells = test_get_all_spells()
        
        # Test filtering
        test_filter_spells_by_level()
        test_filter_spells_by_class()
        test_search_spells()
        
        # Test homebrew creation
        homebrew_id = test_create_homebrew_spell()
        
        # Test campaign spell
        campaign_spell_id = test_create_campaign_spell(campaign_id)
        
        # Test spellbook management
        if all_spells:
            # Add a few spells to spellbook
            for spell in all_spells[:3]:
                test_add_to_spellbook(character_id, spell['id'])
        
        if homebrew_id:
            test_add_to_spellbook(character_id, homebrew_id)
        
        # Test getting spellbook
        test_get_spellbook(character_id)
        test_get_prepared_spells(character_id)
        
        # Test casting
        if all_spells:
            test_cast_spell(character_id, all_spells[0]['id'])
        
        # Test stats
        test_spell_stats()
        
        print("\n" + "="*60)
        print("✅ All tests completed!")
        print("="*60)
        
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Cannot connect to server")
        print("Make sure the server is running on http://localhost:8000")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")


if __name__ == "__main__":
    main()
