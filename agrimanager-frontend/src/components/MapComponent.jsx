import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup, Polygon } from 'react-leaflet';
import L from 'leaflet';
import * as turf from '@turf/turf'; 
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

// --- FIX ΓΙΑ ΤΑ ΕΙΚΟΝΙΔΙΑ ΤΩΝ MARKERS ---
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- ΕΣΩΤΕΡΙΚΑ COMPONENTS ---

// Λύνει το πρόβλημα της εξαφάνισης του χάρτη
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [map]);
  return null;
}

function GeomanControls({ onPolygonComplete }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !map.pm) return;

    map.pm.addControls({
      position: 'topleft',
      drawMarker: false,
      drawPolygon: true,
      drawRectangle: true,
      editMode: true,
      removalMode: true,
    });

    map.on('pm:create', (e) => {
      const layer = e.layer;
      const latlngs = layer.getLatLngs()[0];
      const coords = latlngs.map(p => [p.lng, p.lat]);
      const closedCoords = [...coords, coords[0]];

      try {
        const poly = turf.polygon([closedCoords]);
        const areaSqMeters = turf.area(poly);
        const areaStremmata = (areaSqMeters / 1000).toFixed(2);
        onPolygonComplete(closedCoords, areaStremmata);
      } catch (err) {
        console.error("Σφάλμα Turf:", err);
      }
    });

    return () => {
      map.pm.removeControls();
      map.off('pm:create');
    };
  }, [map, onPolygonComplete]);

  return null;
}

function GlobalMarkers({ allFields, hide }) {
  if (hide || !allFields || allFields.length === 0) return null;

  return allFields.map((field) => {
    try {
      const poly = turf.polygon(field.boundary.coordinates);
      const center = turf.centroid(poly);
      const [lng, lat] = center.geometry.coordinates;

      return (
        <Marker key={field.id} position={[lat, lng]}>
          <Popup>
            <div className="text-center">
              <strong className="text-green-700">{field.name}</strong><br/>
              <span>{field.area} στρ.</span>
            </div>
          </Popup>
        </Marker>
      );
    } catch (err) {
      return null;
    }
  });
}

function DataLayer({ boundary, color = 'green' }) {
  if (!boundary || boundary.length < 3) return null;
  const positions = boundary.map(coord => [coord[1], coord[0]]);
  return <Polygon positions={positions} pathOptions={{ color: color, fillColor: color, fillOpacity: 0.3 }} />;
}

function MapRecenter({ boundary, parentBoundary }) {
  const map = useMap();

  useEffect(() => {
    const target = parentBoundary && parentBoundary.length > 0 ? parentBoundary : boundary;
    if (target && target.length > 0) {
      const firstPoint = [target[0][1], target[0][0]]; 
      map.flyTo(firstPoint, 16);
    }
  }, [boundary, parentBoundary, map]);

  return null;
}

// --- ΚΥΡΙΟ COMPONENT ---
export default function MapComponent({ onPolygonComplete, boundary, allFields, parentBoundary }) {
  const parentPositions = parentBoundary ? parentBoundary.map(c => [c[1], c[0]]) : null;

  return (
    <div style={{ height: '400px', width: '100%', position: 'relative', borderRadius: '15px', overflow: 'hidden', border: '1px solid #ddd' }}>
      <MapContainer 
        center={[38.2466, 21.7346]} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        <MapResizer />
        <MapRecenter boundary={boundary} parentBoundary={parentBoundary} />
        <GeomanControls onPolygonComplete={onPolygonComplete} />

        {parentPositions && (
          <Polygon 
            positions={parentPositions} 
            pathOptions={{ 
              color: '#4B5563', 
              fillColor: '#9CA3AF', 
              fillOpacity: 0.1, 
              dashArray: '10, 10', 
              weight: 2 
            }} 
          />
        )}

        <DataLayer boundary={boundary} color={parentBoundary ? 'orange' : 'green'} />
        <GlobalMarkers allFields={allFields} hide={!!parentBoundary} />
      </MapContainer>
    </div>
  );
}