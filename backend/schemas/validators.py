"""
Pydantic Schemas for Request/Response Validation
=================================================
Centralized schema definitions used across all routes.
"""

import re
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator


# ── Auth Schemas ───────────────────────────────────────────────────────────────

class RegisterSchema(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Username for the new account")
    email: str = Field(..., description="Email address for the new account")
    password: str = Field(..., min_length=8, max_length=128, description="Password for the new account")
    role: str = Field(default="analyst", description="Role for the new account (analyst or admin)")

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        v = v.strip()
        if not re.fullmatch(r"[a-zA-Z0-9_.-]+", v):
            raise ValueError("Username can only contain letters, numbers, underscores, dots, hyphens.")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip()
        if not re.fullmatch(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", v):
            raise ValueError("Invalid email format.")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit.")
        return v

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        valid_roles = ["analyst", "admin"]
        if v not in valid_roles:
            raise ValueError(f"Role must be one of: {', '.join(valid_roles)}.")
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "username": "john_doe",
                "email": "john@example.com",
                "password": "SecurePass123",
                "role": "analyst"
            }
        }
    }


# ── Policy Schemas ────────────────────────────────────────────────────────────

class ConditionSchema(BaseModel):
    field: str = Field(..., description="Field name to evaluate")
    operator: str = Field(..., description="Operator: equals, not_equals, greater_than, less_than, contains, not_contains, in, not_in, is_null, is_not_null")
    value: Optional[Any] = Field(None, description="Value to compare against")
    data_type: str = Field(default="string", description="Data type: string, number, boolean")


class ActionSchema(BaseModel):
    type: str = Field(..., description="Action type: allow, deny, flag, notify, transform")
    message: Optional[str] = Field(None, description="Human readable message")
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Action parameters")


class PolicyCreateSchema(BaseModel):
    name: str = Field(..., min_length=3, max_length=100, description="Policy name")
    description: str = Field(..., min_length=10, max_length=500, description="Policy description")
    category: str = Field(..., description="Category: Compliance, Security, Financial, Data Governance, Access Control, Other")
    tags: List[str] = Field(default_factory=list, description="List of tags")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if re.search(r"[<>\"'%;()&+]", v):
            raise ValueError("Policy name contains invalid characters.")
        return v

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        valid_categories = ["Compliance", "Security", "Financial", "Data Governance", "Access Control", "Other"]
        if v not in valid_categories:
            raise ValueError(f"Category must be one of: {', '.join(valid_categories)}.")
        return v

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: List[str]) -> List[str]:
        cleaned = []
        for tag in v:
            tag = tag.strip()
            if tag and len(tag) <= 30:
                if not re.search(r"[<>\"'%;()&+]", tag):
                    cleaned.append(tag)
        return cleaned[:10]  # Max 10 tags

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "Employee Access Policy",
                "description": "Controls access to employee resources based on role and department",
                "category": "Access Control",
                "tags": ["access-control", "employee", "security"]
            }
        }
    }


class PolicyUpdateSchema(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100, description="Policy name")
    description: Optional[str] = Field(None, min_length=10, max_length=500, description="Policy description")
    category: Optional[str] = Field(None, description="Category")
    tags: Optional[List[str]] = Field(None, description="List of tags")
    status: Optional[str] = Field(None, description="Status: draft, active, archived")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if re.search(r"[<>\"'%;()&+]", v):
            raise ValueError("Policy name contains invalid characters.")
        return v

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        valid_categories = ["Compliance", "Security", "Financial", "Data Governance", "Access Control", "Other"]
        if v not in valid_categories:
            raise ValueError(f"Category must be one of: {', '.join(valid_categories)}.")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        valid_statuses = ["draft", "active", "archived"]
        if v not in valid_statuses:
            raise ValueError(f"Status must be one of: {', '.join(valid_statuses)}.")
        return v

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is None:
            return v
        cleaned = []
        for tag in v:
            tag = tag.strip()
            if tag and len(tag) <= 30:
                if not re.search(r"[<>\"'%;()&+]", tag):
                    cleaned.append(tag)
        return cleaned[:10]  # Max 10 tags


