from models.rule import Rule, Condition, ConditionOperator
from models.policy import Policy
from models.evaluation import Evaluation, RuleResult
from models.log import AuditLog
from typing import Any, Dict, List
import time
from concurrent.futures import ThreadPoolExecutor

_executor = ThreadPoolExecutor(max_workers=8)

class PolicyEvaluator:
    """Core Python Rule Engine for evaluating policies against input data"""

    def evaluate_condition(self, condition: Condition, data: Dict[str, Any]) -> bool:
        # Case-insensitive field lookup — handles CSV headers in any case
        field_lower = condition.field.lower()
        field_value = None
        for key, val in data.items():
            if key.lower() == field_lower:
                field_value = str(val).strip() if val is not None else val
                break

        expected = condition.value
        op = condition.operator

        if op == ConditionOperator.IS_NULL:
            return field_value is None
        if op == ConditionOperator.IS_NOT_NULL:
            return field_value is not None
        if field_value is None:
            return False

        # Type coercion
        try:
            if condition.data_type == "number":
                field_value = float(field_value)
                expected = float(expected)
            elif condition.data_type == "boolean":
                field_value = bool(field_value)
        except (ValueError, TypeError):
            return False

        if op == ConditionOperator.EQUALS:
            return str(field_value).lower() == str(expected).lower()
        elif op == ConditionOperator.NOT_EQUALS:
            return str(field_value).lower() != str(expected).lower()
        elif op == ConditionOperator.GREATER_THAN:
            return float(field_value) > float(expected)
        elif op == ConditionOperator.LESS_THAN:
            return float(field_value) < float(expected)
        elif op == ConditionOperator.CONTAINS:
            return str(expected).lower() in str(field_value).lower()
        elif op == ConditionOperator.NOT_CONTAINS:
            return str(expected).lower() not in str(field_value).lower()
        elif op == ConditionOperator.IN:
            values = [v.strip().lower() for v in str(expected).split(",")]
            return str(field_value).lower() in values
        elif op == ConditionOperator.NOT_IN:
            values = [v.strip().lower() for v in str(expected).split(",")]
            return str(field_value).lower() not in values
        return False

    def evaluate_rule(self, rule: Rule, data: Dict[str, Any]) -> RuleResult:
        conditions_evaluated = []
        results = []

        for condition in rule.conditions:
            result = self.evaluate_condition(condition, data)
            results.append(result)
            # Case-insensitive actual value for display
            field_lower = condition.field.lower()
            actual_val = next(
                (str(v).strip() for k, v in data.items() if k.lower() == field_lower),
                None
            )
            conditions_evaluated.append({
                "field": condition.field,
                "operator": condition.operator,
                "expected": condition.value,
                "actual": actual_val,
                "passed": result
            })

        if rule.logic == "AND":
            matched = all(results)
        else:  # OR
            matched = any(results)

        actions_triggered = []
        if matched:
            actions_triggered = [a.type for a in rule.actions]

        return RuleResult(
            rule_id=str(rule.id),
            rule_name=rule.name,
            matched=matched,
            actions_triggered=actions_triggered,
            conditions_evaluated=conditions_evaluated
        )

    async def evaluate_policy(self, policy_id: str, input_data: Dict[str, Any], evaluated_by: str) -> Evaluation:
        policy = await Policy.get(policy_id)
        if not policy:
            raise ValueError(f"Policy {policy_id} not found")

        rules = await Rule.find(Rule.policy_id == policy_id, Rule.is_active == True).sort(Rule.priority).to_list()

        start_time = time.time()
        results = []
        all_actions = []

        for rule in rules:
            result = self.evaluate_rule(rule, input_data)
            results.append(result)
            if result.matched:
                all_actions.extend(result.actions_triggered)

        execution_ms = (time.time() - start_time) * 1000

        # Determine final decision
        # Priority: deny > flag > allow > deny (default if no rule matched)
        if "deny" in all_actions:
            final_decision = "deny"
        elif "flag" in all_actions:
            final_decision = "flag"
        elif "allow" in all_actions:
            final_decision = "allow"
        else:
            # No rule matched → default deny (safe fail-closed behaviour)
            final_decision = "deny"

        evaluation = Evaluation(
            policy_id=policy_id,
            policy_name=policy.name,
            input_data=input_data,
            results=results,
            final_decision=final_decision,
            rules_matched=sum(1 for r in results if r.matched),
            rules_total=len(results),
            execution_time_ms=round(execution_ms, 2),
            evaluated_by=evaluated_by
        )
        await evaluation.insert()

        log = AuditLog(
            action="EVALUATE",
            entity_type="evaluation",
            entity_id=str(evaluation.id),
            entity_name=policy.name,
            performed_by=evaluated_by,
            details={"decision": final_decision, "rules_matched": evaluation.rules_matched}
        )
        await log.insert()

        return evaluation

    def evaluate_policy_fast(self, input_data: dict, rules_cache: list) -> dict:
        """
        Sync in-memory evaluation — skips DB insert & audit log.
        Called from a ThreadPoolExecutor for true parallel execution.
        """
        start_time = time.perf_counter()
        all_actions = []
        results = []

        for rule in rules_cache:
            result = self.evaluate_rule(rule, input_data)
            results.append(result)
            if result.matched:
                all_actions.extend(result.actions_triggered)

        execution_ms = round((time.perf_counter() - start_time) * 1000, 3)

        if "deny" in all_actions:
            final_decision = "deny"
        elif "flag" in all_actions:
            final_decision = "flag"
        elif "allow" in all_actions:
            final_decision = "allow"
        else:
            final_decision = "deny"  # fail-closed default

        return {
            "final_decision": final_decision,
            "rules_matched": sum(1 for r in results if r.matched),
            "rules_total": len(results),
            "execution_time_ms": execution_ms,
            "results": [r.dict() for r in results],
        }


evaluator = PolicyEvaluator()
