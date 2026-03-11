from fastapi import APIRouter, Depends
from models.log import AuditLog
from routes.auth import get_current_user
from models.user import User

router = APIRouter()

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
        "timestamp": l.timestamp
    } for l in logs]
