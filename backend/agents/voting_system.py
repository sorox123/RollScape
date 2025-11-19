"""
Voting system for handling player absenteeism.

Allows party to vote on:
- Skip absent player's turn for the session
- Enable AI Agent control for the session
"""

from enum import Enum
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set
from pydantic import BaseModel, Field
from sqlalchemy import Column, String, Integer, DateTime, JSON, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from database import Base
import uuid


class VoteType(str, Enum):
    """Types of votes for absent players"""
    SKIP_TURN = "skip_turn"
    AI_CONTROL = "ai_control"


class VoteStatus(str, Enum):
    """Status of a vote"""
    ACTIVE = "active"
    PASSED = "passed"
    FAILED = "failed"
    EXPIRED = "expired"


class AbsenteeVote(Base):
    """Database model for absentee votes"""
    __tablename__ = "absentee_votes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("game_sessions.id"), nullable=False)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id"), nullable=False)
    absent_character_id = Column(UUID(as_uuid=True), ForeignKey("characters.id"), nullable=False)
    
    vote_type = Column(SQLEnum(VoteType), nullable=False)
    status = Column(SQLEnum(VoteStatus), default=VoteStatus.ACTIVE, nullable=False)
    
    # Voting details
    votes_for = Column(JSON, default=list)  # List of character IDs who voted yes
    votes_against = Column(JSON, default=list)  # List of character IDs who voted no
    eligible_voters = Column(JSON, default=list)  # List of character IDs who can vote
    
    # Vote requirements
    required_votes = Column(Integer, nullable=False)  # Number of votes needed to pass
    vote_threshold = Column(Integer, default=50)  # Percentage needed (e.g., 50 = majority)
    
    # Timing
    initiated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    
    # Results
    ai_agent_active = Column(Boolean, default=False)
    ai_agent_config = Column(JSON, nullable=True)  # Stores PlayerAgent configuration
    
    # Metadata
    initiated_by = Column(UUID(as_uuid=True), ForeignKey("characters.id"), nullable=False)
    reason = Column(String, nullable=True)


class VoteRequest(BaseModel):
    """Request to initiate a vote"""
    session_id: str
    campaign_id: str
    absent_character_id: str
    vote_type: VoteType
    initiated_by: str  # Character ID of voter
    reason: Optional[str] = None
    expires_in_minutes: int = Field(default=10, ge=1, le=60)


class VoteCast(BaseModel):
    """A single vote cast"""
    vote_id: str
    character_id: str
    vote_for: bool  # True = yes, False = no
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class VoteResult(BaseModel):
    """Result of a vote"""
    vote_id: str
    status: VoteStatus
    vote_type: VoteType
    votes_for_count: int
    votes_against_count: int
    total_eligible: int
    passed: bool
    ai_agent_activated: bool = False


