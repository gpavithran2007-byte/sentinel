"""Point-in-time features shared by training and production inference."""

from __future__ import annotations

import numpy as np
import pandas as pd

TARGET = "future_sustained_distress"
GROUP = "customer_id"
RAW_TARGET = "sustained_distress"
NON_FEATURE_COLUMNS = {GROUP, "month", RAW_TARGET, TARGET, "scenario"}


def _pct_change(series: pd.Series) -> pd.Series:
    return series.replace(0, np.nan).pct_change().replace([np.inf, -np.inf], np.nan).fillna(0) * 100


def build_features(frame: pd.DataFrame, with_target: bool = False) -> pd.DataFrame:
    """Build features using each row and earlier rows only."""
    required = {GROUP, "month", "income", "essential_spending", "discretionary_spending",
                "balance", "emi", "debt", "credit_limit", "savings_buffer", "missed_payments"}
    missing = required.difference(frame.columns)
    if missing:
        raise ValueError(f"Dataset is missing required columns: {sorted(missing)}")
    result = frame.copy()
    result["month"] = pd.to_datetime(result["month"])
    result = result.sort_values([GROUP, "month"]).reset_index(drop=True)
    grouped = result.groupby(GROUP, sort=False)
    total_expenses = result["essential_spending"] + result["discretionary_spending"]
    result["income_change_pct"] = grouped["income"].transform(_pct_change)
    result["expense_change_pct"] = total_expenses.groupby(result[GROUP], sort=False).transform(_pct_change)
    result["balance_change_pct"] = grouped["balance"].transform(_pct_change)
    result["savings_buffer_change"] = grouped["savings_buffer"].diff().fillna(0)
    result["debt_to_income_ratio"] = result["debt"] / result["income"].clip(lower=1)
    result["emi_to_income_ratio"] = result["emi"] / result["income"].clip(lower=1)
    if "credit_utilization" not in result:
        result["credit_utilization"] = result["debt"] / result["credit_limit"].clip(lower=1)
    result["income_volatility"] = grouped["income_change_pct"].transform(lambda values: values.rolling(3, min_periods=2).std().fillna(0))
    result["expense_volatility"] = grouped["expense_change_pct"].transform(lambda values: values.rolling(3, min_periods=2).std().fillna(0))
    stress_score = ((result["essential_spending"] + result["emi"]) / result["income"].clip(lower=1) * 0.40
                    + result["credit_utilization"].clip(0, 1.25) * 0.22
                    + result["missed_payments"].clip(upper=4) / 4 * 0.18
                    + (1 - (result["savings_buffer"] / (result["essential_spending"] + result["emi"]).clip(lower=1)).clip(upper=6) / 6) * 0.20)
    result["current_stressed"] = (stress_score >= 0.56).astype(int)
    result["consecutive_stressed_months"] = grouped["current_stressed"].transform(lambda values: values.groupby((values == 0).cumsum()).cumcount() + 1) * result["current_stressed"]
    result["stressed_months_recent"] = grouped["current_stressed"].transform(lambda values: values.rolling(3, min_periods=1).sum())
    previous_stressed = grouped["current_stressed"].shift(1).fillna(0)
    event = result["event"] if "event" in result else pd.Series("", index=result.index)
    result["recent_recovery_indicator"] = (((previous_stressed == 1) & (result["current_stressed"] == 0)) | event.eq("recovery")).astype(int)
    if with_target:
        if RAW_TARGET not in result:
            raise ValueError(f"Training data must contain {RAW_TARGET}")
        future_one = grouped[RAW_TARGET].shift(-1)
        future_two = grouped[RAW_TARGET].shift(-2)
        result[TARGET] = ((future_one == 1) | (future_two == 1)).astype(int)
        result["future_target_available"] = future_two.notna().astype(int)
        result = result[result["future_target_available"] == 1].drop(columns="future_target_available")
    return result


def feature_frame(frame: pd.DataFrame) -> pd.DataFrame:
    return frame.drop(columns=[column for column in NON_FEATURE_COLUMNS if column in frame], errors="ignore")