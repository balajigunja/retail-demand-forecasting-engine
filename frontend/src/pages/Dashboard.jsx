
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  BarChart3,
  Boxes,
  CalendarDays,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { getForecast } from "../services/api";

const CATEGORIES = ["Beauty", "Clothing", "Electronics"];
const HORIZONS = [7, 14, 30];

function getPredictionArray(data) {
  if (Array.isArray(data)) return data;

  return (
    data?.predictions ??
    data?.forecast ??
    data?.data?.predictions ??
    data?.data ??
    []
  );
}

function normalizePredictions(data) {
  return getPredictionArray(data).map((item, index) => {
    const rawValue =
      item.predicted_quantity ??
      item.predicted_demand ??
      item.predictedDemand ??
      item.prediction ??
      item.demand ??
      item.units ??
      item.predicted_units;

    const value = Number(rawValue);

    return {
      date: String(item.date ?? item.ds ?? `Day ${index + 1}`),
      category: item.category ?? "",
      demand:
        rawValue !== null &&
        rawValue !== undefined &&
        rawValue !== "" &&
        Number.isFinite(value)
          ? Math.max(0, value)
          : 0,
    };
  });
}

function MetricCard({ title, value, description, icon: Icon }) {
  return (
    <article className="kpi-card">
      <div className="kpi-top">
        <span className="kpi-label">{title}</span>
        <span className="kpi-icon">
          <Icon size={18} />
        </span>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-foot">{description}</div>
    </article>
  );
}

