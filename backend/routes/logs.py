from fastapi import APIRouter, Depends
from models.log import AuditLog
from routes.auth import get_current_user
from models.user import User
from datetime import timezone, timedelta

router = APIRouter()

IST = timezone(timedelta(hours=5, minutes=30))

def to_ist(dt):
    if dt is None:
        return None
    # naive datetime असेल तर UTC assume कर
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(IST).isoformat()

@router.get("")
async def get_logs(limit: int = 100, entity_type: str = None, current_user: User = Depends(get_current_user)):
    query = AuditLog.find_all() if not entity_type else AuditLog.find(AuditLog.entity_type == entity_type)
    logs = await query.sort(-AuditLog.timestamp).limit(limit).to_list()
    return [{
        "id": str(l.id),
        "action": l.action,
        "entity_type": l.entity_type,
        "entity_id": l.entity_id,
        "entity_name": l.entity_name,
        "performed_by": l.performed_by,
        "details": l.details,
        "timestamp": to_ist(l.timestamp)  # ✅ IST मध्ये convert
    } for l in logs]