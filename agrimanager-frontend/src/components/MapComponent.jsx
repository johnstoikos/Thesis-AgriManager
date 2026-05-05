import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup, Polygon, Tooltip, useMapEvents } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

// Fix για τα Icons της Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: markerIcon, shadowUrl: markerShadow,
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Κίτρινο Icon για την προσωρινή πινέζα
const yellowIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
    shadowUrl: markerShadow,
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

function getTaskMarkerMeta(taskType = "") {
  const type = taskType ? String(taskType).toLowerCase() : "default";
  if (type.includes("ποτ")) return { color: "#2563eb", label: "Π" };
  if (type.includes("λιπ")) return { color: "#eab308", label: "Λ" };
  if (type.includes("ψεκ")) return { color: "#7c3aed", label: "Ψ" };
  if (type.includes("συγ")) return { color: "#16a34a", label: "Σ" };
  if (type.includes("κλαδ")) return { color: "#f97316", label: "Κ" };
  return { color: "#64748b", label: "Ε" };
}

function getTaskIcon(taskType) {
  const { color, label } = getTaskMarkerMeta(taskType);
  return L.divIcon({
    className: "task-div-marker",
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -36],
    html: `
      <div style="
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 9999px 9999px 9999px 0;
        transform: rotate(-45deg);
        background: ${color};
        color: white;
        border: 3px solid rgba(255,255,255,0.95);
        box-shadow: 0 14px 30px rgba(15,23,42,0.28);
      ">
        <span style="transform: rotate(45deg); font-weight: 900; font-size: 13px; font-family: system-ui, sans-serif;">${label}</span>
      </div>
    `,
  });
}

// --- 1. Ο "Σωτήρας" των Modals: Διορθώνει το μέγεθος του χάρτη ---
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    // Περιμένουμε λίγο να τελειώσει το animation του Modal και κάνουμε refresh το μέγεθος
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 400);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

// --- 2. Εργαλεία Σχεδίασης (Geoman) ---
function GeomanControls({ onPolygonComplete, boundary }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !map.pm || !onPolygonComplete) return;

    map.pm.addControls({
      position: 'topleft',
      drawMarker: false,
      drawPolygon: true,
      drawPolyline: false,
      drawRectangle: false,
      drawCircle: false,
      editMode: true,
      removalMode: true,
    });

    map.on('pm:create', (e) => {
      const layer = e.layer;
      const coords = layer.getLatLngs()[0].map(p => [p.lng, p.lat]);
      const closedCoords = [...coords, coords[0]];
      const polygon = turf.polygon([closedCoords]);
      const areaInStremmata = (turf.area(polygon) / 1000).toFixed(2);
      onPolygonComplete(closedCoords, areaInStremmata);
      layer.remove(); 
    });

    return () => {
      map.pm.removeControls();
      map.off('pm:create');
    };
  }, [map, onPolygonComplete, boundary]);
  return null;
}

// --- 3. Χειριστής κλικ για Εργασίες (Points) ---
function TaskClickHandler({ isAddingTask, onPointSelect }) {
  useMapEvents({
    click(e) {
      if (isAddingTask) {
        const { lat, lng } = e.latlng;
        onPointSelect([lng, lat]);
      }
    },
  });
  return null;
}

// --- 4. Αυτόματο Κεντράρισμα ---
function MapEvents({ boundary, parentBoundary, focusedLocation }) {
  const map = useMap();
  useEffect(() => {
    if (focusedLocation?.length === 2) {
      map.flyTo([focusedLocation[1], focusedLocation[0]], 18, { duration: 0.8 });
      return;
    }

    const target = (parentBoundary?.length > 0) ? parentBoundary : (boundary?.length > 0 ? boundary : null);
    if (target && target.length > 0) {
      map.flyTo([target[0][1], target[0][0]], 16);
    }
  }, [parentBoundary, boundary, focusedLocation, map]);
  return null;
}

