"""
OpenAI service with rate limiting, cost tracking, and error handling.
"""

from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta
from collections import deque
import time
import asyncio
from services.service_config import openai_config, ServiceMode


class RateLimiter:
    """Rate limiter for API calls"""
    
    def __init__(self, max_requests: int, time_window: int = 60):
        """
        Args:
            max_requests: Maximum requests allowed
            time_window: Time window in seconds
        """
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = deque()
    
    def can_make_request(self) -> bool:
        """Check if request can be made"""
        now = time.time()
        
        # Remove old requests outside time window
        while self.requests and self.requests[0] < now - self.time_window:
            self.requests.popleft()
        
        return len(self.requests) < self.max_requests
    
    def record_request(self):
        """Record a request"""
        self.requests.append(time.time())
    
    async def wait_if_needed(self):
        """Wait if rate limit would be exceeded"""
        while not self.can_make_request():
            await asyncio.sleep(1)
        
        self.record_request()


class CostTracker:
    """Track OpenAI API costs"""
    
    # Pricing per 1K tokens (as of 2024)
    PRICING = {
        "gpt-4-turbo-preview": {"input": 0.01, "output": 0.03},
        "gpt-4": {"input": 0.03, "output": 0.06},
        "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015}
    }
    
    def __init__(self, daily_limit: float):
        self.daily_limit = daily_limit
        self.usage_by_day: Dict[str, float] = {}
    
    def get_today_key(self) -> str:
        """Get today's date key"""
        return datetime.utcnow().date().isoformat()
    
    def get_today_cost(self) -> float:
        """Get today's total cost"""
        return self.usage_by_day.get(self.get_today_key(), 0.0)
    
    def can_make_request(self, estimated_cost: float = 0.02) -> bool:
        """Check if request would exceed daily limit"""
        return self.get_today_cost() + estimated_cost <= self.daily_limit
    
    def record_usage(self, model: str, input_tokens: int, output_tokens: int):
        """Record API usage"""
        pricing = self.PRICING.get(model, self.PRICING["gpt-4-turbo-preview"])
        
        cost = (
            (input_tokens / 1000) * pricing["input"] +
            (output_tokens / 1000) * pricing["output"]
        )
        
        today = self.get_today_key()
        self.usage_by_day[today] = self.usage_by_day.get(today, 0.0) + cost
        
        return cost
    
    def get_usage_stats(self) -> Dict:
        """Get usage statistics"""
        today_cost = self.get_today_cost()
        
        return {
            "today_cost": round(today_cost, 4),
            "daily_limit": self.daily_limit,
            "remaining": round(self.daily_limit - today_cost, 4),
            "percentage_used": round((today_cost / self.daily_limit) * 100, 2)
        }


class MockOpenAIClient:
    """Mock OpenAI client for development"""
    
    async def ainvoke(self, messages: List[Dict]) -> Any:
        """Mock async invoke"""
        await asyncio.sleep(0.1)  # Simulate API delay
        
        # Simple mock response
        return MockResponse(
            content="This is a mock response. Set MOCK_MODE=false and add OPENAI_API_KEY to use real AI."
        )
    
    def invoke(self, messages: List[Dict]) -> Any:
        """Mock sync invoke"""
        return MockResponse(
            content="This is a mock response. Set MOCK_MODE=false and add OPENAI_API_KEY to use real AI."
        )


class MockResponse:
    """Mock OpenAI response"""
    
    def __init__(self, content: str):
        self.content = content
        self.usage = {
            "prompt_tokens": 100,
            "completion_tokens": 50,
            "total_tokens": 150
        }


