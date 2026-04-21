import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup, Polygon } from 'react-leaflet';
import L from 'leaflet';
import * as turf from '@turf/turf'; 
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

// Fix για τα εικονίδια
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: markerIcon, shadowUrl: markerShadow,
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    // Αυξάνουμε λίγο τον χρόνο για να προλάβει το Modal να ανοίξει πλήρως
    const timer = setTimeout(() => { map.invalidateSize(); }, 400);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

function GeomanControls({ onPolygonComplete, boundary }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !map.pm) return;

    if (!boundary || boundary.length === 0) {
      map.pm.disableDraw();
      map.eachLayer((layer) => {
        if (layer instanceof L.Polygon && layer.options.dashArray !== '10, 10' && !layer.options.pmIgnore && !layer._url) {
          map.removeLayer(layer);
        }
      });
    }

    map.pm.addControls({
      position: 'topleft', drawMarker: false, drawPolygon: true,
      drawRectangle: false, editMode: true, removalMode: true,
    });

    map.on('pm:create', (e) => {
      const layer = e.layer;
      layer.remove(); 
      const latlngs = layer.getLatLngs()[0];
      const coords = latlngs.map(p => [p.lng, p.lat]);
      const closedCoords = [...coords, coords[0]];
      onPolygonComplete(closedCoords);
    });

    return () => {
      map.pm.removeControls();
      map.off('pm:create');
    };
  }, [map, onPolygonComplete, boundary]);
  return null;
}

function ExistingCropsLayer({ crops }) {
  if (!crops || !Array.isArray(crops)) return null;

  return crops.map((crop) => {
    try {
      if (!crop.zoneBoundary?.coordinates?.[0]) return null;
      const positions = crop.zoneBoundary.coordinates[0].map(coord => [coord[1], coord[0]]);
      return (
        <Polygon 
          key={crop.id} 
          positions={positions} 
          pathOptions={{ color: '#059669', fillColor: '#10b981', fillOpacity: 0.3, weight: 2, pmIgnore: true }} 
        >
          <Popup><strong>{crop.type}</strong></Popup>
        </Polygon>
      );
    } catch (e) { return null; }
  });
}

export default function MapComponent({ onPolygonComplete, boundary, parentBoundary, existingCrops }) {
  const parentPositions = parentBoundary ? parentBoundary.map(c => [c[1], c[0]]) : null;

  return (
    <div style={{ height: '500px', width: '100%', backgroundColor: '#f3f4f6', position: 'relative' }}>
      <MapContainer center={[38.2466, 21.7346]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapResizer />
        
        {/* Recenter logic απευθείας εδώ για σιγουριά */}
        <MapEvents boundary={boundary} parentBoundary={parentBoundary} />
        
        <GeomanControls onPolygonComplete={onPolygonComplete} boundary={boundary} />

        {parentPositions && (
          <Polygon 
            positions={parentPositions} 
            pathOptions={{ color: '#4B5563', fillColor: '#9CA3AF', fillOpacity: 0.05, dashArray: '10, 10', weight: 2, pmIgnore: true }} 
          />
        )}

        <ExistingCropsLayer crops={existingCrops} />

        {boundary && boundary.length >= 3 && (
          <Polygon positions={boundary.map(c => [c[1], c[0]])} pathOptions={{ color: 'orange', fillColor: 'orange', fillOpacity: 0.4 }} />
        )}
      </MapContainer>
    </div>
  );
}

function MapEvents({ boundary, parentBoundary }) {
  const map = useMap();
  useEffect(() => {
    const target = (parentBoundary?.length > 0) ? parentBoundary : (boundary?.length > 0 ? boundary : null);
    if (target && target.length > 0) {
      map.flyTo([target[0][1], target[0][0]], 16);
    }
  }, [parentBoundary, map]);
  return null;
}