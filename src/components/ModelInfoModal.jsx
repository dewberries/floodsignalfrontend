import { useEffect, useState } from "react";

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMetric(value, digits = 3) {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(digits) : "--";
}

export default function ModelInfoModal({ setShowModelInfo }) {
  const [modelInfo, setModelInfo] = useState(null);
  const [previousModel, setPreviousModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadModelInfo() {
      try {
        setLoading(true);
        setError("");

        const [currentRes, historyRes] = await Promise.all([
          fetch(
            "https://flood-signal-api.blueisland-60083360.centralus.azurecontainerapps.io/api/model-info"
          ),
          fetch(
            "https://flood-signal-api.blueisland-60083360.centralus.azurecontainerapps.io/api/model-history"
          ),
        ]);

        if (!currentRes.ok) {
          throw new Error(`Model info request failed: ${currentRes.status}`);
        }

        if (!historyRes.ok) {
          throw new Error(`Model history request failed: ${historyRes.status}`);
        }

        const currentData = await currentRes.json();
        const historyData = await historyRes.json();

        if (!isMounted) return;

        const currentModel = Array.isArray(currentData)
          ? currentData[0] || null
          : currentData || null;

        const history = Array.isArray(historyData) ? historyData : [];
        const previous =
          history.length > 1
            ? history[1]
            : history.length === 1 &&
              currentModel &&
              history[0]?.model_version !== currentModel.model_version
            ? history[0]
            : null;

        setModelInfo(currentModel);
        setPreviousModel(previous);
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to load model info:", err);
        setError("Could not load model information.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadModelInfo();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="about-overlay" onClick={() => setShowModelInfo(false)}>
      <div className="about-modal" onClick={(e) => e.stopPropagation()}>
        <div className="about-header">
          <div>
            <h2>Model Information</h2>
            <p className="subtle">Model outputs support monitoring and planning, but uncertainty
                  can increase during unusual or extreme events.</p>
          </div>

          <button
            type="button"
            className="about-close-btn"
            onClick={() => setShowModelInfo(false)}
          >
            Close
          </button>
        </div>

        <div className="about-content">
          {loading ? (
            <section className="about-section">
              <p>Loading model information...</p>
            </section>
          ) : error ? (
            <section className="about-section">
              <p>{error}</p>
            </section>
          ) : !modelInfo ? (
            <section className="about-section">
              <p>No model information available.</p>
            </section>
          ) : (
            <>
              <section className="about-section">
                <h3>Current Model</h3>
                <div className="about-grid">
                  <div>
                    <span>Model Name</span>
                    <strong>{modelInfo.model_name || "--"}</strong>
                  </div>

                  <div>
                    <span>Version</span>
                    <strong>{modelInfo.model_version || "--"}</strong>
                  </div>

                  <div>
                    <span>Last Trained</span>
                    <strong>{formatDate(modelInfo.trained_at)}</strong>
                  </div>

                  <div>
                    <span>R²</span>
                    <strong>{formatMetric(modelInfo.r2)}</strong>
                  </div>

                  <div>
                    <span>RMSE</span>
                    <strong>{formatMetric(modelInfo.rmse)}</strong>
                  </div>

                  <div>
                    <span>MAE</span>
                    <strong>{formatMetric(modelInfo.mae)}</strong>
                  </div>

                  <div className="about-grid-wide">
                    <span>Metric Notes</span>
                    <p>
                      RMSE and MAE show average prediction error, with lower
                      values indicating better performance. R² shows how well
                      the model explains variation in the observed data, with
                      values closer to 1 indicating a stronger overall fit.
                    </p>
                  </div>
                </div>
              </section>

              <section className="about-section">
                <h3>Model Update Process</h3>
                <div className="about-grid">
                  <div>
                    <span>Retraining Schedule</span>
                    <strong>Weekly</strong>
                  </div>

                  <div>
                    <span>Promotion Rule</span>
                    <strong>Promote only if improved</strong>
                  </div>

                  <div className="about-grid-wide">
                    <span>How Promotion Works</span>
                    <p>
                      A new candidate model is trained each week and evaluated
                      against the current active model. If the new model performs
                      better on validation metrics, it is promoted. Otherwise,
                      the current active model stays in place.
                    </p>
                  </div>
                </div>
              </section>

              <section className="about-section">
                <h3>Previous Model</h3>
                {previousModel ? (
                  <div className="model-compare-grid">
                    <div>
                      <span>Version</span>
                      <strong>{previousModel.model_version || "--"}</strong>
                    </div>

                    <div>
                      <span>Last Trained</span>
                      <strong>{formatDate(previousModel.trained_at)}</strong>
                    </div>

                    <div>
                      <span>RMSE</span>
                      <strong>{formatMetric(previousModel.rmse)}</strong>
                    </div>

                    <div>
                      <span>MAE</span>
                      <strong>{formatMetric(previousModel.mae)}</strong>
                    </div>

                    <div>
                      <span>R²</span>
                      <strong>{formatMetric(previousModel.r2)}</strong>
                    </div>
                  </div>
                ) : (
                  <p>No previous model record available.</p>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}