"""Generate a reproducible synthetic monthly financial distress dataset."""

from __future__ import annotations

import argparse
import csv
import math
import random
from dataclasses import dataclass
from datetime import date
from pathlib import Path


SCENARIOS = (
    "healthy",
    "gradual_deterioration",
    "sudden_emergency",
    "persistent_debt_stress",
    "income_loss",
    "rising_expenses",
    "irregular_income",
)


@dataclass
class CustomerProfile:
    customer_id: str
    scenario: str
    monthly_income: float
    essential_ratio: float
    discretionary_ratio: float
    emi: float
    debt: float
    credit_limit: float
    balance: float
    savings_buffer: float
    income_volatility: float
    expense_volatility: float


def clipped(value: float, lower: float, upper: float) -> float:
    return max(lower, min(value, upper))


def money(value: float) -> float:
    return round(max(0.0, value), 2)


def month_date(start_year: int, month_index: int) -> str:
    month = (month_index % 12) + 1
    year = start_year + month_index // 12
    return date(year, month, 1).isoformat()


def create_profile(rng: random.Random, customer_number: int) -> CustomerProfile:
    scenario = rng.choices(
        SCENARIOS,
        weights=(0.35, 0.15, 0.10, 0.12, 0.10, 0.10, 0.08),
        k=1,
    )[0]
    income = clipped(rng.lognormvariate(math.log(2_750), 0.42), 1_400, 9_500)
    essential_ratio = clipped(rng.normalvariate(0.53, 0.08), 0.35, 0.72)
    discretionary_ratio = clipped(rng.normalvariate(0.16, 0.06), 0.05, 0.32)
    debt = clipped(rng.lognormvariate(math.log(5_800), 0.75), 0, 42_000)
    credit_limit = clipped(rng.lognormvariate(math.log(7_500), 0.55), 2_000, 30_000)
    emi = clipped(debt * rng.uniform(0.018, 0.042), 0, min(1_600, income * 0.28))
    balance = clipped(rng.normalvariate(income * 1.25, income * 0.55), 150, 24_000)

    if scenario == "persistent_debt_stress":
        debt *= rng.uniform(1.35, 2.1)
        emi = min(max(emi * rng.uniform(1.35, 1.8), 250), income * 0.38)
        balance *= rng.uniform(0.25, 0.65)
    elif scenario == "income_loss":
        balance *= rng.uniform(0.8, 1.4)
    elif scenario == "rising_expenses":
        essential_ratio = clipped(essential_ratio + rng.uniform(0.04, 0.11), 0.42, 0.78)
    elif scenario == "irregular_income":
        income *= rng.uniform(0.8, 1.15)

    return CustomerProfile(
        customer_id=f"C{customer_number:05d}",
        scenario=scenario,
        monthly_income=income,
        essential_ratio=essential_ratio,
        discretionary_ratio=discretionary_ratio,
        emi=emi,
        debt=debt,
        credit_limit=credit_limit,
        balance=balance,
        savings_buffer=balance,
        income_volatility=0.02 if scenario == "healthy" else rng.uniform(0.05, 0.15),
        expense_volatility=rng.uniform(0.02, 0.08),
    )


