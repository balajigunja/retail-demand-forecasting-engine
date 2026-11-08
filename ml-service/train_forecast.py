
from pathlib import Path
import json

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "retail.csv"
MODEL_DIR = BASE_DIR / "models"
MODEL_PATH = MODEL_DIR / "demand_forecast.joblib"
METRICS_PATH = MODEL_DIR / "evaluation_metrics.json"

DATE_COL = "Date"
CATEGORY_COL = "Product Category"
TARGET_COL = "Quantity"

FEATURES = [
    "day_of_week",
    "month",
    "day_of_month",
    "lag_1",
    "lag_7",
    "lag_14",
    "rolling_mean_7",
]


def evaluate(actual, predicted):
    return {
        "mae": round(float(mean_absolute_error(actual, predicted)), 4),
        "rmse": round(
            float(np.sqrt(mean_squared_error(actual, predicted))), 4
        ),
    }


def main():
    # Load and validate the CSV
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset not found: {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)

    required = [DATE_COL, CATEGORY_COL, TARGET_COL]
    missing = [col for col in required if col not in df.columns]

    if missing:
        raise ValueError(
            f"Missing columns: {missing}. Available columns: {list(df.columns)}"
        )

    df[DATE_COL] = pd.to_datetime(df[DATE_COL], errors="coerce")
    df[TARGET_COL] = pd.to_numeric(df[TARGET_COL], errors="coerce")
    df[CATEGORY_COL] = df[CATEGORY_COL].astype("string").str.strip()

    df = df.dropna(subset=required).copy()
    df = df[df[CATEGORY_COL] != ""].copy()

    if df.empty:
        raise ValueError("No valid records remain after cleaning.")

    if (df[TARGET_COL] < 0).any():
        raise ValueError("Negative quantities found in the dataset.")

    # Aggregate transaction records into daily category quantities
    daily = (
        df.groupby([DATE_COL, CATEGORY_COL], as_index=False)[TARGET_COL]
        .sum()
        .rename(columns={
            DATE_COL: "date",
            CATEGORY_COL: "category",
            TARGET_COL: "quantity",
        })
    )

    # Fill missing dates within each category.
    # Assumption: missing date/category records mean zero sales.
    filled = []

    for category, group in daily.groupby("category"):
        group = group.sort_values("date").set_index("date")

        date_range = pd.date_range(
            start=group.index.min(),
            end=group.index.max(),
            freq="D",
        )

        group = group.reindex(date_range)
        group.index.name = "date"
        group["category"] = category
        group["quantity"] = group["quantity"].fillna(0)

        filled.append(group.reset_index())

    daily = pd.concat(filled, ignore_index=True)
    daily["quantity"] = daily["quantity"].astype(float)
    daily = daily.sort_values(["category", "date"]).reset_index(drop=True)

    categories = sorted(daily["category"].unique().tolist())

    if len(daily) < 15:
        raise ValueError("Not enough historical daily data to train the model.")

    print(f"Loaded {len(daily)} daily records.")
    print(f"Categories: {categories}")
    print(f"Date range: {daily['date'].min().date()} to "
          f"{daily['date'].max().date()}")

    # Create features separately for each category
    def add_features(data):
        result = data.copy()
        grouped = result.groupby("category")["quantity"]

        result["day_of_week"] = result["date"].dt.dayofweek
        result["month"] = result["date"].dt.month
        result["day_of_month"] = result["date"].dt.day
        result["lag_1"] = grouped.shift(1)
        result["lag_7"] = grouped.shift(7)
        result["lag_14"] = grouped.shift(14)

        result["rolling_mean_7"] = grouped.transform(
            lambda s: s.shift(1).rolling(7, min_periods=7).mean()
        )
        return result

    featured = add_features(daily)
    training_data = featured.dropna(subset=FEATURES).copy()

    unique_dates = sorted(training_data["date"].unique())

    if len(unique_dates) < 5:
        raise ValueError(
            "At least 5 feature-ready dates are required for evaluation."
        )

    split_index = min(
        max(int(len(unique_dates) * 0.8), 1),
        len(unique_dates) - 1,
    )
    split_date = pd.Timestamp(unique_dates[split_index])

    train = training_data[training_data["date"] < split_date]
    test = training_data[training_data["date"] >= split_date]

    if train.empty or test.empty:
        raise ValueError("Chronological train/test split is empty.")

    X_train = train[FEATURES]
    y_train = train["quantity"]
    X_test = test[FEATURES]
    y_test = test["quantity"]

    # Compare against a simple 7-day-average baseline
    baseline_predictions = test["rolling_mean_7"].to_numpy()

    model = RandomForestRegressor(
        n_estimators=300,
        max_depth=12,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )

    print("Training Random Forest...")
    model.fit(X_train, y_train)

    rf_predictions = np.maximum(0, model.predict(X_test))

    baseline_metrics = evaluate(y_test, baseline_predictions)
    rf_metrics = evaluate(y_test, rf_predictions)

    print("\n=== MODEL EVALUATION ===")
    print(f"Training rows: {len(train)}")
    print(f"Testing rows: {len(test)}")
    print(f"Baseline MAE/RMSE: {baseline_metrics}")
    print(f"Random Forest MAE/RMSE: {rf_metrics}")

    # Train the final model on all available feature-ready records
    final_model = RandomForestRegressor(
        n_estimators=300,
        max_depth=12,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )
    final_model.fit(training_data[FEATURES], training_data["quantity"])

    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    # These keys must match app/forecast.py
    bundle = {
        "model": final_model,
        "feature_columns": FEATURES,
        "categories": categories,
        "daily_history": daily[["date", "category", "quantity"]].copy(),
        "last_date": daily["date"].max(),
        "evaluation": {
            "split_date": str(split_date.date()),
            "train_rows": int(len(train)),
            "test_rows": int(len(test)),
            "baseline": baseline_metrics,
            "random_forest": rf_metrics,
            "random_forest_beats_baseline": bool(
                rf_metrics["mae"] <= baseline_metrics["mae"]
            ),
        },
    }

    joblib.dump(bundle, MODEL_PATH)

    with open(METRICS_PATH, "w", encoding="utf-8") as file:
        json.dump(bundle["evaluation"], file, indent=2)

    print("\n=== TRAINING COMPLETE ===")
    print(f"Model saved: {MODEL_PATH}")
    print(f"Metrics saved: {METRICS_PATH}")


if __name__ == "__main__":
    main()
