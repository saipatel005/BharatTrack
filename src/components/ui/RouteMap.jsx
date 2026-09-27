import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Bus Icon factory
const getBusIcon = () => {
  const busIconHtml = `
    <div class="relative" style="width: 44px; height: 44px;">
      <div class="bg-blue-600 text-white rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)] border-2 border-white flex items-center justify-center animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" style="width: 100%; height: 100%;">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>
        </svg>
      </div>
      <span class="absolute -bottom-1 -right-1 flex h-4 w-4">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white"></span>
      </span>
    </div>
  `;

  return new L.divIcon({
    html: busIconHtml,
    className: 'custom-bus-icon-container bg-transparent border-none',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22]
  });
};

// Component to recenter map when bounds change
const MapUpdater = ({ bounds, center }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (center) {
      map.setView(center, map.getZoom());
    }
  }, [bounds, center, map]);
};

// Component to handle map clicks
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
};

export const RouteMap = ({ stops = [], busLocation = null, onMapClick = null, className = "h-[400px] w-full rounded-xl z-0" }) => {
  const [routePath, setRoutePath] = useState([]);

  // Fetch actual road routing from OSRM
  useEffect(() => {
    const fetchRoute = async () => {
      if (!stops || stops.length < 2) {
        setRoutePath(stops.map(s => [s.lat, s.lng]));
        return;
      }

      try {
        // OSRM expects coordinates in lon,lat format
        const coordinatesString = stops.map(stop => `${stop.lng},${stop.lat}`).join(';');
        const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinatesString}?overview=full&geometries=geojson`);
        
        if (!response.ok) throw new Error('OSRM API response not OK');
        
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          // GeoJSON uses [lon, lat], Leaflet Polyline expects [lat, lon]
          const path = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
          setRoutePath(path);
        } else {
          // Fallback to straight lines if route not found
          setRoutePath(stops.map(s => [s.lat, s.lng]));
        }
      } catch (error) {
        console.error('Error fetching route from OSRM:', error);
        // Fallback to straight lines on error
        setRoutePath(stops.map(s => [s.lat, s.lng]));
      }
    };

    fetchRoute();
  }, [stops]);

  // Center on stops if available, otherwise bus location, otherwise default
  const defaultCenter = stops.length > 0 ? [stops[0].lat, stops[0].lng] : 
                        busLocation ? [busLocation.lat, busLocation.lng] : 
                        [17.3850, 78.4867];

  const bounds = stops.length > 0 ? stops.map(s => [s.lat, s.lng]) : 
                 busLocation ? [[busLocation.lat, busLocation.lng]] : null;

  return (
    <div className={className}>
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        style={{ height: '100%', width: '100%', zIndex: 0, borderRadius: 'inherit' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater bounds={bounds} center={defaultCenter} />
        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}

        {/* Draw Route Line */}
        {routePath.length > 1 && (
          <Polyline 
            positions={routePath} 
            color="#3b82f6" 
            weight={5}
            opacity={0.8}
          />
        )}

        {/* Draw Stops */}
        {stops.map((stop, index) => (
          <Marker key={stop.id || index} position={[stop.lat, stop.lng]}>
            <Popup>
              <div className="font-semibold">{stop.name}</div>
              <div className="text-xs text-gray-500">Stop {index + 1}</div>
            </Popup>
          </Marker>
        ))}

        {/* Draw Bus Location */}
        {busLocation && (
          <Marker 
            position={[busLocation.lat, busLocation.lng]}
            icon={getBusIcon()}
            zIndexOffset={1000}
          >
            <Popup>
              <div className="font-semibold text-blue-600">Bus Location</div>
              <div className="text-xs text-gray-500">{busLocation.speed} km/h</div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};