def generate_customer_rows(
    profile: CustomerProfile, rng: random.Random, months: int, start_year: int
) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    previous_income = profile.monthly_income
    missed_payments = 0
    high_stress_months = 0
    emergency_month = rng.randrange(3, max(4, months - 2))

    for month_index in range(months):
        income = profile.monthly_income
        essential_ratio = profile.essential_ratio
        discretionary_ratio = profile.discretionary_ratio
        debt = profile.debt
        emi = profile.emi
        event = "normal"

        if profile.scenario == "gradual_deterioration":
            progress = month_index / max(1, months - 1)
            income *= 1 - 0.12 * progress
            essential_ratio += 0.12 * progress
            discretionary_ratio += 0.02 * progress
            debt *= 1 + 0.22 * progress
            event = "gradual pressure"
        elif profile.scenario == "sudden_emergency" and month_index == emergency_month:
            income *= rng.uniform(0.45, 0.75)
            essential_ratio += rng.uniform(0.08, 0.18)
            debt += rng.uniform(600, 2_500)
            event = "one-month emergency"
        elif profile.scenario == "sudden_emergency" and month_index == emergency_month + 1:
            event = "recovery"
        elif profile.scenario == "persistent_debt_stress":
            debt *= 1 + rng.uniform(0.01, 0.035)
            emi = min(profile.monthly_income * 0.4, emi * (1 + month_index * 0.012))
            discretionary_ratio *= 0.95
            event = "debt pressure"
        elif profile.scenario == "income_loss" and month_index >= 4:
            income *= 0.63
            event = "income loss"
        elif profile.scenario == "rising_expenses":
            essential_ratio += 0.012 * month_index
            event = "rising essentials"
        elif profile.scenario == "irregular_income":
            income *= rng.choice((0.58, 0.78, 1.0, 1.12, 1.38))
            event = "variable income"

        income *= 1 + rng.normalvariate(0, profile.income_volatility)
        income = clipped(income, 650, 14_000)
        essential_spending = income * clipped(
            essential_ratio + rng.normalvariate(0, profile.expense_volatility), 0.30, 0.86
        )
        discretionary_spending = income * clipped(
            discretionary_ratio + rng.normalvariate(0, profile.expense_volatility), 0.02, 0.30
        )
        total_outgoings = essential_spending + discretionary_spending + emi
        available_after_bills = income - total_outgoings

        if available_after_bills < 0:
            debt += abs(available_after_bills) * rng.uniform(0.45, 0.85)
        else:
            debt -= min(debt, available_after_bills * rng.uniform(0.12, 0.28))
        debt = clipped(debt, 0, 50_000)

        payment_pressure = (emi + max(0, -available_after_bills)) / max(income, 1)
        payment_probability = clipped(
            0.985 - payment_pressure * 0.92 - max(0, debt / max(income, 1) - 3.5) * 0.025,
            0.18,
            0.995,
        )
        missed_this_month = 1 if rng.random() > payment_probability else 0
        missed_payments += missed_this_month

        balance_change = available_after_bills - missed_this_month * emi * rng.uniform(0.4, 0.9)
        profile.balance = clipped(profile.balance + balance_change, 0, 30_000)
        profile.savings_buffer = clipped(
            profile.savings_buffer + balance_change * 0.55, 0, 30_000
        )
        credit_utilization = clipped(
            (debt * rng.uniform(0.28, 0.48) + max(0, -available_after_bills))
            / max(profile.credit_limit, 1),
            0,
            1.25,
        )
        buffer_months = profile.savings_buffer / max(essential_spending + emi, 1)
        stress_score = (
            (essential_spending + emi) / max(income, 1) * 0.40
            + credit_utilization * 0.22
            + min(missed_payments, 4) / 4 * 0.18
            + (1 - min(buffer_months, 6) / 6) * 0.20
        )
        is_stress_month = stress_score >= 0.56 or missed_this_month == 1
        high_stress_months = high_stress_months + 1 if is_stress_month else 0
        sustained_distress = int(high_stress_months >= 2)

        rows.append(
            {
                "customer_id": profile.customer_id,
                "month": month_date(start_year, month_index),
                "month_index": month_index + 1,
                "scenario": profile.scenario,
                "event": event,
                "income": money(income),
                "essential_spending": money(essential_spending),
                "discretionary_spending": money(discretionary_spending),
                "balance": money(profile.balance),
                "emi": money(emi),
                "debt": money(debt),
                "credit_limit": money(profile.credit_limit),
                "credit_utilization": round(credit_utilization, 4),
                "missed_payments": missed_payments,
                "savings_buffer": money(profile.savings_buffer),
                "income_change_pct": round((income / max(previous_income, 1) - 1) * 100, 2),
                "expense_to_income_pct": round(
                    (essential_spending + discretionary_spending) / max(income, 1) * 100, 2
                ),
                "sustained_distress": sustained_distress,
            }
        )
        previous_income = income
        profile.debt = debt

    return rows


def generate_dataset(
    output_path: Path, customer_count: int, months: int, seed: int, start_year: int
) -> None:
    rng = random.Random(seed)
    rows: list[dict[str, object]] = []
    for customer_number in range(1, customer_count + 1):
        profile = create_profile(rng, customer_number)
        rows.extend(generate_customer_rows(profile, rng, months, start_year))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = list(rows[0].keys())
    with output_path.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows):,} rows for {customer_count:,} customers to {output_path}")
    print(f"Seed: {seed}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--customers", type=int, default=1_000)
    parser.add_argument("--months", type=int, default=12)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--start-year", type=int, default=2025)
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/synthetic_financial_distress.csv"),
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.customers < 1 or args.months < 1:
        raise SystemExit("--customers and --months must be positive")
    generate_dataset(args.output, args.customers, args.months, args.seed, args.start_year)


if __name__ == "__main__":
    main()
