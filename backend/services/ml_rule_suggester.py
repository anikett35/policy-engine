

import math
from collections import defaultdict, Counter
from typing import List, Dict, Any, Optional
import numpy as np


class DecisionTree:
    """
    A single Decision Tree classifier.
    Uses Gini Impurity to find the best splits.
    Supports max_depth and min_samples_leaf constraints.
    """

    def __init__(self, max_depth: int = 4, min_samples: int = 2, feature_subset: List[int] = None):
        self.max_depth      = max_depth
        self.min_samples    = min_samples
        self.feature_subset = feature_subset  # Random feature subset for Random Forest
        self.root           = None

    # ------------------------------------------------------------------
    # Gini Impurity
    # ------------------------------------------------------------------
    def _gini(self, labels: list) -> float:
        """
        Calculate Gini Impurity for a list of class labels.
        
        Gini = 1 - sum(p_i^2)
        where p_i = proportion of class i in the node.
        
        Returns 0.0 for a pure node (all same class).
        Returns ~0.67 for maximum impurity (3 equal classes).
        """
        if not labels:
            return 0.0
        total  = len(labels)
        counts = Counter(labels)
        return 1.0 - sum((count / total) ** 2 for count in counts.values())

    # ------------------------------------------------------------------
    # Find Best Split
    # ------------------------------------------------------------------
    def _best_split(self, X: list, y: list):
        """
        Find the feature and threshold that gives the best information gain.

        For each feature, tries all midpoints between consecutive unique values
        as candidate thresholds. Picks the split with maximum gain.

        Returns:
            best_feature_idx  - index of best feature
            best_threshold    - optimal split value
            best_gain         - information gain achieved
        """
        best_gain      = 0.0
        best_feature   = None
        best_threshold = None
        parent_gini    = self._gini(y)
        n              = len(y)

        features = self.feature_subset if self.feature_subset else range(len(X[0]))

        for feat_idx in features:
            # Get all unique values for this feature, sorted
            values = sorted(set(
                row[feat_idx] for row in X
                if isinstance(row[feat_idx], (int, float))
            ))

            if len(values) < 2:
                continue

            # Candidate thresholds = midpoints between consecutive values
            thresholds = [
                (values[i] + values[i + 1]) / 2
                for i in range(len(values) - 1)
            ]

            for threshold in thresholds:
                left_y  = [y[i] for i, row in enumerate(X) if row[feat_idx] <= threshold]
                right_y = [y[i] for i, row in enumerate(X) if row[feat_idx] > threshold]

                if not left_y or not right_y:
                    continue

                # Weighted average Gini after split
                weighted_gini = (
                    (len(left_y) / n) * self._gini(left_y) +
                    (len(right_y) / n) * self._gini(right_y)
                )
                gain = parent_gini - weighted_gini

                if gain > best_gain:
                    best_gain      = gain
                    best_feature   = feat_idx
                    best_threshold = threshold

        return best_feature, best_threshold, best_gain

    # ------------------------------------------------------------------
    # Build Tree Recursively
    # ------------------------------------------------------------------
    def _build(self, X: list, y: list, depth: int = 0) -> dict:
        """
        Recursively build the decision tree.

        Stopping conditions:
            - Max depth reached
            - All samples have same label (pure node)
            - Too few samples to split
            - No split improves purity

        Returns a node dict with either:
            - {'leaf': True, 'prediction': ..., 'samples': ..., 'distribution': ...}
            - {'leaf': False, 'feature_idx': ..., 'threshold': ..., 'left': ..., 'right': ...}
        """
        label_counts = Counter(y)

        # Stopping conditions → create leaf node
        if (
            depth >= self.max_depth
            or len(set(y)) == 1
            or len(y) <= self.min_samples
        ):
            prediction = label_counts.most_common(1)[0][0] if y else "allow"
            return {
                "leaf":         True,
                "prediction":   prediction,
                "samples":      len(y),
                "distribution": dict(label_counts),
            }

        # Find best split
        feat_idx, threshold, gain = self._best_split(X, y)

        if feat_idx is None or gain < 0.001:
            prediction = label_counts.most_common(1)[0][0]
            return {
                "leaf":         True,
                "prediction":   prediction,
                "samples":      len(y),
                "distribution": dict(label_counts),
            }

        # Split data into left and right branches
        left_indices  = [i for i, row in enumerate(X) if row[feat_idx] <= threshold]
        right_indices = [i for i, row in enumerate(X) if row[feat_idx] > threshold]

        left_X  = [X[i] for i in left_indices]
        left_y  = [y[i] for i in left_indices]
        right_X = [X[i] for i in right_indices]
        right_y = [y[i] for i in right_indices]

        return {
            "leaf":         False,
            "feature_idx":  feat_idx,
            "threshold":    threshold,
            "gain":         gain,
            "samples":      len(y),
            "distribution": dict(label_counts),
            "left":         self._build(left_X, left_y, depth + 1),
            "right":        self._build(right_X, right_y, depth + 1),
        }

    def fit(self, X: list, y: list):
        """Train the decision tree on feature matrix X and labels y."""
        self.root = self._build(X, y)
        return self

    # ------------------------------------------------------------------
    # Extract Feature Importance
    # ------------------------------------------------------------------
    def get_feature_importance(self) -> Dict[int, float]:
        """
        Traverse the tree and accumulate feature importance scores.
        Importance = sum of (gain * samples) for each node where the feature is used.
        """
        importance = {}
        self._traverse_importance(self.root, importance)
        return importance

    def _traverse_importance(self, node: dict, importance: dict):
        if not node or node.get("leaf"):
            return
        feat_idx = node["feature_idx"]
        importance[feat_idx] = importance.get(feat_idx, 0) + node["gain"] * node["samples"]
        self._traverse_importance(node["left"], importance)
        self._traverse_importance(node["right"], importance)

    # ------------------------------------------------------------------
    # Extract Split Rules
    # ------------------------------------------------------------------
    def get_splits(self) -> list:
        """
        Collect all internal split nodes from the tree.
        Each split includes: feature_idx, threshold, gain, dominant decision per side.
        """
        splits = []
        self._traverse_splits(self.root, splits)
        return splits

    def _traverse_splits(self, node: dict, splits: list):
        if not node or node.get("leaf"):
            return

        left_dist  = node["left"].get("distribution", {})
        right_dist = node["right"].get("distribution", {})

        left_dominant  = max(left_dist,  key=left_dist.get)  if left_dist  else "allow"
        right_dominant = max(right_dist, key=right_dist.get) if right_dist else "allow"

        splits.append({
            "feature_idx":     node["feature_idx"],
            "threshold":       node["threshold"],
            "gain":            node["gain"],
            "samples":         node["samples"],
            "left_decision":   left_dominant,
            "right_decision":  right_dominant,
            "left_count":      sum(left_dist.values()),
            "right_count":     sum(right_dist.values()),
        })

        self._traverse_splits(node["left"],  splits)
        self._traverse_splits(node["right"], splits)


