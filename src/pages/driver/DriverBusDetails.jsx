import { useState, useEffect } from 'react';
import { Bus, Settings, Wrench, ShieldCheck, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

export const DriverBusDetails = () => {
  const { userData } = useAuth();
  const [busDetails, setBusDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusDetails = async () => {
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

        const q = query(collection(db, 'buses'), where('busNumber', '==', activeBusId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setBusDetails({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
        }
      } catch (error) {
        console.error("Error fetching bus details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusDetails();
  }, [userData]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading bus details...</div>;
  }

  if (!busDetails) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-xl text-gray-500 border border-gray-100 max-w-4xl mx-auto">
        No bus has been assigned to you yet. Please contact the administrator.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bus Details</h1>
        <p className="text-gray-500 mt-1">Vehicle specifications and status</p>
      </div>

      <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Bus className="w-48 h-48" />
        </div>
        <CardContent className="p-8 relative z-10">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm mb-6 ${
            busDetails.status === 'Maintenance' ? 'bg-orange-500/50' : ''
          }`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${busDetails.status === 'Active' ? 'bg-green-400 animate-pulse' : 'bg-orange-400'}`}></span>
            {busDetails.status || 'Active'} Condition
          </span>
          
          <h2 className="text-4xl font-black mb-2">{busDetails.registrationNumber || 'Pending Registration'}</h2>
          <p className="text-blue-100 text-lg">Bus ID: {busDetails.busNumber} • Standard Fleet</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-white/20">
            <div>
              <p className="text-blue-200 text-sm mb-1">Capacity</p>
              <p className="text-xl font-bold">{busDetails.capacity || 40} Seats</p>
            </div>
            <div>
              <p className="text-blue-200 text-sm mb-1">Fuel Type</p>
              <p className="text-xl font-bold">Diesel</p>
            </div>
            <div>
              <p className="text-blue-200 text-sm mb-1">Last Serviced</p>
              <p className="text-xl font-bold">Oct 12, 2026</p>
            </div>
            <div>
              <p className="text-blue-200 text-sm mb-1">Insurance</p>
              <p className="text-xl font-bold">Valid</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Wrench className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900">Maintenance Schedule</h3>
            </div>
            <ul className="space-y-4">
              <li className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Next Oil Change</span>
                <span className="font-medium">In 1,200 km</span>
              </li>
              <li className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Tire Rotation</span>
                <span className="font-medium text-orange-600">Due Now</span>
              </li>
              <li className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Brake Inspection</span>
                <span className="font-medium">Dec 1, 2026</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-50 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900">Compliance & Checks</h3>
            </div>
            <ul className="space-y-4">
              <li className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Pollution Certificate</span>
                <span className="font-medium text-green-600">Valid</span>
              </li>
              <li className="flex justify-between items-center text-sm">
                <span className="text-gray-600">First Aid Kit</span>
                <span className="font-medium text-green-600">Present</span>
              </li>
              <li className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Fire Extinguisher</span>
                <span className="font-medium text-green-600">Inspected</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
