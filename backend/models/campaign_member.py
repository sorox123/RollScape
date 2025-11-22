"""Campaign membership - who's playing in which campaign"""

from sqlalchemy import Column, String, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import uuid
import enum


class MemberRole(str, enum.Enum):
    """Role a user has in a campaign"""
    DM = "dm"
    PLAYER = "player"
    OBSERVER = "observer"


class CampaignMember(Base):
    """
    Campaign membership table.
    Links users to campaigns with their role and character.
    """
    __tablename__ = "campaign_members"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id = Column(String, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    character_id = Column(String, ForeignKey("characters.id", ondelete="SET NULL"), nullable=True)
    role = Column(SQLEnum(MemberRole), nullable=False, default=MemberRole.PLAYER)
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    campaign = relationship("Campaign", back_populates="members")
    user = relationship("User")
    character = relationship("Character")
    
    def __repr__(self):
        return f"<CampaignMember(user_id={self.user_id}, campaign_id={self.campaign_id}, role={self.role})>"