class VotingSystem:
    """Manages voting for absent player handling"""
    
    def __init__(self, db_session):
        """
        Initialize voting system.
        
        Args:
            db_session: SQLAlchemy database session
        """
        self.db = db_session
    
    def initiate_vote(
        self,
        session_id: str,
        campaign_id: str,
        absent_character_id: str,
        vote_type: VoteType,
        initiated_by: str,
        eligible_voters: List[str],
        reason: Optional[str] = None,
        expires_in_minutes: int = 10
    ) -> AbsenteeVote:
        """
        Start a vote for handling an absent player.
        
        Args:
            session_id: Game session ID
            campaign_id: Campaign ID
            absent_character_id: Character who is absent
            vote_type: SKIP_TURN or AI_CONTROL
            initiated_by: Character ID who started vote
            eligible_voters: List of character IDs who can vote
            reason: Optional reason for vote
            expires_in_minutes: How long vote stays open
            
        Returns:
            Created AbsenteeVote
        """
        # Check if vote already exists for this character in this session
        existing = self.db.query(AbsenteeVote).filter(
            AbsenteeVote.session_id == uuid.UUID(session_id),
            AbsenteeVote.absent_character_id == uuid.UUID(absent_character_id),
            AbsenteeVote.status == VoteStatus.ACTIVE
        ).first()
        
        if existing:
            raise ValueError("Vote already active for this character")
        
        # Calculate required votes (majority)
        required_votes = len(eligible_voters) // 2 + 1
        
        vote = AbsenteeVote(
            session_id=uuid.UUID(session_id),
            campaign_id=uuid.UUID(campaign_id),
            absent_character_id=uuid.UUID(absent_character_id),
            vote_type=vote_type,
            initiated_by=uuid.UUID(initiated_by),
            eligible_voters=eligible_voters,
            required_votes=required_votes,
            expires_at=datetime.utcnow() + timedelta(minutes=expires_in_minutes),
            reason=reason
        )
        
        self.db.add(vote)
        self.db.commit()
        
        return vote
    
    def cast_vote(
        self,
        vote_id: str,
        character_id: str,
        vote_for: bool
    ) -> VoteResult:
        """
        Cast a vote.
        
        Args:
            vote_id: Vote ID
            character_id: Character casting vote
            vote_for: True = yes, False = no
            
        Returns:
            Current vote result
        """
        vote = self.db.query(AbsenteeVote).filter(
            AbsenteeVote.id == uuid.UUID(vote_id)
        ).first()
        
        if not vote:
            raise ValueError("Vote not found")
        
        if vote.status != VoteStatus.ACTIVE:
            raise ValueError(f"Vote is {vote.status}, cannot cast vote")
        
        if datetime.utcnow() > vote.expires_at:
            vote.status = VoteStatus.EXPIRED
            self.db.commit()
            raise ValueError("Vote has expired")
        
        if character_id not in vote.eligible_voters:
            raise ValueError("Character not eligible to vote")
        
        # Remove from both lists (in case changing vote)
        votes_for = vote.votes_for or []
        votes_against = vote.votes_against or []
        
        if character_id in votes_for:
            votes_for.remove(character_id)
        if character_id in votes_against:
            votes_against.remove(character_id)
        
        # Add to appropriate list
        if vote_for:
            votes_for.append(character_id)
        else:
            votes_against.append(character_id)
        
        vote.votes_for = votes_for
        vote.votes_against = votes_against
        
        # Check if vote is decided
        if len(votes_for) >= vote.required_votes:
            vote.status = VoteStatus.PASSED
            vote.resolved_at = datetime.utcnow()
            
            # Activate AI if vote type is AI_CONTROL
            if vote.vote_type == VoteType.AI_CONTROL:
                vote.ai_agent_active = True
        
        elif len(votes_against) > len(vote.eligible_voters) - vote.required_votes:
            # Too many against votes - cannot pass
            vote.status = VoteStatus.FAILED
            vote.resolved_at = datetime.utcnow()
        
        self.db.commit()
        
        return self._get_vote_result(vote)
    
    def get_vote_status(self, vote_id: str) -> VoteResult:
        """Get current status of a vote"""
        vote = self.db.query(AbsenteeVote).filter(
            AbsenteeVote.id == uuid.UUID(vote_id)
        ).first()
        
        if not vote:
            raise ValueError("Vote not found")
        
        # Check if expired
        if vote.status == VoteStatus.ACTIVE and datetime.utcnow() > vote.expires_at:
            vote.status = VoteStatus.EXPIRED
            self.db.commit()
        
        return self._get_vote_result(vote)
    
    def get_active_votes_for_session(self, session_id: str) -> List[AbsenteeVote]:
        """Get all active votes for a session"""
        return self.db.query(AbsenteeVote).filter(
            AbsenteeVote.session_id == uuid.UUID(session_id),
            AbsenteeVote.status == VoteStatus.ACTIVE
        ).all()
    
    def get_ai_controlled_characters(self, session_id: str) -> List[str]:
        """Get list of character IDs currently under AI control"""
        votes = self.db.query(AbsenteeVote).filter(
            AbsenteeVote.session_id == uuid.UUID(session_id),
            AbsenteeVote.status == VoteStatus.PASSED,
            AbsenteeVote.vote_type == VoteType.AI_CONTROL,
            AbsenteeVote.ai_agent_active == True
        ).all()
        
        return [str(vote.absent_character_id) for vote in votes]
    
    def deactivate_ai_control(self, vote_id: str):
        """Deactivate AI control for a character (e.g., when player returns)"""
        vote = self.db.query(AbsenteeVote).filter(
            AbsenteeVote.id == uuid.UUID(vote_id)
        ).first()
        
        if vote:
            vote.ai_agent_active = False
            self.db.commit()
    
    def _get_vote_result(self, vote: AbsenteeVote) -> VoteResult:
        """Convert AbsenteeVote to VoteResult"""
        votes_for = vote.votes_for or []
        votes_against = vote.votes_against or []
        
        return VoteResult(
            vote_id=str(vote.id),
            status=vote.status,
            vote_type=vote.vote_type,
            votes_for_count=len(votes_for),
            votes_against_count=len(votes_against),
            total_eligible=len(vote.eligible_voters),
            passed=vote.status == VoteStatus.PASSED,
            ai_agent_activated=vote.ai_agent_active
        )
    
    def close_expired_votes(self):
        """Close all expired votes (maintenance task)"""
        expired = self.db.query(AbsenteeVote).filter(
            AbsenteeVote.status == VoteStatus.ACTIVE,
            AbsenteeVote.expires_at < datetime.utcnow()
        ).all()
        
        for vote in expired:
            vote.status = VoteStatus.EXPIRED
            vote.resolved_at = datetime.utcnow()
        
        self.db.commit()
        
        return len(expired)
