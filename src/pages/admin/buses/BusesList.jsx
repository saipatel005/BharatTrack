import { useState, useEffect } from 'react';
import { collection, query, getDocs, deleteDoc, doc, where } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { Plus, Search, Edit2, Trash2, Bus as BusIcon, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../components/ui/Table';
import { addDoc, updateDoc } from 'firebase/firestore';

export const BusesList = () => {
  const [buses, setBuses] = useState([]);
  const [driversList, setDriversList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    busNumber: '',
    registrationNumber: '',
    capacity: 40,
    driverName: '',
    status: 'Active'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBuses = async () => {
    try {
      const q = query(collection(db, 'buses'));
      const querySnapshot = await getDocs(q);
      
      // Also fetch drivers to dynamically resolve assignments
      const driversQ = query(collection(db, 'drivers'));
      const driversSnap = await getDocs(driversQ);
      const fetchedDrivers = driversSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDriversList(fetchedDrivers);

      const fetchedBuses = querySnapshot.docs.map(doc => {
        const busData = doc.data();
        // Find if any driver claims this bus
        const assignedDriver = fetchedDrivers.find(d => d.assignedBusId === busData.busNumber);
        
        return {
          id: doc.id,
          ...busData,
          // Use explicitly saved driverName OR dynamically resolved name
          driverName: assignedDriver?.name || busData.driverName || ''
        };
      });

      // Sort by bus number (numeric/alphanumeric sorting)
      const sortedBuses = fetchedBuses.sort((a, b) => 
        (a.busNumber || "").localeCompare(b.busNumber || "", undefined, { numeric: true })
      );
      
      setBuses(sortedBuses);
    } catch (error) {
      console.error("Error fetching buses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuses();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this bus?")) {
      try {
        await deleteDoc(doc(db, 'buses', id));
        setBuses(buses.filter(b => b.id !== id));
      } catch (error) {
        console.error("Error deleting bus:", error);
      }
    }
  };

  const filteredBuses = buses.filter(bus => 
    bus.busNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bus.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveBus = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'buses', editingId), formData);
      } else {
        await addDoc(collection(db, 'buses'), formData);
      }

      // TWO-WAY SYNC: Update the corresponding Driver document
      if (formData.driverName) {
        const q = query(collection(db, 'drivers'), where('name', '==', formData.driverName));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const driverDoc = snap.docs[0];
          await updateDoc(doc(db, 'drivers', driverDoc.id), { assignedBusId: formData.busNumber });
        }
      }

      closeModal();
      fetchBuses(); // Refresh the list
    } catch (error) {
      console.error("Error saving bus:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (bus) => {
    setFormData({
      busNumber: bus.busNumber || '',
      registrationNumber: bus.registrationNumber || '',
      capacity: bus.capacity || 40,
      driverName: bus.driverName || '',
      status: bus.status || 'Active'
    });
    setEditingId(bus.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ busNumber: '', registrationNumber: '', capacity: 40, driverName: '', status: 'Active' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buses</h1>
          <p className="text-gray-500 mt-1">Manage college transportation fleet</p>
        </div>
        <Button className="shrink-0" onClick={() => {
          setEditingId(null);
          setFormData({ busNumber: '', registrationNumber: '', capacity: 40, driverName: '', status: 'Active' });
          setIsModalOpen(true);
        }}>
          <Plus className="w-5 h-5 mr-2" />
          Add New Bus
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-100 flex items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search buses by number or registration..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
        </div>
        
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading buses...</div>
          ) : filteredBuses.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <BusIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No buses found</h3>
              <p className="mt-1 text-gray-500">
                {searchTerm ? "No buses match your search criteria." : "Get started by adding a new bus to the fleet."}
              </p>
              {!searchTerm && (
                <Button className="mt-6">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Bus
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bus Details</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Assigned Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBuses.map((bus) => (
                  <TableRow key={bus.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mr-3">
                          <BusIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{bus.busNumber}</p>
                          <p className="text-sm text-gray-500">{bus.registrationNumber}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{bus.capacity} seats</TableCell>
                    <TableCell>
                      {bus.driverName ? (
                        <span className="text-gray-900 font-medium">{bus.driverName}</span>
                      ) : (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        bus.status === 'Active' ? 'bg-green-100 text-green-800' :
                        bus.status === 'Maintenance' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {bus.status || 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleEditClick(bus)}
                          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Edit Bus"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(bus.id)}
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

      {/* Add Bus Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Bus' : 'Add New Bus'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveBus} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bus Number / ID</label>
                <input 
                  required
                  type="text"
                  value={formData.busNumber}
                  onChange={(e) => setFormData({...formData, busNumber: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  placeholder="e.g. 10A"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Plate</label>
                <input 
                  required
                  type="text"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  placeholder="e.g. TS 09 EA 1234"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seat Capacity</label>
                <input 
                  required
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Driver (Optional)</label>
                <select
                  value={formData.driverName}
                  onChange={(e) => setFormData({...formData, driverName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 appearance-none"
                >
                  <option value="">-- Unassigned --</option>
                  {driversList.map(driver => (
                    <option key={driver.id} value={driver.name}>
                      {driver.name} ({driver.licenseNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex space-x-3">
                <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : (editingId ? 'Update Bus' : 'Save Bus')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
