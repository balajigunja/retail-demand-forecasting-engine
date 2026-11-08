
from fastapi import FastAPI, HTTPException, Query
from app.forecast import get_forecast

app = FastAPI(
    title="Retail Demand Forecasting API",
    description="API for retail demand forecasting",
    version="1.0.0"
)


@app.get("/")
def root():
    return {"message": "Retail ML service is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/forecast")
def forecast(
    category: str = Query(..., description="Product category"),
    days: int = Query(7, ge=1, le=30)
):
    try:
        predictions = get_forecast(category, days)
        return {
            "category": category,
            "forecast_days": days,
            "predictions": predictions
        }
    except (ValueError, FileNotFoundError) as error:
        raise HTTPException(status_code=400, detail=str(error))
