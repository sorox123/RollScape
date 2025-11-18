"""
DM Agent - AI Dungeon Master using LangChain and GPT-4.

This agent handles:
- Narrative generation
- NPC dialogue
- Rule interpretation
- Scene descriptions
- Quest suggestions
"""

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from typing import List, Dict, Optional
from pydantic import BaseModel, Field
import os


class DMPersonality:
    """DM personality presets"""
    BALANCED = "balanced"
    STORYTELLING = "storytelling"
    TACTICAL = "tactical"
    HUMOROUS = "humorous"
    SERIOUS = "serious"


class GameContext(BaseModel):
    """Current game state context for the DM"""
    campaign_name: str
    rule_system: str = "D&D 5e"
    current_location: Optional[str] = None
    active_characters: List[str] = Field(default_factory=list)
    recent_events: List[str] = Field(default_factory=list)
    quest_objectives: List[str] = Field(default_factory=list)


class DMResponse(BaseModel):
    """DM's response to player actions"""
    narrative: str
    suggestions: Optional[List[str]] = None
    npc_dialogue: Optional[str] = None
    requires_roll: Optional[str] = None
    combat_initiated: bool = False


class DMAgent:
    """AI Dungeon Master Agent"""
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        personality: str = DMPersonality.BALANCED,
        temperature: float = 0.8
    ):
        """
        Initialize the DM Agent.
        
        Args:
            api_key: OpenAI API key (defaults to env var)
            personality: DM personality style
            temperature: LLM creativity (0.0-1.0)
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        
        if not self.api_key:
            raise ValueError("OpenAI API key required. Set OPENAI_API_KEY environment variable.")
        
        self.personality = personality
        
        # Initialize the LLM (GPT-4 Turbo for best results)
        self.llm = ChatOpenAI(
            model="gpt-4-turbo-preview",
            temperature=temperature,
            api_key=self.api_key,
            max_tokens=2000
        )
        
        # System prompt based on personality
        self.system_prompt = self._get_system_prompt(personality)
        
        # Conversation history
        self.message_history: List[Dict] = []
    
    def _get_system_prompt(self, personality: str) -> str:
        """Get system prompt based on DM personality"""
        
        base_prompt = """You are an expert Dungeon Master for D&D. Your role is to:
- Create immersive, engaging narratives
- Respond to player actions dynamically
- Interpret rules fairly and consistently
- Control NPCs and monsters
- Describe environments vividly
- Maintain game balance and pacing

Important guidelines:
- Be descriptive but concise (2-3 paragraphs max)
- Ask for dice rolls when appropriate
- Give players meaningful choices
- Reward creativity
- Never control player characters' actions
"""
        
        personality_prompts = {
            DMPersonality.BALANCED: """
Style: Balanced approach between combat and roleplay.
- Mix tactical challenges with narrative depth
- Encourage both strategy and storytelling
- Maintain steady pacing
""",
            DMPersonality.STORYTELLING: """
Style: Focus on narrative and character development.
- Emphasize rich descriptions and emotional moments
- Develop compelling NPCs with depth
- Create meaningful story arcs
- Combat is cinematic and narrative-driven
""",
            DMPersonality.TACTICAL: """
Style: Emphasis on strategic gameplay and rules.
- Clear, precise descriptions of tactical situations
- Challenge players with complex encounters
- Enforce rules strictly but fairly
- Provide detailed environmental information for tactics
""",
            DMPersonality.HUMOROUS: """
Style: Light-hearted and entertaining.
- Include humor and witty NPCs
- Don't take things too seriously
- Add amusing situations and absurd twists
- Keep the game fun and energetic
""",
            DMPersonality.SERIOUS: """
