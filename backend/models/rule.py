from beanie import Document
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Any, Dict
from enum import Enum


class ConditionOperator(str, Enum):
    """Operators for rule conditions"""
    EQUALS = "equals"
    NOT_EQUALS = "not_equals"
    GREATER_THAN = "greater_than"
    LESS_THAN = "less_than"
    CONTAINS = "contains"
    NOT_CONTAINS = "not_contains"
    IN = "in"
    NOT_IN = "not_in"
    IS_NULL = "is_null"
    IS_NOT_NULL = "is_not_null"


class Condition(BaseModel):
    """Condition for rule evaluation"""
    field: str
    operator: str
    value: Optional[Any] = None
    data_type: str = "string"


class Action(BaseModel):
    """Action to take when rule matches"""
    type: str
    message: Optional[str] = None
    parameters: Dict[str, Any] = {}


class Rule(Document):
    """Rule document for policy evaluation"""
    name: str
    description: str
    policy_id: str
    priority: int
    conditions: List[Condition]
    logic: str = "AND"
    actions: List[Action]
    is_active: bool = True
    created_by: str
    created_at: datetime = datetime.utcnow()
    updated_at: Optional[datetime] = None

    class Settings:
        name = "rules"

