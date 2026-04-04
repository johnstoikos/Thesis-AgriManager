import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Διόρθωση για τα εικονίδια του Leaflet που μερικές φορές εξαφανίζονται στη React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapComponent() {
  // Συντεταγμένες για το κέντρο του χάρτη (π.χ. κάπου στην Ελλάδα)
  const position = [38.2466, 21.7346]; 

  return (
    <div style={{ height: '400px', width: '100%', borderRadius: '15px', overflow: 'hidden', border: '2px solid #e5e7eb', zIndex: 0 }}>
      <MapContainer 
        center={position} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>
            Το πρώτο μου χωράφι!
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
export default MapComponent;