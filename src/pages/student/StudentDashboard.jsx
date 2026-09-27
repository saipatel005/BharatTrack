import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, onSnapshot, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Bus, MapPin, Clock, AlertCircle, Bell, Key, X, User } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { RouteMap } from '../../components/ui/RouteMap';
import { StopSequence } from '../../components/ui/StopSequence';

export const StudentDashboard = () => {
  const { userData } = useAuth();
  const [busDetails, setBusDetails] = useState(null);
  const [routeDetails, setRouteDetails] = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eta, setEta] = useState(null);
  const [notification, setNotification] = useState({ show: false, title: '', message: '' });
  const prevActiveTripRef = useRef(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(
    "Notification" in window ? Notification.permission : "denied"
  );

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
        
        let routeQ;
        if (assignedRouteId) {
          routeQ = query(collection(db, 'routes'), where('routeName', '==', assignedRouteId));
        } else if (assignedBusId) {
          routeQ = query(collection(db, 'routes'), where('assignedBusId', '==', assignedBusId));
        }

        if (routeQ) {
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
          if (prevActiveTripRef.current === false) {
            // Trigger in-app toast
            setNotification({
              show: true,
              title: 'Trip Started!',
              message: 'Your bus has just started its route.'
            });
            setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 8000);
            
            // Trigger OS Native Notification
            if ("Notification" in window && Notification.permission === "granted") {
              const showNative = async () => {
                try {
                  if ('serviceWorker' in navigator) {
                    const registration = await navigator.serviceWorker.getRegistration();
                    if (registration) {
                      await registration.showNotification("Trip Started!", {
                        body: "Your bus has just started its route.",
                        icon: "/logo.png",
                        vibrate: [200, 100, 200, 100, 200]
                      });
                      return;
                    }
                  }
                  new Notification("Trip Started!", { 
                    body: "Your bus has just started its route.",
                    icon: "/logo.png"
                  });
                } catch (e) {
                  console.error("Native notification failed:", e);
                  try {
                    new Notification("Trip Started!", { 
                      body: "Your bus has just started its route.",
                      icon: "/logo.png"
                    });
                  } catch (fallbackErr) {
                    console.error("Fallback notification failed:", fallbackErr);
                  }
                }
              };
              showNative();
            }
          }
          prevActiveTripRef.current = true;

          setLiveLocation({
            lat: data.latitude,
            lng: data.longitude,
            speed: data.speed,
            timestamp: data.timestamp,
            direction: data.direction
          });
          
          // Basic ETA calculation
          if (routeDetails) {
            const myStop = routeDetails.stops.find(s => s.id === studentStopId);
            if (myStop) {
              setEta('~2 mins'); 
            }
          }
        } else {
          const wasActive = prevActiveTripRef.current;
          
          if (wasActive === true) {
            // Trigger in-app toast
            setNotification({
              show: true,
              title: 'Trip Ended',
              message: 'Your bus has completed its route.'
            });
            setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 8000);
            
            // Trigger OS Native Notification
            if ("Notification" in window && Notification.permission === "granted") {
              const showNativeEnd = async () => {
                try {
                  if ('serviceWorker' in navigator) {
                    const registration = await navigator.serviceWorker.getRegistration();
                    if (registration) {
                      await registration.showNotification("Trip Ended", {
                        body: "Your bus has completed its route.",
                        icon: "/logo.png",
                        vibrate: [200, 100, 200]
                      });
                      return;
                    }
                  }
                  new Notification("Trip Ended", { 
                    body: "Your bus has completed its route.",
                    icon: "/logo.png"
                  });
                } catch (e) {
                  console.error("Native notification failed:", e);
                }
              };
              showNativeEnd();
            }
          }
          
          prevActiveTripRef.current = false;
          setLiveLocation(null);
          setEta('Bus is offline');
          
          // Only force hide if we didn't just show the "Trip Ended" message
          if (wasActive === null) {
            setNotification(prev => ({ ...prev, show: false }));
          }
        }
      } else {
        prevActiveTripRef.current = false;
        setLiveLocation(null);
        setEta('Bus is offline');
        setNotification(prev => ({ ...prev, show: false }));
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
      setNewPassword('');
      alert("Password updated successfully!");
    } catch (error) {
      console.error("Error updating password:", error);
      alert("Failed to update password. Please try again.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    } else {
      alert("Browser security block: Native notifications require HTTPS or a trusted local network bypass. The in-app notifications will still work!");
    }
  };

  if (loading) {
    return <div className="flex h-[calc(100vh-8rem)] items-center justify-center text-gray-500">Loading your bus details...</div>;
  }

  const displayStops = routeDetails?.stops 
    ? (liveLocation?.direction === 'From College' ? [...routeDetails.stops].reverse() : routeDetails.stops)
    : [];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 lg:pb-8 relative">
      
      {/* Simulated Notification Toast */}
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[1000] transition-all duration-500 ease-in-out ${
        notification.show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'
      }`}>
        <div className="bg-white px-6 py-4 rounded-2xl shadow-2xl border border-blue-100 flex items-center space-x-4 max-w-[90vw] mx-auto">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-blue-600 animate-bounce" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900">{notification.title}</h4>
            <p className="text-sm text-gray-500">{notification.message}</p>
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
        <div className="flex items-center space-x-2 self-start sm:self-auto flex-wrap gap-y-2">
          <Button variant="outline" onClick={() => setIsSettingsModalOpen(true)} className="flex items-center border-purple-200 text-purple-700 hover:bg-purple-50">
            <User className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
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
              {liveLocation ? `ON ROUTE - ${liveLocation.direction || 'Towards College'}` : 'OFFLINE'}
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
                stops={displayStops} 
                busLocation={liveLocation}
                className="w-full h-full"
              />
            )}
          </div>
        </Card>
        
        {displayStops.length > 0 && (
          <StopSequence stops={displayStops} busLocation={liveLocation} />
        )}
      </div>

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Account Settings</h2>
              <button onClick={() => setIsSettingsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Notifications Settings */}
              {notificationPermission !== 'granted' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center">
                    <Bell className="w-4 h-4 mr-2 text-blue-600" /> Notifications
                  </h3>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col space-y-3">
                    <p className="text-sm text-blue-800">You currently have push notifications disabled. Enable them to get alerts when your bus starts and ends its trip.</p>
                    <Button onClick={requestNotificationPermission} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      Enable Push Alerts
                    </Button>
                  </div>
                </div>
              )}

              {/* Password Settings */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center">
                  <Key className="w-4 h-4 mr-2 text-purple-600" /> Security
                </h3>
                <form onSubmit={handlePasswordChange} className="space-y-3">
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
                  <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={isUpdatingPassword}>
                    {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                  </Button>
                </form>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
              <Button type="button" variant="outline" className="w-full" onClick={() => setIsSettingsModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
