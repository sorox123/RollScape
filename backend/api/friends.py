"""
Friends and social relationships API.
Handles friend requests, friendships, blocking.
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

from services.supabase_service import supabase_service
from services.redis_service import redis_service


router = APIRouter(prefix="/api/friends", tags=["friends"])


# ===== Request/Response Models =====

class FriendRequestCreate(BaseModel):
    """Request to send friend request"""
    friend_id: str


class FriendRequestResponse(BaseModel):
    """Response for friend request action"""
    friendship_id: str
    status: str
    message: str


class FriendProfile(BaseModel):
    """Friend profile information"""
    user_id: str
    username: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_online: bool = False
    friendship_id: str
    friends_since: str
    mutual_friends_count: int = 0


class PendingRequest(BaseModel):
    """Pending friend request"""
    friendship_id: str
    user_id: str
    username: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_requester: bool  # True if they sent request to you
    created_at: str


class BlockUserRequest(BaseModel):
    """Request to block user"""
    user_id: str
    reason: Optional[str] = None


# ===== Endpoints =====

@router.post("/request", response_model=FriendRequestResponse)
async def send_friend_request(request: FriendRequestCreate, current_user_id: str = "demo-user"):
    """
    Send a friend request to another user.
    Uses normalized IDs to prevent duplicates.
    """
    # Validate not sending to self
    if request.friend_id == current_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send friend request to yourself"
        )
    
    # Check if friendship already exists
    user_id_1, user_id_2 = _normalize_ids(current_user_id, request.friend_id)
    
    existing = supabase_service.db.table("friendships")\
        .select("*")\
        .eq("user_id_1", user_id_1)\
        .eq("user_id_2", user_id_2)\
        .execute()
    
    if existing.data:
        friendship = existing.data[0]
        if friendship["status"] == "accepted":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already friends with this user"
            )
        elif friendship["status"] == "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Friend request already pending"
            )
        elif friendship["status"] == "blocked":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot send friend request to this user"
            )
    
    # Check if blocked
    is_blocked = await _check_blocked(current_user_id, request.friend_id)
    if is_blocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot send friend request to this user"
        )
    
    # Create friendship request
    friendship_data = {
        "id": str(uuid.uuid4()),
        "user_id_1": user_id_1,
        "user_id_2": user_id_2,
        "requester_id": current_user_id,
        "status": "pending",
        "created_at": datetime.utcnow().isoformat()
    }
    
    result = supabase_service.db.table("friendships").insert(friendship_data)
    
    return FriendRequestResponse(
        friendship_id=friendship_data["id"],
        status="pending",
        message="Friend request sent"
    )


@router.post("/{friendship_id}/accept", response_model=FriendRequestResponse)
async def accept_friend_request(friendship_id: str, current_user_id: str = "demo-user"):
    """Accept a pending friend request"""
    
    # Get friendship
    friendship = await _get_friendship(friendship_id)
    
    # Verify user can accept (not the requester)
    if friendship["requester_id"] == current_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot accept your own friend request"
        )
    
    # Verify user is part of this friendship
    if friendship["user_id_1"] != current_user_id and friendship["user_id_2"] != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to accept this request"
        )
    
    # Verify status is pending
    if friendship["status"] != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot accept friendship with status: {friendship['status']}"
        )
    
    # Update to accepted
    update_data = {
        "status": "accepted",
        "accepted_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    supabase_service.db.table("friendships")\
        .update(update_data)\
        .eq("id", friendship_id)\
        .execute()
    
    # Clear cached friend lists
    _clear_friend_cache(friendship["user_id_1"])
    _clear_friend_cache(friendship["user_id_2"])
    
    return FriendRequestResponse(
        friendship_id=friendship_id,
        status="accepted",
        message="Friend request accepted"
    )


@router.post("/{friendship_id}/decline", response_model=FriendRequestResponse)
async def decline_friend_request(friendship_id: str, current_user_id: str = "demo-user"):
    """Decline a pending friend request"""
    
    friendship = await _get_friendship(friendship_id)
    
    # Verify user can decline (not the requester)
    if friendship["requester_id"] == current_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot decline your own friend request. Use cancel instead."
        )
    
    # Verify user is part of this friendship
    if friendship["user_id_1"] != current_user_id and friendship["user_id_2"] != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Update to declined
    supabase_service.db.table("friendships")\
        .update({"status": "declined", "updated_at": datetime.utcnow().isoformat()})\
        .eq("id", friendship_id)\
        .execute()
    
    return FriendRequestResponse(
        friendship_id=friendship_id,
        status="declined",
        message="Friend request declined"
    )


@router.delete("/{friendship_id}")
async def remove_friend(friendship_id: str, current_user_id: str = "demo-user"):
    """
    Remove a friend or cancel friend request.
    Deletes the friendship record.
    """
    friendship = await _get_friendship(friendship_id)
    
    # Verify user is part of this friendship
    if friendship["user_id_1"] != current_user_id and friendship["user_id_2"] != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Delete friendship
    supabase_service.db.table("friendships").delete().eq("id", friendship_id).execute()
    
    # Clear caches
    _clear_friend_cache(friendship["user_id_1"])
    _clear_friend_cache(friendship["user_id_2"])
    
    return {"message": "Friendship removed", "friendship_id": friendship_id}


@router.get("/list", response_model=List[FriendProfile])
async def get_friends(current_user_id: str = "demo-user", include_online_status: bool = True):
    """
    Get list of all friends (accepted friendships).
    Includes online status from Redis.
    """
    # Try cache first
    if redis_service.is_mock:
        cached = redis_service.get_cached_inbox(f"{current_user_id}:friends")
        if cached:
            return cached
    
    # Query friendships
    friendships = supabase_service.db.table("friendships")\
        .select("*")\
        .eq("status", "accepted")\
        .execute()
    
    # Filter for current user
    user_friendships = [
        f for f in friendships.data 
        if f["user_id_1"] == current_user_id or f["user_id_2"] == current_user_id
    ]
    
    # Get friend IDs
    friend_ids = [
        f["user_id_2"] if f["user_id_1"] == current_user_id else f["user_id_1"]
        for f in user_friendships
    ]
    
    # Get online status
    online_ids = set()
    if include_online_status:
        online_ids = set(redis_service.get_online_users(friend_ids))
    
    # Build friend profiles
    friends = []
    for friendship in user_friendships:
        friend_id = friendship["user_id_2"] if friendship["user_id_1"] == current_user_id else friendship["user_id_1"]
        
        # Get user info (mock for now)
        friends.append(FriendProfile(
            user_id=friend_id,
            username=f"user_{friend_id[:8]}",
            display_name=f"User {friend_id[:8]}",
            is_online=friend_id in online_ids,
            friendship_id=friendship["id"],
            friends_since=friendship.get("accepted_at", friendship["created_at"]),
            mutual_friends_count=0  # TODO: Calculate
        ))
    
    # Cache result
    if redis_service.is_mock:
        redis_service.cache_user_inbox(f"{current_user_id}:friends", [f.dict() for f in friends])
    
    return friends


@router.get("/pending", response_model=List[PendingRequest])
async def get_pending_requests(current_user_id: str = "demo-user"):
    """
    Get all pending friend requests (sent and received).
    """
    friendships = supabase_service.db.table("friendships")\
        .select("*")\
        .eq("status", "pending")\
        .execute()
    
    # Filter for current user
    pending = [
        f for f in friendships.data 
        if f["user_id_1"] == current_user_id or f["user_id_2"] == current_user_id
    ]
    
    requests = []
    for friendship in pending:
        other_user_id = friendship["user_id_2"] if friendship["user_id_1"] == current_user_id else friendship["user_id_1"]
        is_requester = friendship["requester_id"] == current_user_id
        
        requests.append(PendingRequest(
            friendship_id=friendship["id"],
            user_id=other_user_id,
            username=f"user_{other_user_id[:8]}",
            display_name=f"User {other_user_id[:8]}",
            is_requester=is_requester,
            created_at=friendship["created_at"]
        ))
    
    return requests


@router.post("/block", response_model=dict)
async def block_user(request: BlockUserRequest, current_user_id: str = "demo-user"):
    """
    Block a user. Removes any existing friendship.
    """
    if request.user_id == current_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot block yourself"
        )
    
    # Check if already blocked
    existing = supabase_service.db.table("blocked_users")\
        .select("*")\
        .eq("blocker_id", current_user_id)\
        .eq("blocked_id", request.user_id)\
        .execute()
    
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already blocked"
        )
    
    # Remove any existing friendship
    user_id_1, user_id_2 = _normalize_ids(current_user_id, request.user_id)
    supabase_service.db.table("friendships")\
        .delete()\
        .eq("user_id_1", user_id_1)\
        .eq("user_id_2", user_id_2)\
        .execute()
    
    # Create block
    block_data = {
        "id": str(uuid.uuid4()),
        "blocker_id": current_user_id,
        "blocked_id": request.user_id,
        "reason": request.reason,
        "created_at": datetime.utcnow().isoformat()
    }
    
    supabase_service.db.table("blocked_users").insert(block_data)
    
    return {"message": "User blocked", "blocked_id": request.user_id}


@router.delete("/block/{user_id}")
async def unblock_user(user_id: str, current_user_id: str = "demo-user"):
    """Unblock a user"""
    
    result = supabase_service.db.table("blocked_users")\
        .delete()\
        .eq("blocker_id", current_user_id)\
        .eq("blocked_id", user_id)\
        .execute()
    
    return {"message": "User unblocked", "user_id": user_id}


@router.get("/blocked", response_model=List[dict])
async def get_blocked_users(current_user_id: str = "demo-user"):
    """Get list of blocked users"""
    
    blocks = supabase_service.db.table("blocked_users")\
        .select("*")\
        .eq("blocker_id", current_user_id)\
        .execute()
    
    return blocks.data


# ===== Helper Functions =====

def _normalize_ids(id1: str, id2: str) -> tuple[str, str]:
    """Normalize user IDs (lower first)"""
    return (id1, id2) if id1 < id2 else (id2, id1)


async def _get_friendship(friendship_id: str) -> dict:
    """Get friendship by ID or raise 404"""
    result = supabase_service.db.table("friendships")\
        .select("*")\
        .eq("id", friendship_id)\
        .execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Friendship not found"
        )
    
    return result.data[0]


async def _check_blocked(user_id: str, other_user_id: str) -> bool:
    """Check if either user has blocked the other"""
    blocks = supabase_service.db.table("blocked_users")\
        .select("*")\
        .execute()
    
    for block in blocks.data:
        if (block["blocker_id"] == user_id and block["blocked_id"] == other_user_id) or \
           (block["blocker_id"] == other_user_id and block["blocked_id"] == user_id):
            return True
    
    return False


def _clear_friend_cache(user_id: str):
    """Clear cached friend list for user"""
    redis_service.delete(f"user:{user_id}:inbox:friends")