// --- ΤΟ ΚΕΝΤΡΙΚΟ COMPONENT ---
export default function MapComponent({ 
  onPolygonComplete, boundary, parentBoundary, existingCrops, 
  tasks, isAddingTask, onPointSelect, pendingLocation, focusedLocation,
  dashboardFields,
}) {
  const navigate = useNavigate();

  const fieldMarkers = Array.isArray(dashboardFields)
    ? dashboardFields
        .map((field, index) => {
          const coords = field?.boundary?.coordinates?.[0] ?? field?.boundary?.coordinates ?? [];
          if (!Array.isArray(coords) || coords.length === 0) return null;

          let position = null;
          try {
            const polygon = turf.polygon([coords]);
            const center = turf.centerOfMass(polygon)?.geometry?.coordinates;
            if (Array.isArray(center) && center.length >= 2) {
              position = [center[1], center[0]];
            }
          } catch {
            // ignore turf failure and fallback to first coordinate
          }

          if (!position && Array.isArray(coords[0]) && coords[0].length >= 2) {
            position = [coords[0][1], coords[0][0]];
          }

          if (!position) return null;

          return {
            id: field?.id ?? `field-${index}`,
            name: field?.name || field?.title || `Field ${field?.id ?? index}`,
            position,
            field,
          };
        })
        .filter(Boolean)
    : [];

  return (
    <div className="relative z-0 isolate" style={{ height: '100%', width: '100%', minHeight: '500px' }}>
      <MapContainer 
        center={[38.2466, 21.7346]} 
        zoom={13} 
        style={{ height: '100%', width: '100%', minHeight: '500px' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        <MapResizer />
        <MapEvents boundary={boundary} parentBoundary={parentBoundary} focusedLocation={focusedLocation} />
        <GeomanControls onPolygonComplete={onPolygonComplete} boundary={boundary} />
        <TaskClickHandler isAddingTask={isAddingTask} onPointSelect={onPointSelect} />

        {fieldMarkers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            eventHandlers={{
              click: () => navigate(`/fields/${marker.field.id}`),
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
              {marker.name}
            </Tooltip>
            <Popup>{marker.name}</Popup>
          </Marker>
        ))}

        {/* Εμφάνιση αποθηκευμένων εργασιών */}
        {tasks?.map(task => (
          task?.location?.coordinates && (
            <Marker
              key={task.id}
              position={[task.location.coordinates[1], task.location.coordinates[0]]}
              icon={getTaskIcon(task.taskType)}
            >
              <Popup>
                <div className="font-sans text-xs">
                  <strong>{task.taskType || "Εργασία"}</strong><br/>
                  {task.description || "Χωρίς περιγραφή"}<br/>
                  <span>{task.status === "COMPLETED" ? "Ολοκληρωμένη" : "Εκκρεμής"}</span>
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* Εμφάνιση προσωρινής κίτρινης πινέζας */}
        {isAddingTask && pendingLocation && (
          <Marker position={[pendingLocation[1], pendingLocation[0]]} icon={yellowIcon} />
        )}

        {/* Όριο χωραφιού */}
        {parentBoundary && (
          <Polygon 
            positions={parentBoundary.map(c => [c[1], c[0]])} 
            pathOptions={{ color: '#4B5563', dashArray: '10, 10', weight: 2, pmIgnore: true }} 
          />
        )}

        {/* Υπάρχουσες καλλιέργειες */}
        {existingCrops?.map((crop, idx) => {
          if (!crop || !crop.zoneBoundary?.coordinates) return null;
          const positions = crop.zoneBoundary.coordinates[0].map(coord => [coord[1], coord[0]]);
          return (
            <Polygon 
              key={idx} 
              positions={positions} 
              pathOptions={{ color: '#059669', fillColor: '#10b981', fillOpacity: 0.3, pmIgnore: true }} 
            />
          );
        })}

        {/* Νέο πολύγωνο (υπό σχεδίαση) */}
        {boundary && boundary.length >= 3 && (
          <Polygon 
            positions={boundary.map(c => [c[1], c[0]])} 
            pathOptions={{ color: 'orange', fillOpacity: 0.4, pmIgnore: true }} 
          />
        )}
      </MapContainer>
    </div>
  );
}
