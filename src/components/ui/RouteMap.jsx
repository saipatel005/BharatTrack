import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
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
  return null;
};

export const RouteMap = ({ stops = [], busLocation = null, className = "h-[400px] w-full rounded-xl z-0" }) => {
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
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <MapUpdater bounds={bounds} center={defaultCenter} />

        {/* Draw Route Line */}
        {stops.length > 1 && (
          <Polyline 
            positions={stops.map(s => [s.lat, s.lng])} 
            color="#3b82f6" 
            weight={4}
            opacity={0.7}
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
