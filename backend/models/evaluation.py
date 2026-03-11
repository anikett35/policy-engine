from beanie import Document
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Any, Dict

class RuleResult(BaseModel):
    rule_id: str
    rule_name: str
    matched: bool
    actions_triggered: List[str]
    conditions_evaluated: List[Dict[str, Any]]

class Evaluation(Document):
    policy_id: str
    policy_name: str
    input_data: Dict[str, Any]
    results: List[RuleResult]
    final_decision: str  # allow, deny, flag
    rules_matched: int
    rules_total: int
    execution_time_ms: float
    evaluated_by: str
    evaluated_at: datetime = datetime.utcnow()

    class Settings:
        name = "evaluations"
