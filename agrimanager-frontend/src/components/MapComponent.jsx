import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup, Polygon, Tooltip, useMapEvents } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { useAppPreferences } from '../i18n';

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

// Επιστρέφει δεδομένα.
function getTaskMarkerMeta(taskType = "") {
  const type = taskType ? String(taskType).toLowerCase() : "default";
  if (type.includes("ποτ")) return { color: "#2563eb", label: "Π" };
  if (type.includes("λιπ")) return { color: "#eab308", label: "Λ" };
  if (type.includes("ψεκ")) return { color: "#7c3aed", label: "Ψ" };
  if (type.includes("συγ")) return { color: "#16a34a", label: "Σ" };
  if (type.includes("κλαδ")) return { color: "#f97316", label: "Κ" };
  return { color: "#64748b", label: "Ε" };
}

// Επιστρέφει δεδομένα.
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

// --- 1.Διορθώνει το έγεθος του χάρτη ---
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 400);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

function closePolygonCoordinates(coords) {
  if (!Array.isArray(coords) || coords.length < 3) return [];

  // Τα polygons αποθηκεύονται ως GeoJSON rings, άρα πρέπει να είναι κλειστά και numeric.
  const cleanCoords = coords
    .filter((coord) => Array.isArray(coord) && coord.length >= 2)
    .map(([lng, lat]) => [Number(lng), Number(lat)])
    .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));

  if (cleanCoords.length < 3) return [];

  const first = cleanCoords[0];
  const last = cleanCoords[cleanCoords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    cleanCoords.push([...first]);
  }

  return cleanCoords;
}

function getLayerPolygonCoordinates(layer) {
  const latLngs = layer?.getLatLngs?.()?.[0] || [];
  return closePolygonCoordinates(latLngs.map((point) => [point.lng, point.lat]));
}

function getPolygonAreaInStremmata(coords) {
  if (!coords.length) return "";
  try {
    return (turf.area(turf.polygon([coords])) / 1000).toFixed(2);
  } catch {
    return "";
  }
}

// --- 2. Εργαλεία Σχεδίασης (Geoman) ---
function GeomanControls({ onPolygonComplete }) {
  const map = useMap();
  const onPolygonCompleteRef = useRef(onPolygonComplete);
  const hasPolygonHandler = Boolean(onPolygonComplete);

  // Κρατάμε πάντα το νεότερο callback χωρίς να ξαναστήνονται τα Geoman controls σε κάθε render.
  useEffect(() => {
    onPolygonCompleteRef.current = onPolygonComplete;
  }, [onPolygonComplete]);

  useEffect(() => {
    if (!map || !map.pm || !hasPolygonHandler) return;

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

    let createdLayer = null;

    const handleCreate = (e) => {
      const layer = e.layer;
      const closedCoords = getLayerPolygonCoordinates(layer);
      const areaInStremmata = getPolygonAreaInStremmata(closedCoords);
      onPolygonCompleteRef.current?.(closedCoords, areaInStremmata);
      createdLayer = layer;
      // Το drawn layer αντικαθίσταται από React state, ώστε edit/delete να δουλεύουν πάνω στο ίδιο boundary.
      layer.remove(); 
      window.setTimeout(() => {
        if (createdLayer === layer) createdLayer = null;
      }, 0);
    };

    const handleRemove = (event) => {
      // Η αφαίρεση του προσωρινού layer μετά το draw δεν είναι πραγματική διαγραφή από τον χρήστη.
      if (event?.layer && event.layer === createdLayer) return;
      onPolygonCompleteRef.current?.([], "");
    };

    map.on('pm:create', handleCreate);
    map.on('pm:remove', handleRemove);

    return () => {
      map.pm.removeControls();
      map.off('pm:create', handleCreate);
      map.off('pm:remove', handleRemove);
    };
  }, [hasPolygonHandler, map]);
  return null;
}

// Χειρίζεται κλικ εργασιών.
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
function MapEvents({ boundary, parentBoundary, focusedLocation, hasSelectedLayer }) {
  const map = useMap();
  useEffect(() => {
    if (focusedLocation?.length === 2) {
      map.flyTo([focusedLocation[1], focusedLocation[0]], 18, { duration: 0.8 });
      return;
    }

    if (hasSelectedLayer) return;

    const target = (parentBoundary?.length > 0) ? parentBoundary : (boundary?.length > 0 ? boundary : null);
    if (target && target.length > 0) {
      map.flyTo([target[0][1], target[0][0]], 16);
    }
  }, [parentBoundary, boundary, focusedLocation, hasSelectedLayer, map]);
  return null;
}

// Εμφανίζει στοιχείο διεπαφής.
function SelectedLayerController({
  selectedDashboardFieldId,
  selectedCropId,
  selectionRequest,
  fieldMarkerRefs,
  cropLayerRefs,
}) {
  const map = useMap();

  useEffect(() => {
    const selectedFieldMarker = selectedDashboardFieldId != null
      ? fieldMarkerRefs.current.get(String(selectedDashboardFieldId))
      : null;
    const selectedCropLayer = selectedCropId != null
      ? cropLayerRefs.current.get(String(selectedCropId))
      : null;
    const selectedLayer = selectedCropLayer || selectedFieldMarker;

    if (!selectedLayer) return undefined;

    if (selectedCropLayer?.getBounds) {
      map.flyToBounds(selectedCropLayer.getBounds(), {
        padding: [48, 48],
        maxZoom: 17,
        duration: 0.8,
      });
    } else if (selectedFieldMarker?.getLatLng) {
      map.flyTo(selectedFieldMarker.getLatLng(), 16, { duration: 0.8 });
    }

    const popupTimer = window.setTimeout(() => selectedLayer.openPopup(), 650);
    return () => window.clearTimeout(popupTimer);
  }, [
    cropLayerRefs,
    fieldMarkerRefs,
    map,
    selectedCropId,
    selectedDashboardFieldId,
    selectionRequest,
  ]);

  return null;
}