class OpenAIService:
    """OpenAI service with rate limiting and cost tracking"""
    
    def __init__(self):
        self.config = openai_config
        self.rate_limiter = RateLimiter(self.config.rate_limit_rpm)
        self.cost_tracker = CostTracker(self.config.cost_limit_daily)
        
        if self.config.mode == ServiceMode.MOCK or not self.config.api_key:
            self.client = MockOpenAIClient()
            self.is_mock = True
        else:
            self._init_production()
            self.is_mock = False
    
    def _init_production(self):
        """Initialize production OpenAI client"""
        try:
            from langchain_openai import ChatOpenAI
            
            self.client = ChatOpenAI(
                model=self.config.model,
                temperature=self.config.temperature,
                max_tokens=self.config.max_tokens,
                api_key=self.config.api_key
            )
        except ImportError:
            raise ImportError("langchain-openai required: pip install langchain-openai")
    
    async def ainvoke(self, messages: List[Dict], **kwargs) -> Any:
        """Async invoke with rate limiting and cost tracking"""
        # Check rate limit
        await self.rate_limiter.wait_if_needed()
        
        # Check cost limit
        if not self.is_mock and not self.cost_tracker.can_make_request():
            raise Exception(
                f"Daily cost limit reached (${self.cost_tracker.daily_limit}). "
                "Reset at midnight UTC or increase OPENAI_COST_LIMIT_DAILY."
            )
        
        # Make request
        response = await self.client.ainvoke(messages, **kwargs)
        
        # Track cost (if real API)
        if not self.is_mock and hasattr(response, 'usage'):
            self.cost_tracker.record_usage(
                self.config.model,
                response.usage.get("prompt_tokens", 0),
                response.usage.get("completion_tokens", 0)
            )
        
        return response
    
    def invoke(self, messages: List[Dict], **kwargs) -> Any:
        """Sync invoke with rate limiting"""
        # Check rate limit (simplified for sync)
        if not self.rate_limiter.can_make_request():
            time.sleep(1)
        
        self.rate_limiter.record_request()
        
        # Check cost limit
        if not self.is_mock and not self.cost_tracker.can_make_request():
            raise Exception(f"Daily cost limit reached (${self.cost_tracker.daily_limit})")
        
        # Make request
        response = self.client.invoke(messages, **kwargs)
        
        # Track cost
        if not self.is_mock and hasattr(response, 'usage'):
            self.cost_tracker.record_usage(
                self.config.model,
                response.usage.get("prompt_tokens", 0),
                response.usage.get("completion_tokens", 0)
            )
        
        return response
    
    def get_usage_stats(self) -> Dict:
        """Get usage statistics"""
        stats = self.cost_tracker.get_usage_stats()
        stats["rate_limit_rpm"] = self.config.rate_limit_rpm
        stats["is_mock"] = self.is_mock
        return stats


    async def generate_session_recap(self, session_data: Dict) -> Dict:
        """
        Generate a narrative recap of a game session.
        
        Args:
            session_data: Dict containing session info (messages, actions, combat_logs)
        
        Returns:
            Dict with recap_text, key_events, npcs_met, locations_visited, decisions_made
        """
        # Build prompt from session data
        messages_summary = "\n".join([
            f"{msg.get('sender_name', 'Unknown')}: {msg.get('message', '')}"
            for msg in session_data.get('messages', [])[:50]  # Last 50 messages
        ])
        
        actions_summary = "\n".join([
            f"{action.get('character_name', 'Character')} - {action.get('action_type', 'action')}: {action.get('description', '')}"
            for action in session_data.get('actions', [])[:30]  # Last 30 actions
        ])
        
        combat_summary = "\n".join([
            f"Combat: {combat.get('description', 'Battle')} - {len(combat.get('participants', []))} participants"
            for combat in session_data.get('combat_logs', [])[:5]  # Last 5 combats
        ])
        
        prompt = f"""
You are a skilled Dungeon Master creating a session recap for a D&D game.

Session Title: {session_data.get('title', 'Untitled Session')}
Session Number: {session_data.get('session_number', 'N/A')}
Duration: {session_data.get('duration_minutes', 0)} minutes

Chat Messages:
{messages_summary}

Player Actions:
{actions_summary}

Combat Encounters:
{combat_summary}

Based on this session data, create a comprehensive recap in the following JSON format:
{{
  "recap_text": "A narrative summary (2-3 paragraphs) of the session written in an engaging storytelling style",
  "key_events": ["Event 1", "Event 2", "Event 3"],
  "npcs_met": ["NPC name 1", "NPC name 2"],
  "locations_visited": ["Location 1", "Location 2"],
  "decisions_made": ["Decision 1", "Decision 2"],
  "combat_encounters": ["Brief combat description 1", "Brief combat description 2"]
}}

Make the recap_text engaging and highlight important story beats, character development, and memorable moments.
"""
        
        messages = [
            {"role": "system", "content": "You are a professional Dungeon Master creating engaging session recaps."},
            {"role": "user", "content": prompt}
        ]
        
        try:
            response = await self.ainvoke(messages)
            
            # Parse response (handle both mock and real responses)
            if self.is_mock:
                # Mock response structure
                return {
                    "recap_text": "This is a mock session recap. In production, this would be an AI-generated narrative summary of the game session, highlighting key events, character moments, and story progression.",
                    "key_events": [
                        "Party entered the ancient dungeon",
                        "Discovered mysterious artifact",
                        "Defeated goblin ambush"
                    ],
                    "npcs_met": ["Eldrin the Wise", "Goblin Chief Grax"],
                    "locations_visited": ["Ancient Dungeon Entrance", "Hall of Mirrors"],
                    "decisions_made": [
                        "Chose to spare the goblin prisoner",
                        "Decided to explore the eastern passage"
                    ],
                    "combat_encounters": [
                        "Goblin ambush - 4 goblins defeated"
                    ]
                }
            else:
                # Parse real OpenAI response
                import json
                content = response.content
                
                # Try to extract JSON from markdown code blocks
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                
                return json.loads(content)
        
        except Exception as e:
            # Fallback response on error
            return {
                "recap_text": f"Error generating recap: {str(e)}",
                "key_events": [],
                "npcs_met": [],
                "locations_visited": [],
                "decisions_made": [],
                "combat_encounters": []
            }


# Global service instance
openai_service = OpenAIService()
