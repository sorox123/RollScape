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
