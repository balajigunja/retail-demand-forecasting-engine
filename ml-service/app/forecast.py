
from pathlib import Path

import joblib
import pandas as pd

MODEL_PATH = (
    Path(__file__).resolve().parent.parent
    / "models"
    / "demand_forecast.joblib"
)


def get_forecast(category: str, days: int = 7):
    if not 1 <= days <= 30:
        raise ValueError("days must be between 1 and 30")

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            "Model not found. Run python train_forecast.py first."
        )

    bundle = joblib.load(MODEL_PATH)

    model = bundle["model"]
    feature_columns = bundle["feature_columns"]
    categories = bundle["categories"]

    if category not in categories:
        raise ValueError(
            f"Unknown category '{category}'. Available categories: {categories}"
        )

    history = bundle.get("daily_history")

    if history is None:
        raise ValueError(
            "Historical data missing from model. Add 'daily_history': daily "
            "to train_forecast.py and retrain the model."
        )

    history = history.copy()
    history["date"] = pd.to_datetime(history["date"])

    category_history = (
        history[history["category"] == category]
        .sort_values("date")["quantity"]
        .astype(float)
        .tolist()
    )

    if not category_history:
        raise ValueError(f"No history found for category '{category}'.")

    last_date = pd.to_datetime(bundle["last_date"])
    predictions = []

    for step in range(1, days + 1):
        forecast_date = last_date + pd.Timedelta(days=step)

        row = {
            "category": category,
            "day_of_week": forecast_date.day_of_week,
            "month": forecast_date.month,
            "day_of_month": forecast_date.day,
            "lag_1": category_history[-1],
            "lag_7": (
                category_history[-7] if len(category_history) >= 7 else 0
            ),
            "lag_14": (
                category_history[-14] if len(category_history) >= 14 else 0
            ),
            "rolling_mean_7": (
                sum(category_history[-7:]) / min(7, len(category_history))
            ),
        }

        X = pd.DataFrame([row])
        X = pd.get_dummies(X, columns=["category"])
        X = X.reindex(columns=feature_columns, fill_value=0)

        predicted_quantity = max(0.0, float(model.predict(X)[0]))
        predicted_quantity = round(predicted_quantity, 2)

        predictions.append({
            "date": forecast_date.strftime("%Y-%m-%d"),
            "category": category,
            "predicted_quantity": predicted_quantity,
        })

        # Use the predicted quantity as history for the next forecast day.
        category_history.append(predicted_quantity)

    return predictions
