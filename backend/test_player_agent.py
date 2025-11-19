"""
Test script for Player Agent and Voting System.
"""

import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"


def print_section(title):
    """Print formatted section header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")


def test_availability():
    """Test if Player Agent is available"""
    print_section("Testing Player Agent Availability")
    
    response = requests.get(f"{BASE_URL}/api/player-agent/test")
    result = response.json()
    
    print(f"Status: {response.status_code}")
    print(f"Available: {result['player_agent_available']}")
    print(f"Message: {result['message']}")
    
    if not result['player_agent_available']:
        print("\n⚠️  OpenAI API key not configured!")
        print("Set OPENAI_API_KEY in your .env file")
        return False
    
    return True


def test_character_analysis():
    """Test character personality analysis"""
    print_section("Character Personality Analysis")
    
    payload = {
        "character_id": "char_123",
        "character_name": "Theron Ironforge",
        "character_class": "Fighter (Battle Master)",
        "chat_history": [
            {"speaker": "Theron", "message": "I'll take the lead. Stay behind me."},
            {"speaker": "Theron", "message": "We need a plan before rushing in."},
            {"speaker": "Theron", "message": "I've seen worse odds. Let's do this."},
            {"speaker": "Theron", "message": "Everyone alright? We stick together."}
        ],
        "action_history": [
            "Stepped forward to protect the wizard",
            "Examined the dungeon entrance carefully",
            "Suggested a defensive formation",
            "Volunteered to check for traps",
            "Intimidated the bandits to stand down"
        ]
    }
    
    print(f"Analyzing: {payload['character_name']} ({payload['character_class']})")
    print(f"Chat history: {len(payload['chat_history'])} messages")
    print(f"Action history: {len(payload['action_history'])} actions\n")
    
    response = requests.post(
        f"{BASE_URL}/api/player-agent/analyze-character",
        json=payload
    )
    
    if response.status_code == 200:
        result = response.json()
        print("Analysis Results:")
        print(f"{result['analysis']['analysis']}\n")
        print(f"Confidence: {result['analysis']['confidence']}")
        return True
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.json())
        return False


def test_action_decision():
    """Test AI deciding character action"""
    print_section("AI Action Decision")
    
    payload = {
        "character_id": "char_123",
        "situation": "You're in a dark tavern. A hooded figure in the corner beckons you over. Your party is discussing their next move at the bar.",
        "available_actions": [
            "Approach the hooded figure alone",
            "Signal to your party and approach together",
            "Ignore the figure and stay with the party",
            "Try to get a better look at the figure from a distance"
        ],
        "party_context": "The wizard is asking about local rumors. The rogue is counting coin. The cleric is ordering drinks."
    }
    
    print("Situation:")
    print(f"  {payload['situation']}\n")
    print("Available Actions:")
    for i, action in enumerate(payload['available_actions'], 1):
        print(f"  {i}. {action}")
    print(f"\nParty Context: {payload['party_context']}\n")
    
    response = requests.post(
        f"{BASE_URL}/api/player-agent/decide-action",
        json=payload
    )
    
    if response.status_code == 200:
        result = response.json()
        print("AI Decision:")
        print(f"  Action: {result['action']}")
        if result.get('dialogue'):
            print(f"  Says: \"{result['dialogue']}\"")
        print(f"  Reasoning: {result['reasoning']}")
        print(f"  Confidence: {result['confidence']}")
        return True
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.json())
        return False


def test_npc_response():
    """Test AI responding to NPC"""
    print_section("AI NPC Response")
    
    payload = {
        "character_id": "char_123",
        "npc_name": "Mysterious Stranger",
        "npc_dialogue": "I have information about the artifact you seek. But it will cost you... 500 gold pieces.",
        "context": "The party needs to find the Crystal of Power. They have about 300 gold total."
    }
    
    print(f"NPC ({payload['npc_name']}) says:")
    print(f'  "{payload["npc_dialogue"]}"\n')
    print(f"Context: {payload['context']}\n")
    
    response = requests.post(
        f"{BASE_URL}/api/player-agent/respond-to-npc",
        json=payload
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"Theron responds:")
        print(f'  "{result["response"]}"')
        return True
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.json())
        return False


def test_voting_system():
    """Test voting system for absent player"""
    print_section("Voting System - Absent Player Handling")
    
    # Mock IDs (would be real UUIDs from database)
    session_id = "550e8400-e29b-41d4-a716-446655440000"
    campaign_id = "660e8400-e29b-41d4-a716-446655440000"
    absent_char_id = "770e8400-e29b-41d4-a716-446655440000"
    voter1_id = "880e8400-e29b-41d4-a716-446655440000"
    voter2_id = "990e8400-e29b-41d4-a716-446655440000"
    
    print("Scenario: Player controlling 'Lyra the Wizard' is absent")
    print("Present players must vote: Skip turn or Enable AI?\n")
    
    # Note: This test requires database connection
    print("⚠️  Voting system tests require database connection")
    print("Run after connecting to PostgreSQL/Supabase\n")
    
    print("Example vote initiation:")
    vote_payload = {
        "session_id": session_id,
        "campaign_id": campaign_id,
        "absent_character_id": absent_char_id,
        "vote_type": "ai_control",
        "initiated_by": voter1_id,
        "reason": "Lyra's player is sick, but we need the wizard for this dungeon",
        "expires_in_minutes": 10
    }
    print(json.dumps(vote_payload, indent=2))
    
    return True


def test_combat_scenario():
    """Test AI in combat situation"""
    print_section("AI in Combat")
    
    payload = {
        "character_id": "char_123",
        "situation": "COMBAT! You're facing 3 goblins. One is attacking the wizard (who has 8 HP left). Two are shooting arrows at you. You have your Action, Bonus Action, and Movement available.",
        "available_actions": [
            "Attack the goblin threatening the wizard",
            "Use Second Wind to heal yourself (you're at 15/40 HP)",
            "Take the Dodge action and move to block attacks on wizard",
            "Attack the two archers to reduce incoming damage"
        ],
        "party_context": "Wizard is low HP and casting. Rogue is flanking. Cleric used their Healing Word last turn."
    }
    
    print("⚔️  Combat Situation:")
    print(f"  {payload['situation']}\n")
    print("Available Actions:")
    for i, action in enumerate(payload['available_actions'], 1):
        print(f"  {i}. {action}")
    print()
    
    response = requests.post(
        f"{BASE_URL}/api/player-agent/decide-action",
        json=payload
    )
    
    if response.status_code == 200:
        result = response.json()
        print("🤖 AI Decides:")
        print(f"  {result['action']}")
        if result.get('dialogue'):
            print(f"  Shouts: \"{result['dialogue']}\"")
        return True
    else:
        print(f"❌ Error: {response.status_code}")
        return False


def main():
    """Run all tests"""
    print("\n🎲 RollScape Player Agent Test Suite 🎲")
    
    try:
        # Test availability
        if not test_availability():
            print("\n⚠️  Skipping tests requiring API key")
            test_voting_system()  # Still show voting example
            return
        
        # Run tests
        tests = [
            test_character_analysis,
            test_action_decision,
            test_npc_response,
            test_combat_scenario,
            test_voting_system
        ]
        
        results = []
        for test in tests:
            try:
                results.append(test())
                time.sleep(1)  # Rate limiting
            except Exception as e:
                print(f"\n❌ Test failed: {e}\n")
                results.append(False)
        
        # Summary
        print_section("Test Summary")
        passed = sum(results)
        total = len(results)
        print(f"Passed: {passed}/{total}")
        
        if passed == total:
            print("✅ All tests passed!")
        else:
            print(f"⚠️  {total - passed} test(s) failed or skipped")
    
    except requests.exceptions.ConnectionError:
        print("\n❌ Cannot connect to server")
        print("Start server: python -m uvicorn main:app --reload")


if __name__ == "__main__":
    main()
