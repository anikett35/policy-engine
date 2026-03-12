import os
import json
import httpx
from fastapi import APIRouter, HTTPException, Depends
from schemas.validators import GeneratePolicySchema
from dotenv import load_dotenv

from models.policy import Policy, PolicyStatus
from models.rule import Rule, Condition, Action
from models.log import AuditLog
from routes.auth import get_current_user
from models.user import User

load_dotenv()

router = APIRouter()

# ── Groq Config ────────────────────────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL   = "llama-3.3-70b-versatile"   # Best free model on Groq

SYSTEM_PROMPT = """You are an expert policy rule engine designer.
The user will describe a policy in plain English.
Convert it into a structured JSON object.

Return ONLY valid JSON — no explanation, no markdown, no code fences, no text before or after.

Return exactly this structure:
{
  "policy": {
    "name": "short descriptive policy name",
    "description": "one sentence explaining what this policy does",
    "category": "one of: Compliance, Security, Financial, Data Governance, Access Control, Other",
    "tags": ["short", "keyword", "tags"],
    "status": "draft"
  },
  "rules": [
    {
      "name": "short rule name",
      "description": "what this rule checks",
      "priority": 1,
      "logic": "AND",
      "conditions": [
        {
          "field": "snake_case_field_name",
          "operator": "one of: equals, not_equals, greater_than, less_than, contains, not_contains, in, not_in, is_null, is_not_null",
          "value": "string value",
          "data_type": "one of: string, number, boolean"
        }
      ],
      "actions": [
        {
          "type": "one of: allow, deny, flag",
          "message": "human readable explanation",
          "parameters": {}
        }
      ],
      "is_active": true
    }
  ]
}

Rules:
- Return ONLY JSON. Nothing before or after. No backticks.
- DENY rules get lower priority numbers (run first).
- snake_case for all field names.
- Numbers: use greater_than/less_than with string values like "18", "600".
- Each rule has exactly ONE action.
- Generate 3 to 6 rules depending on complexity."""


# ── Request Model ──────────────────────────────────────────────────────────────
GeneratePolicyRequest = GeneratePolicySchema  # validation handled by shared schema


# ── Save to MongoDB ────────────────────────────────────────────────────────────
async def _save_policy_and_rules(generated: dict, created_by: str):
    """Save the AI-generated policy and all its rules to MongoDB."""
    pd = generated["policy"]

    policy = Policy(
        name        = pd["name"],
        description = pd["description"],
        category    = pd.get("category", "Other"),
        tags        = pd.get("tags", []),
        status      = PolicyStatus.DRAFT,
        created_by  = created_by,
    )
    await policy.insert()

    await AuditLog(
        action       = "CREATE",
        entity_type  = "policy",
        entity_id    = str(policy.id),
        entity_name  = policy.name,
        performed_by = created_by,
        details      = {"source": "ai_generator", "model": GROQ_MODEL},
    ).insert()

    for i, rd in enumerate(generated["rules"]):
        conditions = [
            Condition(
                field     = c["field"],
                operator  = c["operator"],
                value     = str(c["value"]),
                data_type = c.get("data_type", "string"),
            )
            for c in rd.get("conditions", [])
        ]
        actions = [
            Action(
                type       = a["type"],
                message    = a.get("message", ""),
                parameters = a.get("parameters", {}),
            )
            for a in rd.get("actions", [])
        ]

        rule = Rule(
            name        = rd["name"],
            description = rd.get("description", ""),
            policy_id   = str(policy.id),
            priority    = rd.get("priority", i + 1),
            logic       = rd.get("logic", "AND"),
            conditions  = conditions,
            actions     = actions,
            is_active   = rd.get("is_active", True),
            created_by  = created_by,
        )
        await rule.insert()

        await AuditLog(
            action       = "CREATE",
            entity_type  = "rule",
            entity_id    = str(rule.id),
            entity_name  = rule.name,
            performed_by = created_by,
            details      = {"source": "ai_generator", "policy_id": str(policy.id)},
        ).insert()

    return str(policy.id), policy.name


