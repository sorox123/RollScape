"""
Test script for DM Agent.
Tests the AI Dungeon Master functionality.
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000"


def print_section(title):
    """Print a formatted section header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")


def test_dm_availability():
    """Test if DM agent is available"""
    print_section("Testing DM Availability")
    
    response = requests.get(f"{BASE_URL}/api/dm/test")
    result = response.json()
    
    print(f"Status: {response.status_code}")
    print(f"Available: {result['dm_available']}")
    print(f"Message: {result['message']}")
    
    if not result['dm_available']:
        print("\n⚠️  OpenAI API key not configured!")
        print("Set OPENAI_API_KEY in your .env file to test the DM Agent.")
        return False
    
    return True


def test_start_campaign():
    """Test campaign opening generation"""
    print_section("Starting New Campaign")
    
    payload = {
        "campaign_name": "The Lost Mines of Phandelver",
        "setting": "fantasy",
        "personality": "storytelling"
    }
    
    print(f"Campaign: {payload['campaign_name']}")
    print(f"Setting: {payload['setting']}")
    print(f"DM Style: {payload['personality']}\n")
    
    response = requests.post(f"{BASE_URL}/api/dm/start-campaign", json=payload)
    
    if response.status_code == 200:
        result = response.json()
        print("Opening Scene:")
        print(f"\n{result['opening_narrative']}\n")
        return True
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.json())
        return False


def test_player_action():
    """Test DM response to player action"""
    print_section("Player Action Response")
    
    payload = {
        "player_input": "I approach the old tavern and push open the heavy wooden door.",
        "campaign_name": "The Lost Mines",
        "current_location": "Phandalin Village"
    }
    
    print(f"Player says: \"{payload['player_input']}\"\n")
    
    response = requests.post(f"{BASE_URL}/api/dm/respond", json=payload)
    
    if response.status_code == 200:
        result = response.json()
        print("DM responds:")
        print(f"\n{result['narrative']}\n")
        
        if result.get('requires_roll'):
            print(f"🎲 Requires: {result['requires_roll']}")
        
        if result.get('combat_initiated'):
            print(f"⚔️  Combat initiated!")
        
        return True
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.json())
        return False


def test_npc_generation():
    """Test NPC generation"""
    print_section("Generating NPC")
    
    payload = {
        "npc_name": "Thaddeus Grimbrook",
        "npc_role": "mysterious tavern keeper"
    }
    
    print(f"Creating NPC: {payload['npc_name']}")
    print(f"Role: {payload['npc_role']}\n")
    
    response = requests.post(
        f"{BASE_URL}/api/dm/generate-npc",
        params=payload
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"{result['description']}\n")
        return True
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.json())
        return False


def test_encounter_generation():
    """Test combat encounter generation"""
    print_section("Generating Combat Encounter")
    
    payload = {
        "party_level": 3,
        "difficulty": "medium"
    }
    
    print(f"Party Level: {payload['party_level']}")
    print(f"Difficulty: {payload['difficulty']}\n")
    
    response = requests.post(
        f"{BASE_URL}/api/dm/generate-encounter",
        params=payload
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"{result['encounter']}\n")
        return True
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.json())
        return False


def test_conversation_flow():
    """Test multi-turn conversation"""
    print_section("Testing Conversation Flow")
    
    # Clear history first
    requests.post(f"{BASE_URL}/api/dm/clear-history")
    print("Conversation history cleared\n")
    
    # Series of player actions
    actions = [
        "I walk up to the bar and order an ale.",
        "I ask the bartender if he's heard any rumors lately.",
        "I offer to help with whatever troubles the town."
    ]
    
    for i, action in enumerate(actions, 1):
        print(f"Turn {i}:")
        print(f"Player: \"{action}\"")
        
        response = requests.post(
            f"{BASE_URL}/api/dm/respond",
            json={
                "player_input": action,
                "campaign_name": "Test Campaign"
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"DM: \"{result['narrative'][:200]}...\"\n")
        else:
            print(f"❌ Error: {response.status_code}\n")
            return False
    
    # Check history
    response = requests.get(f"{BASE_URL}/api/dm/history")
    if response.status_code == 200:
        history = response.json()
        print(f"✅ Conversation history contains {len(history)} messages")
        return True
    
    return False


def main():
    """Run all tests"""
    print("\n🎲 RollScape DM Agent Test Suite 🎲")
    
    try:
        # Test availability first
        if not test_dm_availability():
            print("\n⚠️  Skipping remaining tests (API key required)")
            return
        
        # Run all tests
        tests = [
            test_start_campaign,
            test_player_action,
            test_npc_generation,
            test_encounter_generation,
            test_conversation_flow
        ]
        
        results = []
        for test in tests:
            try:
                results.append(test())
            except Exception as e:
                print(f"\n❌ Test failed with error: {e}\n")
                results.append(False)
        
        # Summary
        print_section("Test Summary")
        passed = sum(results)
        total = len(results)
        
        print(f"Passed: {passed}/{total}")
        
        if passed == total:
            print("✅ All tests passed!")
        else:
            print(f"⚠️  {total - passed} test(s) failed")
    
    except requests.exceptions.ConnectionError:
        print("\n❌ Cannot connect to server at http://127.0.0.1:8000")
        print("Make sure the FastAPI server is running: uvicorn main:app --reload")


if __name__ == "__main__":
    main()
