"""
AI Content Generator Service
Generates NPCs, monsters, items, locations, quests, and lore using OpenAI
"""

import json
from typing import Dict, Any, Optional, List
from services.openai_service import OpenAIService


class ContentGeneratorService:
    """AI-powered content generation for D&D"""
    
    def __init__(self, openai_service: OpenAIService):
        self.openai_service = openai_service
    
    async def generate_npc(
        self,
        prompt: str,
        race: Optional[str] = None,
        class_type: Optional[str] = None,
        alignment: Optional[str] = None,
        level: Optional[int] = None,
        location: Optional[str] = None,
        personality_traits: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Generate an NPC with full D&D 5e statistics and personality"""
        
        system_prompt = """You are a master D&D 5e Dungeon Master creating compelling NPCs.
Generate a complete NPC with personality, backstory, statistics, and roleplaying notes.
Return ONLY valid JSON with no markdown formatting."""
        
        user_prompt = f"""Create a D&D 5e NPC based on: {prompt}

"""
        
        if race:
            user_prompt += f"Race: {race}\n"
        if class_type:
            user_prompt += f"Class: {class_type}\n"
        if alignment:
            user_prompt += f"Alignment: {alignment}\n"
        if level:
            user_prompt += f"Level: {level}\n"
        if location:
            user_prompt += f"Location: {location}\n"
        if personality_traits:
            user_prompt += f"Personality Traits: {', '.join(personality_traits)}\n"
        
        user_prompt += """
Return JSON with this structure:
{
    "name": "Full name",
    "race": "Race",
    "class": "Class and level",
    "alignment": "Alignment",
    "backstory": "Rich backstory paragraph",
    "personality": "Personality description",
    "appearance": "Physical description",
    "motivation": "What drives them",
    "secrets": ["Secret 1", "Secret 2"],
    "quirks": ["Quirk 1", "Quirk 2"],
    "voice": "How they speak",
    "statistics": {
        "ac": 15,
        "hp": 50,
        "speed": "30 ft",
        "str": 10, "dex": 14, "con": 12, "int": 16, "wis": 13, "cha": 15,
        "skills": ["Persuasion +5", "Insight +3"],
        "senses": "Passive Perception 13"
    },
    "special_abilities": ["Ability name: description"],
    "actions": ["Action name: description"],
    "equipment": ["Item 1", "Item 2"],
    "relationships": ["Relationship to other NPCs/factions"],
    "quest_hooks": ["Potential quest 1", "Potential quest 2"],
    "roleplaying_tips": ["Tip 1", "Tip 2"]
}"""
        
        response = await self.openai_service.generate_completion(
            prompt=user_prompt,
            system_message=system_prompt,
            max_tokens=2000,
            temperature=0.8
        )
        
        # Parse JSON response
        try:
            content = response["choices"][0]["message"]["content"]
            # Remove markdown code blocks if present
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            npc_data = json.loads(content)
            return npc_data
        except json.JSONDecodeError:
            # Fallback to raw content
            return {"error": "Failed to parse JSON", "raw_content": content}
    
    async def generate_monster(
        self,
        prompt: str,
        challenge_rating: Optional[str] = None,
        environment: Optional[str] = None,
        size: Optional[str] = None,
        monster_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate a custom D&D 5e monster with full stat block"""
        
        system_prompt = """You are a master D&D 5e Dungeon Master creating balanced, interesting monsters.
Generate complete monsters with proper CR-appropriate statistics following 5e guidelines.
Return ONLY valid JSON with no markdown formatting."""
        
        user_prompt = f"""Create a D&D 5e monster based on: {prompt}

"""
        
        if challenge_rating:
            user_prompt += f"Challenge Rating: {challenge_rating}\n"
        if environment:
            user_prompt += f"Environment: {environment}\n"
        if size:
            user_prompt += f"Size: {size}\n"
        if monster_type:
            user_prompt += f"Type: {monster_type}\n"
        
        user_prompt += """
Return JSON with full stat block:
{
    "name": "Monster name",
    "size": "Medium/Large/etc",
    "type": "Beast/Dragon/Undead/etc",
    "alignment": "Alignment",
    "challenge_rating": "CR",
    "xp": 450,
    "description": "Lore and description",
    "armor_class": 15,
    "hit_points": "45 (7d8 + 14)",
    "speed": "30 ft., fly 60 ft.",
    "str": 16, "dex": 14, "con": 14, "int": 8, "wis": 12, "cha": 10,
    "saving_throws": ["Dex +4", "Con +4"],
    "skills": ["Perception +3", "Stealth +4"],
    "damage_resistances": "fire, cold",
    "damage_immunities": "",
    "condition_immunities": "",
    "senses": "darkvision 60 ft., passive Perception 13",
    "languages": "Common, Draconic",
    "special_traits": [
        {
            "name": "Trait name",
            "description": "Full description"
        }
    ],
    "actions": [
        {
            "name": "Multiattack",
            "description": "The creature makes two attacks"
        },
        {
            "name": "Attack name",
            "attack_bonus": "+5",
            "damage": "1d8 + 3 slashing",
            "description": "Full description"
        }
    ],
    "legendary_actions": [],
    "lair_actions": [],
    "tactics": "How the monster fights",
    "loot": ["Treasure 1", "Treasure 2"]
}"""
        
        response = await self.openai_service.generate_completion(
            prompt=user_prompt,
            system_message=system_prompt,
            max_tokens=2500,
            temperature=0.7
        )
        
        try:
            content = response["choices"][0]["message"]["content"]
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            monster_data = json.loads(content)
            return monster_data
        except json.JSONDecodeError:
            return {"error": "Failed to parse JSON", "raw_content": content}
    
    async def generate_item(
        self,
        prompt: str,
        item_type: Optional[str] = None,
        rarity: Optional[str] = None,
        requires_attunement: Optional[bool] = None,
    ) -> Dict[str, Any]:
        """Generate a magic item with full 5e properties"""
        
        system_prompt = """You are a master D&D 5e Dungeon Master creating balanced magic items.
Generate items that are interesting, flavorful, and properly balanced for their rarity.
Return ONLY valid JSON with no markdown formatting."""
        
        user_prompt = f"""Create a D&D 5e magic item based on: {prompt}

"""
        
        if item_type:
            user_prompt += f"Type: {item_type} (weapon, armor, wondrous item, potion, scroll, etc.)\n"
        if rarity:
            user_prompt += f"Rarity: {rarity}\n"
        if requires_attunement is not None:
            user_prompt += f"Requires Attunement: {requires_attunement}\n"
        
        user_prompt += """
Return JSON:
{
    "name": "Item name",
    "type": "Weapon/Armor/Wondrous Item/etc",
    "rarity": "Common/Uncommon/Rare/Very Rare/Legendary",
    "requires_attunement": true,
    "attunement_requirements": "by a spellcaster",
    "description": "Flavorful description",
    "appearance": "What it looks like",
    "properties": [
        "Property 1: description",
        "Property 2: description"
    ],
    "mechanics": {
        "bonus": "+2",
        "damage": "1d8 + 2 fire",
        "ac_bonus": "+1",
        "special_abilities": ["Ability description"]
    },
    "charges": {
        "current": 7,
        "maximum": 7,
        "recharge": "1d6+1 at dawn"
    },
    "curse": "Curse description if cursed",
    "history": "Item's origin story",
    "value_gp": 5000,
    "weight_lbs": 3
}"""
        
        response = await self.openai_service.generate_completion(
            prompt=user_prompt,
            system_message=system_prompt,
            max_tokens=1500,
            temperature=0.8
        )
        
        try:
            content = response["choices"][0]["message"]["content"]
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            item_data = json.loads(content)
            return item_data
        except json.JSONDecodeError:
            return {"error": "Failed to parse JSON", "raw_content": content}
    
    async def generate_location(
        self,
        prompt: str,
        location_type: Optional[str] = None,
        size: Optional[str] = None,
        inhabitants: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate a detailed location with encounters and secrets"""
        
        system_prompt = """You are a master D&D 5e Dungeon Master creating evocative, detailed locations.
Generate locations with atmosphere, NPCs, encounters, and adventure hooks.
Return ONLY valid JSON with no markdown formatting."""
        
        user_prompt = f"""Create a D&D 5e location based on: {prompt}

"""
        
        if location_type:
            user_prompt += f"Type: {location_type} (dungeon, city, tavern, wilderness, etc.)\n"
        if size:
            user_prompt += f"Size: {size}\n"
        if inhabitants:
            user_prompt += f"Inhabitants: {inhabitants}\n"
        
        user_prompt += """
Return JSON:
{
    "name": "Location name",
    "type": "Dungeon/City/Tavern/Wilderness/etc",
    "description": "Atmospheric description",
    "history": "Background and lore",
    "atmosphere": "What it feels like to be there",
    "notable_features": ["Feature 1", "Feature 2"],
    "areas": [
        {
            "name": "Area name (e.g., Main Hall)",
            "description": "Description",
            "encounters": ["Possible encounter"],
            "treasure": ["Hidden treasure"],
            "secrets": ["Secret passage, etc."]
        }
    ],
    "npcs": [
        {
            "name": "NPC name",
            "role": "Innkeeper/Guard/etc",
            "description": "Brief description"
        }
    ],
    "encounters": [
        {
            "name": "Encounter name",
            "trigger": "What triggers it",
            "description": "What happens",
            "creatures": ["Creature 1 x2", "Creature 2"],
            "difficulty": "Easy/Medium/Hard/Deadly"
        }
    ],
    "quest_hooks": ["Hook 1", "Hook 2"],
    "rumors": ["Rumor 1", "Rumor 2"],
    "shops": [
        {
            "name": "Shop name",
            "type": "General store/Blacksmith/etc",
            "inventory": ["Item 1", "Item 2"]
        }
    ],
    "map_description": "Layout and key points"
}"""
        
        response = await self.openai_service.generate_completion(
            prompt=user_prompt,
            system_message=system_prompt,
            max_tokens=2500,
            temperature=0.8
        )
        
        try:
            content = response["choices"][0]["message"]["content"]
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            location_data = json.loads(content)
            return location_data
        except json.JSONDecodeError:
            return {"error": "Failed to parse JSON", "raw_content": content}
    
    async def generate_quest(
        self,
        prompt: str,
        party_level: Optional[int] = None,
        quest_type: Optional[str] = None,
        location: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate a quest with multiple paths and outcomes"""
        
        system_prompt = """You are a master D&D 5e Dungeon Master creating engaging quests.
Generate quests with clear objectives, branching paths, and multiple outcomes.
Return ONLY valid JSON with no markdown formatting."""
        
        user_prompt = f"""Create a D&D 5e quest based on: {prompt}

"""
        
        if party_level:
            user_prompt += f"Party Level: {party_level}\n"
        if quest_type:
            user_prompt += f"Type: {quest_type} (rescue, investigation, combat, social, etc.)\n"
        if location:
            user_prompt += f"Location: {location}\n"
        
        user_prompt += """
Return JSON:
{
    "title": "Quest title",
    "type": "Main/Side/Personal",
    "summary": "One sentence summary",
    "description": "Full quest description",
    "quest_giver": {
        "name": "NPC name",
        "description": "Who gives the quest"
    },
    "objectives": [
        {
            "description": "Objective description",
            "optional": false,
            "completed": false
        }
    ],
    "stages": [
        {
            "number": 1,
            "title": "Stage title",
            "description": "What happens",
            "location": "Where it happens",
            "encounters": ["Encounter 1"],
            "skill_challenges": ["Skill check needed"],
            "branching_paths": {
                "success": "What happens on success",
                "failure": "What happens on failure",
                "alternative": "Alternative approach"
            }
        }
    ],
    "rewards": {
        "xp": 1000,
        "gold": 500,
        "items": ["Magic item reward"],
        "reputation": "Faction +1",
        "story": "Story consequence"
    },
    "consequences": {
        "success": "Long-term effect of success",
        "failure": "Long-term effect of failure",
        "ignored": "What happens if quest is ignored"
    },
    "time_limit": "3 days",
    "difficulty": "Medium",
    "estimated_sessions": 2,
    "hooks": ["How to introduce the quest"]
}"""
        
        response = await self.openai_service.generate_completion(
            prompt=user_prompt,
            system_message=system_prompt,
            max_tokens=2500,
            temperature=0.8
        )
        
        try:
            content = response["choices"][0]["message"]["content"]
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            quest_data = json.loads(content)
            return quest_data
        except json.JSONDecodeError:
            return {"error": "Failed to parse JSON", "raw_content": content}
    
    async def generate_lore(
        self,
        prompt: str,
        category: Optional[str] = None,
        campaign_context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate campaign lore entry"""
        
        system_prompt = """You are a master D&D 5e Dungeon Master creating rich, consistent world lore.
Generate lore that enhances the campaign world and provides hooks for storytelling.
Return ONLY valid JSON with no markdown formatting."""
        
        user_prompt = f"""Create a D&D 5e lore entry based on: {prompt}

"""
        
        if category:
            user_prompt += f"Category: {category} (history, geography, religion, politics, culture, magic, faction, etc.)\n"
        if campaign_context:
            user_prompt += f"Campaign Context: {campaign_context}\n"
        
        user_prompt += """
Return JSON:
{
    "title": "Lore entry title",
    "category": "history/geography/religion/politics/culture/magic/faction/etc",
    "summary": "Brief summary",
    "content": "Full lore text with rich detail",
    "key_points": ["Key point 1", "Key point 2"],
    "related_entities": ["NPC/Location/Event that relates to this"],
    "story_hooks": ["How this can be used in gameplay"],
    "secrets": ["Hidden truths about this lore"],
    "timeline": [
        {"date": "100 years ago", "event": "What happened"}
    ],
    "tags": ["tag1", "tag2"]
}"""
        
        response = await self.openai_service.generate_completion(
            prompt=user_prompt,
            system_message=system_prompt,
            max_tokens=2000,
            temperature=0.8
        )
        
        try:
            content = response["choices"][0]["message"]["content"]
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            lore_data = json.loads(content)
            return lore_data
        except json.JSONDecodeError:
            return {"error": "Failed to parse JSON", "raw_content": content}
