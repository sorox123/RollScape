"""
Redis service with in-memory fallback for development.
"""

from typing import Optional, Any, Dict
import json
from datetime import datetime, timedelta
from services.service_config import redis_config, ServiceMode


class MockRedis:
    """In-memory Redis mock for development"""
    
    def __init__(self):
        self.data: Dict[str, tuple[Any, Optional[datetime]]] = {}
    
    def get(self, key: str) -> Optional[str]:
        """Get value"""
        if key not in self.data:
            return None
        
        value, expires_at = self.data[key]
        
        # Check expiration
        if expires_at and datetime.utcnow() > expires_at:
            del self.data[key]
            return None
        
        return value
    
    def set(self, key: str, value: str, ex: Optional[int] = None):
        """Set value with optional expiration"""
        expires_at = None
        if ex:
            expires_at = datetime.utcnow() + timedelta(seconds=ex)
        
        self.data[key] = (value, expires_at)
        return True
    
    def delete(self, *keys: str):
        """Delete keys"""
        count = 0
        for key in keys:
            if key in self.data:
                del self.data[key]
                count += 1
        return count
    
    def exists(self, key: str) -> bool:
        """Check if key exists"""
        return self.get(key) is not None
    
    def keys(self, pattern: str = "*") -> list:
        """Get keys matching pattern"""
        # Simple pattern matching (supports * wildcard)
        if pattern == "*":
            return list(self.data.keys())
        
        # Basic wildcard support
        if "*" in pattern:
            prefix = pattern.split("*")[0]
            return [k for k in self.data.keys() if k.startswith(prefix)]
        
        return [pattern] if pattern in self.data else []
    
    def expire(self, key: str, seconds: int):
        """Set expiration on key"""
        if key not in self.data:
            return False
        
        value, _ = self.data[key]
        expires_at = datetime.utcnow() + timedelta(seconds=seconds)
        self.data[key] = (value, expires_at)
        return True
    
    def ttl(self, key: str) -> int:
        """Get time to live"""
        if key not in self.data:
            return -2
        
        _, expires_at = self.data[key]
        if not expires_at:
            return -1
        
        remaining = (expires_at - datetime.utcnow()).total_seconds()
        return int(remaining) if remaining > 0 else -2
    
    def flushdb(self):
        """Clear all data"""
        self.data.clear()
        return True


