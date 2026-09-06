import { useState, useEffect } from 'react';
import { collection, query, getDocs, deleteDoc, doc, where } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { Plus, Search, Edit2, Trash2, User, X, Key } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../components/ui/Table';
import { addDoc, updateDoc } from 'firebase/firestore';

export const DriversList = () => {
  const [drivers, setDrivers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    licenseNumber: '',
    assignedBusId: '',
    password: '',
    status: 'Active'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDrivers = async () => {
    try {
      const q = query(collection(db, 'drivers'));
      const querySnapshot = await getDocs(q);
      const fetchedDriversRaw = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const busesQ = query(collection(db, 'buses'));
      const busesSnapshot = await getDocs(busesQ);
      const fetchedBuses = busesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBuses(fetchedBuses);

      // Dynamically resolve driver's assigned bus if it wasn't explicitly saved
      const fetchedDrivers = fetchedDriversRaw.map(driver => {
        const assignedBus = fetchedBuses.find(b => b.driverName === driver.name);
        return {
          ...driver,
          assignedBusId: driver.assignedBusId || assignedBus?.busNumber || ''
        };
      });

      // Sort by assigned bus number (numeric/alphanumeric sorting)
      // Unassigned drivers will appear at the bottom
      const sortedDrivers = fetchedDrivers.sort((a, b) => {
        const busA = a.assignedBusId || "ZZZZZZ"; // Fallback to push to bottom
        const busB = b.assignedBusId || "ZZZZZZ";
        return busA.localeCompare(busB, undefined, { numeric: true });
      });
      
      setDrivers(sortedDrivers);
    } catch (error) {
      console.error("Error fetching drivers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleUpdatePassword = async (id, currentName) => {
    const newPassword = window.prompt(`Enter new password for ${currentName}:`);
    if (newPassword && newPassword.trim() !== '') {
      try {
        // Force reset the isLoggedIn flag so they aren't locked out of the new login
        await updateDoc(doc(db, 'drivers', id), { 
          password: newPassword,
          isLoggedIn: false
        });
        setDrivers(drivers.map(d => d.id === id ? { ...d, password: newPassword, isLoggedIn: false } : d));
        alert('Password updated successfully!');
      } catch (error) {
        console.error("Error updating password:", error);
        alert('Failed to update password.');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this driver?")) {
      try {
        await deleteDoc(doc(db, 'drivers', id));
        setDrivers(drivers.filter(d => d.id !== id));
      } catch (error) {
        console.error("Error deleting driver:", error);
      }
    }
  };

  const filteredDrivers = drivers.filter(driver => 
    driver.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveDriver = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'drivers', editingId), formData);
      } else {
        await addDoc(collection(db, 'drivers'), formData);
      }
      
      // TWO-WAY SYNC: Update the corresponding Bus document
      if (formData.assignedBusId) {
        const q = query(collection(db, 'buses'), where('busNumber', '==', formData.assignedBusId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const busDoc = snap.docs[0];
          await updateDoc(doc(db, 'buses', busDoc.id), { driverName: formData.name });
        }
      }

      closeModal();
      fetchDrivers(); // Refresh the list
    } catch (error) {
      console.error("Error saving driver:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (driver) => {
    setFormData({
      name: driver.name || '',
      phone: driver.phone || '',
      licenseNumber: driver.licenseNumber || '',
      assignedBusId: driver.assignedBusId || '',
      password: driver.password || '',
      status: driver.status || 'Active'
    });
    setEditingId(driver.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', phone: '', licenseNumber: '', assignedBusId: '', password: '', status: 'Active' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
          <p className="text-gray-500 mt-1">Manage bus drivers and assignments</p>
        </div>
        <Button className="shrink-0" onClick={() => {
          setEditingId(null);
          setFormData({ name: '', phone: '', licenseNumber: '', assignedBusId: '', password: '', status: 'Active' });
          setIsModalOpen(true);
        }}>
          <Plus className="w-5 h-5 mr-2" />
          Add New Driver
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-100 flex items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or license..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
        </div>
        
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading drivers...</div>
          ) : filteredDrivers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No drivers found</h3>
              <p className="mt-1 text-gray-500">
                {searchTerm ? "No drivers match your search criteria." : "Get started by adding a new driver."}
              </p>
              {!searchTerm && (
                <Button className="mt-6">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Driver
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver Details</TableHead>
                  <TableHead>License Number</TableHead>
                  <TableHead>Assigned Bus</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-3">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{driver.name}</p>
                          <p className="text-sm text-gray-500">{driver.phone}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{driver.licenseNumber}</TableCell>
                    <TableCell>
                      {driver.assignedBusId ? (
                        <span className="text-gray-900 font-medium">{driver.assignedBusId}</span>
                      ) : (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        driver.status === 'Active' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {driver.status || 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleUpdatePassword(driver.id, driver.name)}
                          className="p-2 text-gray-400 hover:text-yellow-600 rounded-lg hover:bg-yellow-50 transition-colors"
                          title="Change Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEditClick(driver)}
                          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Edit Driver"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(driver.id)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Driver Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Driver' : 'Add New Driver'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveDriver} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  placeholder="e.g. John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input 
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  placeholder="e.g. +91 9876543210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                <input 
                  required
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  placeholder="e.g. TS09 20180000000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Bus (Optional)</label>
                <select
                  value={formData.assignedBusId}
                  onChange={(e) => setFormData({...formData, assignedBusId: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 appearance-none"
                >
                  <option value="">-- Unassigned --</option>
                  {buses.map(bus => (
                    <option key={bus.id} value={bus.busNumber}>
                      {bus.busNumber} (Cap: {bus.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Login Password</label>
                <input 
                  required
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  placeholder="e.g. securepass123"
                />
              </div>

              <div className="pt-4 flex space-x-3">
                <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : (editingId ? 'Update Driver' : 'Save Driver')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
