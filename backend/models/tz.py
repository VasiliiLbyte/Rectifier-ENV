from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from db import Base

class TZSpec(Base):
    __tablename__ = "tz_specs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    version = Column(String, default="1.0")
    status = Column(String, default="draft")
    created_at = Column(DateTime, default=datetime.utcnow)
    sections = relationship("TZSection", back_populates="spec", cascade="all, delete-orphan")

class TZSection(Base):
    __tablename__ = "tz_sections"

    id = Column(Integer, primary_key=True, index=True)
    spec_id = Column(Integer, ForeignKey("tz_specs.id"))
    title = Column(String)
    content = Column(Text)
    order_index = Column(Integer)
    spec = relationship("TZSpec", back_populates="sections")
