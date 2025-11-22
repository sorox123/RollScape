"""
Mock Redis Service - In-memory cache for development.

Provides Redis-like functionality without running Redis server.
"""

import json
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import threading


class MockRedisService:
    """Mock Redis implementation using in-memory dictionary"""
    
    def __init__(self):
        self._storage: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()
    
    async def set(
        self,
        key: str,
        value: Any,
        expire: Optional[int] = None
    ) -> bool:
        """Set a key-value pair with optional expiration (seconds)"""
        with self._lock:
            # Serialize value if not string
            if not isinstance(value, str):
                value = json.dumps(value)
            
            expiry = None
            if expire:
                expiry = datetime.now() + timedelta(seconds=expire)
            
            self._storage[key] = {
                "value": value,
                "expiry": expiry,
                "created_at": datetime.now()
            }
            
            return True
    
    async def get(self, key: str) -> Optional[str]:
        """Get value by key"""
        with self._lock:
            if key not in self._storage:
                return None
            
            item = self._storage[key]
            
            # Check expiration
            if item["expiry"] and datetime.now() > item["expiry"]:
                del self._storage[key]
                return None
            
            return item["value"]
    
    async def delete(self, key: str) -> bool:
        """Delete a key"""
        with self._lock:
            if key in self._storage:
                del self._storage[key]
                return True
            return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists"""
        value = await self.get(key)
        return value is not None
    
    async def expire(self, key: str, seconds: int) -> bool:
        """Set expiration on existing key"""
        with self._lock:
            if key not in self._storage:
                return False
            
            self._storage[key]["expiry"] = datetime.now() + timedelta(seconds=seconds)
            return True
    
    async def ttl(self, key: str) -> int:
        """Get time to live for key (-1 if no expiry, -2 if doesn't exist)"""
        with self._lock:
            if key not in self._storage:
                return -2
            
            item = self._storage[key]
            if not item["expiry"]:
                return -1
            
            remaining = item["expiry"] - datetime.now()
            return int(remaining.total_seconds())
    
    async def setex(self, key: str, seconds: int, value: Any) -> bool:
        """Set key with expiration"""
        return await self.set(key, value, expire=seconds)
    
    async def hset(self, name: str, key: str, value: Any) -> bool:
        """Set hash field"""
        hash_key = f"hash:{name}"
        
        with self._lock:
            if hash_key not in self._storage:
                self._storage[hash_key] = {
                    "value": {},
                    "expiry": None,
                    "created_at": datetime.now()
                }
            
            hash_data = self._storage[hash_key]["value"]
            if isinstance(hash_data, str):
                hash_data = json.loads(hash_data)
            
            hash_data[key] = value
            self._storage[hash_key]["value"] = hash_data
            
            return True
    
    async def hget(self, name: str, key: str) -> Optional[Any]:
        """Get hash field"""
        hash_key = f"hash:{name}"
        
        with self._lock:
            if hash_key not in self._storage:
                return None
            
            hash_data = self._storage[hash_key]["value"]
            if isinstance(hash_data, str):
                hash_data = json.loads(hash_data)
            
            return hash_data.get(key)
    
    async def hgetall(self, name: str) -> Dict:
        """Get all hash fields"""
        hash_key = f"hash:{name}"
        
        with self._lock:
            if hash_key not in self._storage:
                return {}
            
            hash_data = self._storage[hash_key]["value"]
            if isinstance(hash_data, str):
                hash_data = json.loads(hash_data)
            
            return hash_data
    
    async def hdel(self, name: str, *keys: str) -> int:
        """Delete hash fields"""
        hash_key = f"hash:{name}"
        
        with self._lock:
            if hash_key not in self._storage:
                return 0
            
            hash_data = self._storage[hash_key]["value"]
            if isinstance(hash_data, str):
                hash_data = json.loads(hash_data)
            
            deleted = 0
            for key in keys:
                if key in hash_data:
                    del hash_data[key]
                    deleted += 1
            
            self._storage[hash_key]["value"] = hash_data
            return deleted
    
    async def keys(self, pattern: str = "*") -> list:
        """Get keys matching pattern (simplified - only supports *)"""
        with self._lock:
            if pattern == "*":
                return list(self._storage.keys())
            
            # Simple prefix match
            prefix = pattern.replace("*", "")
            return [k for k in self._storage.keys() if k.startswith(prefix)]
    
    async def flushall(self) -> bool:
        """Clear all data"""
        with self._lock:
            self._storage.clear()
            return True
    
    async def ping(self) -> bool:
        """Health check"""
        return True
    
    def _cleanup_expired(self):
        """Remove expired keys (call periodically in production)"""
        with self._lock:
            now = datetime.now()
            expired_keys = [
                key for key, item in self._storage.items()
                if item["expiry"] and now > item["expiry"]
            ]
            
            for key in expired_keys:
                del self._storage[key]
            
            return len(expired_keys)
    
    def get_stats(self) -> Dict:
        """Get cache statistics"""
        with self._lock:
            total_keys = len(self._storage)
            expired = sum(
                1 for item in self._storage.values()
                if item["expiry"] and datetime.now() > item["expiry"]
            )
            
            return {
                "total_keys": total_keys,
                "active_keys": total_keys - expired,
                "expired_keys": expired,
                "mock_mode": True,
                "memory_storage": True
            }


# Singleton instance
_mock_redis_service = None

def get_mock_redis_service() -> MockRedisService:
    """Get or create mock Redis service singleton"""
    global _mock_redis_service
    if _mock_redis_service is None:
        _mock_redis_service = MockRedisService()
    return _mock_redis_service
