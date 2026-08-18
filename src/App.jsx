import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import DriverLayout from './components/layout/DriverLayout';
import StudentLayout from './components/layout/StudentLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { BusesList } from './pages/admin/buses/BusesList';
import { DriversList } from './pages/admin/drivers/DriversList';
import { StudentsList } from './pages/admin/students/StudentsList';
import { RoutesList } from './pages/admin/routes/RoutesList';
import { DriverDashboard } from './pages/driver/DriverDashboard';
import { DriverTrips } from './pages/driver/DriverTrips';
import { DriverRoutes } from './pages/driver/DriverRoutes';
import { DriverPassengers } from './pages/driver/DriverPassengers';
import { DriverBusDetails } from './pages/driver/DriverBusDetails';
import { DriverSupport } from './pages/driver/DriverSupport';

import { StudentDashboard } from './pages/student/StudentDashboard';
import { Login } from './pages/auth/Login';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Admin Routes */}
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout>
                  <Routes>
                    <Route path="/" element={<AdminDashboard />} />
                    <Route path="/buses" element={<BusesList />} />
                    <Route path="/drivers" element={<DriversList />} />
                    <Route path="/students" element={<StudentsList />} />
                    <Route path="/routes" element={<RoutesList />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            } />
            
            {/* Driver Routes */}
            <Route path="/driver" element={<ProtectedRoute allowedRoles={['driver']}><DriverLayout /></ProtectedRoute>}>
              <Route index element={<DriverDashboard />} />
              <Route path="trips" element={<DriverTrips />} />
              <Route path="routes" element={<DriverRoutes />} />
              <Route path="passengers" element={<DriverPassengers />} />
              <Route path="bus" element={<DriverBusDetails />} />
              <Route path="support" element={<DriverSupport />} />
            </Route>
            
            {/* Student Routes */}
            <Route path="/student/*" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentLayout>
                  <Routes>
                    <Route path="/" element={<StudentDashboard />} />
                  </Routes>
                </StudentLayout>
              </ProtectedRoute>
            } />
            
            {/* Default Route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