# ==============================================================================
# Random Forest
# ==============================================================================
class RandomForest:
    """
    Random Forest classifier.

    Trains N decision trees, each on a random bootstrap sample of the data
    and a random subset of features. Aggregates results across all trees
    to produce stable feature importance and threshold suggestions.

    Hyperparameters:
        n_trees    - number of trees in the forest (default 10)
        max_depth  - maximum depth per tree (default 4)
        min_samples- minimum samples to split a node (default 2)
    """

    def __init__(self, n_trees: int = 10, max_depth: int = 4, min_samples: int = 2):
        self.n_trees     = n_trees
        self.max_depth   = max_depth
        self.min_samples = min_samples
        self.trees: List[DecisionTree] = []
        self.feature_names: List[str]  = []

    def fit(self, X: list, y: list, feature_names: List[str]):
        """
        Train the Random Forest.

        For each tree:
            1. Bootstrap sample: sample N rows with replacement
            2. Random feature subset: pick sqrt(n_features) features
            3. Train a DecisionTree on the bootstrap sample
        """
        self.feature_names = feature_names
        self.trees         = []

        n          = len(X)
        n_features = len(X[0]) if X else 0
        subset_size = max(1, int(math.sqrt(n_features)))

        np.random.seed(42)

        for _ in range(self.n_trees):
            # Bootstrap sampling (sample with replacement)
            indices  = [int(np.random.randint(0, n)) for _ in range(n)]
            sample_X = [X[i] for i in indices]
            sample_y = [y[i] for i in indices]

            # Random feature subset
            if n_features > subset_size:
                feat_subset = list(np.random.choice(n_features, subset_size, replace=False))
            else:
                feat_subset = list(range(n_features))

            tree = DecisionTree(
                max_depth=self.max_depth,
                min_samples=self.min_samples,
                feature_subset=feat_subset,
            )
            tree.fit(sample_X, sample_y)
            self.trees.append(tree)

        return self

    def get_aggregated_importance(self) -> Dict[int, float]:
        """
        Aggregate feature importance across all trees.
        Normalize to sum to 1.0.
        """
        total = {}
        for tree in self.trees:
            for feat_idx, score in tree.get_feature_importance().items():
                total[feat_idx] = total.get(feat_idx, 0) + score

        total_score = sum(total.values()) or 1
        return {k: v / total_score for k, v in total.items()}

    def get_aggregated_splits(self) -> list:
        """
        Collect all splits from all trees.
        Group by feature, compute median threshold and average gain.
        Returns sorted list of aggregated split info per feature.
        """
        all_splits = []
        for tree in self.trees:
            all_splits.extend(tree.get_splits())

        # Group splits by feature index
        by_feature = defaultdict(list)
        for split in all_splits:
            by_feature[split["feature_idx"]].append(split)

        aggregated = []
        for feat_idx, feat_splits in by_feature.items():
            if not feat_splits:
                continue

            thresholds = [s["threshold"] for s in feat_splits]
            gains      = [s["gain"]      for s in feat_splits]

            median_threshold = float(np.median(thresholds))
            avg_gain         = float(np.mean(gains))

            left_decisions  = Counter(s["left_decision"]  for s in feat_splits)
            right_decisions = Counter(s["right_decision"] for s in feat_splits)

            dominant_left  = left_decisions.most_common(1)[0][0]
            dominant_right = right_decisions.most_common(1)[0][0]

            # Frequency = how often this feature appears across all trees (0 to n_trees)
            frequency = len(feat_splits) / (self.n_trees or 1)

            # Confidence = combination of frequency and gain
            confidence = min(1.0, frequency * avg_gain * 10)

            aggregated.append({
                "feature":        self.feature_names[feat_idx],
                "feature_idx":    feat_idx,
                "threshold":      median_threshold,
                "gain":           avg_gain,
                "frequency":      frequency,
                "left_decision":  dominant_left,
                "right_decision": dominant_right,
                "confidence":     confidence,
            })

        return sorted(aggregated, key=lambda x: x["confidence"], reverse=True)


