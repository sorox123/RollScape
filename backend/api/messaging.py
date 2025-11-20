"""
Messaging and conversations API.
Steam-style persistent messaging system.
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from services.supabase_service import supabase_service
from services.redis_service import redis_service


router = APIRouter(prefix="/api/messages", tags=["messages"])


# ===== Request/Response Models =====

class ConversationCreate(BaseModel):
    """Request to create conversation"""
    participant_ids: List[str]
    type: str = "direct"  # direct, group, campaign
    name: Optional[str] = None
    description: Optional[str] = None
    campaign_id: Optional[str] = None


class ConversationResponse(BaseModel):
    """Conversation information"""
    id: str
    type: str
    name: Optional[str] = None
    description: Optional[str] = None
    campaign_id: Optional[str] = None
    participant_count: int
    created_at: str
    last_message_at: str
    unread_count: int = 0


class MessageSend(BaseModel):
    """Request to send message"""
    content: str
    message_type: str = "text"  # text, image, dice_roll, system
    metadata: Optional[Dict[str, Any]] = None
    reply_to_id: Optional[str] = None


class MessageResponse(BaseModel):
    """Message information"""
    id: str
    conversation_id: str
    sender_id: str
    sender_name: str
    content: str
    message_type: str
    metadata: Optional[Dict[str, Any]] = None
    reply_to_id: Optional[str] = None
    created_at: str
    edited_at: Optional[str] = None
    is_deleted: bool = False


class InboxConversation(BaseModel):
    """Conversation in inbox view"""
    id: str
    type: str
    name: Optional[str] = None
    participant_ids: List[str]
    last_message: Optional[MessageResponse] = None
    unread_count: int = 0
    is_pinned: bool = False
    is_muted: bool = False
    last_activity: str


class TypingIndicator(BaseModel):
    """Request to set typing indicator"""
    conversation_id: str
    is_typing: bool


class MarkReadRequest(BaseModel):
    """Request to mark messages as read"""
    message_id: str  # Last read message ID


# ===== Endpoints =====

@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(
    request: ConversationCreate, 
    current_user_id: str = "demo-user"
):
    """
    Create a new conversation.
    For direct messages, checks if conversation already exists.
    """
    # Validate participants
    if not request.participant_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one participant required"
        )
    
    # Add creator to participants if not included
    all_participants = list(set(request.participant_ids + [current_user_id]))
    
    # Validate conversation type
    if request.type == "direct" and len(all_participants) != 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Direct conversations must have exactly 2 participants"
        )
    
    # Check if direct conversation already exists
    if request.type == "direct":
        existing = await _find_direct_conversation(all_participants[0], all_participants[1])
        if existing:
            return await _build_conversation_response(existing["id"], current_user_id)
    
    # Create conversation
    conversation_id = str(uuid.uuid4())
    conversation_data = {
        "id": conversation_id,
        "type": request.type,
        "name": request.name,
        "description": request.description,
        "campaign_id": request.campaign_id,
        "created_by": current_user_id,
        "created_at": datetime.utcnow().isoformat(),
        "last_message_at": datetime.utcnow().isoformat()
    }
    
    supabase_service.db.table("conversations").insert(conversation_data)
    
    # Add participants
    for participant_id in all_participants:
        participant_data = {
            "id": str(uuid.uuid4()),
            "conversation_id": conversation_id,
            "user_id": participant_id,
            "joined_at": datetime.utcnow().isoformat(),
            "is_active": True,
            "role": "admin" if participant_id == current_user_id else "member"
        }
        supabase_service.db.table("conversation_participants").insert(participant_data)
    
    return await _build_conversation_response(conversation_id, current_user_id)


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(conversation_id: str, current_user_id: str = "demo-user"):
    """Get conversation details"""
    
    # Verify user is participant
    await _verify_participant(conversation_id, current_user_id)
    
    return await _build_conversation_response(conversation_id, current_user_id)


@router.get("/inbox", response_model=List[InboxConversation])
async def get_inbox(current_user_id: str = "demo-user", limit: int = 50):
    """
    Get user's inbox (all conversations they're in).
    Sorted by last activity, includes unread counts.
    """
    # Try cache first
    cached = redis_service.get_cached_inbox(current_user_id)
    if cached:
        return cached
    
    # Get user's participations
    participations = supabase_service.db.table("conversation_participants")\
        .select("*")\
        .eq("user_id", current_user_id)\
        .eq("is_active", True)\
        .execute()
    
    if not participations.data:
        return []
    
    # Get conversation IDs
    conv_ids = [p["conversation_id"] for p in participations.data]
    
    # Get conversations
    conversations = supabase_service.db.table("conversations")\
        .select("*")\
        .execute()
    
    # Filter to user's conversations
    user_convs = [c for c in conversations.data if c["id"] in conv_ids]
    
    # Build inbox items
    inbox = []
    for conv in user_convs:
        # Get participation for this user
        participation = next(p for p in participations.data if p["conversation_id"] == conv["id"])
        
        # Get last message
        last_msg = await _get_last_message(conv["id"])
        
        # Get unread count
        unread = await _get_unread_count(conv["id"], current_user_id, participation)
        
        # Get other participants
        other_participants = await _get_participant_ids(conv["id"], exclude=current_user_id)
        
        inbox.append(InboxConversation(
            id=conv["id"],
            type=conv["type"],
            name=conv.get("name") or _generate_conversation_name(conv, other_participants),
            participant_ids=other_participants,
            last_message=last_msg,
            unread_count=unread,
            is_pinned=participation.get("is_pinned", False),
            is_muted=participation.get("is_muted", False),
            last_activity=conv["last_message_at"]
        ))
    
    # Sort by last activity
    inbox.sort(key=lambda x: x.last_activity, reverse=True)
    
    # Apply limit
    inbox = inbox[:limit]
    
    # Cache result
    redis_service.cache_user_inbox(current_user_id, [i.dict() for i in inbox])
    
    return inbox


@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: str,
    message: MessageSend,
    current_user_id: str = "demo-user"
):
    """
    Send a message in a conversation.
    Updates conversation last_message_at and increments unread counts.
    """
    # Verify user is participant
    await _verify_participant(conversation_id, current_user_id)
    
    # Create message
    message_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    message_data = {
        "id": message_id,
        "conversation_id": conversation_id,
        "sender_id": current_user_id,
        "content": message.content,
        "message_type": message.message_type,
        "metadata": message.metadata,
        "reply_to_id": message.reply_to_id,
        "created_at": now
    }
    
    supabase_service.db.table("messages").insert(message_data)
    
    # Update conversation last_message_at
    supabase_service.db.table("conversations")\
        .update({"last_message_at": now})\
        .eq("id", conversation_id)\
        .execute()
    
    # Increment unread counts for other participants
    await _increment_unread_for_participants(conversation_id, current_user_id)
    
    # Clear caches
    redis_service.delete(f"conv:{conversation_id}:messages")
    
    participants = await _get_participant_ids(conversation_id)
    for participant_id in participants:
        redis_service.delete(f"user:{participant_id}:inbox")
    
    return MessageResponse(
        id=message_id,
        conversation_id=conversation_id,
        sender_id=current_user_id,
        sender_name=f"User {current_user_id[:8]}",
        content=message.content,
        message_type=message.message_type,
        metadata=message.metadata,
        reply_to_id=message.reply_to_id,
        created_at=now
    )


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    conversation_id: str,
    current_user_id: str = "demo-user",
    limit: int = 50,
    before_id: Optional[str] = None
):
    """
    Get messages from conversation.
    Supports pagination with before_id.
    """
    # Verify user is participant
    await _verify_participant(conversation_id, current_user_id)
    
    # Try cache for recent messages
    if not before_id:
        cached = redis_service.get_cached_messages(conversation_id)
        if cached:
            return [MessageResponse(**msg) for msg in cached]
    
    # Query messages
    query = supabase_service.db.table("messages")\
        .select("*")\
        .eq("conversation_id", conversation_id)
    
    # Pagination
    if before_id:
        # Get timestamp of before_id message
        before_msg = supabase_service.db.table("messages")\
            .select("created_at")\
            .eq("id", before_id)\
            .execute()
        
        if before_msg.data:
            query = query.lt("created_at", before_msg.data[0]["created_at"])
    
    result = query.order("created_at", desc=True).limit(limit).execute()
    
    # Build responses
    messages = []
    for msg in result.data:
        if msg.get("deleted_at"):
            continue
        
        messages.append(MessageResponse(
            id=msg["id"],
            conversation_id=msg["conversation_id"],
            sender_id=msg["sender_id"],
            sender_name=f"User {msg['sender_id'][:8]}",
            content=msg["content"],
            message_type=msg["message_type"],
            metadata=msg.get("metadata"),
            reply_to_id=msg.get("reply_to_id"),
            created_at=msg["created_at"],
            edited_at=msg.get("edited_at"),
            is_deleted=False
        ))
    
    # Cache if recent messages
    if not before_id:
        redis_service.cache_conversation_messages(
            conversation_id,
            [m.dict() for m in messages]
        )
    
    # Reverse to chronological order
    messages.reverse()
    
    return messages


@router.post("/conversations/{conversation_id}/read")
async def mark_as_read(
    conversation_id: str,
    request: MarkReadRequest,
    current_user_id: str = "demo-user"
):
    """
    Mark messages as read up to a specific message ID.
    Updates last_read_message_id for user's participation.
    """
    # Verify user is participant
    participation = await _get_participation(conversation_id, current_user_id)
    
    # Update participation
    update_data = {
        "last_read_message_id": request.message_id,
        "last_read_at": datetime.utcnow().isoformat()
    }
    
    supabase_service.db.table("conversation_participants")\
        .update(update_data)\
        .eq("id", participation["id"])\
        .execute()
    
    # Clear cache
    redis_service.delete(f"user:{current_user_id}:inbox")
    
    return {"message": "Marked as read", "last_read_message_id": request.message_id}


@router.post("/typing")
async def set_typing_indicator(indicator: TypingIndicator, current_user_id: str = "demo-user"):
    """
    Set typing indicator for conversation.
    Client should call this every 3 seconds while typing.
    """
    # Verify user is participant
    await _verify_participant(indicator.conversation_id, current_user_id)
    
    if indicator.is_typing:
        redis_service.set_typing_indicator(indicator.conversation_id, current_user_id)
    else:
        redis_service.delete(f"conv:{indicator.conversation_id}:typing:{current_user_id}")
    
    return {"message": "Typing indicator updated"}


@router.get("/conversations/{conversation_id}/typing", response_model=List[str])
async def get_typing_users(conversation_id: str, current_user_id: str = "demo-user"):
    """Get list of users currently typing in conversation"""
    
    await _verify_participant(conversation_id, current_user_id)
    
    typing_users = redis_service.get_typing_users(conversation_id)
    # Exclude current user
    typing_users = [u for u in typing_users if u != current_user_id]
    
    return typing_users


@router.delete("/messages/{message_id}")
async def delete_message(message_id: str, current_user_id: str = "demo-user"):
    """
    Soft delete a message (only sender can delete).
    Message content replaced with [deleted].
    """
    # Get message
    message = supabase_service.db.table("messages")\
        .select("*")\
        .eq("id", message_id)\
        .execute()
    
    if not message.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    msg = message.data[0]
    
    # Verify sender
    if msg["sender_id"] != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only delete your own messages"
        )
    
    # Soft delete
    supabase_service.db.table("messages")\
        .update({
            "content": "[deleted]",
            "deleted_at": datetime.utcnow().isoformat()
        })\
        .eq("id", message_id)\
        .execute()
    
    # Clear cache
    redis_service.delete(f"conv:{msg['conversation_id']}:messages")
    
    return {"message": "Message deleted", "message_id": message_id}


# ===== Helper Functions =====

async def _find_direct_conversation(user_id_1: str, user_id_2: str) -> Optional[dict]:
    """Find existing direct conversation between two users"""
    
    # Get all direct conversations
    conversations = supabase_service.db.table("conversations")\
        .select("*")\
        .eq("type", "direct")\
        .execute()
    
    for conv in conversations.data:
        # Get participants
        participants = await _get_participant_ids(conv["id"])
        if set(participants) == {user_id_1, user_id_2}:
            return conv
    
    return None


async def _verify_participant(conversation_id: str, user_id: str):
    """Verify user is active participant in conversation"""
    participation = supabase_service.db.table("conversation_participants")\
        .select("*")\
        .eq("conversation_id", conversation_id)\
        .eq("user_id", user_id)\
        .eq("is_active", True)\
        .execute()
    
    if not participation.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a participant in this conversation"
        )


async def _get_participation(conversation_id: str, user_id: str) -> dict:
    """Get user's participation record"""
    participation = supabase_service.db.table("conversation_participants")\
        .select("*")\
        .eq("conversation_id", conversation_id)\
        .eq("user_id", user_id)\
        .execute()
    
    if not participation.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a participant"
        )
    
    return participation.data[0]


