import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, limit, orderBy, where, getCountFromServer, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Users, Truck, Route, AlertCircle, Calendar, Bus, Map, AlertTriangle, Phone, Info } from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardContent } from '../../components/ui/Card';
import { RouteMap } from '../../components/ui/RouteMap';
import { StopSequence } from '../../components/ui/StopSequence';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLocations, setActiveLocations] = useState([]);
  const [selectedBusId, setSelectedBusId] = useState('');
  const [selectedRouteDetails, setSelectedRouteDetails] = useState(null);
  const [stats, setStats] = useState({
    totalBuses: 0,
    totalStudents: 0,
    activeTrips: 0,
    maintenanceBuses: 0
  });


  useEffect(() => {
    let unsubscribeTrips;
    
    const fetchDashboardData = async () => {
      try {
        // Fetch Students count
        const studentsSnap = await getCountFromServer(collection(db, 'students'));
        const totalStudents = studentsSnap.data().count;

        // Fetch Buses
        const busesSnap = await getDocs(collection(db, 'buses'));
        const totalBuses = busesSnap.size;
        let maintenanceBuses = 0;
        busesSnap.forEach(doc => {
          if (doc.data().status === 'Maintenance') maintenanceBuses++;
        });

        // Fetch Active Trips count
        const activeTripsQuery = query(collection(db, 'trips'), where('status', '==', 'Active'));
        const activeTripsSnap = await getCountFromServer(activeTripsQuery);
        const activeTrips = activeTripsSnap.data().count;

        setStats({
          totalBuses,
          totalStudents,
          activeTrips,
          maintenanceBuses
        });

        // Fetch Drivers for name resolution
        const driversSnap = await getDocs(collection(db, 'drivers'));
        const driversMap = {};
        driversSnap.forEach(d => {
          driversMap[d.id] = d.data();
        });

        // Fetch Recent Trips (List) in real-time
        const recentQ = query(collection(db, 'trips'), orderBy('startTime', 'desc'), limit(5));
        unsubscribeTrips = onSnapshot(recentQ, (snapshot) => {
          const trips = snapshot.docs.map(doc => {
            const data = doc.data();
            
            let resolvedDriver = driversMap[data.driverId];
            if (!resolvedDriver && data.busId) {
              resolvedDriver = Object.values(driversMap).find(d => d.assignedBusId === data.busId);
            }
            
            let displayDriverName = data.driverName || data.driverId || 'Unknown Driver';
            if (resolvedDriver) {
              displayDriverName = resolvedDriver.name;
            } else if (data.driverId === 'demo-driver') {
              displayDriverName = 'Demo Driver';
            }
            
            return { 
              id: doc.id, 
              ...data,
              resolvedDriverName: displayDriverName,
              resolvedDriverPhone: resolvedDriver?.phone || ''
            };
          });
          setRecentTrips(trips);
        });



      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
    
    return () => {
      if (unsubscribeTrips) unsubscribeTrips();
    };
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'locations'), where('activeTrip', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const locations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActiveLocations(locations);
      
      setSelectedBusId(prev => {
        if (!prev && locations.length > 0) return locations[0].busId;
        // If the previously selected bus is no longer active, select another or empty
        if (prev && !locations.find(l => l.busId === prev)) return locations.length > 0 ? locations[0].busId : '';
        return prev;
      });
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedBusId) {
      setSelectedRouteDetails(null);
      return;
    }
    const fetchRoute = async () => {
      try {
        const routeQ = query(collection(db, 'routes'), where('assignedBusId', '==', selectedBusId));
        const routeSnap = await getDocs(routeQ);
        if (!routeSnap.empty) {
          setSelectedRouteDetails(routeSnap.docs[0].data());
        } else {
          setSelectedRouteDetails(null);
        }
      } catch (e) {
        console.error("Error fetching route for selected bus:", e);
      }
    };
    fetchRoute();
  }, [selectedBusId]);

  const selectedLocation = activeLocations.find(loc => loc.busId === selectedBusId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Overview</h1>
        <div className="flex space-x-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            System Online
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Buses" 
          value={stats.totalBuses.toString()} 
          icon={Bus} 
          trend="none" 
          colorClass="text-blue-600"
          bgClass="bg-blue-100"
        />
        <StatCard 
          title="Total Students" 
          value={stats.totalStudents.toString()} 
          icon={Users} 
          trend="none" 
          colorClass="text-purple-600"
          bgClass="bg-purple-100"
        />
        <StatCard 
          title="Active Trips" 
          value={stats.activeTrips.toString()} 
          icon={Map} 
          trend="none"
          colorClass="text-green-600"
          bgClass="bg-green-100"
        />
        <StatCard 
          title="Maintenance/Delayed" 
          value={stats.maintenanceBuses.toString()} 
          icon={AlertTriangle} 
          trend="none"
          colorClass="text-orange-600"
          bgClass="bg-orange-100"
        />
      </div>

      <div className="mt-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Live Tracking</h3>
                <p className="text-sm text-gray-500">Real-time fleet monitoring</p>
              </div>
              <div className="mt-4 sm:mt-0 min-w-[200px]">
                <select 
                  value={selectedBusId} 
                  onChange={(e) => setSelectedBusId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 appearance-none"
                >
                  <option value="" disabled>Select a bus to track</option>
                  {activeLocations.map(loc => (
                    <option key={loc.busId} value={loc.busId}>
                      Bus: {loc.busId}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="h-[400px] w-full rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
              {activeLocations.length === 0 ? (
                <div className="text-gray-500 flex flex-col items-center">
                  <Map className="w-8 h-8 mb-2 text-gray-400" />
                  <p>No active trips to track</p>
                </div>
              ) : selectedLocation ? (
                <RouteMap 
                  busLocation={{ lat: selectedLocation.latitude, lng: selectedLocation.longitude, speed: Math.round((selectedLocation.speed || 0) * 3.6) }}
                  stops={selectedRouteDetails?.stops || []}
                  className="h-full w-full z-0"
                />
              ) : (
                <div className="text-gray-500 flex flex-col items-center">
                  <Map className="w-8 h-8 mb-2 text-gray-400" />
                  <p>Select a bus to view its location</p>
                </div>
              )}
            </div>
            
            {selectedRouteDetails?.stops && selectedRouteDetails.stops.length > 0 && (
              <StopSequence 
                stops={selectedRouteDetails.stops} 
                busLocation={selectedLocation ? { lat: selectedLocation.latitude, lng: selectedLocation.longitude } : null} 
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardContent className="p-0">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Trips History</h3>
                <p className="text-sm text-gray-500">Live feed of fleet operations</p>
              </div>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">Trip ID</th>
                    <th className="px-6 py-4 font-medium">Bus Number</th>
                    <th className="px-6 py-4 font-medium">Driver Name</th>
                    <th className="px-6 py-4 font-medium">Started At</th>
                    <th className="px-6 py-4 font-medium">Reached At</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Loading history...</td></tr>
                  ) : recentTrips.length === 0 ? (
                    <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No recent trips found</td></tr>
                  ) : recentTrips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">{trip.id}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{trip.busId || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-600">{trip.resolvedDriverName}</td>
                      <td className="px-6 py-4 text-gray-500">
                        {trip.startTime?.toDate ? trip.startTime.toDate().toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {trip.endTime?.toDate ? trip.endTime.toDate().toLocaleString() : (trip.status === 'Active' ? 'In Progress' : 'N/A')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => navigate('/admin/buses')}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors tooltip-trigger" 
                            title="View Bus Details"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => trip.resolvedDriverPhone ? window.location.href = `tel:${trip.resolvedDriverPhone}` : alert('No phone number available for this driver.')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors tooltip-trigger" 
                            title="Call Driver"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
