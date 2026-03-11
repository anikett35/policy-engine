"""
Shared Validators — Policy Rules Evaluation Engine
====================================================
Centralized validation utilities used across all routes.
Industry-grade: field-level errors, detailed messages, reusable.
"""

import re
from typing import Any, Dict, List, Optional
from fastapi import HTTPException

# ── Constants ──────────────────────────────────────────────────────────────────

VALID_CATEGORIES = [
    "Compliance", "Security", "Financial",
    "Data Governance", "Access Control", "Other"
]

VALID_OPERATORS = [
    "equals", "not_equals", "greater_than", "less_than",
    "contains", "not_contains", "in", "not_in",
    "is_null", "is_not_null"
]

VALID_DATA_TYPES  = ["string", "number", "boolean"]
VALID_LOGIC       = ["AND", "OR"]
VALID_ACTIONS     = ["allow", "deny", "flag", "notify", "transform"]
VALID_ROLES       = ["analyst", "admin"]
VALID_STATUSES    = ["draft", "active", "archived"]

OPERATORS_REQUIRE_VALUE = [
    "equals", "not_equals", "greater_than", "less_than",
    "contains", "not_contains", "in", "not_in"
]

MAX_NAME_LEN        = 100
MAX_DESC_LEN        = 500
MAX_TAG_LEN         = 30
MAX_TAGS            = 10
MAX_CONDITIONS      = 20
MAX_ACTIONS         = 5
MAX_INPUT_FIELDS    = 50
MAX_FIELD_NAME_LEN  = 60
MAX_FIELD_VALUE_LEN = 500
MIN_PASSWORD_LEN    = 8
MAX_PASSWORD_LEN    = 128
MAX_PROMPT_LEN      = 2000


# ── Helper ─────────────────────────────────────────────────────────────────────

def _raise(status: int, msg: str, field: str = None):
    detail = {"message": msg}
    if field:
        detail["field"] = field
    raise HTTPException(status_code=status, detail=detail)


def is_valid_object_id(value: str) -> bool:
    """MongoDB ObjectId is 24-char hex string."""
    return bool(re.fullmatch(r"[a-fA-F0-9]{24}", value or ""))


def sanitize_string(value: str) -> str:
    """Strip leading/trailing whitespace."""
    return value.strip() if isinstance(value, str) else value


# ── Policy Validators ──────────────────────────────────────────────────────────

def validate_policy_name(name: str, field: str = "name"):
    name = sanitize_string(name)
    if not name:
        _raise(422, "Policy name is required.", field)
    if len(name) < 3:
        _raise(422, "Policy name must be at least 3 characters.", field)
    if len(name) > MAX_NAME_LEN:
        _raise(422, f"Policy name must not exceed {MAX_NAME_LEN} characters.", field)
    if re.search(r"[<>\"'%;()&+]", name):
        _raise(422, "Policy name contains invalid characters.", field)
    return name


def validate_policy_description(description: str, field: str = "description"):
    description = sanitize_string(description)
    if not description:
        _raise(422, "Policy description is required.", field)
    if len(description) < 10:
        _raise(422, "Description must be at least 10 characters.", field)
    if len(description) > MAX_DESC_LEN:
        _raise(422, f"Description must not exceed {MAX_DESC_LEN} characters.", field)
    return description


def validate_policy_category(category: str, field: str = "category"):
    if not category:
        _raise(422, "Category is required.", field)
    if category not in VALID_CATEGORIES:
        _raise(422, f"Invalid category. Must be one of: {', '.join(VALID_CATEGORIES)}.", field)
    return category


def validate_tags(tags: List[str], field: str = "tags") -> List[str]:
    if not isinstance(tags, list):
        _raise(422, "Tags must be a list.", field)
    if len(tags) > MAX_TAGS:
        _raise(422, f"Maximum {MAX_TAGS} tags allowed.", field)
    cleaned = []
    for tag in tags:
        tag = sanitize_string(tag)
        if not tag:
            continue
        if len(tag) > MAX_TAG_LEN:
            _raise(422, f"Each tag must not exceed {MAX_TAG_LEN} characters.", field)
        if re.search(r"[<>\"'%;()&+]", tag):
            _raise(422, f"Tag '{tag}' contains invalid characters.", field)
        cleaned.append(tag)
    return list(dict.fromkeys(cleaned))  # deduplicate, preserve order


