
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export function getForecast(category = "Beauty", days = 7) {
  return api.get("/forecast", {
    params: { category, days },
  });
}

export default api;
