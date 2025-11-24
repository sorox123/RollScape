"""
Test session recap API endpoints.
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_session_recap():
    """Test session recap generation and retrieval"""
    print("\n" + "="*60)
    print("TESTING SESSION RECAP API")
    print("="*60)
    
    # Mock session ID
    session_id = "test-session-123"
    
    # Test 1: Try to get recap (should fail - doesn't exist yet)
    print("\n1. Getting recap (should not exist)...")
    response = requests.get(f"{BASE_URL}/api/session/{session_id}/recap")
    print(f"Status: {response.status_code}")
    if response.status_code == 404:
        print("✓ No recap exists yet (expected)")
    else:
        print(f"Response: {response.json()}")
    
    # Test 2: Generate recap
    print("\n2. Generating session recap...")
    response = requests.post(f"{BASE_URL}/api/session/{session_id}/recap/generate")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("✓ Recap generated successfully!")
        recap = data.get('recap', {})
        
        print(f"\nRecap Summary:")
        print(f"- Recap text length: {len(recap.get('recap_text', ''))} characters")
        print(f"- Key events: {len(recap.get('key_events', []))} events")
        print(f"- NPCs met: {len(recap.get('npcs_met', []))} NPCs")
        print(f"- Locations: {len(recap.get('locations_visited', []))} locations")
        print(f"- Decisions: {len(recap.get('decisions_made', []))} decisions")
        print(f"- Combats: {len(recap.get('combat_encounters', []))} encounters")
        
        print(f"\nRecap Text Preview:")
        print(recap.get('recap_text', 'N/A')[:200] + "...")
        
        if recap.get('key_events'):
            print(f"\nKey Events:")
            for i, event in enumerate(recap['key_events'][:3], 1):
                print(f"  {i}. {event}")
        
        if recap.get('npcs_met'):
            print(f"\nNPCs Met:")
            for npc in recap['npcs_met']:
                print(f"  - {npc}")
    else:
        print(f"✗ Error: {response.json()}")
        return
    
    # Test 3: Get recap (should exist now)
    print("\n3. Retrieving recap...")
    response = requests.get(f"{BASE_URL}/api/session/{session_id}/recap")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("✓ Recap retrieved successfully!")
        print(f"Generated at: {data.get('generated_at', 'N/A')}")
    else:
        print(f"✗ Error: {response.json()}")
        return
    
    # Test 4: Update recap
    print("\n4. Updating recap...")
    update_data = {
        "key_events": ["Updated event 1", "Updated event 2"],
        "npcs_met": ["Updated NPC"]
    }
    response = requests.patch(
        f"{BASE_URL}/api/session/{session_id}/recap",
        json=update_data
    )
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("✓ Recap updated successfully!")
        recap = data.get('recap', {})
        print(f"Updated key events: {recap.get('key_events')}")
        print(f"Updated NPCs: {recap.get('npcs_met')}")
    else:
        print(f"✗ Error: {response.json()}")
    
    # Test 5: Regenerate recap
    print("\n5. Regenerating recap...")
    response = requests.post(f"{BASE_URL}/api/session/{session_id}/recap/generate")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        print("✓ Recap regenerated successfully!")
    else:
        print(f"✗ Error: {response.json()}")
    
    # Test 6: Delete recap
    print("\n6. Deleting recap...")
    response = requests.delete(f"{BASE_URL}/api/session/{session_id}/recap")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        print("✓ Recap deleted successfully!")
    else:
        print(f"✗ Error: {response.json()}")
    
    # Verify deletion
    print("\n7. Verifying deletion...")
    response = requests.get(f"{BASE_URL}/api/session/{session_id}/recap")
    print(f"Status: {response.status_code}")
    if response.status_code == 404:
        print("✓ Recap no longer exists (expected)")
    else:
        print(f"✗ Unexpected: {response.json()}")
    
    print("\n" + "="*60)
    print("SESSION RECAP TESTS COMPLETE")
    print("="*60 + "\n")


if __name__ == "__main__":
    try:
        test_session_recap()
    except requests.exceptions.ConnectionError:
        print("\n✗ ERROR: Could not connect to backend server.")
        print("Make sure the server is running on http://localhost:8000")
    except Exception as e:
        print(f"\n✗ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
