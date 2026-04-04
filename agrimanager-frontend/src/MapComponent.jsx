import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import * as turf from '@turf/turf'; 
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { Polygon } from 'react-leaflet';

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

      // 1. Μετατροπή σε μορφή Turf [[lng, lat], [lng, lat], ...]
      const coords = latlngs.map(p => [p.lng, p.lat]);
      // Το Turf θέλει το πολύγωνο να κλείνει (πρώτο σημείο = τελευταίο)
      const closedCoords = [...coords, coords[0]];

      try {
        // 2. Δημιουργία Turf Polygon και υπολογισμός εμβαδού
        const polygon = turf.polygon([closedCoords]);
        const areaSqMeters = turf.area(polygon);
        
        // 3. Μετατροπή σε στρέμματα (1 στρέμμα = 1000 τ.μ.)
        const areaStremmata = (areaSqMeters / 1000).toFixed(2);

        console.log("Εμβαδόν από Turf:", areaStremmata);

        // Στέλνουμε τις συντεταγμένες και το εμβαδόν
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

function DataLayer({ boundary }) {
  // Αν δεν υπάρχουν τουλάχιστον 3 σημεία, μην σχεδιάζεις τίποτα
  if (!boundary || boundary.length < 3) return null;

  // ΠΡΟΣΟΧΗ: Το Leaflet θέλει [lat, lng] για να σχεδιάσει, 
  // ενώ το GeoJSON/Turf έχουν [lng, lat]. Πρέπει να τα αντιστρέψουμε:
  const positions = boundary.map(coord => [coord[1], coord[0]]);

  return <Polygon positions={positions} pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.3 }} />;
}

export default function MapComponent({ onPolygonComplete, boundary }) { // Πρόσθεσε το boundary στα props
  return (
    <div style={{ height: '350px', width: '100%', borderRadius: '12px', overflow: 'hidden', marginTop: '10px', border: '1px solid #ccc' }}>
      <MapContainer center={[38.2466, 21.7346]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <GeomanControls onPolygonComplete={onPolygonComplete} />
        
        {/* Εδώ εμφανίζονται τα όρια που βάζεις χειροκίνητα */}
        <DataLayer boundary={boundary} />
      </MapContainer>
    </div>
  );
}