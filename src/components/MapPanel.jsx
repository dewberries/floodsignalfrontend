import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

const DEFAULT_MAP_STYLE = "mapbox://styles/dmgibbs/cmo3eafxr001o01s71b457fwl";
const COLORBLIND_MAP_STYLE = "mapbox://styles/dmgibbs/cmo3pl72l002o01rxffyi2tp3";

const FOCUS_GAUGE_IDS = [2, 3, 4, 5];
const FOCUS_CENTER = [-86.70, 36.0];
const FOCUS_ZOOM = 11;
const FOCUS_PITCH = 45;
const FOCUS_BEARING = 0;
const ALL_CENTER = [-86.82, 36.06];
const ALL_ZOOM = 10.0;
const ALL_PITCH = 45;
const ALL_BEARING = 0;


function formatNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(1) : "--";
}

function getGaugeVariant(riskCategory, isSelected) {
  if (isSelected) return "selected";

  const risk = String(riskCategory || "").toLowerCase();
  if (risk === "flood" || risk === "major") return "flood";
  return "normal";
}

function StreamGaugeIcon({ variant = "normal", size = 58, colorblindMode = false }) {
  const standardStyles = {
    normal: {
      ringFill: "rgba(79, 191, 182, 0.18)",
      ringStroke: "#7fe7dd",
      dropFill: "rgba(79, 191, 182, 0.20)",
      dot: "#d7fffb",
      ticks: "#c8f2ed",
    },
    selected: {
      ringFill: "rgba(164, 177, 215, 0.22)",
      ringStroke: "#d7def7",
      dropFill: "rgba(164, 177, 215, 0.22)",
      dot: "#ffffff",
      ticks: "#eef2ff",
    },
    flood: {
      ringFill: "rgba(209, 124, 124, 0.18)",
      ringStroke: "#f0b3b3",
      dropFill: "rgba(209, 124, 124, 0.20)",
      dot: "#fff1f1",
      ticks: "#f6d1d1",
    },
  };

  const colorblindStyles = {
    normal: {
      ringFill: "rgba(107, 183, 232, 0.18)",
      ringStroke: "#6bb7e8",
      dropFill: "rgba(107, 183, 232, 0.20)",
      dot: "#eef8ff",
      ticks: "#d7ebfa",
    },
    selected: {
      ringFill: "rgba(211, 143, 188, 0.20)",
      ringStroke: "#d38fbc",
      dropFill: "rgba(211, 143, 188, 0.20)",
      dot: "#fff3fa",
      ticks: "#f0dce8",
    },
    flood: {
      ringFill: "rgba(201, 121, 58, 0.18)",
      ringStroke: "#c9793a",
      dropFill: "rgba(201, 121, 58, 0.20)",
      dot: "#fff2e8",
      ticks: "#efd8c6",
    },
  };

  const palette = colorblindMode ? colorblindStyles : standardStyles;
  const c = palette[variant] || palette.normal;

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="18" fill={c.ringFill} stroke={c.ringStroke} strokeWidth="2.9" />
      <path
        d="M32 20C32 20 25 28.4 25 33.8C25 38.3287 28.134 42 32 42C35.866 42 39 38.3287 39 33.8C39 28.4 32 20 32 20Z"
        fill={c.dropFill}
        stroke={c.ringStroke}
        strokeWidth="2.9"
      />
      <circle cx="32" cy="34" r="2.6" fill={c.dot} />
      <line x1="43" y1="24" x2="43" y2="28" stroke={c.ticks} strokeWidth="2" strokeLinecap="round" />
      <line x1="43" y1="31" x2="43" y2="35" stroke={c.ticks} strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      <line x1="43" y1="38" x2="43" y2="42" stroke={c.ticks} strokeWidth="2" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapPanel({ setSelectedGauge, selectedGauge, colorblindMode }) {
  const mapRef = useRef(null);
  const [gauges, setGauges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [popupGauge, setPopupGauge] = useState(null);
  const [viewMode, setViewMode] = useState("focus");

  const activeMapStyle = colorblindMode ? COLORBLIND_MAP_STYLE : DEFAULT_MAP_STYLE;
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

  useEffect(() => {
    let isMounted = true;

    fetch("https://flood-signal-api.blueisland-60083360.centralus.azurecontainerapps.io/api/map-gauges")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;

        const cleaned = Array.isArray(data) ? data : [];
        const valid = cleaned.filter((g) => {
          const lat = Number(g.latitude);
          const lng = Number(g.longitude);
          return Number.isFinite(lat) && Number.isFinite(lng);
        });

        const focusGauges = valid.filter((g) => FOCUS_GAUGE_IDS.includes(g.gauge_id));

        setGauges(cleaned);

        if (!selectedGauge) {
          const defaultGauge = focusGauges[0] || valid[0] || null;
          if (defaultGauge) {
            setSelectedGauge(defaultGauge);
            setPopupGauge(defaultGauge);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load gauges:", err);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [setSelectedGauge, selectedGauge]);

  const validGauges = useMemo(() => {
    return gauges.filter((g) => {
      const lat = Number(g.latitude);
      const lng = Number(g.longitude);
      return Number.isFinite(lat) && Number.isFinite(lng);
    });
  }, [gauges]);

  const focusGauges = useMemo(() => {
    return validGauges.filter((g) => FOCUS_GAUGE_IDS.includes(g.gauge_id));
  }, [validGauges]);

  const displayedGauges = viewMode === "focus" ? focusGauges : validGauges;

  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;

    if (viewMode === "focus") {
      map.easeTo({
        center: FOCUS_CENTER,
        zoom: FOCUS_ZOOM,
        pitch: FOCUS_PITCH,
        bearing: FOCUS_BEARING,
        duration: 900,
      });
    } else {
      map.easeTo({
        center: ALL_CENTER,
        zoom: ALL_ZOOM,
        pitch: ALL_PITCH,
        bearing: ALL_BEARING,
        duration: 900,
      });
    }
  }, [viewMode, colorblindMode]);

  return (
    <section className="map-card">
      <div className="map-card-header">
        <div>
          <h2>Stream Gauge Locations</h2>
          <p className="subtle">
            {viewMode === "focus"
              ? "Focused on Mill Creek gauges"
              : "Showing all available gauges"}
          </p>
        </div>

        <div className="map-panel-controls">
          <div className="gauge-view-toggle">
            <button
              type="button"
              className={`gauge-view-btn ${viewMode === "focus" ? "active" : ""}`}
              onClick={() => setViewMode("focus")}
            >
              Mill Creek Watershed Focus
            </button>
            <button
              type="button"
              className={`gauge-view-btn ${viewMode === "all" ? "active" : ""}`}
              onClick={() => setViewMode("all")}
            >
              All Gauges
            </button>
          </div>

          {loading ? (
            <div className="map-status-chip">Loading gauges...</div>
          ) : (
            <div className="map-status-chip">{displayedGauges.length} gauges</div>
          )}
        </div>
      </div>

      <div className="map-wrapper">
      <Map
        key={colorblindMode ? "colorblind-map" : "default-map"}
        ref={mapRef}
        initialViewState={{
          latitude: FOCUS_CENTER[1],
          longitude: FOCUS_CENTER[0],
          zoom: FOCUS_ZOOM,
          pitch: FOCUS_PITCH,
          bearing: FOCUS_BEARING,
        }}
        mapStyle={activeMapStyle}
        mapboxAccessToken={mapboxToken}
        style={{ width: "100%", height: "100%" }}
        maxPitch={60}
        minZoom={6}
        maxZoom={17}
        antialias={true}
        onClick={() => setPopupGauge(null)}
      >
          <NavigationControl position="top-left" />

          {displayedGauges.map((g) => {
            const lat = Number(g.latitude);
            const lng = Number(g.longitude);
            const isSelected = selectedGauge?.gauge_id === g.gauge_id;
            const variant = getGaugeVariant(g.risk_category, isSelected);

            return (
              <Marker
                key={g.gauge_id}
                longitude={lng}
                latitude={lat}
                anchor="center"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setSelectedGauge(g);
                  setPopupGauge(g);
                }}
              >
                <button
                  type="button"
                  className={`svg-gauge-marker ${isSelected ? "selected" : ""}`}
                  onMouseEnter={() => setPopupGauge(g)}
                  onMouseLeave={() => setPopupGauge(null)}
                  aria-label={g.gauge_name}
                >
                  <StreamGaugeIcon
                    variant={variant}
                    size={isSelected ? 64 : 54}
                    colorblindMode={colorblindMode}
                  />
                </button>
              </Marker>
            );
          })}

          {popupGauge && (
            <Popup
              longitude={Number(popupGauge.longitude)}
              latitude={Number(popupGauge.latitude)}
              anchor="top"
              closeButton={false}
              closeOnClick={false}
              offset={18}
              className="gauge-popup"
            >
              <div className="popup-content">
                <p className="popup-title">{popupGauge.gauge_name}</p>

                <div className="popup-grid">
                  <div>
                    <p className="popup-label">Observed</p>
                    <p className="popup-value">{formatNumber(popupGauge.observed_stage)} ft</p>
                  </div>

                  <div>
                    <p className="popup-label">Predicted</p>
                    <p className="popup-value popup-value-purple">
                      {formatNumber(popupGauge.predicted_stage)} ft
                    </p>
                  </div>
                </div>

                <div className="popup-footer">
                  <span
                    className={`risk ${String(
                      popupGauge.risk_category || "normal"
                    ).toLowerCase()}`}
                  >
                    {popupGauge.risk_category ?? "Unknown"}
                  </span>
                </div>
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </section>
  );
}