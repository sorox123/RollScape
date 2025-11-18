"""
Test script for RollScape dice rolling API.
Demonstrates all dice rolling features.
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def print_result(title, result):
    """Pretty print test results"""
    print(f"\n{'='*60}")
    print(f"🎲 {title}")
    print(f"{'='*60}")
    print(json.dumps(result, indent=2))


def test_simple_roll():
    """Test basic dice roll"""
    response = requests.get(f"{BASE_URL}/api/dice/roll/2d20")
    print_result("Simple Roll: 2d20", response.json())


def test_roll_with_modifier():
    """Test roll with modifier"""
    response = requests.get(f"{BASE_URL}/api/dice/roll/1d6+3")
    print_result("Roll with Modifier: 1d6+3", response.json())


def test_advantage():
    """Test advantage roll"""
    response = requests.post(
        f"{BASE_URL}/api/dice/roll",
        json={"notation": "1d20+5", "advantage": True}
    )
    print_result("Advantage Roll: 1d20+5 with advantage", response.json())


def test_disadvantage():
    """Test disadvantage roll"""
    response = requests.post(
        f"{BASE_URL}/api/dice/roll",
        json={"notation": "1d20+2", "disadvantage": True}
    )
    print_result("Disadvantage Roll: 1d20+2 with disadvantage", response.json())


def test_keep_highest():
    """Test keep highest (stat rolling)"""
    response = requests.get(f"{BASE_URL}/api/dice/roll/4d6kh3")
    print_result("Keep Highest 3: 4d6kh3 (stat rolling)", response.json())


def test_ability_check():
    """Test ability check"""
    response = requests.post(
        f"{BASE_URL}/api/dice/roll/ability?modifier=5&advantage=true"
    )
    print_result("Ability Check: +5 modifier with advantage", response.json())


def test_attack_roll():
    """Test attack roll"""
    response = requests.post(
        f"{BASE_URL}/api/dice/roll/attack?attack_bonus=7&damage_dice=1d8+3&advantage=false"
    )
    result = response.json()
    print_result("Attack Roll: +7 to hit, 1d8+3 damage", result)
    
    print(f"\n📊 Attack Summary:")
    print(f"   To Hit: {result['attack']['total']} {'⚡ CRITICAL!' if result['is_critical'] else '❌ FUMBLE!' if result['is_fumble'] else ''}")
    print(f"   Damage: {result['damage']['total']}")


def test_multiple_dice():
    """Test rolling multiple different dice"""
    print(f"\n{'='*60}")
    print("🎲 Multiple Different Rolls")
    print(f"{'='*60}")
    
    rolls = [
        ("1d4", "Dagger damage"),
        ("1d6", "Shortbow damage"),
        ("1d8", "Longsword damage"),
        ("1d10", "Pike damage"),
        ("1d12", "Greataxe damage"),
        ("2d6", "Greatsword damage"),
        ("8d6", "Fireball damage!")
    ]
    
    for notation, description in rolls:
        response = requests.get(f"{BASE_URL}/api/dice/roll/{notation}")
        result = response.json()
        print(f"\n{description:.<40} {result['total']}")


def run_all_tests():
    """Run all dice tests"""
    print("\n" + "="*60)
    print("🎲 RollScape Dice Rolling System Test Suite")
    print("="*60)
    
    try:
        test_simple_roll()
        test_roll_with_modifier()
        test_advantage()
        test_disadvantage()
        test_keep_highest()
        test_ability_check()
        test_attack_roll()
        test_multiple_dice()
        
        print(f"\n{'='*60}")
        print("✅ All tests completed successfully!")
        print(f"{'='*60}\n")
        
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Could not connect to server.")
        print("Make sure the server is running: python -m uvicorn main:app")
    except Exception as e:
        print(f"\n❌ Error: {e}")


if __name__ == "__main__":
    run_all_tests()