async def _get_participant_ids(conversation_id: str, exclude: Optional[str] = None) -> List[str]:
    """Get list of participant user IDs"""
    participants = supabase_service.db.table("conversation_participants")\
        .select("user_id")\
        .eq("conversation_id", conversation_id)\
        .eq("is_active", True)\
        .execute()
    
    user_ids = [p["user_id"] for p in participants.data]
    
    if exclude:
        user_ids = [uid for uid in user_ids if uid != exclude]
    
    return user_ids


async def _get_last_message(conversation_id: str) -> Optional[MessageResponse]:
    """Get last message in conversation"""
    messages = supabase_service.db.table("messages")\
        .select("*")\
        .eq("conversation_id", conversation_id)\
        .order("created_at", desc=True)\
        .limit(1)\
        .execute()
    
    if not messages.data:
        return None
    
    msg = messages.data[0]
    
    if msg.get("deleted_at"):
        return None
    
    return MessageResponse(
        id=msg["id"],
        conversation_id=msg["conversation_id"],
        sender_id=msg["sender_id"],
        sender_name=f"User {msg['sender_id'][:8]}",
        content=msg["content"],
        message_type=msg["message_type"],
        metadata=msg.get("metadata"),
        created_at=msg["created_at"]
    )


async def _get_unread_count(conversation_id: str, user_id: str, participation: dict) -> int:
    """Calculate unread message count for user"""
    last_read_id = participation.get("last_read_message_id")
    
    if not last_read_id:
        # Never read, count all messages
        messages = supabase_service.db.table("messages")\
            .select("id")\
            .eq("conversation_id", conversation_id)\
            .execute()
        return len(messages.data)
    
    # Count messages after last read
    last_read_msg = supabase_service.db.table("messages")\
        .select("created_at")\
        .eq("id", last_read_id)\
        .execute()
    
    if not last_read_msg.data:
        return 0
    
    newer_messages = supabase_service.db.table("messages")\
        .select("id")\
        .eq("conversation_id", conversation_id)\
        .gt("created_at", last_read_msg.data[0]["created_at"])\
        .execute()
    
    return len(newer_messages.data)