# ── Rule Schemas ──────────────────────────────────────────────────────────────

class RuleCreateSchema(BaseModel):
    name: str = Field(..., min_length=3, max_length=100, description="Rule name")
    description: str = Field(..., min_length=10, max_length=500, description="Rule description")
    policy_id: str = Field(..., description="ID of the policy this rule belongs to")
    priority: int = Field(..., ge=1, le=1000, description="Rule priority (1-1000)")
    conditions: List[ConditionSchema] = Field(..., min_length=1, description="List of conditions")
    logic: str = Field(default="AND", description="Logic operator: AND or OR")
    actions: List[ActionSchema] = Field(..., min_length=1, description="List of actions")
    is_active: bool = Field(default=True, description="Whether the rule is active")

    @field_validator("logic")
    @classmethod
    def validate_logic(cls, v: str) -> str:
        valid_logic = ["AND", "OR"]
        if v not in valid_logic:
            raise ValueError(f"Logic must be one of: {', '.join(valid_logic)}.")
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "Deny Junior Employees",
                "description": "Deny access for employees below level 3",
                "policy_id": "507f1f77bcf86cd799439011",
                "priority": 1,
                "conditions": [
                    {
                        "field": "employee_level",
                        "operator": "less_than",
                        "value": "3",
                        "data_type": "number"
                    }
                ],
                "logic": "AND",
                "actions": [
                    {
                        "type": "deny",
                        "message": "Access denied: requires employee level 3 or higher"
                    }
                ],
                "is_active": True
            }
        }
    }


class RuleUpdateSchema(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100, description="Rule name")
    description: Optional[str] = Field(None, min_length=10, max_length=500, description="Rule description")
    policy_id: Optional[str] = Field(None, description="ID of the policy this rule belongs to")
    priority: Optional[int] = Field(None, ge=1, le=1000, description="Rule priority (1-1000)")
    conditions: Optional[List[ConditionSchema]] = Field(None, min_length=1, description="List of conditions")
    logic: Optional[str] = Field(None, description="Logic operator: AND or OR")
    actions: Optional[List[ActionSchema]] = Field(None, min_length=1, description="List of actions")
    is_active: Optional[bool] = Field(None, description="Whether the rule is active")

    @field_validator("logic")
    @classmethod
    def validate_logic(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        valid_logic = ["AND", "OR"]
        if v not in valid_logic:
            raise ValueError(f"Logic must be one of: {', '.join(valid_logic)}.")
        return v


# ── Evaluation Schema ─────────────────────────────────────────────────────────

class EvaluateSchema(BaseModel):
    policy_id: str = Field(..., description="ID of the policy to evaluate against")
    input_data: Dict[str, Any] = Field(..., description="Input data to evaluate")

    @field_validator("input_data")
    @classmethod
    def validate_input_data(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        if not v:
            raise ValueError("input_data must not be empty.")
        if len(v) > 50:
            raise ValueError("input_data must not exceed 50 fields.")
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "policy_id": "507f1f77bcf86cd799439011",
                "input_data": {
                    "employee_level": 5,
                    "department": "engineering",
                    "request_type": "read"
                }
            }
        }
    }


# ── AI Generator Schema ───────────────────────────────────────────────────────

class GeneratePolicySchema(BaseModel):
    prompt: str = Field(..., min_length=15, max_length=2000, description="Natural language description of the policy")
    save_to_db: bool = Field(default=True, description="Whether to save the generated policy to the database")

    @field_validator("prompt")
    @classmethod
    def validate_prompt(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 15:
            raise ValueError("Prompt must be at least 15 characters. Please describe your policy in more detail.")
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "prompt": "Create a policy that denies access to financial reports for employees below manager level",
                "save_to_db": True
            }
        }
    }

