"""
Test Inventory System API

Quick tests for inventory endpoints
"""

import requests
import json

BASE_URL = "http://localhost:8000"
CHARACTER_ID = "test-character"

def test_add_item():
    """Test adding an item to inventory"""
    print("\n🧪 Testing: Add Item")
    
    item_data = {
        "name": "Longsword",
        "description": "A sharp blade forged in the fires of Mount Doom",
        "item_type": "weapon",
        "rarity": "common",
        "weight": 3.0,
        "value": 15,
        "quantity": 1,
        "equippable": True,
        "equipment_slot": "main_hand",
        "damage_dice": "1d8",
        "damage_type": "slashing",
        "is_magical": False,
        "requires_attunement": False,
        "properties": ["Versatile (1d10)"],
        "notes": "Found in the dungeon"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/inventory/characters/{CHARACTER_ID}/items",
        json=item_data
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        item = response.json()
        print(f"✅ Added: {item['name']} (ID: {item['id']})")
        return item['id']
    else:
        print(f"❌ Error: {response.text}")
        return None


def test_get_inventory(character_id):
    """Test getting inventory"""
    print("\n🧪 Testing: Get Inventory")
    
    response = requests.get(
        f"{BASE_URL}/api/inventory/characters/{character_id}/items"
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        items = response.json()
        print(f"✅ Found {len(items)} items:")
        for item in items:
            print(f"   - {item['name']} (x{item['quantity']})")
    else:
        print(f"❌ Error: {response.text}")


def test_equip_item(character_id, item_id):
    """Test equipping an item"""
    print("\n🧪 Testing: Equip Item")
    
    response = requests.post(
        f"{BASE_URL}/api/inventory/characters/{character_id}/items/{item_id}/equip"
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Equipped: {result['item']['name']}")
    else:
        print(f"❌ Error: {response.text}")


def test_add_magical_item(character_id):
    """Test adding a magical item"""
    print("\n🧪 Testing: Add Magical Item")
    
    item_data = {
        "name": "Ring of Protection",
        "description": "+1 bonus to AC and saving throws",
        "item_type": "wondrous",
        "rarity": "rare",
        "weight": 0.0,
        "value": 3500,
        "quantity": 1,
        "equippable": True,
        "equipment_slot": "ring_1",
        "is_magical": True,
        "requires_attunement": True,
        "properties": ["+1 AC", "+1 Saves"],
        "notes": "Found in the dragon's hoard"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/inventory/characters/{character_id}/items",
        json=item_data
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        item = response.json()
        print(f"✅ Added: {item['name']} (Magical: {item['is_magical']})")
        return item['id']
    else:
        print(f"❌ Error: {response.text}")
        return None


def test_attune_item(character_id, item_id):
    """Test attuning to an item"""
    print("\n🧪 Testing: Attune to Item")
    
    response = requests.post(
        f"{BASE_URL}/api/inventory/characters/{character_id}/items/{item_id}/attune"
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Attuned to: {result['item']['name']}")
    else:
        print(f"❌ Error: {response.text}")


def test_inventory_summary(character_id):
    """Test getting inventory summary"""
    print("\n🧪 Testing: Inventory Summary")
    
    response = requests.get(
        f"{BASE_URL}/api/inventory/characters/{character_id}/summary"
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        summary = response.json()
        print(f"✅ Summary:")
        print(f"   Total Items: {summary['total_items']}")
        print(f"   Total Weight: {summary['total_weight']} lbs")
        print(f"   Total Value: {summary['total_value']} gp")
        print(f"   Equipped Items: {summary['equipped_items']}")
        print(f"   Attuned Items: {summary['attuned_items']}")
        print(f"   By Type: {summary['by_type']}")
        print(f"   By Rarity: {summary['by_rarity']}")
    else:
        print(f"❌ Error: {response.text}")


def main():
    """Run all tests"""
    print("="*60)
    print("🎒 INVENTORY SYSTEM TESTS")
    print("="*60)
    
    try:
        # Test adding items
        item_id = test_add_item()
        
        # Test getting inventory
        test_get_inventory(CHARACTER_ID)
        
        # Test equipping
        if item_id:
            test_equip_item(CHARACTER_ID, item_id)
        
        # Test magical item
        magical_item_id = test_add_magical_item(CHARACTER_ID)
        
        # Test attunement
        if magical_item_id:
            test_attune_item(CHARACTER_ID, magical_item_id)
        
        # Test summary
        test_inventory_summary(CHARACTER_ID)
        
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
