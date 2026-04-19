import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

function formatStage(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function formatLabel(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function getChartColors(colorblindMode) {
  if (colorblindMode) {
    return {
      observed: "#6bb7e8",
      observedPoint: "#6bb7e8",
      observedBorder: "#071427",

      predicted: "#d38fbc",
      predictedPoint: "#d38fbc",

      nextDay: "#f0d7e7",
      nextDayPoint: "#f0d7e7",

      action: "rgba(63, 164, 122, 0.65)",
      minor: "rgba(217, 164, 65, 0.65)",
      moderate: "rgba(201, 121, 58, 0.68)",
      major: "rgba(214, 214, 214, 0.7)",

      legend: "#a8bddc",
      ticks: "#6f88ab",
      gridX: "rgba(160, 200, 255, 0.05)",
      gridY: "rgba(160, 200, 255, 0.06)",

      tooltipBg: "rgba(15, 28, 52, 0.95)",
      tooltipBorder: "rgba(160, 200, 255, 0.2)",
      tooltipTitle: "#eaf2ff",
      tooltipBody: "#cfe3ff",
    };
  }

  return {
    observed: "#5df5e2",
    observedPoint: "#5df5e2",
    observedBorder: "#0b1b33",

    predicted: "#9f7aea",
    predictedPoint: "#9f7aea",

    nextDay: "#e2d4ff",
    nextDayPoint: "#d8c4ff",

    action: "rgba(52, 211, 153, 0.6)",
    minor: "rgba(250, 204, 21, 0.6)",
    moderate: "rgba(251, 146, 60, 0.6)",
    major: "rgba(218, 3, 14, 0.65)",

    legend: "#a8bddc",
    ticks: "#6f88ab",
    gridX: "rgba(160, 200, 255, 0.05)",
    gridY: "rgba(160, 200, 255, 0.06)",

    tooltipBg: "rgba(15, 28, 52, 0.95)",
    tooltipBorder: "rgba(160, 200, 255, 0.2)",
    tooltipTitle: "#eaf2ff",
    tooltipBody: "#cfe3ff",
  };
}

function getDynamicRange(series, gauge) {
  const values = [
    ...series.map((row) => formatStage(row.gauge_height)),
    ...series.map((row) => formatStage(row.predicted_stage)),
    formatStage(gauge?.predicted_stage),
    formatStage(gauge?.action_stage_ft),
    formatStage(gauge?.minor_stage_ft),
    formatStage(gauge?.moderate_stage_ft),
    formatStage(gauge?.major_stage_ft),
  ].filter((v) => v !== null);

  if (!values.length) {
    return { min: 0, max: 10 };
  }

  const min = Math.max(0, Math.min(...values) - 1);
  const max = Math.max(...values) + 1;

  return { min, max };
}

function getPredictionRange(series, gauge) {
  const values = [
    ...series.map((row) => formatStage(row.gauge_height)),
    ...series.map((row) => formatStage(row.predicted_stage)),
    formatStage(gauge?.predicted_stage),
  ].filter((v) => v !== null);

  if (!values.length) {
    return { min: 0, max: 6 };
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  const min = Math.max(0, Math.floor((minValue - 0.4) * 10) / 10);
  const max = Math.ceil((maxValue + 0.4) * 10) / 10;

  return { min, max };
}

function buildThresholdChartData(series, gauge, colorblindMode) {
  const colors = getChartColors(colorblindMode);

  const labels = series.map((row) => formatLabel(row.obs_datetime));
  const observedValues = series.map((row) => formatStage(row.gauge_height));

  const actionLine = new Array(labels.length).fill(formatStage(gauge?.action_stage_ft));
  const minorLine = new Array(labels.length).fill(formatStage(gauge?.minor_stage_ft));
  const moderateLine = new Array(labels.length).fill(formatStage(gauge?.moderate_stage_ft));
  const majorLine = new Array(labels.length).fill(formatStage(gauge?.major_stage_ft));

  return {
    labels,
    datasets: [
      {
        label: "Observed Stage",
        data: observedValues,
        borderColor: colors.observed,
        backgroundColor: colors.observed,
        tension: 0.35,
        pointRadius: 2,
        pointHoverRadius: 4,
        pointBackgroundColor: colors.observedPoint,
        pointBorderColor: colors.observedBorder,
        pointBorderWidth: 1.25,
        borderWidth: 2.25,
        clip: false,
      },
      {
        label: "Action Stage",
        data: actionLine,
        borderColor: colors.action,
        pointRadius: 0,
        borderDash: [4, 4],
        borderWidth: 1,
        clip: false,
      },
      {
        label: "Minor Flood",
        data: minorLine,
        borderColor: colors.minor,
        pointRadius: 0,
        borderDash: [4, 4],
        borderWidth: 1,
        clip: false,
      },
      {
        label: "Moderate Flood",
        data: moderateLine,
        borderColor: colors.moderate,
        pointRadius: 0,
        borderDash: [4, 4],
        borderWidth: 1,
        clip: false,
      },
      {
        label: "Major Flood",
        data: majorLine,
        borderColor: colors.major,
        pointRadius: 0,
        borderDash: [4, 4],
        borderWidth: 1,
        clip: false,
      },
    ],
  };
}

function buildPredictionChartData(series, gauge, colorblindMode) {
  const colors = getChartColors(colorblindMode);

  const baseLabels = series.map((row) => formatLabel(row.obs_datetime));
  const labels = [...baseLabels, "Next"];

  const observedValues = series.map((row) => formatStage(row.gauge_height));
  observedValues.push(null);

  const predictedHistory = series.map((row) => formatStage(row.predicted_stage));
  predictedHistory.push(null);

  const nextDayPredicted = new Array(baseLabels.length).fill(null);
  nextDayPredicted.push(formatStage(gauge?.predicted_stage));

  return {
    labels,
    datasets: [
      {
        label: "Observed Stage",
        data: observedValues,
        borderColor: colors.observed,
        backgroundColor: colors.observed,
        tension: 0.35,
        pointRadius: 2.5,
        pointHoverRadius: 5,
        pointBackgroundColor: colors.observedPoint,
        pointBorderColor: colors.observedBorder,
        pointBorderWidth: 1.5,
        borderWidth: 2.5,
        clip: false,
      },
      {
        label: "Predicted History",
        data: predictedHistory,
        borderColor: colors.predicted,
        backgroundColor: colors.predicted,
        tension: 0.35,
        pointRadius: 2.5,
        pointHoverRadius: 5,
        pointBackgroundColor: colors.predictedPoint,
        pointBorderColor: "#071427",
        pointBorderWidth: 1.5,
        borderDash: [8, 5],
        borderWidth: 3,
        clip: false,
      },
      {
        label: "Next-Day Prediction",
        data: nextDayPredicted,
        borderColor: colors.nextDay,
        backgroundColor: colors.nextDay,
        pointBackgroundColor: colors.nextDayPoint,
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        showLine: false,
        pointRadius: 6,
        pointHoverRadius: 8,
        clip: false,
      },
    ],
  };
}

function buildCommonOptions(colorblindMode) {
  const colors = getChartColors(colorblindMode);

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        labels: {
          color: colors.legend,
          boxWidth: 10,
          usePointStyle: true,
          pointStyle: "circle",
          font: {
            size: 11,
            weight: "500",
          },
        },
      },
      tooltip: {
        backgroundColor: colors.tooltipBg,
        borderColor: colors.tooltipBorder,
        borderWidth: 1,
        titleColor: colors.tooltipTitle,
        bodyColor: colors.tooltipBody,
        padding: 10,
        displayColors: false,
        titleFont: {
          size: 12,
          weight: "600",
        },
        bodyFont: {
          size: 12,
        },
        callbacks: {
          label: function (context) {
            const value = context.parsed.y;
            return value == null
              ? `${context.dataset.label}: --`
              : `${context.dataset.label}: ${Number(value).toFixed(2)} ft`;
          },
        },
      },
    },
    elements: {
      line: {
        borderCapStyle: "round",
        borderJoinStyle: "round",
      },
    },
  };
}

