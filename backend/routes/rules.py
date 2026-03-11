from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from models.rule import Rule, Condition, Action
from models.policy import Policy
from models.log import AuditLog
from routes.auth import get_current_user
from models.user import User
from schemas.validators import RuleCreateSchema, RuleUpdateSchema
from datetime import datetime

router = APIRouter()

async def log_action(action, entity_id, entity_name, user, details={}):
    await AuditLog(action=action, entity_type="rule", entity_id=entity_id,
                   entity_name=entity_name, performed_by=user.username, details=details).insert()

def rule_dict(r):
    return {"id": str(r.id), "name": r.name, "description": r.description,
            "policy_id": r.policy_id, "priority": r.priority,
            "conditions": [c.dict() for c in r.conditions],
            "logic": r.logic, "actions": [a.dict() for a in r.actions],
            "is_active": r.is_active, "created_by": r.created_by, "created_at": r.created_at}

@router.get("")
async def get_rules(policy_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = Rule.find_all() if not policy_id else Rule.find(Rule.policy_id == policy_id)
    rules = await query.sort(Rule.priority).to_list()
    return [rule_dict(r) for r in rules]

@router.post("", status_code=201)
async def create_rule(data: RuleCreateSchema, current_user: User = Depends(get_current_user)):
    # Validate policy exists
    policy = await Policy.get(data.policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail=f"Policy '{data.policy_id}' not found.")

    # Duplicate rule name check within same policy
    existing = await Rule.find_one(Rule.policy_id == data.policy_id, Rule.name == data.name)
    if existing:
        raise HTTPException(status_code=400, detail=f"A rule named '{data.name}' already exists in this policy.")

    # Duplicate priority check within same policy
    existing_priority = await Rule.find_one(Rule.policy_id == data.policy_id, Rule.priority == data.priority)
    if existing_priority:
        raise HTTPException(status_code=400,
            detail=f"Priority {data.priority} is already used by rule '{existing_priority.name}'. Use a different priority.")

    # Build Condition and Action objects
    conditions = [Condition(**c.dict()) for c in data.conditions]
    actions = [Action(**a.dict()) for a in data.actions]

    rule = Rule(
        name=data.name, description=data.description, policy_id=data.policy_id,
        priority=data.priority, conditions=conditions, logic=data.logic,
        actions=actions, is_active=data.is_active, created_by=current_user.username
    )
    await rule.insert()
    await log_action("CREATE", str(rule.id), rule.name, current_user, {"policy_id": data.policy_id})
    return {"id": str(rule.id), "message": "Rule created successfully."}

@router.get("/{rule_id}")
async def get_rule(rule_id: str, current_user: User = Depends(get_current_user)):
    rule = await Rule.get(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found.")
    return rule_dict(rule)

@router.put("/{rule_id}")
async def update_rule(rule_id: str, data: RuleUpdateSchema, current_user: User = Depends(get_current_user)):
    rule = await Rule.get(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found.")

    # Duplicate name check if name is changing
    if data.name and data.name != rule.name:
        existing = await Rule.find_one(Rule.policy_id == rule.policy_id, Rule.name == data.name)
        if existing:
            raise HTTPException(status_code=400,
                detail=f"A rule named '{data.name}' already exists in this policy.")

    # Duplicate priority check if priority is changing
    if data.priority and data.priority != rule.priority:
        existing_priority = await Rule.find_one(
            Rule.policy_id == rule.policy_id,
            Rule.priority == data.priority
        )
        if existing_priority and str(existing_priority.id) != rule_id:
            raise HTTPException(status_code=400,
                detail=f"Priority {data.priority} is already used by rule '{existing_priority.name}'.")

    update_data = {k: v for k, v in data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    await rule.update({"$set": update_data})
    await log_action("UPDATE", rule_id, rule.name, current_user)
    return {"message": "Rule updated successfully."}

@router.delete("/{rule_id}")
async def delete_rule(rule_id: str, current_user: User = Depends(get_current_user)):
    rule = await Rule.get(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found.")
    await log_action("DELETE", rule_id, rule.name, current_user)
    await rule.delete()
    return {"message": "Rule deleted successfully."}