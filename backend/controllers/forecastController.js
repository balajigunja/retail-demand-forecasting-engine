const axios = require("axios");

exports.getForecast = async (req, res) => {
  try {
    const category = req.query.category || "Beauty";
    const days = Number(req.query.days || 7);

    const allowedCategories = ["Beauty", "Clothing", "Electronics"];

    if (!allowedCategories.includes(category)) {
      return res.status(400).json({
        message: "Invalid category. Choose Beauty, Clothing, or Electronics.",
      });
    }

    if (!Number.isInteger(days) || days < 1 || days > 30) {
      return res.status(400).json({
        message: "Forecast days must be an integer between 1 and 30.",
      });
    }

    const response = await axios.get(
      "http://127.0.0.1:8000/forecast",
      {
        params: { category, days },
        timeout: 12000,
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error(
      "Forecast service error:",
      error.response?.data || error.message
    );

    if (error.code === "ECONNABORTED") {
      return res.status(504).json({
        message: "The ML forecasting service timed out.",
      });
    }

    return res.status(502).json({
      message:
        "Could not reach the ML service. Ensure it is running on port 8000.",
    });
  }
};