# ── Main Route ─────────────────────────────────────────────────────────────────
@router.post("/generate-policy")
async def generate_policy(
    req: GeneratePolicyRequest,
    current_user: User = Depends(get_current_user),
):
    # Validate API key
    if not GROQ_API_KEY:
        raise HTTPException(
            status_code=500,
            detail=(
                "GROQ_API_KEY not configured. "
                "Get a free key at https://console.groq.com → API Keys. "
                "Add GROQ_API_KEY=gsk_... to your .env file."
            ),
        )

    if not req.prompt or len(req.prompt.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="Prompt too short. Please describe your policy in at least one sentence.",
        )

    # ── Call Groq API (OpenAI-compatible format) ───────────────────────────────
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                GROQ_URL,
                headers={
                    "Content-Type":  "application/json",
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                },
                json={
                    "model":       GROQ_MODEL,
                    "temperature": 0.2,
                    "max_tokens":  2048,
                    "messages": [
                        {
                            "role":    "system",
                            "content": SYSTEM_PROMPT,
                        },
                        {
                            "role":    "user",
                            "content": (
                                f"Generate a policy for this requirement:\n\n"
                                f"{req.prompt}\n\n"
                                f"Return ONLY the JSON object, nothing else."
                            ),
                        },
                    ],
                    # Force JSON output — Groq supports this
                    "response_format": {"type": "json_object"},
                },
            )

        if response.status_code == 401:
            raise HTTPException(
                status_code=401,
                detail="Invalid GROQ_API_KEY. Check your key at https://console.groq.com",
            )
        if response.status_code == 429:
            raise HTTPException(
                status_code=429,
                detail="Groq rate limit reached. Wait a moment and try again.",
            )
        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"Groq API error {response.status_code}: {response.text[:300]}",
            )

        api_data = response.json()

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Groq API timed out. Please try again.")
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Could not reach Groq API: {str(e)}")

    # ── Extract text from response ─────────────────────────────────────────────
    try:
        raw_text = api_data["choices"][0]["message"]["content"]
    except (KeyError, IndexError) as e:
        raise HTTPException(
            status_code=422,
            detail=f"Unexpected Groq response structure: {str(api_data)[:300]}",
        )

    # ── Parse JSON ─────────────────────────────────────────────────────────────
    clean = raw_text.strip()
    if clean.startswith("```"):
        lines = clean.split("\n")
        clean = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

    try:
        generated = json.loads(clean)
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=422,
            detail=f"Could not parse response as JSON: {str(e)}. Raw: {clean[:300]}",
        )

    # ── Validate ───────────────────────────────────────────────────────────────
    if "policy" not in generated or "rules" not in generated:
        raise HTTPException(
            status_code=422,
            detail="Response missing 'policy' or 'rules'. Try a more detailed prompt.",
        )
    if not isinstance(generated["rules"], list) or len(generated["rules"]) == 0:
        raise HTTPException(
            status_code=422,
            detail="No rules were generated. Please provide a more detailed description.",
        )

    # ── Save to MongoDB ────────────────────────────────────────────────────────
    policy_id   = None
    policy_name = generated["policy"].get("name", "Untitled Policy")

    if req.save_to_db:
        try:
            policy_id, policy_name = await _save_policy_and_rules(
                generated, current_user.username
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database save failed: {str(e)}")

    return {
        "status":      "success",
        "message":     f"Policy '{policy_name}' with {len(generated['rules'])} rules generated successfully.",
        "policy_id":   policy_id,
        "policy_name": policy_name,
        "rules_count": len(generated["rules"]),
        "saved":       req.save_to_db,
        "preview":     generated,
    }


# ── Preview Route ──────────────────────────────────────────────────────────────
@router.post("/preview-policy")
async def preview_policy(
    req: GeneratePolicyRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate and preview without saving to database."""
    req.save_to_db = False
    return await generate_policy(req, current_user)