export default function Dashboard() {
  const [category, setCategory] = useState("Beauty");
  const [days, setDays] = useState(7);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadForecast() {
      setLoading(true);
      setError("");

      try {
        const response = await getForecast(category, days);
        const rows = normalizePredictions(response?.data ?? response);

        if (!rows.length) {
          throw new Error(
            "The API returned no prediction rows. Check the forecast response."
          );
        }

        if (!cancelled) {
          setPredictions(rows);
        }
      } catch (err) {
        if (!cancelled) {
          setPredictions([]);
          setError(
            err?.response?.data?.detail ??
              err?.response?.data?.message ??
              err?.message ??
              "Could not load predictions. Check the backend and ML service."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadForecast();

    return () => {
      cancelled = true;
    };
  }, [category, days, refreshKey]);

  const totalDemand = useMemo(
    () => predictions.reduce((sum, row) => sum + row.demand, 0),
    [predictions]
  );

  const averageDemand = predictions.length
    ? totalDemand / predictions.length
    : 0;

  const highestDemand = predictions.length
    ? Math.max(...predictions.map((row) => row.demand))
    : 0;

  const lowestDemand = predictions.length
    ? Math.min(...predictions.map((row) => row.demand))
    : 0;

  const chartData = predictions.map((row) => ({
    ...row,
    label:
      row.date.length > 10
        ? row.date.slice(5, 10)
        : row.date,
  }));

  const numberFormat = (value) =>
    value.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <BarChart3 size={21} />
          </div>
          <div>
            <div className="brand-name">RetailIQ</div>
            <div className="brand-subtitle">Demand intelligence</div>
          </div>
        </div>

        <div>
          <div className="nav-label">Workspace</div>
          <nav className="nav-list">
            <a className="nav-link active" href="#overview">
              <BarChart3 size={17} /> Overview
            </a>
            <a className="nav-link" href="#forecast">
              <TrendingUp size={17} /> Demand forecast
            </a>
            <a className="nav-link" href="#predictions">
              <Boxes size={17} /> Predictions
            </a>
          </nav>
        </div>

        <div className="sidebar-note">
          <strong>Forecast workspace</strong>
          <p>
            Review demand estimates by product category and planning horizon.
          </p>
        </div>
      </aside>

      <main className="dashboard" id="overview">
        <header className="topbar">
          <div>
            <p className="eyebrow">Retail analytics</p>
            <h1>Demand overview</h1>
            <p className="page-subtitle">
              Understand projected product demand and plan inventory with
              confidence.
            </p>
          </div>

          <div className="topbar-actions">
            <span className="status-pill">
              <span className="status-dot" /> API connected
            </span>
            <button
              className="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              disabled={loading}
            >
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        </header>

        <section className="filters-panel" aria-label="Forecast filters">
          <div className="filter-field">
            <label htmlFor="category">Product category</label>
            <select
              id="category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="horizon">Forecast horizon</label>
            <select
              id="horizon"
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
            >
              {HORIZONS.map((value) => (
                <option key={value} value={value}>
                  {value} days
                </option>
              ))}
            </select>
          </div>

          <div className="filter-spacer" />
          <span className="status-pill">
            <CalendarDays size={14} /> {days}-day outlook
          </span>
        </section>

        {error && (
          <div className="error-state" role="alert">
            <strong>Unable to load predictions.</strong>
            <div>{error}</div>
            <p>
              Check that the backend is running on port 5000 and the ML service
              on port 8000.
            </p>
          </div>
        )}

        <section className="kpi-grid">
          <MetricCard
            title="Total forecast demand"
            value={loading ? "—" : numberFormat(totalDemand)}
            description={`Projected units across ${days} days`}
            icon={Boxes}
          />

          <MetricCard
            title="Average daily demand"
            value={loading ? "—" : averageDemand.toFixed(2)}
            description="Average predicted units per day"
            icon={TrendingUp}
          />

          <MetricCard
            title="Forecast horizon"
            value={`${days} days`}
            description={`Selected category: ${category}`}
            icon={CalendarDays}
          />

          <MetricCard
            title="Forecast records"
            value={loading ? "—" : predictions.length}
            description="Daily prediction points returned"
            icon={BarChart3}
          />
        </section>

        <section className="content-grid" id="forecast">
          <article className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Demand forecast</h2>
                <p className="panel-description">
                  Predicted daily units for {category}
                </p>
              </div>
              <span className="table-badge">Forecast</span>
            </div>

            {loading ? (
              <div className="loading-state">Loading forecast data…</div>
            ) : !predictions.length ? (
              <div className="empty-state">No forecast data available.</div>
            ) : (
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
                  >
                    <CartesianGrid
                      stroke="#edf1f6"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#7b899c", fontSize: 11 }}
                      axisLine={{ stroke: "#e3eaf2" }}
                      tickLine={false}
                    />
                    <YAxis
                      width={42}
                      tick={{ fill: "#7b899c", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        border: "1px solid #e3eaf2",
                        borderRadius: 10,
                        fontSize: 12,
                      }}
                      formatter={(value) => [
                        `${Number(value).toFixed(2)} units`,
                        "Predicted demand",
                      ]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="demand"
                      name="Predicted demand"
                      stroke="#4776a8"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#4776a8", strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Forecast summary</h2>
                <p className="panel-description">
                  Quick planning indicators
                </p>
              </div>
            </div>

            {loading ? (
              <div className="loading-state">Calculating summary…</div>
            ) : (
              <div className="category-list">
                <div className="category-row">
                  <div className="category-meta">
                    <span>Category</span>
                    <strong>{category}</strong>
                  </div>
                  <div className="category-meta">
                    <span>Forecast period</span>
                    <strong>{days} days</strong>
                  </div>
                </div>

                <div className="category-row">
                  <div className="category-meta">
                    <span>Total predicted units</span>
                    <strong>{numberFormat(totalDemand)}</strong>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${
                          totalDemand > 0
                            ? Math.max(
                                4,
                                Math.min(
                                  100,
                                  (averageDemand / Math.max(averageDemand, 1)) *
                                    100
                                )
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="category-row">
                  <div className="category-meta">
                    <span>Highest predicted day</span>
                    <strong>
                      {predictions.length
                        ? highestDemand.toFixed(2)
                        : "—"}
                    </strong>
                  </div>
                  <div className="category-meta">
                    <span>Lowest predicted day</span>
                    <strong>
                      {predictions.length
                        ? lowestDemand.toFixed(2)
                        : "—"}
                    </strong>
                  </div>
                </div>

                <p className="panel-description">
                  These are model estimates, not confirmed sales or inventory
                  counts. Validate them against recent actual demand before
                  making purchasing decisions.
                </p>
              </div>
            )}
          </article>
        </section>

        <section className="panel table-panel" id="predictions">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Daily predictions</h2>
              <p className="panel-description">
                {category} · {days}-day forecast horizon
              </p>
            </div>
            <span className="table-badge">
              {predictions.length} records
            </span>
          </div>

          {loading ? (
            <div className="loading-state">Loading prediction table…</div>
          ) : (
            <div className="table-scroll">
              <table className="forecast-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Predicted demand</th>
                    <th>Record type</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((row, index) => (
                    <tr key={`${row.date}-${index}`}>
                      <td>{row.date}</td>
                      <td>{row.category || category}</td>
                      <td className="table-number">
                        {numberFormat(row.demand)}
                      </td>
                      <td>
                        <span className="table-badge">Model estimate</span>
                      </td>
                    </tr>
                  ))}

                  {!predictions.length && (
                    <tr>
                      <td colSpan={4}>No prediction records to display.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="footer-note">
          <span>RetailIQ · Demand forecasting workspace</span>
          <span>
            Model estimates should be evaluated against unseen historical data.
          </span>
        </footer>
      </main>
    </div>
  );
}
