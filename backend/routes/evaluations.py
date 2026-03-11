from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from services.rule_engine import evaluator
from models.evaluation import Evaluation
from models.policy import Policy
from routes.auth import get_current_user
from models.user import User
from schemas.validators import EvaluateSchema

router = APIRouter()

@router.post("/run")
async def run_evaluation(req: EvaluateSchema, current_user: User = Depends(get_current_user)):
    # Verify policy exists before running
    policy = await Policy.get(req.policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail=f"Policy '{req.policy_id}' not found.")
    if policy.status == "archived":
        raise HTTPException(status_code=400, detail="Cannot evaluate against an archived policy.")
    try:
        evaluation = await evaluator.evaluate_policy(req.policy_id, req.input_data, current_user.username)
        return {
            "id": str(evaluation.id),
            "policy_id": evaluation.policy_id,
            "policy_name": evaluation.policy_name,
            "final_decision": evaluation.final_decision,
            "rules_matched": evaluation.rules_matched,
            "rules_total": evaluation.rules_total,
            "execution_time_ms": evaluation.execution_time_ms,
            "results": [r.dict() for r in evaluation.results],
            "evaluated_at": evaluation.evaluated_at
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

@router.get("")
async def get_evaluations(
    policy_id: Optional[str] = None,
    decision: Optional[str] = Query(None, description="Filter by decision: allow, deny, flag"),
    limit: int = Query(50, ge=1, le=500),
    current_user: User = Depends(get_current_user)
):
    if decision and decision not in ["allow", "deny", "flag"]:
        raise HTTPException(status_code=400, detail="decision filter must be: allow, deny, or flag.")
    query = Evaluation.find_all() if not policy_id else Evaluation.find(Evaluation.policy_id == policy_id)
    evals = await query.sort(-Evaluation.evaluated_at).limit(limit).to_list()
    if decision:
        evals = [e for e in evals if e.final_decision == decision]
    return [{
        "id": str(e.id), "policy_id": e.policy_id, "policy_name": e.policy_name,
        "final_decision": e.final_decision, "rules_matched": e.rules_matched,
        "rules_total": e.rules_total, "execution_time_ms": e.execution_time_ms,
        "evaluated_by": e.evaluated_by, "evaluated_at": e.evaluated_at
    } for e in evals]

@router.get("/stats")
async def get_stats(
    policy_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    if policy_id:
        all_evals = await Evaluation.find(Evaluation.policy_id == policy_id).to_list()
    else:
        all_evals = await Evaluation.find_all().to_list()
    total = len(all_evals)
    allow = sum(1 for e in all_evals if e.final_decision == "allow")
    deny  = sum(1 for e in all_evals if e.final_decision == "deny")
    flag  = sum(1 for e in all_evals if e.final_decision == "flag")
    avg_time = sum(e.execution_time_ms for e in all_evals) / total if total > 0 else 0
    return {
        "total_evaluations": total, "allow": allow, "deny": deny, "flag": flag,
        "avg_execution_ms": round(avg_time, 2),
        "allow_pct": round((allow / total) * 100, 1) if total else 0,
        "deny_pct":  round((deny  / total) * 100, 1) if total else 0,
        "flag_pct":  round((flag  / total) * 100, 1) if total else 0,
    }

@router.get("/{eval_id}")
async def get_evaluation(eval_id: str, current_user: User = Depends(get_current_user)):
    ev = await Evaluation.get(eval_id)
    if not ev:
        raise HTTPException(status_code=404, detail="Evaluation not found.")
    return {
        "id": str(ev.id), "policy_id": ev.policy_id, "policy_name": ev.policy_name,
        "input_data": ev.input_data, "final_decision": ev.final_decision,
        "rules_matched": ev.rules_matched, "rules_total": ev.rules_total,
        "execution_time_ms": ev.execution_time_ms,
        "results": [r.dict() for r in ev.results],
        "evaluated_by": ev.evaluated_by, "evaluated_at": ev.evaluated_at
    }