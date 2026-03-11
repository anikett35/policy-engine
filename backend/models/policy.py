from beanie import Document, Link
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from enum import Enum

class PolicyStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"

class Policy(Document):
    name: str
    description: str
    category: str
    status: PolicyStatus = PolicyStatus.DRAFT
    version: int = 1
    tags: List[str] = []
    created_by: str
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()

    class Settings:
        name = "policies"
