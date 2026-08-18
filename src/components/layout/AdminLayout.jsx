
import { LogOut, User, Bus, Map, Users, LayoutDashboard, Settings } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../firebase/config';
import { signOut } from 'firebase/auth';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData, isDemoMode, disableDemoMode } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Buses', href: '/admin/buses', icon: Bus },
    { name: 'Drivers', href: '/admin/drivers', icon: User },
    { name: 'Students', href: '/admin/students', icon: Users },
    { name: 'Routes', href: '/admin/routes', icon: Map },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    try {
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
        <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
          <span className="text-xl font-bold text-blue-600">SmartBus</span>
        </div>
        
        <nav className="p-4 space-y-1 flex-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
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
          <div className="lg:hidden font-bold text-blue-600 text-lg">SmartBus</div>
          <div className="hidden lg:block flex-1" />
          
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">
              {userData?.name || 'Admin'}
            </span>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto pb-24 lg:pb-8 relative">
          {children}
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
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
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

export default AdminLayout;
