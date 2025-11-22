"""
Mock OpenAI Service - Free development without API costs.

Provides realistic responses for testing without calling OpenAI API.
"""

import random
from typing import List, Dict, Optional
from datetime import datetime


class MockOpenAIService:
    """Mock implementation of OpenAI API for development"""
    
    def __init__(self):
        self.call_count = 0
        self.conversation_history = []
    
    async def generate_dm_response(
        self,
        player_input: str,
        context: Optional[Dict] = None,
        personality: str = "balanced"
    ) -> Dict:
        """Generate mock DM narrative response"""
        self.call_count += 1
        
        # Store in history
        self.conversation_history.append({
            "role": "player",
            "content": player_input,
            "timestamp": datetime.now().isoformat()
        })
        
        # Generate response based on input keywords
        narrative = self._generate_narrative(player_input, personality)
        
        self.conversation_history.append({
            "role": "dm",
            "content": narrative,
            "timestamp": datetime.now().isoformat()
        })
        
        # Detect if roll is needed
        requires_roll = None
        if any(word in player_input.lower() for word in ["search", "investigate", "persuade", "attack", "climb"]):
            requires_roll = "ability_check"
        
        # Detect combat
        combat_initiated = "attack" in player_input.lower() or "fight" in player_input.lower()
        
        return {
            "narrative": narrative,
            "requires_roll": requires_roll,
            "combat_initiated": combat_initiated,
            "suggestions": self._generate_suggestions(player_input),
            "tokens_used": 0,  # Mock tokens
            "cost": 0.0
        }
    
    def _generate_narrative(self, player_input: str, personality: str) -> str:
        """Generate contextual narrative based on player input"""
        
        lower_input = player_input.lower()
        
        # Door/entrance
        if "door" in lower_input or "enter" in lower_input:
            return self._get_entrance_narrative(personality)
        
        # Tavern
        if "tavern" in lower_input or "inn" in lower_input or "bar" in lower_input:
            return self._get_tavern_narrative(personality)
        
        # NPC interaction
        if "talk" in lower_input or "speak" in lower_input or "ask" in lower_input:
            return self._get_npc_dialogue(personality)
        
        # Combat
        if "attack" in lower_input or "fight" in lower_input:
            return self._get_combat_narrative(personality)
        
        # Investigation
        if "search" in lower_input or "investigate" in lower_input or "look" in lower_input:
            return self._get_investigation_narrative(personality)
        
        # Default response
        return self._get_default_narrative(personality)
    
    def _get_entrance_narrative(self, personality: str) -> str:
        narratives = {
            "storytelling": "The heavy oak door creaks open, revealing a warm glow from within. The scent of woodsmoke and ale wafts out to greet you, along with the gentle murmur of conversation. As your eyes adjust to the dimmer light, you see a cozy common room with a roaring fireplace at the far end.",
            "tactical": "The door opens into a 30-foot by 40-foot common room. Three exits visible: stairs to your left (presumably leading up), a door behind the bar (likely kitchen), and the main entrance behind you. Approximately 8-10 patrons scattered throughout. Clear sightlines to most of the room.",
            "humorous": "You push open the door with perhaps a bit too much dramatic flair. It swings wide and bangs against the wall, causing every head in the tavern to turn and stare at you. An awkward silence fills the room. Well, at least you made an entrance!",
            "serious": "The door opens with a low groan. Inside, the atmosphere is tense. Hushed conversations die as you enter, and several patrons eye you with suspicion. This is not a welcoming place. You sense danger lurking in the shadows.",
            "balanced": "You push open the wooden door and step inside. The tavern is moderately busy with locals enjoying their evening meals and drinks. A few glance your way with mild curiosity before returning to their conversations. The bartender nods in acknowledgment from behind the bar."
        }
        return narratives.get(personality, narratives["balanced"])
    
    def _get_tavern_narrative(self, personality: str) -> str:
        narratives = [
            "The Prancing Pony is a lively establishment. The bartender, a stout dwarf named Thorin, polishes glasses while keeping a watchful eye on his patrons. A group of merchants huddle in one corner, and a hooded figure sits alone by the fire.",
            "You notice the tavern has seen better days, but it's clean and warm. A bard strums a lute in the corner, playing a melancholy tune. The smell of roasting meat makes your stomach rumble.",
            "The common room is filled with the usual tavern fare: adventurers comparing scars, locals gossiping about town affairs, and a few suspicious-looking characters lurking in the shadows. What catches your eye?"
        ]
        return random.choice(narratives)
    
    def _get_npc_dialogue(self, personality: str) -> str:
        dialogues = [
            "The innkeeper looks up from wiping the counter. \"Welcome, traveler. What can I do for you? We've got fresh stew and cold ale. Looking for a room, or just passing through?\"",
            "The old man at the bar turns to face you, his weathered face breaking into a smile. \"Ah, fresh faces! Don't see many adventurers around these parts anymore. What brings you to our humble village?\"",
            "\"Aye, I've heard things,\" the guard says in a low voice, glancing around nervously. \"Strange noises from the old mine at night. Folks been disappearing. If you're looking for trouble, you'll find it there.\""
        ]
        return random.choice(dialogues)
    
    def _get_combat_narrative(self, personality: str) -> str:
        narratives = {
            "tactical": "Roll initiative! The goblin (AC 15, HP 7) stands 20 feet ahead, drawing a rusty scimitar. You have clear line of sight. The room is 30x30 feet with a table providing half cover to your right.",
            "storytelling": "Time seems to slow as you reach for your weapon. The goblin's eyes widen in surprise, then narrow with malicious intent. It lets out a high-pitched screech and charges toward you, its blade gleaming in the torchlight!",
            "humorous": "The goblin looks at you. You look at the goblin. There's an awkward moment of silence. Then, as if on cue, you both reach for your weapons and chaos ensues! Roll initiative!",
            "balanced": "Combat begins! The goblin moves to attack. Roll for initiative to determine turn order."
        }
        return narratives.get(personality, narratives["balanced"])
    
    def _get_investigation_narrative(self, personality: str) -> str:
        findings = [
            "Make an Investigation check. On a success, you notice fresh scratches on the floorboards near the bookshelf, suggesting it moves. On closer inspection, you spot a hidden mechanism.",
            "Your keen eyes spot something unusual. Roll Perception. You notice a glint of metal behind the painting - perhaps a hidden safe or compartment?",
            "Searching the room, you find several items of interest: a torn letter with a partial address, a strange coin of foreign make, and fresh boot prints leading toward the window."
        ]
        return random.choice(findings)
    
    def _get_default_narrative(self, personality: str) -> str:
        responses = [
            "The scene unfolds before you. The air is thick with anticipation. What do you do next?",
            "Your action draws attention. Several nearby NPCs glance your way, curious about your intentions. The bartender raises an eyebrow.",
            "As you proceed, you notice the atmosphere in the room shift slightly. It seems your presence hasn't gone unnoticed. What's your next move?"
        ]
        return random.choice(responses)
    
    def _generate_suggestions(self, player_input: str) -> List[str]:
        """Generate contextual action suggestions"""
        return [
            "Talk to the bartender",
            "Investigate the hooded figure",
            "Order food and drink",
            "Look for a place to rest"
        ]
    
    async def generate_campaign_opening(
        self,
        campaign_name: str,
        setting: str = "fantasy",
        personality: str = "balanced"
    ) -> str:
        """Generate campaign opening scene"""
        self.call_count += 1
        
        openings = {
            "fantasy": f"Welcome to {campaign_name}. Your adventure begins in the bustling town of Greenwood, where rumors of ancient ruins and forgotten treasures have drawn adventurers from across the realm. As you enter the local tavern, the 'Rusty Dragon,' you notice a weathered map pinned to the notice board, marked with an ominous red X. The map is titled 'The Lost Catacombs.' Several other adventurers eye it with interest. What do you do?",
            "horror": f"{campaign_name} begins on a dark and stormy night. You've sought shelter in an old manor house on the edge of town. The locals warned you not to go there, whispering tales of disappearances and strange lights. But with nowhere else to go, you had no choice. As lightning illuminates the dusty entrance hall, you hear a sound from upstairs - footsteps, slow and deliberate. You're not alone.",
            "sci-fi": f"Stardate 2387.4. Welcome to {campaign_name}. Your ship has just docked at Station Nexus, a massive trading hub on the edge of known space. You've received a cryptic message from an old contact: 'They know. Meet me at the Plasma Lounge. Come alone.' The station bustles with activity - merchants, bounty hunters, and corporate agents. Your hand instinctively moves to your sidearm. What's your next move?"
        }
        
        return openings.get(setting, openings["fantasy"])
    
    async def generate_npc_description(
        self,
        npc_name: str,
        npc_role: str
    ) -> str:
        """Generate NPC description"""
        self.call_count += 1
        
        descriptions = [
            f"{npc_name}, the {npc_role}, is a weathered individual with keen eyes that miss nothing. They speak with a gravelly voice and have a distinctive scar across their left cheek. Known for their reliability and discretion.",
            f"Meet {npc_name}, a {npc_role} whose reputation precedes them. Of average height but commanding presence, they dress practically with well-worn leather gear. They have a habit of checking over their shoulder and speak in measured tones.",
            f"{npc_name} stands before you - a {npc_role} with an air of mystery. Their most notable feature is their piercing green eyes and silver-streaked hair. They carry themselves with quiet confidence and seem to know more than they let on."
        ]
        
        return random.choice(descriptions)
    
    async def generate_encounter(
        self,
        party_level: int,
        difficulty: str = "medium"
    ) -> str:
        """Generate combat encounter"""
        self.call_count += 1
        
        encounters = {
            "easy": f"2 Goblins (AC 15, HP 7 each) lurk in the shadows. They're poorly equipped and will flee if one is defeated. Environment: Rocky terrain with scattered boulders providing cover.",
            "medium": f"1 Hobgoblin Captain (AC 18, HP 39) leading 2 Goblin archers (AC 13, HP 7 each). The captain uses tactics and commands the goblins. Environment: Forest clearing with thick trees around the perimeter.",
            "hard": f"1 Ogre (AC 11, HP 59) and 3 Orcs (AC 13, HP 15 each). The Ogre charges while Orcs flank. Environment: Narrow canyon with limited escape routes. Rocks can be used for cover but limit movement.",
            "deadly": f"1 Young Dragon (AC 17, HP 75) guards its lair. It has breath weapon (2d6 damage, recharge 5-6), flight speed 60ft, and high intelligence. Environment: Cave with stalactites, treasure piles, and a deep chasm in the center."
        }
        
        return encounters.get(difficulty, encounters["medium"])
    
    async def analyze_player_personality(
        self,
        chat_history: List[Dict],
        action_history: List[str]
    ) -> Dict:
        """Analyze player/character personality from history"""
        self.call_count += 1
        
        # Simple mock analysis
        traits = ["brave", "cautious", "witty", "diplomatic"]
        combat_styles = ["aggressive", "defensive", "tactical", "supportive"]
        
        return {
            "personality_traits": random.sample(traits, 2),
            "common_phrases": ["Let's do this!", "I'm not sure about this...", "What could go wrong?"],
            "combat_style": random.choice(combat_styles),
            "roleplay_style": "engaged",
            "risk_tolerance": random.choice(["low", "medium", "high"]),
            "confidence": 0.7
        }
    
    async def generate_ai_player_action(
        self,
        character_name: str,
        character_class: str,
        situation: str,
        personality: Dict
    ) -> Dict:
        """Generate AI player action decision"""
        self.call_count += 1
        
        actions = [
            f"{character_name} readies their weapon and takes a defensive stance.",
            f"{character_name} suggests caution and proposes scouting ahead first.",
            f"{character_name} eagerly volunteers to take point.",
            f"{character_name} hangs back, observing the situation carefully."
        ]
        
        dialogues = [
            "I've got a bad feeling about this...",
            "Let me handle this one.",
            "What do you think we should do?",
            "I'm ready when you are."
        ]
        
        return {
            "action": random.choice(actions),
            "dialogue": random.choice(dialogues),
            "reasoning": "Based on character personality and situation",
            "confidence": 0.8
        }
    
    def get_conversation_history(self) -> List[Dict]:
        """Get full conversation history"""
        return self.conversation_history.copy()
    
    def clear_history(self):
        """Clear conversation history"""
        self.conversation_history = []
        self.call_count = 0
    
    def get_stats(self) -> Dict:
        """Get usage statistics"""
        return {
            "total_calls": self.call_count,
            "conversation_length": len(self.conversation_history),
            "total_cost": 0.0,  # Always free!
            "mock_mode": True
        }


# Singleton instance
_mock_service = None

def get_mock_openai_service() -> MockOpenAIService:
    """Get or create mock OpenAI service singleton"""
    global _mock_service
    if _mock_service is None:
        _mock_service = MockOpenAIService()
    return _mock_service
