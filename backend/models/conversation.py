"""
Conversation and messaging models.
Steam-style architecture for persistent, multi-user conversations.
"""

from sqlalchemy import Column, String, Text, DateTime, Boolean, Enum as SQLEnum, ForeignKey, Integer, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from models.user import Base


class ConversationType(str, enum.Enum):
    """Type of conversation"""
    DIRECT = "direct"        # 1-on-1 conversation
    GROUP = "group"          # Group chat (3+ people)
    CAMPAIGN = "campaign"    # Campaign-specific chat


class Conversation(Base):
    """
    Conversation container. Messages belong to conversations.
    Users are linked via ConversationParticipant.
    """
    __tablename__ = "conversations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    type = Column(SQLEnum(ConversationType), nullable=False, default=ConversationType.DIRECT)
    
    # Optional: for campaign conversations
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id"), nullable=True)
    
    # Group chat metadata
    name = Column(String(100), nullable=True)  # For group chats
    description = Column(Text, nullable=True)
    icon_url = Column(String(500), nullable=True)
    
    # Creator
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    last_message_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Settings
    is_archived = Column(Boolean, nullable=False, default=False)
    settings = Column(JSONB, nullable=True)  # Custom settings
    
    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    campaign = relationship("Campaign", foreign_keys=[campaign_id])
    participants = relationship("ConversationParticipant", back_populates="conversation", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_conversation_type', 'type'),
        Index('idx_conversation_campaign', 'campaign_id'),
        Index('idx_conversation_last_message', 'last_message_at'),
    )


class ConversationParticipant(Base):
    """
    Links users to conversations with per-user state.
    Each participant tracks their own read position and settings.
    """
    __tablename__ = "conversation_participants"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Read state - KEY for unread counts
    last_read_message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id"), nullable=True)
    last_read_at = Column(DateTime, nullable=True)
    
    # Participant status
    joined_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    left_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    
    # Per-user settings
    is_muted = Column(Boolean, nullable=False, default=False)
    is_pinned = Column(Boolean, nullable=False, default=False)
    is_archived = Column(Boolean, nullable=False, default=False)
    notification_settings = Column(JSONB, nullable=True)
    
    # Role in conversation (for group chats)
    role = Column(String(50), nullable=False, default="member")  # admin, moderator, member
    
    # Relationships
    conversation = relationship("Conversation", back_populates="participants")
    user = relationship("User")
    last_read_message = relationship("Message", foreign_keys=[last_read_message_id])
    
    # Indexes
    __table_args__ = (
        Index('idx_participant_conversation', 'conversation_id'),
        Index('idx_participant_user', 'user_id'),
        Index('idx_participant_active', 'is_active'),
    )
    
    def get_unread_count(self) -> int:
        """
        Get unread message count for this participant.
        Count messages after last_read_message_id.
        """
        if not self.last_read_message_id:
            # Never read anything, count all messages
            return len([m for m in self.conversation.messages if m.deleted_at is None])
        
        # Count messages after last read
        from models.message import Message
        return len([
            m for m in self.conversation.messages 
            if m.created_at > self.last_read_at and m.deleted_at is None
        ])


class Message(Base):
    """
    Individual message in a conversation.
    Stored once, visible to all participants.
    """
    __tablename__ = "messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Message content
    content = Column(Text, nullable=False)
    message_type = Column(String(50), nullable=False, default="text")  # text, image, dice_roll, system
    
    # Optional metadata
    metadata = Column(JSONB, nullable=True)  # Dice rolls, images, attachments, etc.
    
    # Attachments
    attachment_urls = Column(JSONB, nullable=True)  # List of URLs
    
    # Reply/thread support
    reply_to_id = Column(UUID(as_uuid=True), ForeignKey("messages.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    edited_at = Column(DateTime, nullable=True)
    deleted_at = Column(DateTime, nullable=True)  # Soft delete
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User")
    reply_to = relationship("Message", remote_side=[id])
    
    # Indexes
    __table_args__ = (
        Index('idx_message_conversation', 'conversation_id'),
        Index('idx_message_sender', 'sender_id'),
        Index('idx_message_created', 'created_at'),
        Index('idx_message_conversation_created', 'conversation_id', 'created_at'),
    )
    
    @property
    def is_deleted(self) -> bool:
        """Check if message is deleted"""
        return self.deleted_at is not None
    
    @property
    def is_edited(self) -> bool:
        """Check if message was edited"""
        return self.edited_at is not None
