import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, onSnapshot, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Bus, MapPin, Clock, AlertCircle, Bell, Key, X, User } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { RouteMap } from '../../components/ui/RouteMap';

export const StudentDashboard = () => {
  const { userData } = useAuth();
  const [busDetails, setBusDetails] = useState(null);
  const [routeDetails, setRouteDetails] = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eta, setEta] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const assignedBusId = userData?.busId || userData?.assignedBusId || '';
  const assignedRouteId = userData?.routeId || userData?.assignedRouteId || '';
  const studentStopId = userData?.stopId || '';

  // 1. Fetch static details (Bus info, Route info)
  useEffect(() => {
    const fetchStaticDetails = async () => {
      try {
        if (assignedBusId) {
          const busQ = query(collection(db, 'buses'), where('busNumber', '==', assignedBusId));
          const busSnap = await getDocs(busQ);
          if (!busSnap.empty) {
            let busData = busSnap.docs[0].data();
            
            // Resolve driver dynamically if out of sync
            const driverQ = query(collection(db, 'drivers'), where('assignedBusId', '==', assignedBusId));
            const driverSnap = await getDocs(driverQ);
            if (!driverSnap.empty) {
              busData = { ...busData, driverName: driverSnap.docs[0].data().name };
            }
            
            setBusDetails(busData);
          } else {
            setBusDetails(null);
          }
        }
        
        if (assignedRouteId) {
          const routeQ = query(collection(db, 'routes'), where('routeName', '==', assignedRouteId));
          const routeSnap = await getDocs(routeQ);
          if (!routeSnap.empty) {
            setRouteDetails(routeSnap.docs[0].data());
          } else {
            setRouteDetails(null);
          }
        }
      } catch (error) {
        console.error("Error fetching static details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStaticDetails();
  }, [assignedBusId, assignedRouteId]);

  // 2. Listen to Live Location updates
  useEffect(() => {
    if (!assignedBusId) return;
    
    const unsubscribe = onSnapshot(doc(db, 'locations', assignedBusId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.activeTrip) {
          setLiveLocation({
            lat: data.latitude,
            lng: data.longitude,
            speed: data.speed,
            timestamp: data.timestamp
          });
          
          // Basic ETA calculation
          if (routeDetails) {
            const myStop = routeDetails.stops.find(s => s.id === studentStopId);
            if (myStop) {
              setEta('~2 mins'); 
              // Simulate approaching notification when bus is moving
              if (data.speed > 0 && !showNotification) {
                setShowNotification(true);
                setTimeout(() => setShowNotification(false), 8000); // Hide after 8s
              }
            }
          }
        } else {
          setLiveLocation(null);
          setEta('Bus is offline');
          setShowNotification(false);
        }
      }
    });

    return () => unsubscribe();
  }, [assignedBusId, routeDetails, studentStopId]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    setIsUpdatingPassword(true);
    try {
      const studentRef = doc(db, 'students', userData.uid);
      await updateDoc(studentRef, { password: newPassword });
      setIsPasswordModalOpen(false);
      setNewPassword('');
      alert("Password updated successfully!");
    } catch (error) {
      console.error("Error updating password:", error);
      alert("Failed to update password. Please try again.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (loading) {
    return <div className="flex h-[calc(100vh-8rem)] items-center justify-center text-gray-500">Loading your bus details...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 lg:pb-8 relative">
      
      {/* Simulated Notification Toast */}
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[1000] transition-all duration-500 ease-in-out ${
        showNotification ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'
      }`}>
        <div className="bg-white px-6 py-4 rounded-2xl shadow-2xl border border-blue-100 flex items-center space-x-4 max-w-[90vw] mx-auto">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-blue-600 animate-bounce" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900">Bus Approaching!</h4>
            <p className="text-sm text-gray-500">Your bus is ~2 mins away from your stop.</p>
          </div>
        </div>
      </div>

      {/* Header Profile Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center border-4 border-white shadow-sm">
            <span className="text-2xl font-bold text-purple-600">
              {userData?.name?.charAt(0) || 'S'}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hello, {userData?.name || 'Student'}</h1>
            <p className="text-gray-500">Track your ride to college</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setIsPasswordModalOpen(true)} className="flex items-center self-start sm:self-auto border-purple-200 text-purple-700 hover:bg-purple-50">
          <Key className="w-4 h-4 mr-2" />
          Change Password
        </Button>
      </div>

      {/* Student Details Card */}
      <Card className="mb-6 shadow-sm border-gray-100">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center mb-4">
            <User className="w-5 h-5 text-purple-600 mr-2" />
            <h3 className="text-lg font-bold text-gray-900">Student Profile</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Roll Number</p>
              <p className="font-semibold text-gray-900">{userData?.rollNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Department</p>
              <p className="font-semibold text-gray-900">{userData?.department || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Year</p>
              <p className="font-semibold text-gray-900">{userData?.year || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Assigned Bus</p>
              <p className="font-semibold text-gray-900">{userData?.busId || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Bus Status Card */}
      <Card className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white border-none shadow-lg overflow-hidden relative">
        {/* Decorative background elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl"></div>
        
        <CardContent className="p-6 relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-purple-100 font-medium mb-1">Your Assigned Bus</p>
              <h2 className="text-4xl font-bold">{busDetails?.busNumber || 'N/A'}</h2>
              <p className="text-purple-200 text-sm mt-1">Driver: {busDetails?.driverName || 'Unknown'}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center shadow-sm ${
              liveLocation ? 'bg-green-400 text-green-900' : 'bg-white/20 text-white'
            }`}>
              {liveLocation && <span className="w-2 h-2 bg-green-900 rounded-full mr-2 animate-pulse" />}
              {liveLocation ? 'ON ROUTE' : 'OFFLINE'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md">
              <div className="flex items-center text-purple-100 mb-2">
                <Clock className="w-4 h-4 mr-2" />
                <span className="text-sm">Est. Arrival</span>
              </div>
              <p className="text-xl font-bold">{liveLocation ? eta : '--'}</p>
            </div>
            
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md">
              <div className="flex items-center text-purple-100 mb-2">
                <MapPin className="w-4 h-4 mr-2" />
                <span className="text-sm">Your Stop</span>
              </div>
              <p className="text-xl font-bold truncate">{userData?.stopId || 'No stop assigned'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-lg font-bold text-gray-900">Live Tracking</h3>
          {liveLocation && (
            <span className="text-sm text-green-600 font-medium bg-green-50 px-2 py-1 rounded-md">
              Speed: {Math.round(liveLocation.speed * 3.6) || 0} km/h
            </span>
          )}
        </div>
        
        <Card className="overflow-hidden border-2 border-white shadow-md">
          <div className="h-[400px] w-full relative z-0">
            {!routeDetails && !liveLocation ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
                <AlertCircle className="w-6 h-6 mr-2" />
                Map data unavailable
              </div>
            ) : (
              <RouteMap 
                stops={routeDetails?.stops || []} 
                busLocation={liveLocation}
                className="w-full h-full"
              />
            )}
          </div>
        </Card>
      </div>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input 
                  required
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
                  placeholder="Enter new password"
                  minLength={6}
                />
              </div>
              <div className="pt-4 flex space-x-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsPasswordModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" style={{backgroundColor: '#9333ea', color: 'white'}} disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
