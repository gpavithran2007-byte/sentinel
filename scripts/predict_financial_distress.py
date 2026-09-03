"""Run the exported forward-looking Sentinel model for JSON history."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

import joblib
import numpy as np
import pandas as pd
import shap

from feature_engineering import GROUP, build_features, feature_frame


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-dir", type=Path, required=True)
    args = parser.parse_args()
    rows = json.load(sys.stdin)
    if not isinstance(rows, list) or not rows:
        raise ValueError("Expected a non-empty JSON array of financial rows")
    engineered = build_features(pd.DataFrame(rows))
    preprocessor = joblib.load(args.model_dir / "preprocessor.joblib")
    classifier = joblib.load(args.model_dir / "xgboost_classifier.joblib")
    metadata = json.loads((args.model_dir / "metadata.json").read_text(encoding="utf-8"))
    latest = engineered.sort_values("month").groupby(GROUP, as_index=False).tail(1)
    matrix = preprocessor.transform(feature_frame(latest))
    probabilities = classifier.predict_proba(matrix)[:, 1]
    shap_values = np.asarray(shap.TreeExplainer(classifier).shap_values(matrix))
    if shap_values.ndim == 3:
        shap_values = shap_values[:, :, 1]
    index = len(probabilities) - 1
    factors = [{"feature": name, "impact": float(value)} for name, value in zip(preprocessor.get_feature_names_out(), shap_values[index])]
    factors.sort(key=lambda factor: abs(factor["impact"]), reverse=True)
    probability = float(probabilities[index])
    print(json.dumps({"distress_probability": probability, "prediction": int(probability >= metadata["threshold"]), "top_factors": factors[:10]}))


if __name__ == "__main__":
    main()