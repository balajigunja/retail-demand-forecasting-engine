# Intelligent Retail Analytics & Demand Forecasting Engine

Starter scaffold only. Source files are intentionally empty so you can implement the project step by step.

## Project layout
- `frontend/`: React + Vite + Tailwind dashboard
- `backend/`: Node.js + Express + MongoDB API
- `ml-service/`: FastAPI forecasting and customer-segmentation service
- `docs/`: architecture notes

## Suggested implementation order
1. Configure MongoDB and start the Express API.
2. Add product CRUD and forecast API routes.
3. Build and test the FastAPI service independently.
4. Prepare the dataset and train baseline ML models.
5. Connect Express to FastAPI.
6. Build the React dashboard and connect it to Express.
7. Add environment variables, tests, and deployment configuration.

## Important
- Copy `.env.example` to `.env` and add your own credentials.
- Never commit `.env`, API keys, passwords, or MongoDB credentials.
- Use a public retail dataset you have permission to use.
