import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc, serverTimestamp, setDoc, deleteDoc, getDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Play, Square, MapPin, Navigation, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const DriverDashboard = () => {
  const { userData } = useAuth();
  const [tripActive, setTripActive] = useState(false);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const watchIdRef = useRef(null);
  const lastUpdateRef = useRef(0);
  const UPDATE_INTERVAL_MS = 1000; // Only update Firestore every 1 second max

  // Cleanup location watching on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const handleLocationUpdate = async (position) => {
    const { latitude, longitude, speed, heading, accuracy } = position.coords;
    const now = Date.now();
    
    // Update local state immediately for UI responsiveness
    setLocation({ latitude, longitude, speed, heading });

    // Throttle Firestore updates to save quota
    if (now - lastUpdateRef.current > UPDATE_INTERVAL_MS) {
      try {
        lastUpdateRef.current = now;
        const busId = userData?.assignedBusId || 'DEMO-BUS-1'; // Fallback for demo mode
        
        await setDoc(doc(db, 'locations', busId), {
          busId,
          latitude,
          longitude,
          speed: speed || 0,
          heading: heading || 0,
          accuracy,
          timestamp: serverTimestamp(),
          activeTrip: true
        }, { merge: true });
        
      } catch (err) {
        console.error("Error updating location to Firestore", err);
      }
    }
  };

  const handleLocationError = (err) => {
    console.error("Geolocation Error:", err);
    setError("Unable to access GPS. Please ensure Location services are enabled and permissions are granted.");
    setTripActive(false);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // Restore active trip state on mount
  useEffect(() => {
    const restoreActiveTrip = async () => {
      if (!userData) return;
      
      try {
        const busId = userData?.assignedBusId || 'DEMO-BUS-1';
        const activeTripRef = doc(db, 'trips', `active_${busId}`);
        const activeTripSnap = await getDoc(activeTripRef);
        
        if (activeTripSnap.exists() && activeTripSnap.data().status === 'Active') {
          setTripActive(true);
          
          // Resume watching GPS if supported and not already watching
          if (navigator.geolocation && watchIdRef.current === null) {
            watchIdRef.current = navigator.geolocation.watchPosition(
              handleLocationUpdate,
              handleLocationError,
              {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 10000
              }
            );
          }
        }
      } catch (err) {
        console.error("Error restoring active trip:", err);
      } finally {
        setIsInitializing(false);
      }
    };
    
    restoreActiveTrip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  const startTrip = async () => {
    setError(null);
    setLoading(true);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    try {
      // Create/update active trip record
      const busId = userData?.assignedBusId || 'DEMO-BUS-1';
      await setDoc(doc(db, 'trips', `active_${busId}`), {
        busId,
        driverId: userData?.uid || userData?.id || 'demo-driver',
        startTime: serverTimestamp(),
        status: 'Active'
      });

      // Immediately set the location to active so students get notified instantly
      // even before the first GPS coordinate is received from the device
      await setDoc(doc(db, 'locations', busId), {
        activeTrip: true,
        timestamp: serverTimestamp()
      }, { merge: true });

      // Start watching GPS
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleLocationUpdate,
        handleLocationError,
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000
        }
      );

      setTripActive(true);
    } catch (err) {
      console.error("Error starting trip:", err);
      setError("Failed to start trip on server.");
    } finally {
      setLoading(false);
    }
  };

  const endTrip = async () => {
    setLoading(true);
    try {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      
      const busId = userData?.assignedBusId || 'DEMO-BUS-1';
      
      const activeTripRef = doc(db, 'trips', `active_${busId}`);
      const activeTripSnap = await getDoc(activeTripRef);
      
      if (activeTripSnap.exists()) {
        const activeTripData = activeTripSnap.data();
        
        // Calculate the new trip ID based on completion number for the day
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        
        const tripsQuery = query(
          collection(db, 'trips'),
          where('status', '==', 'Completed')
        );
        const tripsSnap = await getDocs(tripsQuery);
        
        let tripCount = 0;
        tripsSnap.forEach(doc => {
          const data = doc.data();
          if (data.endTime && data.endTime.toDate() >= startOfDay) {
            tripCount++;
          }
        });
        tripCount += 1;
        
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const newTripId = `${day}-${month}-${tripCount}`;
        
        // Create the completed trip with the new ID
        await setDoc(doc(db, 'trips', newTripId), {
          ...activeTripData,
          status: 'Completed',
          endTime: serverTimestamp(),
        });
        
        // Delete the old active trip document
        await deleteDoc(activeTripRef);
      }

      // Update location document to inactive
      await updateDoc(doc(db, 'locations', busId), {
        activeTrip: false,
        timestamp: serverTimestamp()
      });

      setTripActive(false);
      setLocation(null);
    } catch (err) {
      console.error("Error ending trip:", err);
      setError("Failed to properly end the trip.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] w-full max-w-md mx-auto space-y-8">
      
      <div className="text-center space-y-2 w-full">
        <h1 className="text-3xl font-bold text-gray-900">Driver Console</h1>
        <p className="text-gray-500">Bus: {userData?.assignedBusId || userData?.assignedBusNumber || 'DEMO-BUS-1'}</p>
      </div>

      {error && (
        <div className="w-full p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 shadow-sm text-center">
          {error}
        </div>
      )}

      {/* Main Action Area */}
      <div className="w-full flex flex-col items-center justify-center py-8">
        {isInitializing ? (
          <div className="w-64 h-64 rounded-full bg-gray-100 flex flex-col items-center justify-center shadow-sm">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <span className="mt-4 text-gray-500 font-medium">Checking status...</span>
          </div>
        ) : !tripActive ? (
          <button
            onClick={startTrip}
            disabled={loading}
            className="w-64 h-64 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_40px_rgba(37,99,235,0.4)] transition-all transform active:scale-95 flex flex-col items-center justify-center space-y-4 disabled:opacity-75"
          >
            {loading ? <Loader2 className="w-16 h-16 animate-spin" /> : <Play className="w-16 h-16 fill-current" />}
            <span className="text-2xl font-bold tracking-wider">START TRIP</span>
          </button>
        ) : (
          <button
            onClick={endTrip}
            disabled={loading}
            className="w-64 h-64 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-[0_0_40px_rgba(220,38,38,0.4)] transition-all transform active:scale-95 flex flex-col items-center justify-center space-y-4 disabled:opacity-75"
          >
            {loading ? <Loader2 className="w-16 h-16 animate-spin" /> : <Square className="w-12 h-12 fill-current" />}
            <span className="text-2xl font-bold tracking-wider">END TRIP</span>
          </button>
        )}
      </div>

      {/* Live Status Card */}
      {tripActive && location && (
        <div className="w-full bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-center text-green-600 font-semibold">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2 animate-pulse" />
              Live Tracking Active
            </div>
            <div className="text-sm text-gray-500 font-medium flex items-center">
              <Navigation className="w-4 h-4 mr-1" />
              {location.speed ? Math.round(location.speed * 3.6) : 0} km/h
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-3">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider block mb-1">Latitude</span>
              <span className="font-mono text-sm text-gray-900">{location.latitude.toFixed(6)}</span>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider block mb-1">Longitude</span>
              <span className="font-mono text-sm text-gray-900">{location.longitude.toFixed(6)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
