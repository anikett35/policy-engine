from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from collections import Counter

from models.evaluation import Evaluation
from models.policy import Policy
from services.ml_rule_suggester import suggester
from routes.auth import get_current_user
from models.user import User

router = APIRouter()


@router.get("/suggest")
async def get_rule_suggestions(
    policy_id: Optional[str] = Query(None, description="Filter evaluations by policy ID"),
    category:  Optional[str] = Query(None, description="Policy category (for context)"),
    limit:     int            = Query(100,  description="Max number of evaluations to use for training"),
    current_user: User        = Depends(get_current_user),
):
    """
    Analyze past evaluations and return ML-generated rule suggestions.

    How it works:
        1. Load evaluations from MongoDB (filtered by policy if given)
        2. Pass to SmartRuleSuggester which runs Random Forest + frequency analysis
        3. Return ranked suggestions with confidence scores and reasons

    Response includes:
        - suggestions: combined ranked list (numeric + string)
        - numeric_suggestions: from Random Forest split analysis
        - string_suggestions: from frequency-based dominant decision
        - model_info: training stats (n_trees, top_features, decision_distribution)
    """
    try:
        # Load evaluations from MongoDB
        if policy_id:
            evaluations = (
                await Evaluation
                .find(Evaluation.policy_id == policy_id)
                .sort(-Evaluation.evaluated_at)
                .limit(limit)
                .to_list()
            )
        else:
            evaluations = (
                await Evaluation
                .find_all()
                .sort(-Evaluation.evaluated_at)
                .limit(limit)
                .to_list()
            )

        if not evaluations:
            return {
                "status":      "no_data",
                "message":     "No evaluations found. Run some evaluations first to enable ML suggestions.",
                "suggestions": [],
                "model_info":  {},
            }

        # Convert Beanie documents to plain dicts for the ML service
        eval_dicts = [
            {
                "input_data":     ev.input_data,
                "final_decision": ev.final_decision,
                "policy_id":      ev.policy_id,
                "policy_name":    ev.policy_name,
            }
            for ev in evaluations
        ]

        # Resolve policy category if not provided
        policy_category = category or ""
        if policy_id and not category:
            policy = await Policy.get(policy_id)
            if policy:
                policy_category = policy.category

        # Run ML pipeline
        result = await suggester.suggest_rules(eval_dicts, policy_category)

        # Attach request metadata to response
        result["meta"] = {
            "policy_id":       policy_id,
            "policy_category": policy_category,
            "evaluations_used": len(eval_dicts),
            "requested_by":    current_user.username,
        }

        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"ML suggestion pipeline error: {str(e)}",
        )


@router.get("/status")
async def get_ml_status(current_user: User = Depends(get_current_user)):
    """
    Return current status of the ML model and available training data.

    Useful for the frontend to display:
        - How many evaluations are available for training
        - Whether the model has been trained yet
        - Distribution of decisions in the data
    """
    total_count = await Evaluation.find_all().count()
    all_evals   = await Evaluation.find_all().to_list()

    decision_distribution = dict(Counter(ev.final_decision for ev in all_evals))

    return {
        "status":                      "ready",
        "total_evaluations_available": total_count,
        "decision_distribution":       decision_distribution,
        "model_type":                  "Random Forest + Decision Tree",
        "algorithm":                   "Pure Python — no scikit-learn required",
        "n_trees":                     suggester.forest.n_trees,
        "trained_feature_names":       suggester.forest.feature_names,
        "is_trained":                  len(suggester.forest.trees) > 0,
        "message": (
            "Model is trained and ready."
            if suggester.forest.trees
            else "Model not yet trained — call /suggest to trigger training."
        ),
    }