# ── Rule Validators ────────────────────────────────────────────────────────────

def validate_rule_name(name: str, field: str = "name"):
    name = sanitize_string(name)
    if not name:
        _raise(422, "Rule name is required.", field)
    if len(name) < 3:
        _raise(422, "Rule name must be at least 3 characters.", field)
    if len(name) > MAX_NAME_LEN:
        _raise(422, f"Rule name must not exceed {MAX_NAME_LEN} characters.", field)
    return name


def validate_priority(priority: int, field: str = "priority"):
    if not isinstance(priority, int):
        _raise(422, "Priority must be an integer.", field)
    if priority < 1:
        _raise(422, "Priority must be at least 1.", field)
    if priority > 1000:
        _raise(422, "Priority must not exceed 1000.", field)
    return priority


def validate_logic(logic: str, field: str = "logic"):
    if logic not in VALID_LOGIC:
        _raise(422, f"Logic must be one of: {', '.join(VALID_LOGIC)}.", field)
    return logic


def validate_conditions(conditions: List[Any], field: str = "conditions"):
    if not conditions:
        _raise(422, "At least one condition is required.", field)
    if len(conditions) > MAX_CONDITIONS:
        _raise(422, f"Maximum {MAX_CONDITIONS} conditions per rule.", field)

    for i, cond in enumerate(conditions):
        loc = f"conditions[{i}]"

        # field name
        f_name = sanitize_string(getattr(cond, "field", "") or "")
        if not f_name:
            _raise(422, f"{loc}: Field name is required.", loc)
        if len(f_name) > MAX_FIELD_NAME_LEN:
            _raise(422, f"{loc}: Field name too long (max {MAX_FIELD_NAME_LEN}).", loc)
        if not re.fullmatch(r"[a-zA-Z_][a-zA-Z0-9_.]*", f_name):
            _raise(422, f"{loc}: Field name must be alphanumeric/underscore, starting with a letter.", loc)

        # operator
        op = getattr(cond, "operator", "")
        if op not in VALID_OPERATORS:
            _raise(422, f"{loc}: Invalid operator '{op}'. Must be one of: {', '.join(VALID_OPERATORS)}.", loc)

        # value — required unless is_null / is_not_null
        if op in OPERATORS_REQUIRE_VALUE:
            val = getattr(cond, "value", None)
            if val is None or str(val).strip() == "":
                _raise(422, f"{loc}: Value is required for operator '{op}'.", loc)
            if len(str(val)) > MAX_FIELD_VALUE_LEN:
                _raise(422, f"{loc}: Value too long (max {MAX_FIELD_VALUE_LEN} chars).", loc)

        # data_type
        dt = getattr(cond, "data_type", "string")
        if dt not in VALID_DATA_TYPES:
            _raise(422, f"{loc}: data_type must be one of: {', '.join(VALID_DATA_TYPES)}.", loc)

        # numeric consistency
        if dt == "number" and op in OPERATORS_REQUIRE_VALUE:
            val = getattr(cond, "value", None)
            try:
                float(str(val))
            except (ValueError, TypeError):
                _raise(422, f"{loc}: Value '{val}' is not a valid number for data_type 'number'.", loc)

    return conditions


def validate_actions(actions: List[Any], field: str = "actions"):
    if not actions:
        _raise(422, "At least one action is required.", field)
    if len(actions) > MAX_ACTIONS:
        _raise(422, f"Maximum {MAX_ACTIONS} actions per rule.", field)

    seen_types = []
    for i, action in enumerate(actions):
        loc = f"actions[{i}]"
        a_type = getattr(action, "type", "")
        if a_type not in VALID_ACTIONS:
            _raise(422, f"{loc}: Invalid action type '{a_type}'. Must be one of: {', '.join(VALID_ACTIONS)}.", loc)
        seen_types.append(a_type)

    # Conflict check: allow + deny together makes no sense
    if "allow" in seen_types and "deny" in seen_types:
        _raise(422, "A rule cannot have both 'allow' and 'deny' actions.", field)

    return actions


