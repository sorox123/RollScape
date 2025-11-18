"""
DM Agent Example - How to use the DM Agent

This script demonstrates the DM Agent capabilities.
To actually run it, you need to set OPENAI_API_KEY in your .env file.
"""

from agents.dm_agent import DMAgent, DMPersonality, GameContext


def example_basic_usage():
    """Basic DM usage example"""
    print("="*60)
    print("Example 1: Basic DM Response")
    print("="*60)
    
    # Initialize DM Agent
    dm = DMAgent(personality=DMPersonality.STORYTELLING)
    
    # Player action
    player_input = "I push open the tavern door and step inside."
    
    # Get DM response
    response = dm.respond_sync(player_input)
    
    print(f"\nPlayer: {player_input}")
    print(f"\nDM: {response.narrative}")
    
    if response.requires_roll:
        print(f"\n🎲 The DM requests a {response.requires_roll}")


def example_with_context():
    """Using game context"""
    print("\n\n" + "="*60)
    print("Example 2: DM with Game Context")
    print("="*60)
    
    dm = DMAgent(personality=DMPersonality.TACTICAL)
    
    # Set up game context
    context = GameContext(
        campaign_name="The Lost Mines of Phandelver",
        current_location="Phandalin Village - Stonehill Inn",
        active_characters=["Theron (Fighter)", "Lyra (Wizard)", "Pip (Rogue)"],
        recent_events=[
            "Party arrived in Phandalin",
            "Heard rumors about missing supplies",
            "Met Sildar Hallwinter"
        ],
        quest_objectives=[
            "Find Gundren Rockseeker",
            "Investigate the Redbrand ruffians"
        ]
    )
    
    player_input = "I ask the innkeeper about the Redbrand gang."
    
    response = dm.respond_sync(player_input, context)
    
    print(f"\nContext:")
    print(f"  Campaign: {context.campaign_name}")
    print(f"  Location: {context.current_location}")
    print(f"  Party: {', '.join(context.active_characters)}")
    
    print(f"\nPlayer: {player_input}")
    print(f"\nDM: {response.narrative}")


def example_campaign_start():
    """Starting a new campaign"""
    print("\n\n" + "="*60)
    print("Example 3: Starting a New Campaign")
    print("="*60)
    
    dm = DMAgent(personality=DMPersonality.BALANCED)
    
    opening = dm.start_campaign(
        campaign_name="Curse of Strahd",
        setting="gothic horror"
    )
    
    print(f"\nCampaign: Curse of Strahd")
    print(f"Setting: Gothic Horror")
    print(f"\nOpening Scene:\n{opening}")


def example_npc_generation():
    """Generating NPCs"""
    print("\n\n" + "="*60)
    print("Example 4: NPC Generation")
    print("="*60)
    
    dm = DMAgent(personality=DMPersonality.HUMOROUS)
    
    npc = dm.describe_npc("Barnaby Stoutbrew", "jovial dwarven blacksmith")
    
    print(f"\nNPC Description:\n{npc}")


def example_encounter():
    """Generating encounters"""
    print("\n\n" + "="*60)
    print("Example 5: Combat Encounter Generation")
    print("="*60)
    
    dm = DMAgent(personality=DMPersonality.TACTICAL)
    
    encounter = dm.generate_encounter(party_level=5, difficulty="hard")
    
    print(f"\nLevel 5 Party - Hard Difficulty")
    print(f"\n{encounter}")


def example_personality_differences():
    """Different DM personalities"""
    print("\n\n" + "="*60)
    print("Example 6: DM Personality Styles")
    print("="*60)
    
    scenario = "A massive dragon lands in front of the party, its eyes glowing with rage."
    
    personalities = [
        DMPersonality.STORYTELLING,
        DMPersonality.TACTICAL,
        DMPersonality.HUMOROUS,
        DMPersonality.SERIOUS
    ]
    
    print(f"\nScenario: {scenario}\n")
    
    for personality in personalities:
        dm = DMAgent(personality=personality, temperature=0.7)
        response = dm.respond_sync(f"How does the party react? {scenario}")
        
        print(f"\n{personality.upper()} DM:")
        print(f"{response.narrative[:200]}...")
        
        dm.clear_history()


def main():
    """
    Run all examples.
    
    NOTE: You need to set OPENAI_API_KEY in your .env file to run this!
    """
    print("\n🎲 RollScape DM Agent Examples 🎲\n")
    print("These examples show how to use the DM Agent.")
    print("To run them, set OPENAI_API_KEY in your .env file.\n")
    
    try:
        # Check if API key is set
        import os
        from dotenv import load_dotenv
        
        load_dotenv()
        
        if not os.getenv("OPENAI_API_KEY"):
            print("⚠️  OPENAI_API_KEY not found in .env file")
            print("\nTo run these examples:")
            print("1. Get an API key from https://platform.openai.com")
            print("2. Add it to your .env file: OPENAI_API_KEY=your_key_here")
            print("3. Run this script again")
            return
        
        # Run examples
        example_basic_usage()
        example_with_context()
        example_campaign_start()
        example_npc_generation()
        example_encounter()
        example_personality_differences()
        
        print("\n\n" + "="*60)
        print("✅ All examples completed!")
        print("="*60)
    
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nMake sure:")
        print("- OpenAI API key is valid")
        print("- You have internet connection")
        print("- Dependencies are installed: pip install langchain langchain-openai")


if __name__ == "__main__":
    main()
