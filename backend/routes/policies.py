from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from models.policy import Policy, PolicyStatus
from models.log import AuditLog
from routes.auth import get_current_user
from models.user import User
from schemas.validators import PolicyCreateSchema, PolicyUpdateSchema
from datetime import datetime

router = APIRouter()

async def log_action(action, entity_type, entity_id, entity_name, user, details={}):
    await AuditLog(action=action, entity_type=entity_type, entity_id=entity_id,
                   entity_name=entity_name, performed_by=user.username, details=details).insert()

def policy_dict(p):
    return {"id": str(p.id), "name": p.name, "description": p.description,
            "category": p.category, "status": p.status, "version": p.version,
            "tags": p.tags, "created_by": p.created_by, "created_at": p.created_at}

@router.get("")
async def get_policies(
    status: Optional[str] = None,
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = Policy.find_all()
    policies = await query.to_list()
    # Filter in Python (Beanie simple filtering)
    if status:
        policies = [p for p in policies if p.status == status]
    if category:
        policies = [p for p in policies if p.category == category]
    return [policy_dict(p) for p in policies]

@router.post("", status_code=201)
async def create_policy(data: PolicyCreateSchema, current_user: User = Depends(get_current_user)):
    # Duplicate name check
    existing = await Policy.find_one(Policy.name == data.name)
    if existing:
        raise HTTPException(status_code=400, detail=f"A policy named '{data.name}' already exists.")
    policy = Policy(**data.dict(), created_by=current_user.username)
    await policy.insert()
    await log_action("CREATE", "policy", str(policy.id), policy.name, current_user)
    return {**policy_dict(policy), "message": "Policy created successfully."}

@router.get("/{policy_id}")
async def get_policy(policy_id: str, current_user: User = Depends(get_current_user)):
    policy = await Policy.get(policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found.")
    return policy_dict(policy)

@router.put("/{policy_id}")
async def update_policy(policy_id: str, data: PolicyUpdateSchema, current_user: User = Depends(get_current_user)):
    policy = await Policy.get(policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found.")
    # Duplicate name check (if name is being changed)
    if data.name and data.name != policy.name:
        existing = await Policy.find_one(Policy.name == data.name)
        if existing:
            raise HTTPException(status_code=400, detail=f"A policy named '{data.name}' already exists.")
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    update_data["version"] = policy.version + 1
    await policy.update({"$set": update_data})
    await log_action("UPDATE", "policy", policy_id, policy.name, current_user, update_data)
    return {"message": "Policy updated successfully."}

@router.delete("/{policy_id}")
async def delete_policy(policy_id: str, current_user: User = Depends(get_current_user)):
    policy = await Policy.get(policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found.")
    await log_action("DELETE", "policy", policy_id, policy.name, current_user)
    await policy.delete()
    return {"message": "Policy deleted successfully."}