"""
Friendship and social relationship models.
"""

from sqlalchemy import Column, String, DateTime, Enum as SQLEnum, ForeignKey, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from models.user import Base


class FriendshipStatus(str, enum.Enum):
    """Status of friendship"""
    PENDING = "pending"      # Friend request sent, awaiting response
    ACCEPTED = "accepted"    # Friends
    DECLINED = "declined"    # Request declined
    BLOCKED = "blocked"      # User blocked


class Friendship(Base):
    """
    Friendship relationship between users.
    Uses a normalized approach where user_id_1 < user_id_2 to avoid duplicates.
    """
    __tablename__ = "friendships"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Always store with lower UUID first for consistency
    user_id_1 = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    user_id_2 = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Who initiated the friendship
    requester_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    status = Column(SQLEnum(FriendshipStatus), nullable=False, default=FriendshipStatus.PENDING)
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    accepted_at = Column(DateTime, nullable=True)
    
    # Relationships
    user_1 = relationship("User", foreign_keys=[user_id_1])
    user_2 = relationship("User", foreign_keys=[user_id_2])
    requester = relationship("User", foreign_keys=[requester_id])
    
    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint('user_id_1', 'user_id_2', name='unique_friendship'),
        Index('idx_friendship_user1', 'user_id_1'),
        Index('idx_friendship_user2', 'user_id_2'),
        Index('idx_friendship_status', 'status'),
    )
    
    @staticmethod
    def normalize_user_ids(user_id_1: str, user_id_2: str) -> tuple[str, str]:
        """
        Normalize user IDs so the lower one is always first.
        Prevents duplicate friendships.
        """
        return (user_id_1, user_id_2) if user_id_1 < user_id_2 else (user_id_2, user_id_1)
    
    def get_friend_id(self, user_id: str) -> str:
        """Get the other user's ID in this friendship"""
        return str(self.user_id_2) if str(self.user_id_1) == user_id else str(self.user_id_1)
    
    def is_requester(self, user_id: str) -> bool:
        """Check if user is the one who sent the friend request"""
        return str(self.requester_id) == user_id
    
    def can_accept(self, user_id: str) -> bool:
        """Check if user can accept this friendship"""
        return (
            self.status == FriendshipStatus.PENDING 
            and not self.is_requester(user_id)
        )


class BlockedUser(Base):
    """
    Blocked user relationships.
    Separate from friendships for clarity.
    """
    __tablename__ = "blocked_users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Who blocked whom
    blocker_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    blocked_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    reason = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    blocker = relationship("User", foreign_keys=[blocker_id])
    blocked = relationship("User", foreign_keys=[blocked_id])
    
    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint('blocker_id', 'blocked_id', name='unique_block'),
        Index('idx_blocker', 'blocker_id'),
        Index('idx_blocked', 'blocked_id'),
    )
