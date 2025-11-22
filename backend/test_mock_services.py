"""
Test Mock Services - Verify everything works for FREE!

Run this to test all mock services without spending any money.
"""

import asyncio
from services.mock_openai_service import get_mock_openai_service
from services.mock_dalle_service import get_mock_dalle_service
from services.mock_redis_service import get_mock_redis_service


def print_header(title):
    """Print formatted header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")


async def test_dm_service():
    """Test mock DM/OpenAI service"""
    print_header("Testing Mock DM Service")
    
    dm = get_mock_openai_service()
    
    # Test campaign opening
    print("1. Generating campaign opening...")
    opening = await dm.generate_campaign_opening("Test Adventure", "fantasy")
    print(f"   ✅ Generated {len(opening)} characters")
    print(f"   Preview: {opening[:100]}...")
    
    # Test player interaction
    print("\n2. Testing player interaction...")
    response = await dm.generate_dm_response("I enter the tavern")
    print(f"   ✅ Narrative: {response['narrative'][:100]}...")
    print(f"   Requires roll: {response['requires_roll']}")
    
    # Test NPC generation
    print("\n3. Generating NPC...")
    npc = await dm.generate_npc_description("Thorin", "dwarf blacksmith")
    print(f"   ✅ Generated: {npc[:80]}...")
    
    # Test encounter
    print("\n4. Generating encounter...")
    encounter = await dm.generate_encounter(5, "medium")
    print(f"   ✅ Encounter: {encounter[:100]}...")
    
    # Show stats
    print("\n5. Service Statistics:")
    stats = dm.get_stats()
    for key, value in stats.items():
        print(f"   {key}: {value}")
    
    return True


async def test_image_service():
    """Test mock DALL-E service"""
    print_header("Testing Mock Image Service")
    
    dalle = get_mock_dalle_service()
    
    # Test character portrait
    print("1. Generating character portrait...")
    char_img = await dalle.generate_character_portrait(
        "Aragorn", "Human", "Ranger", "Tall, dark-haired ranger"
    )
    print(f"   ✅ Image URL: {char_img['image_url']}")
    print(f"   Cost: ${char_img['cost']} (Free!)")
    
    # Test battle map
    print("\n2. Generating battle map...")
    map_img = await dalle.generate_battle_map(
        "dungeon", "30x40", "stone corridor", "square"
    )
    print(f"   ✅ Map URL: {map_img['image_url']}")
    print(f"   Dimensions: {map_img['dimensions']}")
    print(f"   Grid: {map_img['grid_type']}")
    
    # Test NPC portrait
    print("\n3. Generating NPC portrait...")
    npc_img = await dalle.generate_npc_portrait(
        "Gandalf", "wizard", "Wise old wizard with grey beard"
    )
    print(f"   ✅ NPC Image: {npc_img['image_url']}")
    
    # Test item image
    print("\n4. Generating item image...")
    item_img = await dalle.generate_item_image(
        "Flaming Sword", "weapon", "legendary"
    )
    print(f"   ✅ Item Image: {item_img['image_url']}")
    
    # Show stats
    print("\n5. Service Statistics:")
    stats = dalle.get_stats()
    for key, value in stats.items():
        print(f"   {key}: {value}")
    
    return True


async def test_redis_service():
    """Test mock Redis service"""
    print_header("Testing Mock Redis Service")
    
    redis = get_mock_redis_service()
    
    # Test basic set/get
    print("1. Testing basic set/get...")
    await redis.set("test_key", "test_value")
    value = await redis.get("test_key")
    print(f"   ✅ Stored and retrieved: {value}")
    
    # Test expiration
    print("\n2. Testing expiration...")
    await redis.setex("expire_key", 5, "expires_soon")
    ttl = await redis.ttl("expire_key")
    print(f"   ✅ Set with 5 second expiry, TTL: {ttl}s")
    
    # Test hash operations
    print("\n3. Testing hash operations...")
    await redis.hset("user:123", "name", "John Doe")
    await redis.hset("user:123", "level", 5)
    user_data = await redis.hgetall("user:123")
    print(f"   ✅ Hash data: {user_data}")
    
    # Test exists
    print("\n4. Testing key existence...")
    exists = await redis.exists("test_key")
    print(f"   ✅ Key exists: {exists}")
    
    # Show stats
    print("\n5. Service Statistics:")
    stats = redis.get_stats()
    for key, value in stats.items():
        print(f"   {key}: {value}")
    
    return True


async def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("  🎮 RollScape Mock Services Test Suite")
    print("  Testing FREE development mode - NO API COSTS!")
    print("="*60)
    
    results = []
    
    try:
        # Test all services
        results.append(await test_dm_service())
        results.append(await test_image_service())
        results.append(await test_redis_service())
        
        # Summary
        print_header("Test Summary")
        
        if all(results):
            print("✅ ALL TESTS PASSED!")
            print("\n🎉 Your mock services are working perfectly!")
            print("💰 Total cost: $0.00")
            print("\n✨ You can now build features without spending money!")
            print("📝 Keep MOCK_MODE=true in your .env file")
        else:
            print("❌ Some tests failed")
            print("Check the errors above")
    
    except Exception as e:
        print(f"\n❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    print("\n🚀 Starting mock service tests...\n")
    asyncio.run(main())
