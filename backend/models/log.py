from beanie import Document
from datetime import datetime
from typing import Optional, Any, Dict

class AuditLog(Document):
    action: str
    entity_type: str  # policy, rule, evaluation, user
    entity_id: str
    entity_name: str
    performed_by: str
    details: Dict[str, Any] = {}
    timestamp: datetime = datetime.utcnow()

    class Settings:
        name = "audit_logs"