# ==============================================================================
# Smart Rule Suggester
# ==============================================================================
class SmartRuleSuggester:
    """
    Main service that orchestrates the ML pipeline and converts
    model output into human-readable rule suggestions.

    Handles two types of fields:
        - Numeric: Random Forest with Decision Tree split analysis
        - String:  Frequency-based dominant decision analysis
    """

    def __init__(self):
        self.forest = RandomForest(n_trees=10, max_depth=4, min_samples=2)

    # ------------------------------------------------------------------
    # Build Suggestions from Aggregated Splits
    # ------------------------------------------------------------------
    def _build_numeric_suggestions(
        self,
        aggregated_splits: list,
        importance: Dict[int, float],
    ) -> list:
        """
        Convert aggregated tree splits into rule suggestion objects.

        Logic:
            - right_decision = allow, left_decision = deny/flag
              → Suggest: field > threshold → ALLOW
            - right_decision = deny
              → Suggest: field > threshold → DENY
            - etc.

        Returns top 6 suggestions sorted by confidence.
        """
        suggestions  = []
        seen_features = set()

        for agg in aggregated_splits[:8]:
            feature = agg["feature"]
            if feature in seen_features:
                continue
            seen_features.add(feature)

            threshold    = agg["threshold"]
            left_dec     = agg["left_decision"]    # value <= threshold
            right_dec    = agg["right_decision"]   # value >  threshold
            confidence   = round(agg["confidence"] * 100, 1)
            feat_idx     = agg["feature_idx"]
            importance_pct = round(importance.get(feat_idx, 0) * 100, 1)

            # Determine operator and action based on which side leads to which decision
            if right_dec == "allow" and left_dec in ("deny", "flag"):
                operator = "greater_than"
                action   = "allow"
                reason   = (
                    f"Past evaluations show that when {feature} > {round(threshold, 2)}, "
                    f"the result is {right_dec.upper()} {confidence}% of the time."
                )
            elif left_dec == "allow" and right_dec in ("deny", "flag"):
                operator = "less_than"
                action   = "allow"
                reason   = (
                    f"Past evaluations show that when {feature} < {round(threshold, 2)}, "
                    f"the result is {left_dec.upper()} {confidence}% of the time."
                )
            elif right_dec == "deny":
                operator = "greater_than"
                action   = "deny"
                reason   = (
                    f"A DENY pattern is detected when {feature} > {round(threshold, 2)}."
                )
            elif left_dec == "deny":
                operator = "less_than"
                action   = "deny"
                reason   = (
                    f"A DENY pattern is detected when {feature} < {round(threshold, 2)}."
                )
            elif right_dec == "flag":
                operator = "greater_than"
                action   = "flag"
                reason   = (
                    f"A FLAG (review) pattern is detected when {feature} > {round(threshold, 2)}."
                )
            else:
                operator = "greater_than"
                action   = right_dec
                reason   = (
                    f"{feature} is an important field. "
                    f"The threshold {round(threshold, 2)} is a significant split point."
                )

            suggestions.append({
                "field":             feature,
                "operator":          operator,
                "value":             str(round(threshold, 2)),
                "data_type":         "number",
                "suggested_action":  action,
                "confidence":        confidence,
                "reason":            reason,
                "importance":        importance_pct,
                "samples_affected":  agg.get("samples", 0),
            })

        return suggestions[:6]

    # ------------------------------------------------------------------
    # String Field Analysis
    # ------------------------------------------------------------------
    def _analyze_string_fields(self, evaluations: list) -> list:
        """
        For string fields, count how often each value leads to each decision.
        If one decision is dominant (>= 60% of cases), suggest a rule for it.

        Example:
            employment_status = "unemployed" → DENY 90% of the time
            → Suggest: employment_status equals unemployed → DENY (confidence: 90%)
        """
        suggestions = []
        field_value_decisions = defaultdict(lambda: defaultdict(list))

        for ev in evaluations:
            for field, value in ev["input_data"].items():
                if isinstance(value, str):
                    field_value_decisions[field][value.lower()].append(ev["final_decision"])

        for field, value_map in field_value_decisions.items():
            for value, decisions in value_map.items():
                if len(decisions) < 2:
                    continue

                counts   = Counter(decisions)
                dominant = counts.most_common(1)[0]
                dom_decision, dom_count = dominant
                confidence = round((dom_count / len(decisions)) * 100, 1)

                if confidence >= 60:
                    suggestions.append({
                        "field":            field,
                        "operator":         "equals",
                        "value":            value,
                        "data_type":        "string",
                        "suggested_action": dom_decision,
                        "confidence":       confidence,
                        "reason": (
                            f'When "{field}" equals "{value}", the decision is {dom_decision.upper()} '
                            f"{confidence}% of the time across {len(decisions)} evaluations."
                        ),
                        "importance":        round(confidence / 100, 2),
                        "samples_affected":  len(decisions),
                    })

        return sorted(suggestions, key=lambda x: x["confidence"], reverse=True)[:4]

    # ------------------------------------------------------------------
    # Main Entry Point
    # ------------------------------------------------------------------
    async def suggest_rules(self, evaluations: list, policy_category: str = "") -> dict:
        """
        Run the full ML pipeline on past evaluations and return rule suggestions.

        Steps:
            1. Validate minimum data requirement (>= 3 evaluations)
            2. Extract numeric feature matrix from input_data
            3. Train Random Forest on numeric features
            4. Extract feature importance and split thresholds
            5. Analyze string fields with frequency counting
            6. Combine and rank all suggestions

        Args:
            evaluations:     List of evaluation dicts from MongoDB
            policy_category: Optional category string for context

        Returns:
            Dict with status, suggestions list, model_info, and split suggestions
        """
        # Minimum data check
        if len(evaluations) < 3:
            return {
                "status":  "insufficient_data",
                "message": (
                    f"At least 3 evaluations are required to generate suggestions. "
                    f"Currently found: {len(evaluations)}."
                ),
                "suggestions":          [],
                "numeric_suggestions":  [],
                "string_suggestions":   [],
                "model_info":           {},
            }

        # --- Discover numeric fields across all evaluations ---
        numeric_fields = set()
        for ev in evaluations:
            for key, value in ev["input_data"].items():
                try:
                    float(value)
                    numeric_fields.add(key)
                except (ValueError, TypeError):
                    pass

        numeric_fields = sorted(numeric_fields)
        numeric_suggestions = []

        model_info = {
            "n_evaluations":  len(evaluations),
            "numeric_fields": numeric_fields,
        }

        # --- Train Random Forest on numeric data ---
        if numeric_fields and len(evaluations) >= 3:
            X = []
            y = []

            for ev in evaluations:
                row   = []
                valid = True
                for field in numeric_fields:
                    try:
                        row.append(float(ev["input_data"].get(field, 0)))
                    except (ValueError, TypeError):
                        valid = False
                        break
                if valid and len(row) == len(numeric_fields):
                    X.append(row)
                    y.append(ev["final_decision"])

            # Need at least 2 different decision classes to learn from
            if len(X) >= 3 and len(set(y)) >= 2:
                self.forest.fit(X, y, numeric_fields)

                importance       = self.forest.get_aggregated_importance()
                aggregated_splits = self.forest.get_aggregated_splits()
                numeric_suggestions = self._build_numeric_suggestions(aggregated_splits, importance)

                model_info.update({
                    "n_trees":             self.forest.n_trees,
                    "n_samples_trained":   len(X),
                    "features_used":       numeric_fields,
                    "decision_distribution": dict(Counter(y)),
                    "top_features": [
                        {
                            "field":      numeric_fields[k],
                            "importance": round(v * 100, 1),
                        }
                        for k, v in sorted(importance.items(), key=lambda x: x[1], reverse=True)[:5]
                        if k < len(numeric_fields)
                    ],
                })

        # --- Analyze string fields ---
        string_suggestions = self._analyze_string_fields(evaluations)

        # --- Combine and rank all suggestions by confidence ---
        all_suggestions = numeric_suggestions + string_suggestions
        all_suggestions = sorted(all_suggestions, key=lambda x: x["confidence"], reverse=True)

        return {
            "status":  "success",
            "message": (
                f"{len(all_suggestions)} rule suggestions generated "
                f"from {len(evaluations)} past evaluations."
            ),
            "suggestions":          all_suggestions,
            "numeric_suggestions":  numeric_suggestions,
            "string_suggestions":   string_suggestions,
            "model_info":           model_info,
        }


# Singleton instance — imported by routes/ml_suggestions.py
suggester = SmartRuleSuggester()