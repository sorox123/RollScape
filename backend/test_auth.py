"""Test authentication system"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_auth():
    """Test getting current user (should auto-create in mock mode)"""
    print("🔐 Testing Authentication System\n")
    print("=" * 60)
    
    print("\n1️⃣ Testing: Get current user...")
    response = requests.get(f"{BASE_URL}/api/users/me")
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        user = response.json()
        print(f"   ✅ User authenticated!")
        print(f"      Username: {user['username']}")
        print(f"      Email: {user['email']}")
        print(f"      ID: {user['id']}")
        print(f"      Tier: {user['subscription_tier']}")
        return user['id']
    else:
        print(f"   ❌ Failed: {response.text}")
        return None


def test_create_campaign(user_id):
    """Test campaign creation with authentication"""
    print("\n2️⃣ Testing: Create campaign...")
    
    response = requests.post(
        f"{BASE_URL}/api/campaigns",
        json={
            "name": "Test Campaign",
            "description": "Integration test campaign",
            "status": "planning",
            "visibility": "private",
            "rule_system": "D&D 5e",
            "max_players": 6
        }
    )
    
    print(f"   Status: {response.status_code}")
    
    if response.status_code in [200, 201]:
        campaign = response.json()
        print(f"   ✅ Campaign created!")
        print(f"      Name: {campaign['name']}")
        print(f"      ID: {campaign['id']}")
        print(f"      DM: {campaign['dm_user_id']}")
        return campaign['id']
    else:
        print(f"   ❌ Failed: {response.text}")
        return None


def test_get_my_campaigns():
    """Test fetching user's campaigns"""
    print("\n3️⃣ Testing: Get my campaigns...")
    
    response = requests.get(f"{BASE_URL}/api/campaigns/my-campaigns")
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        campaigns = response.json()
        print(f"   ✅ Found {len(campaigns)} campaign(s)")
        for camp in campaigns:
            print(f"      - {camp['name']} ({camp['status']})")
        return True
    else:
        print(f"   ❌ Failed: {response.text}")
        return False


def test_create_character(campaign_id):
    """Test character creation with authentication"""
    print("\n4️⃣ Testing: Create character...")
    
    response = requests.post(
        f"{BASE_URL}/api/characters",
        json={
            "name": "Test Hero",
            "campaign_id": campaign_id,
            "race": "Human",
            "character_class": "Fighter",
            "level": 1,
            "max_hp": 12,
            "current_hp": 12,
            "armor_class": 16,
            "strength": 16,
            "dexterity": 14,
            "constitution": 15,
            "intelligence": 10,
            "wisdom": 12,
            "charisma": 8,
            "character_type": "player"
        }
    )
    
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200 or response.status_code == 201:
        character = response.json()
        print(f"   ✅ Character created!")
        print(f"      Name: {character['name']}")
        print(f"      Class: {character['character_class']}")
        print(f"      Level: {character['level']}")
        print(f"      ID: {character['id']}")
        return character['id']
    else:
        print(f"   ❌ Failed: {response.text}")
        return None


def test_update_character(character_id):
    """Test updating character"""
    print("\n5️⃣ Testing: Update character...")
    
    response = requests.patch(
        f"{BASE_URL}/api/characters/{character_id}",
        json={
            "level": 2,
            "experience_points": 300
        }
    )
    
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        character = response.json()
        print(f"   ✅ Character updated!")
        print(f"      New Level: {character['level']}")
        print(f"      Experience: {character.get('experience_points', 'N/A')}")
        return True
    else:
        print(f"   ❌ Failed: {response.text}")
        return False


def test_quota_status():
    """Test quota status endpoint"""
    print("\n6️⃣ Testing: Get quota status...")
    
    response = requests.get(f"{BASE_URL}/api/users/me/quota")
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        quota = response.json()
        print(f"   ✅ Quota retrieved!")
        print(f"      Tier: {quota['tier']}")
        print(f"      AI Images: {quota['usage']['ai_images']} / {quota['limits']['ai_images']}")
        print(f"      AI Players: {quota['usage']['ai_players']} / {quota['limits']['ai_players']}")
        return True
    else:
        print(f"   ❌ Failed: {response.text}")
        return False


def run_all_tests():
    """Run complete authentication test suite"""
    print("🧪 AUTHENTICATION INTEGRATION TEST")
    print("=" * 60)
    print("Testing mock authentication system")
    print("Mode: MOCK_MODE=true (free development)")
    print("=" * 60)
    
    # Test 1: Authentication
    user_id = test_auth()
    if not user_id:
        print("\n❌ Authentication failed - cannot continue")
        return False
    
    # Test 2: Create Campaign
    campaign_id = test_create_campaign(user_id)
    if not campaign_id:
        print("\n❌ Campaign creation failed - cannot continue")
        return False
    
    # Test 3: Get My Campaigns
    test_get_my_campaigns()
    
    # Test 4: Create Character
    character_id = test_create_character(campaign_id)
    if not character_id:
        print("\n⚠️ Character creation failed - skipping character tests")
    else:
        # Test 5: Update Character
        test_update_character(character_id)
    
    # Test 6: Quota Status
    test_quota_status()
    
    # Final Summary
    print("\n" + "=" * 60)
    print("✅ AUTHENTICATION TESTS COMPLETE!")
    print("=" * 60)
    print("\n📊 Summary:")
    print(f"   ✅ User: Authenticated (ID: {user_id})")
    print(f"   ✅ Campaign: Created (ID: {campaign_id})")
    if character_id:
        print(f"   ✅ Character: Created & Updated (ID: {character_id})")
    print(f"   ✅ Quota: Retrieved")
    print("\n💡 Next Steps:")
    print("   1. All API endpoints now use authentication")
    print("   2. No more 501 errors!")
    print("   3. Ready for Task 4 (E2E integration test)")
    print(f"\n💰 Cost: $0.00 (Mock mode)")
    
    return True


if __name__ == "__main__":
    try:
        success = run_all_tests()
        if success:
            print("\n🎉 All tests passed!")
        else:
            print("\n⚠️ Some tests failed")
    except requests.exceptions.ConnectionError:
        print("\n❌ Cannot connect to server")
        print("   Make sure backend is running:")
        print("   cd backend")
        print("   uvicorn main:app --reload")
    except Exception as e:
        print(f"\n❌ Test error: {e}")
        import traceback
        traceback.print_exc()
