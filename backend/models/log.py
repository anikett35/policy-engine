from beanie import Document
from datetime import datetime, timezone
from typing import Any, Dict
from pydantic import Field

class AuditLog(Document):
    action: str
    entity_type: str  # policy, rule, evaluation, user
    entity_id: str
    entity_name: str
    performed_by: str
    details: Dict[str, Any] = {}
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "audit_logs"