import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Activity } from "lucide-react";

export default function ForecastChart({ data = [], loading = false }) {
  return (
    <section className="panel chart-panel" id="forecast">
      <div className="section-heading">
        <div>
          <h2>Daily demand forecast</h2>
          <p className="muted">Predicted product quantities over time</p>
        </div>
        <span className="chart-badge">
          <Activity size={14} />
          ML MODEL
        </span>
      </div>

      <div className="chart">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 12, right: 12, left: -12, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 5"
                stroke="#263449"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                stroke="#8290a7"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={20}
              />

              <YAxis
                stroke="#8290a7"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={48}
              />

              <Tooltip
                contentStyle={{
                  background: "#111a2c",
                  border: "1px solid #2b3b52",
                  borderRadius: "12px",
                  color: "#f8fafc",
                }}
                labelStyle={{ color: "#cbd5e1" }}
                formatter={(value) => [
                  `${Number(value).toFixed(2)} units`,
                  "Predicted quantity",
                ]}
              />

              <Line
                type="monotone"
                dataKey="predicted_quantity"
                name="Predicted quantity"
                stroke="#22d3ee"
                strokeWidth={3}
                dot={{ r: 3, fill: "#22d3ee", strokeWidth: 0 }}
                activeDot={{ r: 6, stroke: "#a5f3fc", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-empty">
            {loading ? "Loading chart data..." : "Forecast data will appear here."}
          </div>
        )}
      </div>
    </section>
  );
}