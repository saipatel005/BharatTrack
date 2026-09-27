
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { Map, LogOut, Clock, Users, Bus, LifeBuoy } from 'lucide-react';
import { Button } from '../ui/Button';

const DriverLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData, isDemoMode, disableDemoMode } = useAuth();

  const navigation = [
    { name: 'Live Tracking', href: '/driver', icon: Map },
    { name: 'My Trips', href: '/driver/trips', icon: Clock },
    { name: 'Routes & Stops', href: '/driver/routes', icon: Map },
    { name: 'Passengers', href: '/driver/passengers', icon: Users },
    { name: 'Bus Details', href: '/driver/bus', icon: Bus },
    { name: 'Help & Support', href: '/driver/support', icon: LifeBuoy },
  ];

  const handleLogout = async () => {
    try {
      const busId = userData?.assignedBusId || 'DEMO-BUS-1';
      const activeTripRef = doc(db, 'trips', `active_${busId}`);
      const activeTripSnap = await getDoc(activeTripRef);
      
      if (activeTripSnap.exists() && activeTripSnap.data().status === 'Active') {
        alert("You cannot log out while a trip is in progress. Please end the trip first.");
        return;
      }

      if (isDemoMode) {
        disableDemoMode();
      } else {
        await signOut(auth);
      }
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-gray-50 flex overflow-hidden">
      {/* Sidebar (Desktop only) */}
      <div className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex-col">
        <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 space-x-2">
          <img src="/logo.png" alt="Bharat Track Logo" className="h-10 w-10 object-contain" />
          <span className="text-xl font-extrabold text-gray-900 tracking-tight">Bharat<span className="text-orange-600">Track</span></span>
        </div>
        
        <nav className="p-4 space-y-1 flex-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${isActive ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-green-700' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:pl-64 h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
          <div className="lg:hidden flex items-center space-x-2">
            <img src="/logo.png" alt="Bharat Track Logo" className="h-8 w-8 object-contain" />
            <span className="text-lg font-extrabold text-gray-900 tracking-tight">Bharat<span className="text-orange-600">Track</span></span>
          </div>
          <div className="hidden lg:block flex-1" />
          
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">
              {userData?.name || 'Driver'}
            </span>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto pb-24 lg:pb-8 relative">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation (Mobile only) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex justify-around items-center h-16 px-1 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-green-600' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-medium text-center leading-tight truncate px-1 w-full">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default DriverLayout;
