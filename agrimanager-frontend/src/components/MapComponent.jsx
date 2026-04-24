import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup, Polygon, useMapEvents } from 'react-leaflet';
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
function MapEvents({ boundary, parentBoundary }) {
  const map = useMap();
  useEffect(() => {
    const target = (parentBoundary?.length > 0) ? parentBoundary : (boundary?.length > 0 ? boundary : null);
    if (target && target.length > 0) {
      map.flyTo([target[0][1], target[0][0]], 16);
    }
  }, [parentBoundary, boundary, map]);
  return null;
}

// --- ΤΟ ΚΕΝΤΡΙΚΟ COMPONENT ---
export default function MapComponent({ 
  onPolygonComplete, boundary, parentBoundary, existingCrops, 
  tasks, isAddingTask, onPointSelect, pendingLocation 
}) {
  return (
    <div style={{ height: '100%', width: '100%', minHeight: '500px', position: 'relative' }}>
      <MapContainer 
        center={[38.2466, 21.7346]} 
        zoom={13} 
        style={{ height: '100%', width: '100%', minHeight: '500px' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        <MapResizer />
        <MapEvents boundary={boundary} parentBoundary={parentBoundary} />
        <GeomanControls onPolygonComplete={onPolygonComplete} boundary={boundary} />
        <TaskClickHandler isAddingTask={isAddingTask} onPointSelect={onPointSelect} />

        {/* Εμφάνιση αποθηκευμένων εργασιών */}
        {tasks?.map(task => (
          task?.location?.coordinates && (
            <Marker key={task.id} position={[task.location.coordinates[1], task.location.coordinates[0]]}>
              <Popup>
                <div className="font-sans text-xs">
                  <strong>{task.taskType}</strong><br/>
                  {task.description}
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