# RetailIQ: Retail Demand Forecasting Engine

A full-stack web application that forecasts retail demand by product category and segments customers, using a machine learning service behind a Node.js API and a React dashboard.

## Features

- **7-day demand forecast** per product category, using a Random Forest regressor
- **Baseline comparison** against a 7-day moving average to measure model improvement
- **Customer segmentation** to group customers by behavior
- **Interactive dashboard** with forecast charts and segment views
- **Separate ML microservice** (FastAPI) so the model can be updated without touching the main API

## Architecture

```
React (Vite) frontend
        |
        v
Node.js / Express backend (port 5000)  --->  MongoDB
        |
        v
FastAPI ML service (port 8000)
        |
        v
Trained models (joblib) + retail dataset
```

The frontend only talks to the backend. The backend calls the ML service for predictions and stores results in the database.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express, MongoDB (Mongoose) |
| ML service | Python, FastAPI, pandas, NumPy, scikit-learn, joblib |

## Project Structure

```
retail-demand-forecasting-engine/
├── backend/            # Express API (routes, controllers, models, middleware)
├── frontend/           # React dashboard (pages, components, services)
├── ml-service/
│   ├── app/            # FastAPI app (main, forecast, segmentation, schemas)
│   ├── data/           # retail.csv dataset
│   ├── models/         # Trained model + evaluation metrics
│   ├── train_forecast.py
│   ├── train_segmentation.py
│   └── requirements.txt
└── docs/               # Architecture notes
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- Python 3.12 (recommended)
- MongoDB (local or Atlas)

### 1. ML service

```bash
cd ml-service
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS / Linux
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

API docs open at `http://localhost:8000/docs`.

To retrain the models:

```bash
python train_forecast.py
python train_segmentation.py
```

### 2. Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
ML_SERVICE_URL=http://127.0.0.1:8000
```

Start the server:

```bash
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

Run all three services at the same time, each in its own terminal.

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `PORT` | backend | Port the API listens on (default 5000) |
| `MONGO_URI` | backend | MongoDB connection string |
| `ML_SERVICE_URL` | backend | Base URL of the ML service |
| `VITE_API_URL` | frontend | Base URL of the backend API |

Never commit `.env` files. They are listed in `.gitignore`.

## Model Details

- **Task:** forecast daily quantity sold per category for the next 7 days
- **Model:** Random Forest regressor (scikit-learn)
- **Baseline:** 7-day moving average
- **Evaluation:** metrics are saved in `ml-service/models/evaluation_metrics.json`

## Deployment

| Service | Platform |
|---|---|
| ML service | Render (Python web service, root directory `ml-service`) |
| Backend | Render (Node web service, root directory `backend`) |
| Frontend | Vercel or Render static site |

ML service settings on Render:

- **Build command:** `pip install -r requirements.txt`
- **Start command:** `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment variable:** `PYTHON_VERSION=3.12.8`

Note: the model file must be loaded with the same scikit-learn version it was trained with (pinned in `requirements.txt`).

## Roadmap

- [ ] Docker setup and Docker Compose
- [ ] GitHub Actions CI pipeline
- [ ] Automated tests for the ML endpoints and backend routes
- [ ] Model versioning and scheduled retraining

## Author

**Gunja Balaji**
GitHub: [@balajigunja](https://github.com/balajigunja)

## License

This project is for learning and portfolio purposes.