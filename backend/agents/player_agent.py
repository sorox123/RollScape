"""
Player Agent - AI-controlled player character system.

Handles:
- AI control of player characters when players are absent
- Character personality analysis from chat logs and actions
- Dynamic roleplay based on character history
- Decision making aligned with character traits
"""

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from typing import List, Dict, Optional, Tuple
from pydantic import BaseModel, Field
import os
import json


class PlayerPersonality:
    """Player personality archetypes"""
    CAUTIOUS = "cautious"
    BRAVE = "brave"
    WITTY = "witty"
    SERIOUS = "serious"
    DIPLOMATIC = "diplomatic"
    AGGRESSIVE = "aggressive"
    ANALYTICAL = "analytical"


class CharacterProfile(BaseModel):
    """Character analysis profile"""
    character_id: str
    character_name: str
    class_info: str
    
    # Analyzed traits
    personality_traits: List[str] = Field(default_factory=list)
    common_phrases: List[str] = Field(default_factory=list)
    decision_patterns: Dict[str, str] = Field(default_factory=dict)
    relationship_notes: Dict[str, str] = Field(default_factory=dict)
    
    # Behavior analysis
    combat_style: Optional[str] = None
    roleplay_style: Optional[str] = None
    risk_tolerance: str = "medium"  # low, medium, high
    
    # History
    recent_actions: List[str] = Field(default_factory=list)
    chat_history: List[Dict] = Field(default_factory=list)


class ActionDecision(BaseModel):
    """AI's decision for character action"""
    action: str
    reasoning: str
    dialogue: Optional[str] = None
    in_character: bool = True
    confidence: float = Field(ge=0.0, le=1.0)


class PlayerAgent:
    """AI Agent that controls player characters when players are absent"""
    
    def __init__(
        self,
        character_profile: CharacterProfile,
        api_key: Optional[str] = None,
        base_personality: str = PlayerPersonality.CAUTIOUS,
        temperature: float = 0.7
    ):
        """
        Initialize Player Agent.
        
        Args:
            character_profile: Profile of character to control
            api_key: OpenAI API key
            base_personality: Base personality archetype
            temperature: LLM creativity (0.0-1.0)
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        
        if not self.api_key:
            raise ValueError("OpenAI API key required")
        
        self.profile = character_profile
        self.base_personality = base_personality
        
        # Initialize LLM (GPT-4 for better roleplay)
        self.llm = ChatOpenAI(
            model="gpt-4-turbo-preview",
            temperature=temperature,
            api_key=self.api_key,
            max_tokens=1000
        )
        
        # System prompt for character roleplay
        self.system_prompt = self._build_system_prompt()
    
    def _build_system_prompt(self) -> str:
        """Build system prompt based on character profile"""
        
        base = f"""You are roleplaying as {self.profile.character_name}, a {self.profile.class_info}.

CRITICAL: You must stay in character at all times. Make decisions this character would make based on their established personality and history.

Character Profile:
- Name: {self.profile.character_name}
- Class: {self.profile.class_info}
- Base Personality: {self.base_personality}
"""
        
        # Add analyzed traits if available
        if self.profile.personality_traits:
            base += f"\nPersonality Traits: {', '.join(self.profile.personality_traits)}"
        
        if self.profile.common_phrases:
            base += f"\nCommon Phrases: {', '.join(self.profile.common_phrases[:5])}"
        
        if self.profile.combat_style:
            base += f"\nCombat Style: {self.profile.combat_style}"
        
        if self.profile.roleplay_style:
            base += f"\nRoleplay Style: {self.profile.roleplay_style}"
        
        base += f"\nRisk Tolerance: {self.profile.risk_tolerance}"
        
        # Add relationship context
        if self.profile.relationship_notes:
            base += "\n\nRelationships:"
            for char, note in self.profile.relationship_notes.items():
                base += f"\n- {char}: {note}"
        
        # Add decision patterns
        if self.profile.decision_patterns:
            base += "\n\nDecision Patterns:"
            for situation, pattern in self.profile.decision_patterns.items():
                base += f"\n- {situation}: {pattern}"
        
        # Add recent context
        if self.profile.recent_actions:
            base += f"\n\nRecent Actions: {'; '.join(self.profile.recent_actions[-5:])}"
        
        base += """

Guidelines:
- Stay true to the character's established personality
- Use similar speech patterns and phrases
- Make decisions aligned with their risk tolerance
- Consider relationships with other party members
- Be consistent with past behavior
- When in doubt, err on the side of caution (player safety first)