class RedisService:
    """Redis service with automatic fallback to in-memory"""
    
    def __init__(self):
        self.config = redis_config
        
        if self.config.mode == ServiceMode.MOCK or not self.config.url:
            self.client = MockRedis()
            self.is_mock = True
        else:
            self._init_production()
            self.is_mock = False
    
    def _init_production(self):
        """Initialize production Redis client"""
        try:
            import redis
            self.client = redis.from_url(
                self.config.url,
                max_connections=self.config.max_connections,
                decode_responses=True
            )
        except ImportError:
            raise ImportError("redis package required: pip install redis")
    
    # JSON helpers
    def get_json(self, key: str) -> Optional[Any]:
        """Get JSON value"""
        value = self.client.get(key)
        if value is None:
            return None
        
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return value
    
    def set_json(self, key: str, value: Any, ex: Optional[int] = None):
        """Set JSON value"""
        json_str = json.dumps(value)
        return self.client.set(key, json_str, ex=ex)
    
    # Game-specific helpers
    def get_session_state(self, session_id: str) -> Optional[Dict]:
        """Get game session state"""
        return self.get_json(f"session:{session_id}")
    
    def set_session_state(self, session_id: str, state: Dict, ttl: Optional[int] = None):
        """Set game session state"""
        ttl = ttl or self.config.ttl_default
        return self.set_json(f"session:{session_id}", state, ex=ttl)
    
    def get_character_state(self, character_id: str) -> Optional[Dict]:
        """Get character state"""
        return self.get_json(f"character:{character_id}")
    
    def set_character_state(self, character_id: str, state: Dict, ttl: Optional[int] = None):
        """Set character state"""
        ttl = ttl or self.config.ttl_default
        return self.set_json(f"character:{character_id}", state, ex=ttl)
    
    def get_combat_state(self, combat_id: str) -> Optional[Dict]:
        """Get combat state"""
        return self.get_json(f"combat:{combat_id}")
    
    def set_combat_state(self, combat_id: str, state: Dict, ttl: Optional[int] = None):
        """Set combat state"""
        ttl = ttl or self.config.ttl_default
        return self.set_json(f"combat:{combat_id}", state, ex=ttl)
    
    def clear_session(self, session_id: str):
        """Clear all session data"""
        keys = self.client.keys(f"session:{session_id}*")
        if keys:
            self.client.delete(*keys)
    
    # Social network helpers
    def set_user_online(self, user_id: str, ttl: int = 300):
        """
        Mark user as online (5 min TTL by default).
        Refresh on any user activity.
        """
        return self.client.set(f"user:{user_id}:online", "true", ex=ttl)
    
    def is_user_online(self, user_id: str) -> bool:
        """Check if user is currently online"""
        return self.client.exists(f"user:{user_id}:online")
    
    def get_online_users(self, user_ids: list[str]) -> list[str]:
        """Get list of online users from given IDs"""
        return [uid for uid in user_ids if self.is_user_online(uid)]
    
    def set_typing_indicator(self, conversation_id: str, user_id: str, ttl: int = 5):
        """
        Set typing indicator (5 sec TTL).
        Client should refresh every 3 seconds while typing.
        """
        return self.client.set(f"conv:{conversation_id}:typing:{user_id}", "true", ex=ttl)
    
    def get_typing_users(self, conversation_id: str) -> list[str]:
        """Get list of users currently typing in conversation"""
        pattern = f"conv:{conversation_id}:typing:*"
        keys = self.client.keys(pattern)
        return [key.split(":")[-1] for key in keys]
    
    def get_unread_count(self, user_id: str) -> int:
        """Get total unread message count for user"""
        count = self.get(f"user:{user_id}:unread_total")
        return int(count) if count else 0
    
    def set_unread_count(self, user_id: str, count: int, ttl: Optional[int] = None):
        """Set total unread message count"""
        ttl = ttl or self.config.ttl_default
        return self.client.set(f"user:{user_id}:unread_total", str(count), ex=ttl)
    
    def increment_unread(self, user_id: str):
        """Increment unread count for user"""
        key = f"user:{user_id}:unread_total"
        if not self.client.exists(key):
            self.set_unread_count(user_id, 1)
        else:
            current = self.get_unread_count(user_id)
            self.set_unread_count(user_id, current + 1)
    
    def cache_conversation_messages(self, conversation_id: str, messages: list, limit: int = 50, ttl: int = 600):
        """
        Cache recent messages for fast retrieval.
        10 min TTL, refreshed on new message.
        """
        recent = messages[-limit:] if len(messages) > limit else messages
        return self.set_json(f"conv:{conversation_id}:messages", recent, ex=ttl)
    
    def get_cached_messages(self, conversation_id: str) -> Optional[list]:
        """Get cached messages for conversation"""
        return self.get_json(f"conv:{conversation_id}:messages")
    
    def cache_user_inbox(self, user_id: str, conversations: list, ttl: int = 300):
        """
        Cache user's inbox (conversation list).
        5 min TTL, refreshed on activity.
        """
        return self.set_json(f"user:{user_id}:inbox", conversations, ex=ttl)
    
    def get_cached_inbox(self, user_id: str) -> Optional[list]:
        """Get cached inbox for user"""
        return self.get_json(f"user:{user_id}:inbox")
    
    # Passthrough methods
    def get(self, key: str) -> Optional[str]:
        """Get value"""
        return self.client.get(key)
    
    def set(self, key: str, value: str, ex: Optional[int] = None):
        """Set value"""
        return self.client.set(key, value, ex=ex)
    
    def delete(self, *keys: str):
        """Delete keys"""
        return self.client.delete(*keys)
    
    def exists(self, key: str) -> bool:
        """Check if key exists"""
        return self.client.exists(key)
    
    def keys(self, pattern: str = "*") -> list:
        """Get keys"""
        return self.client.keys(pattern)


# Global service instance
redis_service = RedisService()
