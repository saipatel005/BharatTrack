import React from 'react';
import { MapPin, Bus } from 'lucide-react';
import { Card, CardContent } from './Card';

const getDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2));
};

export const StopSequence = ({ stops = [], busLocation = null }) => {
  if (!stops || stops.length === 0) return null;

  let closestIndex = -1;
  let minDistance = Infinity;

  if (busLocation && busLocation.lat && busLocation.lng) {
    stops.forEach((stop, index) => {
      const dist = getDistance(busLocation.lat, busLocation.lng, stop.lat, stop.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = index;
      }
    });
  }

  return (
    <Card className="mt-6 border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Stop Sequence</h3>
      </div>
      <CardContent className="p-6">
        <div className="relative border-l-2 border-gray-100 ml-4 space-y-8 py-2">
          {stops.map((stop, index) => {
            const isClosest = index === closestIndex;
            return (
              <div key={index} className="relative flex items-start">
                {/* Timeline dot */}
                <div className="absolute -left-[25px] mt-0.5 bg-white rounded-full">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border shadow-sm transition-all duration-500 ${
                    isClosest ? 'bg-green-100 border-green-200 scale-110 ring-4 ring-green-50 z-10 relative' : 'bg-blue-50 border-blue-100'
                  }`}>
                    {isClosest ? (
                      <Bus className="w-6 h-6 text-green-600 animate-bounce" />
                    ) : (
                      <MapPin className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </div>
                
                <div className={`pl-10 py-1 transition-all duration-500 ${isClosest ? 'opacity-100' : 'opacity-75'}`}>
                  <h4 className={`text-base font-bold ${isClosest ? 'text-green-700' : 'text-gray-900'}`}>
                    {stop.name} <span className="text-gray-400 font-normal text-sm ml-1 hidden sm:inline-block">({stop.lat.toFixed(4)}, {stop.lng.toFixed(4)})</span>
                  </h4>
                  <p className={`text-sm mt-1 flex items-center ${isClosest ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
                    {isClosest && <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />}
                    Stop {index + 1} {isClosest && ' - Bus is currently near here'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