function buildThresholdOptions(series, gauge, colorblindMode) {
  const { min, max } = getDynamicRange(series, gauge);
  const colors = getChartColors(colorblindMode);

  return {
    ...buildCommonOptions(colorblindMode),
    layout: {
      padding: {
        left: 0,
        right: 0,
        top: 2,
        bottom: 0,
      },
    },
    scales: {
      x: {
        offset: false,
        ticks: {
          color: colors.ticks,
          maxRotation: 0,
          autoSkip: true,
          padding: 8,
          font: {
            size: 10,
          },
        },
        grid: {
          color: colors.gridX,
          drawBorder: false,
        },
      },
      y: {
        min,
        max,
        ticks: {
          color: colors.ticks,
          padding: 2,
          font: {
            size: 10,
          },
          callback: (value) => `${Number(value).toFixed(1)} ft`,
        },
        grid: {
          color: colors.gridY,
          drawBorder: false,
        },
      },
    },
  };
}

function buildPredictionOptions(series, gauge, colorblindMode) {
  const { min, max } = getPredictionRange(series, gauge);
  const colors = getChartColors(colorblindMode);

  return {
    ...buildCommonOptions(colorblindMode),
    layout: {
      padding: {
        left: 0,
        right: 0,
        top: 2,
        bottom: 0,
      },
    },
    scales: {
      x: {
        offset: false,
        ticks: {
          color: colors.ticks,
          maxRotation: 0,
          autoSkip: true,
          padding: 8,
          font: {
            size: 10,
          },
        },
        grid: {
          color: colors.gridX,
          drawBorder: false,
        },
      },
      y: {
        min,
        max,
        ticks: {
          color: colors.ticks,
          padding: 2,
          font: {
            size: 10,
          },
          callback: function (value) {
            if (value < 0) return "";
            return `${Number(value).toFixed(1)} ft`;
          },
        },
        grid: {
          color: colors.gridY,
          drawBorder: false,
        },
      },
    },
  };
}