// --- ΤΟ ΚΕΝΤΡΙΚΟ COMPONENT ---
export default function MapComponent({ 
  onPolygonComplete, boundary, parentBoundary, existingCrops, 
  tasks, isAddingTask, onPointSelect, pendingLocation, focusedLocation,
  dashboardFields, selectedDashboardFieldId, onDashboardFieldSelect,
  selectedCropId, onCropSelect, selectionRequest,
}) {
  const navigate = useNavigate();
  const { t } = useAppPreferences();
  const fieldMarkerRefs = useRef(new Map());
  const cropLayerRefs = useRef(new Map());
  const canEditBoundary = Boolean(onPolygonComplete);

  // Όταν ο χρήστης κάνει edit στο υπάρχον boundary, συγχρονίζουμε coords και υπολογισμένη έκταση.
  const handleBoundaryLayerChange = (layer) => {
    if (!onPolygonComplete) return;
    const closedCoords = getLayerPolygonCoordinates(layer);
    onPolygonComplete(closedCoords, getPolygonAreaInStremmata(closedCoords));
  };

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
            // Επιστρέφει στην πρώτη συντεταγμένη.
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
    <div className="relative z-0 isolate w-full" style={{ height: '100%', width: '100%', minHeight: '500px' }}>
      <MapContainer 
        center={[38.2466, 21.7346]} 
        zoom={13} 
        className="w-full"
        style={{ height: '100%', width: '100%', minHeight: '500px' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        
        <MapResizer />
        <MapEvents
          boundary={boundary}
          parentBoundary={parentBoundary}
          focusedLocation={focusedLocation}
          hasSelectedLayer={selectedDashboardFieldId != null || selectedCropId != null}
        />
        <SelectedLayerController
          selectedDashboardFieldId={selectedDashboardFieldId}
          selectedCropId={selectedCropId}
          selectionRequest={selectionRequest}
          fieldMarkerRefs={fieldMarkerRefs}
          cropLayerRefs={cropLayerRefs}
        />
        <GeomanControls onPolygonComplete={onPolygonComplete} />
        <TaskClickHandler isAddingTask={isAddingTask} onPointSelect={onPointSelect} />

        {fieldMarkers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            ref={(layer) => {
              const markerKey = String(marker.id);
              if (layer) fieldMarkerRefs.current.set(markerKey, layer);
              else fieldMarkerRefs.current.delete(markerKey);
            }}
            eventHandlers={{
              click: () => {
                if (onDashboardFieldSelect) {
                  onDashboardFieldSelect(marker.field);
                  return;
                }
                navigate(`/fields/${marker.field.id}`);
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
              {marker.name}
            </Tooltip>
            <Popup>
              <div className="min-w-32 font-sans text-xs">
                <strong className="text-sm">{marker.name}</strong>
                <div className="mt-1">
                  {marker.field?.area != null ? `${marker.field.area} ${t.fields.stremmataShort}` : ""}
                </div>
              </div>
            </Popup>
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
                  <strong>{task.taskType || t.tasks.task}</strong><br/>
                  {task.description || t.tasks.noDescription}<br/>
                  <span>{task.status === "COMPLETED" ? t.tasks.completed : t.tasks.pending}</span>
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
          const isSelected = String(crop.id) === String(selectedCropId);
          return (
            <Polygon 
              key={crop.id ?? idx}
              ref={(layer) => {
                const cropKey = String(crop.id ?? idx);
                if (layer) cropLayerRefs.current.set(cropKey, layer);
                else cropLayerRefs.current.delete(cropKey);
              }}
              positions={positions} 
              pathOptions={{
                color: isSelected ? '#047857' : '#059669',
                fillColor: isSelected ? '#34d399' : '#10b981',
                fillOpacity: isSelected ? 0.5 : 0.25,
                weight: isSelected ? 4 : 2,
                pmIgnore: true,
              }}
              eventHandlers={{
                click: (event) => {
                  if (isAddingTask && onPointSelect) {
                    const { lat, lng } = event.latlng;
                    onPointSelect([lng, lat]);
                    return;
                  }
                  onCropSelect?.(crop);
                },
              }}
            >
              {!isAddingTask && (
                <Popup>
                  <div className="min-w-40 font-sans text-xs">
                    <strong className="text-sm">{crop.type || "Καλλιέργεια"}</strong>
                    <div className="mt-1">{crop.variety || "Γενική ποικιλία"}</div>
                    {crop.harvestYield != null && (
                      <div className="mt-1">Παραγωγή: {crop.harvestYield} kg</div>
                    )}
                    {crop.sellingPricePerKg != null && (
                      <div>Τιμή/kg: {crop.sellingPricePerKg} €</div>
                    )}
                  </div>
                </Popup>
              )}
            </Polygon>
          );
        })}

        {/* Νέο πολύγωνο (υπό σχεδίαση) */}
        {boundary && boundary.length >= 3 && (
          <Polygon 
            positions={boundary.map(c => [c[1], c[0]])} 
            // Το ενεργό boundary πρέπει να είναι Geoman-editable μόνο στις φόρμες σχεδίασης.
            pathOptions={{ color: 'orange', fillOpacity: 0.4, pmIgnore: !canEditBoundary }}
            eventHandlers={canEditBoundary ? {
              'pm:edit': (event) => handleBoundaryLayerChange(event.target),
              'pm:update': (event) => handleBoundaryLayerChange(event.target),
              'pm:remove': () => onPolygonComplete([], ""),
            } : undefined}
          />
        )}
      </MapContainer>
    </div>
  );
}
