"""Train and export the forward-looking Sentinel financial distress model."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import shap
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.metrics import average_precision_score, confusion_matrix, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from xgboost import XGBClassifier

from feature_engineering import GROUP, TARGET, build_features, feature_frame

RANDOM_STATE = 42


def split_by_customer(frame: pd.DataFrame):
    first = GroupShuffleSplit(n_splits=1, test_size=0.20, random_state=RANDOM_STATE)
    train_validation_index, test_index = next(first.split(frame, groups=frame[GROUP]))
    train_validation, test = frame.iloc[train_validation_index], frame.iloc[test_index]
    second = GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=RANDOM_STATE)
    train_index, validation_index = next(second.split(train_validation, groups=train_validation[GROUP]))
    train = train_validation.iloc[train_index].copy()
    validation = train_validation.iloc[validation_index].copy()
    # Keep validation and test observations later than the training observations.
    return train[train.month_index <= 6], validation[validation.month_index.between(7, 8)], test[test.month_index.between(9, 10)]


def make_preprocessor(features: pd.DataFrame) -> ColumnTransformer:
    numeric = features.select_dtypes(include=["number"]).columns.tolist()
    categorical = features.select_dtypes(exclude=["number"]).columns.tolist()
    return ColumnTransformer([
        ("numeric", Pipeline([("imputer", SimpleImputer(strategy="median")), ("scaler", StandardScaler())]), numeric),
        ("categorical", Pipeline([("imputer", SimpleImputer(strategy="most_frequent")), ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))]), categorical),
    ], verbose_feature_names_out=False)


def choose_threshold(labels, probabilities: np.ndarray, minimum_precision: float):
    candidates = np.unique(np.concatenate(([0.05], probabilities, [0.95])))
    scored = []
    for threshold in candidates:
        predictions = probabilities >= threshold
        scored.append((threshold, precision_score(labels, predictions, zero_division=0), recall_score(labels, predictions, zero_division=0), f1_score(labels, predictions, zero_division=0)))
    acceptable = [row for row in scored if row[1] >= minimum_precision]
    chosen = max(acceptable or scored, key=lambda row: (row[2], row[3], -row[0]))
    return chosen[0], {"precision": chosen[1], "recall": chosen[2], "f1": chosen[3]}


def evaluate(labels, probabilities: np.ndarray, threshold: float) -> dict:
    predictions = probabilities >= threshold
    matrix = confusion_matrix(labels, predictions).tolist()
    return {"roc_auc": roc_auc_score(labels, probabilities), "pr_auc": average_precision_score(labels, probabilities),
            "precision": precision_score(labels, predictions, zero_division=0), "recall": recall_score(labels, predictions, zero_division=0),
            "f1": f1_score(labels, predictions, zero_division=0), "confusion_matrix": matrix,
            "false_positives": matrix[0][1], "false_negatives": matrix[1][0]}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=Path("data/synthetic_financial_distress.csv"))
    parser.add_argument("--output-dir", type=Path, default=Path("models/financial_distress"))
    parser.add_argument("--minimum-precision", type=float, default=0.70)
    args = parser.parse_args()
    if not 0 < args.minimum_precision <= 1:
        parser.error("--minimum-precision must be between 0 and 1")
    engineered = build_features(pd.read_csv(args.input), with_target=True)
    train, validation, test = split_by_customer(engineered)
    preprocessor = make_preprocessor(feature_frame(train))
    train_matrix = preprocessor.fit_transform(feature_frame(train))
    validation_matrix = preprocessor.transform(feature_frame(validation))
    test_matrix = preprocessor.transform(feature_frame(test))
    positive = train[TARGET].sum()
    classifier = XGBClassifier(n_estimators=300, max_depth=4, learning_rate=0.05, subsample=0.85, colsample_bytree=0.85,
                               min_child_weight=3, reg_lambda=2.0, objective="binary:logistic", eval_metric="aucpr",
                               scale_pos_weight=(len(train) - positive) / max(positive, 1), random_state=RANDOM_STATE, n_jobs=-1)
    classifier.fit(train_matrix, train[TARGET])
    validation_probabilities = classifier.predict_proba(validation_matrix)[:, 1]
    threshold, validation_selection = choose_threshold(validation[TARGET], validation_probabilities, args.minimum_precision)
    test_probabilities = classifier.predict_proba(test_matrix)[:, 1]
    metrics = evaluate(test[TARGET], test_probabilities, threshold)

    args.output_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(classifier, args.output_dir / "xgboost_classifier.joblib")
    joblib.dump(preprocessor, args.output_dir / "preprocessor.joblib")
    feature_names = preprocessor.get_feature_names_out().tolist()
    importance = [{"feature": name, "importance": float(value)} for name, value in zip(feature_names, classifier.feature_importances_)]
    importance.sort(key=lambda item: item["importance"], reverse=True)
    latest = engineered.sort_values("month").groupby(GROUP, as_index=False).tail(1).copy()
    latest_matrix = preprocessor.transform(feature_frame(latest))
    latest_probabilities = classifier.predict_proba(latest_matrix)[:, 1]
    shap_values = np.asarray(shap.TreeExplainer(classifier).shap_values(latest_matrix))
    if shap_values.ndim == 3:
        shap_values = shap_values[:, :, 1]
    explanations = []
    for index, (_, row) in enumerate(latest.iterrows()):
        factors = [{"feature": name, "impact": float(value)} for name, value in zip(feature_names, shap_values[index])]
        factors.sort(key=lambda item: abs(item["impact"]), reverse=True)
        explanations.append({"customer_id": row[GROUP], "month": row["month"].strftime("%Y-%m-%d"), "distress_probability": float(latest_probabilities[index]), "prediction": int(latest_probabilities[index] >= threshold), "top_factors": factors[:10]})
    test_output = test[[GROUP, "month", TARGET]].copy()
    test_output["distress_probability"] = test_probabilities
    test_output["prediction"] = (test_probabilities >= threshold).astype(int)
    test_output.to_csv(args.output_dir / "test_predictions.csv", index=False)
    (args.output_dir / "feature_importance.json").write_text(json.dumps(importance, indent=2), encoding="utf-8")
    (args.output_dir / "customer_explanations.json").write_text(json.dumps(explanations, indent=2), encoding="utf-8")
    metadata = {"target": TARGET, "threshold": threshold, "minimum_validation_precision": args.minimum_precision, "validation_selection": validation_selection, "metrics": metrics,
                "split": {"train_rows": len(train), "validation_rows": len(validation), "test_rows": len(test), "train_customers": train[GROUP].nunique(), "validation_customers": validation[GROUP].nunique(), "test_customers": test[GROUP].nunique(), "train_max_month_index": int(train.month_index.max()), "validation_max_month_index": int(validation.month_index.max()), "test_min_month_index": int(test.month_index.min())},
                "feature_names": feature_names, "future_horizon_months": 2}
    (args.output_dir / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(json.dumps({"output_dir": str(args.output_dir), "metrics": metrics}, indent=2))


if __name__ == "__main__":
    main()