export default function StageChartCard({ gauge, colorblindMode }) {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!gauge?.gauge_id) {
      setSeries([]);
      setError("");
      return;
    }

    const controller = new AbortController();

    async function loadSeries() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(
          `https://flood-signal-api.blueisland-60083360.centralus.azurecontainerapps.io/api/gauge-timeseries/${gauge.gauge_id}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }

        const data = await res.json();
        setSeries(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Failed to load stage timeseries:", err);
          setError("Could not load stage trend");
          setSeries([]);
        }
      } finally {
        setLoading(false);
      }
    }

    loadSeries();

    return () => controller.abort();
  }, [gauge?.gauge_id]);

  const thresholdChartData = useMemo(() => {
    return buildThresholdChartData(series, gauge, colorblindMode);
  }, [series, gauge, colorblindMode]);

  const predictionChartData = useMemo(() => {
    return buildPredictionChartData(series, gauge, colorblindMode);
  }, [series, gauge, colorblindMode]);

  const thresholdOptions = useMemo(() => {
    return buildThresholdOptions(series, gauge, colorblindMode);
  }, [series, gauge, colorblindMode]);

  const predictionOptions = useMemo(() => {
    return buildPredictionOptions(series, gauge, colorblindMode);
  }, [series, gauge, colorblindMode]);

  if (!gauge) {
    return (
      <div className="card chart-card-fill">
        <div className="card-header-row">
          <p className="card-label">Stage Charts</p>
        </div>
        <p className="card-sub">Select a gauge to view stage charts</p>
      </div>
    );
  }

  return (
    <div className="card chart-card-fill">
      <div className="card-header-row">
        <p className="card-label">Stage Charts</p>
      </div>

      {loading ? (
        <p className="chart-note">Loading stage charts...</p>
      ) : error ? (
        <p className="chart-note">{error}</p>
      ) : series.length === 0 ? (
        <p className="chart-note">No recent stage data available</p>
      ) : (
        <div className="chart-stack">
          <div className="mini-chart-block">
            <p className="mini-chart-title">Observed Stage vs Flood Thresholds</p>
            <div className="chart-placeholder large">
              <div className="real-chart">
                <Line data={thresholdChartData} options={thresholdOptions} />
              </div>
            </div>
          </div>

          <div className="mini-chart-block">
            <p className="mini-chart-title">Observed Stage vs Model Predictions</p>
            <div className="chart-placeholder large">
              <div className="real-chart">
                <Line data={predictionChartData} options={predictionOptions} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}