Response Format:
- Provide the action you want to take
- Include any dialogue in quotation marks
- Explain your reasoning briefly
"""
        
        return base
    
    async def decide_action(
        self,
        situation: str,
        available_actions: Optional[List[str]] = None,
        party_context: Optional[str] = None
    ) -> ActionDecision:
        """
        Decide what action the character should take.
        
        Args:
            situation: Current game situation
            available_actions: List of possible actions
            party_context: What other party members are doing
            
        Returns:
            ActionDecision with action, reasoning, and dialogue
        """
        # Build the prompt
        messages = [SystemMessage(content=self.system_prompt)]
        
        prompt = f"Situation: {situation}\n"
        
        if party_context:
            prompt += f"\nParty Context: {party_context}\n"
        
        if available_actions:
            prompt += f"\nAvailable Actions:\n"
            for i, action in enumerate(available_actions, 1):
                prompt += f"{i}. {action}\n"
        
        prompt += "\nWhat does your character do? Include any dialogue they would say."
        
        messages.append(HumanMessage(content=prompt))
        
        # Get response
        response = await self.llm.ainvoke(messages)
        content = response.content
        
        # Parse response (simplified for prototype)
        action = content
        dialogue = None
        
        # Extract dialogue if present
        if '"' in content:
            parts = content.split('"')
            if len(parts) >= 2:
                dialogue = parts[1]
                action = content.replace(f'"{dialogue}"', '').strip()
        
        return ActionDecision(
            action=action,
            reasoning="Based on character personality and situation",
            dialogue=dialogue,
            in_character=True,
            confidence=0.8
        )
    
    def decide_action_sync(
        self,
        situation: str,
        available_actions: Optional[List[str]] = None,
        party_context: Optional[str] = None
    ) -> ActionDecision:
        """Synchronous version of decide_action"""
        import asyncio
        return asyncio.run(self.decide_action(situation, available_actions, party_context))
    
    async def respond_to_npc(
        self,
        npc_dialogue: str,
        npc_name: str,
        context: Optional[str] = None
    ) -> str:
        """
        Respond to NPC dialogue in character.
        
        Args:
            npc_dialogue: What the NPC said
            npc_name: Name of the NPC
            context: Additional context
            
        Returns:
            Character's response
        """
        messages = [SystemMessage(content=self.system_prompt)]
        
        prompt = f"{npc_name} says: \"{npc_dialogue}\"\n"
        
        if context:
            prompt += f"\nContext: {context}\n"
        
        # Check relationships
        if npc_name in self.profile.relationship_notes:
            prompt += f"\nYour relationship with {npc_name}: {self.profile.relationship_notes[npc_name]}\n"
        
        prompt += f"\nHow does {self.profile.character_name} respond?"
        
        messages.append(HumanMessage(content=prompt))
        
        response = await self.llm.ainvoke(messages)
        return response.content
    
    def respond_to_npc_sync(
        self,
        npc_dialogue: str,
        npc_name: str,
        context: Optional[str] = None
    ) -> str:
        """Synchronous version of respond_to_npc"""
        import asyncio
        return asyncio.run(self.respond_to_npc(npc_dialogue, npc_name, context))
    
    def update_profile(
        self,
        new_actions: Optional[List[str]] = None,
        new_chat: Optional[List[Dict]] = None
    ):
        """
        Update character profile with new actions and chat.
        
        Args:
            new_actions: Recent actions taken
            new_chat: Recent chat messages
        """
        if new_actions:
            self.profile.recent_actions.extend(new_actions)
            # Keep last 20 actions
            self.profile.recent_actions = self.profile.recent_actions[-20:]
        
        if new_chat:
            self.profile.chat_history.extend(new_chat)
            # Keep last 50 messages
            self.profile.chat_history = self.profile.chat_history[-50:]
    
    def analyze_personality_from_history(self) -> Dict[str, any]:
        """
        Analyze character personality from chat and action history.
        Uses LLM to identify patterns.
        
        Returns:
            Analysis results
        """
        if not self.profile.chat_history and not self.profile.recent_actions:
            return {
                "personality_traits": [],
                "common_phrases": [],
                "decision_patterns": {},
                "confidence": 0.0
            }
        
        # Build analysis prompt
        analysis_prompt = f"""Analyze the following character based on their chat history and actions:

Character: {self.profile.character_name} ({self.profile.class_info})

Chat History:
{json.dumps(self.profile.chat_history[-20:], indent=2)}

Recent Actions:
{json.dumps(self.profile.recent_actions[-20:], indent=2)}

Provide analysis in this format:
1. Personality Traits: [list 3-5 key traits]
2. Common Phrases: [list phrases they use often]
3. Combat Style: [how they approach fights]
4. Roleplay Style: [how they interact with NPCs]
5. Risk Tolerance: [low/medium/high]
6. Decision Patterns: [key patterns in decision making]
"""
        
        messages = [
            SystemMessage(content="You are an expert at character analysis for D&D games."),
            HumanMessage(content=analysis_prompt)
        ]
        
        import asyncio
        response = asyncio.run(self.llm.ainvoke(messages))
        
        # Parse response (simplified - would use structured output in production)
        return {
            "analysis": response.content,
            "confidence": 0.7 if len(self.profile.chat_history) > 10 else 0.4
        }
    
    def to_dict(self) -> Dict:
        """Export character profile to dict"""
        return self.profile.model_dump()
    
    @classmethod
    def from_dict(cls, data: Dict, api_key: Optional[str] = None):
        """Create PlayerAgent from dict"""
        profile = CharacterProfile(**data)
        return cls(
            character_profile=profile,
            api_key=api_key,
            base_personality=data.get("base_personality", PlayerPersonality.CAUTIOUS)
        )


def create_player_agent_from_character(
    character_id: str,
    character_name: str,
    character_class: str,
    chat_history: List[Dict],
    action_history: List[str],
    api_key: Optional[str] = None
) -> PlayerAgent:
    """
    Factory function to create a PlayerAgent from character data.
    
    Args:
        character_id: Character database ID
        character_name: Character's name
        character_class: Character's class
        chat_history: Previous chat messages
        action_history: Previous actions
        api_key: OpenAI API key
        
    Returns:
        Configured PlayerAgent
    """
    profile = CharacterProfile(
        character_id=character_id,
        character_name=character_name,
        class_info=character_class,
        chat_history=chat_history,
        recent_actions=action_history
    )
    
    agent = PlayerAgent(
        character_profile=profile,
        api_key=api_key
    )
    
    # Analyze personality from history
    if chat_history or action_history:
        analysis = agent.analyze_personality_from_history()
        # Update profile with analysis (simplified)
        # In production, would parse structured output
    
    return agent
