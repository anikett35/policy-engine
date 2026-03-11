from models.rule import Rule, Condition, ConditionOperator
from models.policy import Policy
from models.evaluation import Evaluation, RuleResult
from models.log import AuditLog
from typing import Any, Dict, List
import time

class PolicyEvaluator:
    """Core Python Rule Engine for evaluating policies against input data"""

    def evaluate_condition(self, condition: Condition, data: Dict[str, Any]) -> bool:
        field_value = data.get(condition.field)
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
            conditions_evaluated.append({
                "field": condition.field,
                "operator": condition.operator,
                "expected": condition.value,
                "actual": data.get(condition.field),
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
        if "deny" in all_actions:
            final_decision = "deny"
        elif "flag" in all_actions:
            final_decision = "flag"
        elif "allow" in all_actions:
            final_decision = "allow"
        else:
            final_decision = "allow"  # default pass-through

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


evaluator = PolicyEvaluator()