def validate_policy_id(policy_id: str, field: str = "policy_id"):
    if not policy_id:
        _raise(422, "policy_id is required.", field)
    if not is_valid_object_id(policy_id):
        _raise(422, "policy_id is not a valid ID format.", field)
    return policy_id


# ── Auth Validators ────────────────────────────────────────────────────────────

def validate_username(username: str, field: str = "username"):
    username = sanitize_string(username)
    if not username:
        _raise(422, "Username is required.", field)
    if len(username) < 3:
        _raise(422, "Username must be at least 3 characters.", field)
    if len(username) > 50:
        _raise(422, "Username must not exceed 50 characters.", field)
    if not re.fullmatch(r"[a-zA-Z0-9_.-]+", username):
        _raise(422, "Username can only contain letters, numbers, underscores, dots, hyphens.", field)
    return username


def validate_password(password: str, field: str = "password"):
    if not password:
        _raise(422, "Password is required.", field)
    if len(password) < MIN_PASSWORD_LEN:
        _raise(422, f"Password must be at least {MIN_PASSWORD_LEN} characters.", field)
    if len(password) > MAX_PASSWORD_LEN:
        _raise(422, f"Password must not exceed {MAX_PASSWORD_LEN} characters.", field)
    if not re.search(r"[A-Z]", password):
        _raise(422, "Password must contain at least one uppercase letter.", field)
    if not re.search(r"[a-z]", password):
        _raise(422, "Password must contain at least one lowercase letter.", field)
    if not re.search(r"\d", password):
        _raise(422, "Password must contain at least one digit.", field)
    return password


def validate_role(role: str, field: str = "role"):
    if role not in VALID_ROLES:
        _raise(422, f"Role must be one of: {', '.join(VALID_ROLES)}.", field)
    return role


# ── Evaluation Validators ──────────────────────────────────────────────────────

def validate_input_data(input_data: Dict[str, Any], field: str = "input_data"):
    if not input_data:
        _raise(422, "input_data is required and must not be empty.", field)
    if not isinstance(input_data, dict):
        _raise(422, "input_data must be a JSON object (key-value pairs).", field)
    if len(input_data) > MAX_INPUT_FIELDS:
        _raise(422, f"input_data must not exceed {MAX_INPUT_FIELDS} fields.", field)

    for key, value in input_data.items():
        if not key or not isinstance(key, str):
            _raise(422, "All input_data keys must be non-empty strings.", field)
        if len(key) > MAX_FIELD_NAME_LEN:
            _raise(422, f"Field name '{key}' is too long (max {MAX_FIELD_NAME_LEN} chars).", field)
        if not re.fullmatch(r"[a-zA-Z_][a-zA-Z0-9_.]*", key):
            _raise(422, f"Field name '{key}' must start with a letter and contain only alphanumeric/underscore/dot chars.", field)
        if value is not None and len(str(value)) > MAX_FIELD_VALUE_LEN:
            _raise(422, f"Value for field '{key}' is too long (max {MAX_FIELD_VALUE_LEN} chars).", field)

    return input_data


# ── AI Generator Validators ────────────────────────────────────────────────────

def validate_prompt(prompt: str, field: str = "prompt"):
    prompt = sanitize_string(prompt)
    if not prompt:
        _raise(422, "Prompt is required.", field)
    if len(prompt) < 15:
        _raise(422, "Prompt must be at least 15 characters. Please describe your policy in more detail.", field)
    if len(prompt) > MAX_PROMPT_LEN:
        _raise(422, f"Prompt must not exceed {MAX_PROMPT_LEN} characters.", field)
    return prompt


# ── ObjectId Path Param Validator ──────────────────────────────────────────────

def validate_object_id(value: str, param_name: str = "id"):
    if not is_valid_object_id(value):
        _raise(400, f"'{param_name}' is not a valid ID.", param_name)
    return value