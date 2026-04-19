import StageChartCard from "./StageChartCard";
import RainSummaryCard from "./RainSummaryCard";

function formatNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(2) : "--";
}

function formatDate(value) {
  if (!value) return "--";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getRiskClass(riskCategory) {
  const value = (riskCategory || "normal").toLowerCase();

  if (value.includes("major")) return "major";
  if (value.includes("moderate")) return "moderate";
  if (value.includes("minor")) return "minor";
  return "normal";
}

export default function SidePanel({ gauge, colorblindMode }) {
  if (!gauge) {
    return (
      <aside className="side-panel">
        <div className="card compact-top-card">
          <div className="card-header-row compact-header-row">
            <div>
              <p className="card-label">Selected Gauge</p>
              <p className="card-sub">Choose a stream gauge from the map</p>
            </div>
            <p className="card-title">No Gauge Selected</p>
          </div>

          <div className="empty-state-panel">
            <p className="empty-state-title">Select a gauge</p>
            <p className="empty-state-text">
              Click a map point to view observed stage, next-day prediction,
              charts, and rainfall forecast.
            </p>
          </div>
        </div>

        <StageChartCard gauge={null} colorblindMode={colorblindMode} />
        <RainSummaryCard gauge={null} colorblindMode={colorblindMode} />
      </aside>
    );
  }

  const observed = Number(gauge.observed_stage);
  const predicted = Number(gauge.predicted_stage);

  const diff =
    Number.isFinite(observed) && Number.isFinite(predicted)
      ? predicted - observed
      : null;

  const riskClass = getRiskClass(gauge.risk_category);

  return (
    <aside className="side-panel">
      <div className="card compact-top-card">
        <div className="card-header-row compact-header-row">
          <div>
            <p className="card-label">Selected Gauge</p>
            <p className="card-sub">Current monitoring summary</p>
          </div>

          <div className="top-card-title-wrap">
            <p className="card-title">{gauge.gauge_name}</p>
          </div>
        </div>

        <div className="hero-metric-row">
          <div className="hero-metric observed-metric">
            <p className="label">Observed Stage</p>
            <p className="hero-value">{formatNumber(gauge.observed_stage)} ft</p>
          </div>

          <div className="hero-metric predicted-metric">
            <p className="label">Predicted Next-Day Stage</p>
            <p className="hero-value">{formatNumber(gauge.predicted_stage)} ft</p>
          </div>
        </div>

        <div className="compact-detail-grid details-grid-pretty">
          <div className="detail-tile">
            <p className="label">Predicted Difference</p>
            <p className="value compact-value">
              {diff === null ? "--" : `${diff >= 0 ? "+" : ""}${diff.toFixed(2)} ft`}
            </p>
          </div>

          <div className="detail-tile">
            <p className="label">Risk Category</p>
            <div className={`risk ${riskClass}`}>
              {gauge.risk_category ?? "Unknown"}
            </div>
          </div>

          <div className="detail-tile detail-tile-wide">
            <p className="label">Last Updated</p>
            <div className="meta-value">
              <p className="value compact-value">
                {formatDate(gauge.obs_datetime ?? gauge.feature_date)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <StageChartCard gauge={gauge} colorblindMode={colorblindMode} />
      <RainSummaryCard gauge={gauge} colorblindMode={colorblindMode} />
    </aside>
  );
}