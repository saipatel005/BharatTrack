import { useState, useEffect } from 'react';
import { Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

export const DriverTrips = () => {
  const { userData } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        if (!userData) return;
        
        const driverId = userData.uid || userData.id || 'demo-driver';
        const q = query(
          collection(db, 'trips'), 
          where('driverId', '==', driverId)
        );
        const snapshot = await getDocs(q);
        
        const fetchedTrips = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.status === 'Completed' || data.status === 'Active') {
            fetchedTrips.push({ id: doc.id, ...data });
          }
        });
        
        // Sort by startTime descending (newest first)
        fetchedTrips.sort((a, b) => {
           const timeA = a.startTime?.toDate ? a.startTime.toDate().getTime() : 0;
           const timeB = b.startTime?.toDate ? b.startTime.toDate().getTime() : 0;
           return timeB - timeA;
        });

        setTrips(fetchedTrips);
      } catch (err) {
        console.error("Error fetching trips:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrips();
  }, [userData]);

  const calculateDuration = (start, end) => {
    if (!start?.toDate || !end?.toDate) return 'N/A';
    const diffMs = end.toDate().getTime() - start.toDate().getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return 'N/A';
    return timestamp.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timestamp) => {
    if (!timestamp?.toDate) return 'N/A';
    return timestamp.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
          <p className="text-gray-500 mt-1">Review your past completed trips</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Trips Completed</p>
              <h3 className="text-2xl font-bold text-blue-900 mt-1">{loading ? '-' : trips.length}</h3>
            </div>
            <Clock className="w-8 h-8 text-blue-300" />
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">On-Time Performance</p>
              <h3 className="text-2xl font-bold text-green-900 mt-1">94%</h3>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-300" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading trips...</div>
            ) : trips.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No completed trips found.</div>
            ) : (
              trips.map(trip => (
                <div key={trip.id} className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{trip.id}</h4>
                      <p className="text-sm text-gray-500 mt-1">{formatDate(trip.startTime)} • {formatTime(trip.startTime)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Bus: {trip.busId || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 flex flex-col sm:items-end w-full sm:w-auto">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                      trip.status === 'Active' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {trip.status}
                    </span>
                    <p className="text-sm font-medium text-gray-500 mt-2">
                      Duration: {trip.status === 'Active' ? 'Ongoing' : calculateDuration(trip.startTime, trip.endTime)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
