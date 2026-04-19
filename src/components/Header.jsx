import floodSignalLogo from "../img/Illustration.png";

export default function Header({
  colorblindMode,
  setColorblindMode,
  setShowAbout,
  setShowModelInfo,
}) {
  return (
    <header className="header">
      <div className="header-brand">
        <img
          src={floodSignalLogo}
          alt="Flood Signal logo"
          className="header-logo"
        />

        <div>
          <h1>Flood Signal</h1>
          <p className="subtle">Flood monitoring and model-assisted awareness</p>
        </div>
      </div>

      <div className="header-actions">
        <button
          type="button"
          className="mode-toggle-btn"
          onClick={() => setShowAbout(true)}
        >
          About
        </button>

        <button
          type="button"
          className="mode-toggle-btn"
          onClick={() => setShowModelInfo(true)}
        >
          Model Info
        </button>

        <button
          type="button"
          className="mode-toggle-btn"
          onClick={() => setColorblindMode((prev) => !prev)}
        >
          {colorblindMode ? "Standard View" : "Colorblind Mode"}
        </button>
      </div>
    </header>
  );
}