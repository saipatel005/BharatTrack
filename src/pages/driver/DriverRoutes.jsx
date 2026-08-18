import { useState, useEffect } from 'react';
import { Map, MapPin, Navigation } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { RouteMap } from '../../components/ui/RouteMap';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

export const DriverRoutes = () => {
  const { userData } = useAuth();
  const [routeDetails, setRouteDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoute = async () => {
      let activeBusId = userData?.assignedBusId;
      
      try {
        if (!activeBusId && userData?.name) {
          const busesQ = query(collection(db, 'buses'), where('driverName', '==', userData.name));
          const busesSnap = await getDocs(busesQ);
          if (!busesSnap.empty) {
            activeBusId = busesSnap.docs[0].data().busNumber;
          }
        }

        if (!activeBusId) {
          setLoading(false);
          return;
        }

        const q = query(collection(db, 'routes'), where('assignedBusId', '==', activeBusId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setRouteDetails({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
        }
      } catch (error) {
        console.error("Error fetching route details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [userData]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading route details...</div>;
  }

  if (!routeDetails) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-xl text-gray-500 border border-gray-100 max-w-4xl mx-auto">
        No route has been assigned to your bus yet. Please contact the administrator.
      </div>
    );
  }

  const stops = routeDetails.stops || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assigned Route</h1>
        <p className="text-gray-500 mt-1">{routeDetails.routeName} • {routeDetails.estimatedDuration}</p>
      </div>

      <Card className="overflow-hidden">
        <div className="h-64 bg-gray-200 relative flex items-center justify-center">
          <RouteMap stops={stops} className="w-full h-full absolute inset-0 z-0" />
          <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-sm border border-white flex justify-between items-center z-10 max-w-sm mx-auto">
            <div className="flex items-center space-x-2">
              <Navigation className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">Total Stops: {stops.length}</span>
            </div>
          </div>
        </div>
        
        <CardContent className="p-6">
          <h3 className="font-bold text-gray-900 mb-6">Stop Sequence</h3>
          
          <div className="space-y-0 relative">
            {/* Connecting line */}
            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-200" />
            
            {stops.map((stop, idx) => {
              const isStart = idx === 0;
              const isEnd = idx === stops.length - 1;
              return (
                <div key={stop.id || idx} className="relative flex items-center p-4 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center relative z-10 border-4 border-white shadow-sm ${
                    isStart ? 'bg-blue-100 text-blue-600' : 
                    isEnd ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <MapPin className="w-5 h-5" />
                  </div>
                  
                  <div className="ml-4 flex-1">
                    <h4 className="font-bold text-gray-900">{stop.name}</h4>
                    <p className="text-sm text-gray-500">Stop {idx + 1}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
