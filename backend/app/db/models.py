from sqlalchemy import Column, String, Text, DateTime, Enum, Float, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
import enum
from .database import Base


def utcnow():
    return datetime.utcnow()


class DocumentStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    DISPUTED = "disputed"
    REJECTED = "rejected"


class DocumentSource(str, enum.Enum):
    MANUAL = "manual"
    AGENT = "agent"


class TZStatus(str, enum.Enum):
    DRAFT = "draft"
    REVIEW = "review"
    APPROVED = "approved"
    IN_PROGRESS = "in_progress"


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(String(1000), nullable=True)
    file_type = Column(String(50), nullable=True)
    source = Column(Enum(DocumentSource), default=DocumentSource.MANUAL)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.PENDING)
    confidence_score = Column(Float, nullable=True)
    source_url = Column(String(2000), nullable=True)
    tags = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)


class TechnicalSpec(Base):
    __tablename__ = "technical_specs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False)
    version = Column(Integer, default=1)
    status = Column(Enum(TZStatus), default=TZStatus.DRAFT)
    content = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)
    sections = relationship("TZSection", back_populates="spec",
                            cascade="all, delete-orphan")


class TZSection(Base):
    __tablename__ = "tz_sections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    spec_id = Column(UUID(as_uuid=True), ForeignKey("technical_specs.id"))
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.PENDING)
    spec = relationship("TechnicalSpec", back_populates="sections")


class AgentLog(Base):
    __tablename__ = "agent_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_name = Column(String(100), nullable=False)
    action = Column(String(200), nullable=False)
    status = Column(String(50), nullable=False)
    input_data = Column(Text, nullable=True)
    output_data = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)