async def _increment_unread_for_participants(conversation_id: str, exclude_user_id: str):
    """Increment unread counts for all participants except sender"""
    participants = await _get_participant_ids(conversation_id, exclude=exclude_user_id)
    
    for participant_id in participants:
        redis_service.increment_unread(participant_id)


async def _build_conversation_response(conversation_id: str, user_id: str) -> ConversationResponse:
    """Build conversation response with unread count"""
    conv = supabase_service.db.table("conversations")\
        .select("*")\
        .eq("id", conversation_id)\
        .execute()
    
    if not conv.data:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conversation = conv.data[0]
    
    # Get participant count
    participants = supabase_service.db.table("conversation_participants")\
        .select("id")\
        .eq("conversation_id", conversation_id)\
        .eq("is_active", True)\
        .execute()
    
    # Get user's participation for unread count
    participation = await _get_participation(conversation_id, user_id)
    unread = await _get_unread_count(conversation_id, user_id, participation)
    
    return ConversationResponse(
        id=conversation["id"],
        type=conversation["type"],
        name=conversation.get("name"),
        description=conversation.get("description"),
        campaign_id=conversation.get("campaign_id"),
        participant_count=len(participants.data),
        created_at=conversation["created_at"],
        last_message_at=conversation["last_message_at"],
        unread_count=unread
    )


def _generate_conversation_name(conversation: dict, participant_ids: List[str]) -> str:
    """Generate name for conversation (for direct messages)"""
    if conversation["type"] == "direct" and len(participant_ids) == 1:
        return f"User {participant_ids[0][:8]}"
    elif conversation["type"] == "group":
        return f"Group Chat ({len(participant_ids) + 1} members)"
    return "Conversation"
