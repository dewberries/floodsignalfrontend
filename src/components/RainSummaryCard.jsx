import { useEffect, useState } from "react";

function formatNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(2) : "--";
}

function getRecentRainLabel(r24, r48, r72) {
  const values = [Number(r24), Number(r48), Number(r72)].filter(Number.isFinite);

  if (!values.length) return "No forecast data";

  const maxRain = Math.max(...values);

  if (maxRain === 0) return "Low recent rainfall";
  if (maxRain < 1) return "Light rainfall expected";
  if (maxRain < 2) return "Moderate rainfall expected";
  return "Higher rainfall expected";
}

export default function RainSummaryCard({ gauge, colorblindMode }) {
  const [forecast, setForecast] = useState(null);

  useEffect(() => {
    if (!gauge) {
      setForecast(null);
      return;
    }

    fetch("https://flood-signal-api.blueisland-60083360.centralus.azurecontainerapps.io/api/latest-forecast")
      .then((res) => res.json())
      .then((data) => {
        const match = Array.isArray(data)
          ? data.find((f) => f.gauge_id === gauge.gauge_id)
          : null;

        setForecast(match || null);
      })
      .catch((err) => {
        console.error("forecast fetch failed", err);
        setForecast(null);
      });
  }, [gauge]);

  if (!gauge) {
    return (
      <div className="card">
        <p className="card-title">Rainfall Forecast</p>
        <p className="card-sub">Select a gauge</p>
      </div>
    );
  }

  const rain24 = forecast?.forecast_precip_24h;
  const rain48 = forecast?.forecast_precip_48h;
  const rain72 = forecast?.forecast_precip_72h;

  const statusText = getRecentRainLabel(rain24, rain48, rain72);

  return (
    <div className={`card ${colorblindMode ? "rain-card-colorblind" : ""}`}>
      <div className="card-header-row">
        <p className="card-label">Rainfall Forecast</p>
        <p className="mini-chart-title">{statusText}</p>
        <p className="card-label">Next 72 hours</p>
      </div>

      <div className="rain-forecast-grid">
        <div className="rain-box">
          <p className="label">24h</p>
          <p className="rain-value">{formatNumber(rain24)} in</p>
        </div>

        <div className="rain-box">
          <p className="label">48h</p>
          <p className="rain-value">{formatNumber(rain48)} in</p>
        </div>

        <div className="rain-box">
          <p className="label">72h</p>
          <p className="rain-value">{formatNumber(rain72)} in</p>
        </div>
      </div>
    </div>
  );
}