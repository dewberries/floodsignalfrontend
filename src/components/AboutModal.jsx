export default function AboutModal({ setShowAbout }) {
  return (
    <div className="about-overlay" onClick={() => setShowAbout(false)}>
      <div className="about-modal" onClick={(e) => e.stopPropagation()}>
        <div className="about-header">
          <div>
            <h2>About Flood Signal</h2>
          </div>

          <button
            type="button"
            className="about-close-btn"
            onClick={() => setShowAbout(false)}
          >
            Close
          </button>
        </div>

        <div className="about-content">
          <section className="about-section">
            <h3>Overview</h3>
            <p>
              Flood Signal is a flood monitoring dashboard centered on Mill Creek,
              with nearby regional gauges included for additional context. The
              application brings together observed stream conditions, rainfall
              information, and model-assisted next-day stage estimates into a
              single view to support quick monitoring and comparison.
            </p>
          </section>

          <section className="about-section">
            <h3>What the Dashboard Shows</h3>
            <p>
              The dashboard combines recent stream gauge observations with
              rainfall data and short-term forecast totals. It also includes
              modeled next-day stage estimates so users can compare current
              observed conditions with near-term projected conditions in one
              place.
            </p>
          </section>

          <section className="about-section">
            <h3>Data Sources and Processing</h3>
            <p>
              Flood Signal integrates observed stream gauge data from the USGS
              Water Services API with National Weather Service weather and
              forecast products. An automated early-morning data pipeline
              retrieves the latest stream stage, discharge, precipitation, and
              forecast information, converts timestamps to Central Time, and
              stores processed values for dashboard display. Forecast
              precipitation is summarized into 24-hour, 48-hour, and 72-hour
              totals for each gauge location, while recent stream observations
              provide the latest stage conditions used throughout the
              application.
            </p>
          </section>

          <section className="about-section">
            <h3>Geographic Focus</h3>
            <p>
              The dashboard is focused on Mill Creek while also including nearby
              regional gauges to provide broader hydrologic context beyond the
              core watershed.
            </p>
          </section>

          <section className="about-section">
            <h3>Purpose</h3>
            <p>
              Flood Signal is intended to support situational awareness by
              helping users review current stream conditions, recent rainfall
              context, and modeled near-term trends together in a single
              monitoring application.
            </p>
          </section>

          <section className="about-section">
            <h3>Important Note</h3>
            <p>
              Flood Signal is not an official warning product. It should be used
              as a monitoring and decision-support tool alongside local
              knowledge, stream observations, and official flood alerts.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}