Style: Dark, gritty, and dramatic.
- Emphasize consequences and moral dilemmas
- Create tense, atmospheric scenes
- NPCs have complex motivations
- Danger feels real and present
"""
        }
        
        return base_prompt + personality_prompts.get(personality, personality_prompts[DMPersonality.BALANCED])
    
    async def respond(
        self,
        player_input: str,
        context: Optional[GameContext] = None,
        include_history: bool = True
    ) -> DMResponse:
        """
        Generate DM response to player action.
        
        Args:
            player_input: What the player said/did
            context: Current game state
            include_history: Use conversation history
            
        Returns:
            DMResponse with narrative and suggestions
        """
        # Build the prompt
        messages = [SystemMessage(content=self.system_prompt)]
        
        # Add context if provided
        if context:
            context_str = f"""
Current Context:
- Campaign: {context.campaign_name}
- System: {context.rule_system}
- Location: {context.current_location or 'Unknown'}
- Active Characters: {', '.join(context.active_characters) if context.active_characters else 'None'}
- Recent Events: {'; '.join(context.recent_events[-3:]) if context.recent_events else 'Campaign just started'}
- Quest Objectives: {'; '.join(context.quest_objectives) if context.quest_objectives else 'None yet'}
"""
            messages.append(SystemMessage(content=context_str))
        
        # Add conversation history
        if include_history and self.message_history:
            for msg in self.message_history[-6:]:  # Last 3 exchanges
                if msg["role"] == "player":
                    messages.append(HumanMessage(content=msg["content"]))
                else:
                    messages.append(AIMessage(content=msg["content"]))
        
        # Add current player input
        messages.append(HumanMessage(content=player_input))
        
        # Get response from LLM
        response = await self.llm.ainvoke(messages)
        narrative = response.content
        
        # Store in history
        self.message_history.append({"role": "player", "content": player_input})
        self.message_history.append({"role": "dm", "content": narrative})
        
        # Parse for special actions (simplified for prototype)
        requires_roll = None
        if any(keyword in narrative.lower() for keyword in ["roll", "check", "save", "saving throw"]):
            requires_roll = "ability_check"
        
        combat_initiated = "initiative" in narrative.lower() or "combat" in narrative.lower()
        
        return DMResponse(
            narrative=narrative,
            requires_roll=requires_roll,
            combat_initiated=combat_initiated
        )
    
    def respond_sync(
        self,
        player_input: str,
        context: Optional[GameContext] = None,
        include_history: bool = True
    ) -> DMResponse:
        """Synchronous version of respond()"""
        import asyncio
        return asyncio.run(self.respond(player_input, context, include_history))
    
    def start_campaign(self, campaign_name: str, setting: str = "fantasy") -> str:
        """
        Generate an opening scene for a new campaign.
        
        Args:
            campaign_name: Name of the campaign
            setting: Genre/setting (fantasy, sci-fi, horror, etc.)
            
        Returns:
            Opening narrative
        """
        prompt = f"""Start a new D&D campaign called "{campaign_name}" in a {setting} setting.
        
Create an engaging opening scene that:
1. Sets the mood and tone
2. Introduces the initial location
3. Presents a hook or initial quest
4. Invites player action

Be descriptive and exciting. End with a question or prompt for the players."""
        
        response = self.respond_sync(prompt, include_history=False)
        return response.narrative
    
    def describe_npc(self, npc_name: str, npc_role: str) -> str:
        """Generate NPC description and personality"""
        prompt = f"Describe {npc_name}, a {npc_role}. Include appearance, personality, and a distinctive trait."
        response = self.respond_sync(prompt, include_history=False)
        return response.narrative
    
    def generate_encounter(self, party_level: int, difficulty: str = "medium") -> str:
        """Generate a combat encounter"""
        prompt = f"""Create a {difficulty} difficulty combat encounter for a party of level {party_level}.
        
Include:
1. Enemy types and numbers
2. Tactical environment description
3. Unique element or twist
4. Victory conditions"""
        
        response = self.respond_sync(prompt, include_history=False)
        return response.narrative
    
    def clear_history(self):
        """Clear conversation history"""
        self.message_history = []
    
    def get_history(self) -> List[Dict]:
        """Get conversation history"""
        return self.message_history.copy()
