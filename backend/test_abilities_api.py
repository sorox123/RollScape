"""
Test Abilities System API

Tests ability library, homebrew creation, and character abilities
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_get_all_abilities():
    """Test getting all abilities (SRD)"""
    print("\n🧪 Testing: Get All Abilities")
    
    response = requests.get(f"{BASE_URL}/api/abilities/")
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        abilities = response.json()
        print(f"✅ Found {len(abilities)} abilities")
        print("\nSample abilities:")
        for ability in abilities[:5]:
            print(f"   - {ability['name']} ({ability['classes'][0] if ability['classes'] else 'none'}, {ability['ability_type']})")
        return abilities
    else:
        print(f"❌ Error: {response.text}")
        return []


def test_filter_by_class():
    """Test filtering abilities by class"""
    print("\n🧪 Testing: Filter by Class (Fighter)")
    
    response = requests.get(f"{BASE_URL}/api/abilities/?class_name=fighter")
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        abilities = response.json()
        print(f"✅ Found {len(abilities)} fighter abilities:")
        for ability in abilities:
            print(f"   - {ability['name']} ({ability['ability_type']})")
    else:
        print(f"❌ Error: {response.text}")


def test_filter_by_type():
    """Test filtering by ability type"""
    print("\n🧪 Testing: Filter by Type (Maneuvers)")
    
    response = requests.get(f"{BASE_URL}/api/abilities/?ability_type=maneuver")
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        abilities = response.json()
        print(f"✅ Found {len(abilities)} Battle Master maneuvers:")
        for ability in abilities:
            print(f"   - {ability['name']}: {ability['description'][:60]}...")
    else:
        print(f"❌ Error: {response.text}")


def test_filter_monk_ki():
    """Test getting Monk ki abilities"""
    print("\n🧪 Testing: Get Monk Ki Abilities")
    
    response = requests.get(f"{BASE_URL}/api/abilities/?class_name=monk&ability_type=ki_ability")
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        abilities = response.json()
        print(f"✅ Found {len(abilities)} ki abilities:")
        for ability in abilities:
            print(f"   - {ability['name']} (Cost: {ability['resource_cost']} ki)")
    else:
        print(f"❌ Error: {response.text}")


def test_create_homebrew_maneuver():
    """Test creating homebrew Battle Master maneuver"""
    print("\n🧪 Testing: Create Homebrew Maneuver")
    
    maneuver_data = {
        "name": "Whirlwind Strike",
        "description": "When you take the Attack action, you can expend one superiority die to make a melee weapon attack against each creature within 5 feet of you. Add the superiority die to each attack's damage roll.",
        "ability_type": "maneuver",
        "classes": ["fighter"],
        "subclass": "battle_master",
        "level_required": 3,
        "resource_type": "superiority_dice",
        "resource_cost": 1,
        "recharge_on": "short_rest",
        "action_type": "free",
        "damage_dice": "1d8",
        "damage_type": "weapon",
        "tags": ["aoe", "damage", "homebrew"]
    }
    
    response = requests.post(
        f"{BASE_URL}/api/abilities/",
        json=maneuver_data
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        ability = response.json()
        print(f"✅ Created homebrew maneuver: {ability['name']}")
        print(f"   ID: {ability['id']}")
        print(f"   Source: {ability['source']}")
        return ability['id']
    else:
        print(f"❌ Error: {response.text}")
        return None


def test_add_to_character(character_id, ability_id):
    """Test adding ability to character"""
    print("\n🧪 Testing: Add Ability to Character")
    
    response = requests.post(
        f"{BASE_URL}/api/abilities/characters/{character_id}/abilities?ability_id={ability_id}&source=class"
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        entry = response.json()
        print(f"✅ Added ability to character")
        print(f"   Uses remaining: {entry['uses_remaining']}")
    else:
        print(f"❌ Error: {response.text}")


def test_get_character_abilities(character_id):
    """Test getting character abilities"""
    print("\n🧪 Testing: Get Character Abilities")
    
    response = requests.get(
        f"{BASE_URL}/api/abilities/characters/{character_id}/abilities"
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        abilities = response.json()
        print(f"✅ Character has {len(abilities)} abilities:")
        for entry in abilities:
            ability = entry['ability']
            print(f"   - {ability['name']} (Uses: {entry['uses_remaining']}, Source: {entry['source']})")
    else:
        print(f"❌ Error: {response.text}")


def test_use_ability(character_id, ability_id):
    """Test using an ability"""
    print("\n🧪 Testing: Use Ability")
    
    use_data = {
        "ability_id": ability_id,
        "character_id": character_id,
        "target_ids": ["enemy-1"]
    }
    
    response = requests.post(
        f"{BASE_URL}/api/abilities/use",
        json=use_data
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Used {result['ability']['name']}")
        print(f"   Effects: {len(result['effects'])} effects")
        for effect in result['effects']:
            print(f"      - {effect}")
        print(f"   Uses remaining: {result['uses_remaining']}")
    else:
        print(f"❌ Error: {response.text}")


def test_rest(character_id):
    """Test short rest to restore abilities"""
    print("\n🧪 Testing: Short Rest")
    
    response = requests.post(
        f"{BASE_URL}/api/abilities/characters/{character_id}/rest?rest_type=short_rest"
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"✅ {result['message']}")
    else:
        print(f"❌ Error: {response.text}")


def test_ability_stats():
    """Test getting ability statistics"""
    print("\n🧪 Testing: Ability Statistics")
    
    response = requests.get(f"{BASE_URL}/api/abilities/stats/summary")
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        stats = response.json()
        print(f"✅ Ability Library Stats:")
        print(f"   Total Abilities: {stats['total_abilities']}")
        print(f"   SRD Abilities: {stats.get('srd_count', 0)}")
        print(f"   Homebrew Abilities: {stats.get('homebrew_count', 0)}")
        print(f"\n   By Type: {stats['by_type']}")
        print(f"   By Class: {stats['by_class']}")
    else:
        print(f"❌ Error: {response.text}")


def test_item_granted_spell():
    """Test adding spell to character from magic item (Fighter with wand)"""
    print("\n🧪 Testing: Item-Granted Spell (Fighter with Wand of Fireballs)")
    
    character_id = "test-fighter-789"
    
    # First, get Fireball spell
    response = requests.get(f"{BASE_URL}/api/spells/?search=fireball")
    if response.status_code == 200:
        spells = response.json()
        if spells:
            fireball_id = spells[0]['id']
            print(f"Found Fireball: {fireball_id}")
            
            # Add to Fighter's spellbook from item
            response = requests.post(
                f"{BASE_URL}/api/spells/characters/{character_id}/spellbook",
                params={
                    "spell_id": fireball_id,
                    "prepared": True,
                    "source": "item",
                    "item_id": "wand-of-fireballs-001"
                }
            )
            
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                entry = response.json()
                print(f"✅ Fighter can now cast Fireball via magic item!")
                print(f"   Source: {entry['source']}")
                print(f"   Item ID: {entry['item_id']}")
            else:
                print(f"❌ Error: {response.text}")
    else:
        print(f"❌ Could not find Fireball spell")


def main():
    """Run all tests"""
    print("="*60)
    print("⚔️  ABILITIES SYSTEM TESTS")
    print("="*60)
    
    character_id = "test-fighter-456"
    
    try:
        # Test getting abilities
        all_abilities = test_get_all_abilities()
        
        # Test filtering
        test_filter_by_class()
        test_filter_by_type()
        test_filter_monk_ki()
        
        # Test homebrew creation
        homebrew_id = test_create_homebrew_maneuver()
        
        # Test character abilities
        if all_abilities:
            # Add some abilities to character
            for ability in all_abilities[:3]:
                test_add_to_character(character_id, ability['id'])
        
        if homebrew_id:
            test_add_to_character(character_id, homebrew_id)
        
        # Test getting character abilities
        test_get_character_abilities(character_id)
        
        # Test using an ability
        if all_abilities:
            test_use_ability(character_id, all_abilities[0]['id'])
        
        # Test rest
        test_rest(character_id)
        
        # Test stats
        test_ability_stats()
        
        # Test item-granted spell
        test_item_granted_spell()
        
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
