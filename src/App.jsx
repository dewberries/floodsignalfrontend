import { useState } from "react";
import Header from "./components/Header";
import MapPanel from "./components/MapPanel";
import SidePanel from "./components/SidePanel";
import AboutModal from "./components/AboutModal";
import ModelInfoModal from "./components/ModelInfoModal";

export default function App() {
  const [selectedGauge, setSelectedGauge] = useState(null);
  const [colorblindMode, setColorblindMode] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showModelInfo, setShowModelInfo] = useState(false);

  return (
    <div className={`app-shell ${colorblindMode ? "theme-colorblind" : ""}`}>
      <Header
        colorblindMode={colorblindMode}
        setColorblindMode={setColorblindMode}
        setShowAbout={setShowAbout}
        setShowModelInfo={setShowModelInfo}
      />

      <main className="dashboard">
        <div className="main-grid">
          <MapPanel
            selectedGauge={selectedGauge}
            setSelectedGauge={setSelectedGauge}
            colorblindMode={colorblindMode}
          />
          <SidePanel gauge={selectedGauge} colorblindMode={colorblindMode} />
        </div>
      </main>

      {showAbout && <AboutModal setShowAbout={setShowAbout} />}
      {showModelInfo && <ModelInfoModal setShowModelInfo={setShowModelInfo} />}
    </div>
  );
}