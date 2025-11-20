"""
Supabase service with mock mode support.
Handles authentication, database, and storage.
"""

from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import uuid
from services.service_config import supabase_config, ServiceMode


class MockSupabaseAuth:
    """Mock authentication for development"""
    
    def __init__(self):
        self.users: Dict[str, Dict] = {}
        self.sessions: Dict[str, Dict] = {}
    
    def sign_up(self, email: str, password: str) -> Dict:
        """Mock user registration"""
        user_id = str(uuid.uuid4())
        user = {
            "id": user_id,
            "email": email,
            "created_at": datetime.utcnow().isoformat(),
            "email_confirmed": True  # Auto-confirm in mock
        }
        self.users[user_id] = user
        
        # Create session
        session_token = str(uuid.uuid4())
        self.sessions[session_token] = {
            "user_id": user_id,
            "expires_at": (datetime.utcnow() + timedelta(days=7)).isoformat()
        }
        
        return {
            "user": user,
            "session": {
                "access_token": session_token,
                "refresh_token": str(uuid.uuid4())
            }
        }
    
    def sign_in(self, email: str, password: str) -> Dict:
        """Mock user sign in"""
        # Find user by email
        user = next((u for u in self.users.values() if u["email"] == email), None)
        
        if not user:
            raise ValueError("Invalid credentials")
        
        # Create new session
        session_token = str(uuid.uuid4())
        self.sessions[session_token] = {
            "user_id": user["id"],
            "expires_at": (datetime.utcnow() + timedelta(days=7)).isoformat()
        }
        
        return {
            "user": user,
            "session": {
                "access_token": session_token,
                "refresh_token": str(uuid.uuid4())
            }
        }
    
    def get_user(self, token: str) -> Optional[Dict]:
        """Get user from token"""
        session = self.sessions.get(token)
        if not session:
            return None
        
        # Check expiration
        if datetime.fromisoformat(session["expires_at"]) < datetime.utcnow():
            return None
        
        return self.users.get(session["user_id"])
    
    def sign_out(self, token: str):
        """Sign out user"""
        if token in self.sessions:
            del self.sessions[token]


class MockSupabaseDB:
    """Mock database for development"""
    
    def __init__(self):
        self.tables: Dict[str, List[Dict]] = {}
    
    def table(self, table_name: str):
        """Get table reference"""
        if table_name not in self.tables:
            self.tables[table_name] = []
        return MockTable(self.tables[table_name])


class MockTable:
    """Mock table operations"""
    
    def __init__(self, data: List[Dict]):
        self.data = data
        self._filters = []
    
    def select(self, columns: str = "*"):
        """Select columns"""
        return self
    
    def insert(self, data: Dict):
        """Insert data"""
        if "id" not in data:
            data["id"] = str(uuid.uuid4())
        if "created_at" not in data:
            data["created_at"] = datetime.utcnow().isoformat()
        
        self.data.append(data)
        return MockResponse([data])
    
    def update(self, data: Dict):
        """Update data"""
        data["updated_at"] = datetime.utcnow().isoformat()
        
        # Apply filters and update
        for item in self.data:
            if self._matches_filters(item):
                item.update(data)
        
        return MockResponse([item for item in self.data if self._matches_filters(item)])
    
    def delete(self):
        """Delete data"""
        to_delete = [item for item in self.data if self._matches_filters(item)]
        self.data[:] = [item for item in self.data if not self._matches_filters(item)]
        return MockResponse(to_delete)
    
    def eq(self, column: str, value: Any):
        """Filter equal"""
        self._filters.append(("eq", column, value))
        return self
    
    def neq(self, column: str, value: Any):
        """Filter not equal"""
        self._filters.append(("neq", column, value))
        return self
    
    def gt(self, column: str, value: Any):
        """Filter greater than"""
        self._filters.append(("gt", column, value))
        return self
    
    def lt(self, column: str, value: Any):
        """Filter less than"""
        self._filters.append(("lt", column, value))
        return self
    
    def execute(self):
        """Execute query"""
        results = [item for item in self.data if self._matches_filters(item)]
        return MockResponse(results)
    
    def _matches_filters(self, item: Dict) -> bool:
        """Check if item matches all filters"""
        for op, column, value in self._filters:
            if column not in item:
                return False
            
            if op == "eq" and item[column] != value:
                return False
            elif op == "neq" and item[column] == value:
                return False
            elif op == "gt" and item[column] <= value:
                return False
            elif op == "lt" and item[column] >= value:
                return False
        
        return True


class MockResponse:
    """Mock response object"""
    
    def __init__(self, data: List[Dict]):
        self.data = data
    
    @property
    def error(self):
        return None


class MockSupabaseStorage:
    """Mock storage for development"""
    
    def __init__(self):
        self.buckets: Dict[str, Dict[str, bytes]] = {}
    
    def from_(self, bucket: str):
        """Get bucket reference"""
        if bucket not in self.buckets:
            self.buckets[bucket] = {}
        return MockBucket(self.buckets[bucket])


class MockBucket:
    """Mock storage bucket"""
    
    def __init__(self, files: Dict[str, bytes]):
        self.files = files
    
    def upload(self, path: str, data: bytes):
        """Upload file"""
        self.files[path] = data
        return {"path": path}
    
    def download(self, path: str):
        """Download file"""
        return self.files.get(path)
    
    def remove(self, paths: List[str]):
        """Remove files"""
        for path in paths:
            self.files.pop(path, None)
        return {"deleted": paths}


class SupabaseService:
    """Unified Supabase service with mock support"""
    
    def __init__(self):
        self.config = supabase_config
        
        if self.config.mode == ServiceMode.MOCK:
            self.auth = MockSupabaseAuth()
            self.db = MockSupabaseDB()
            self.storage = MockSupabaseStorage()
        else:
            self._init_production()
    
    def _init_production(self):
        """Initialize production Supabase client"""
        if not self.config.url or not self.config.key:
            raise ValueError("Supabase URL and key required for production mode")
        
        try:
            from supabase import create_client
            client = create_client(self.config.url, self.config.key)
            self.auth = client.auth
            self.db = client
            self.storage = client.storage
        except ImportError:
            raise ImportError("supabase package required for production mode: pip install supabase")
    
    def is_mock(self) -> bool:
        """Check if running in mock mode"""
        return self.config.mode == ServiceMode.MOCK


# Global service instance
supabase_service = SupabaseService()
