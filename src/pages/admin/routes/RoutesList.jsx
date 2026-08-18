import { useState, useEffect } from 'react';
import { collection, query, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { addDoc, updateDoc } from 'firebase/firestore';
import { Plus, Search, Edit2, Trash2, Map as MapIcon, ChevronRight, X, Minus } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { RouteMap } from '../../../components/ui/RouteMap';
export const RoutesList = () => {
  const [routes, setRoutes] = useState([]);
  const [busesList, setBusesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    routeName: '',
    assignedBusId: '',
    estimatedDuration: '45 mins',
    stops: ['']
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRoutes = async () => {
    try {
      const q = query(collection(db, 'routes'));
      const querySnapshot = await getDocs(q);
      const fetchedRoutes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRoutes(fetchedRoutes);
      if (fetchedRoutes.length > 0) {
        setSelectedRoute(fetchedRoutes[0]);
      }

      const busesQ = query(collection(db, 'buses'));
      const busesSnap = await getDocs(busesQ);
      setBusesList(busesSnap.docs.map(b => ({ id: b.id, ...b.data() })));
    } catch (error) {
      console.error("Error fetching routes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this route?")) {
      try {
        await deleteDoc(doc(db, 'routes', id));
        setRoutes(routes.filter(r => r.id !== id));
        if (selectedRoute?.id === id) {
          setSelectedRoute(null);
        }
      } catch (error) {
        console.error("Error deleting route:", error);
      }
    }
  };

  const filteredRoutes = routes.filter(route => 
    route.routeName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStop = () => {
    setFormData({ ...formData, stops: [...formData.stops, ''] });
  };

  const handleRemoveStop = (index) => {
    const newStops = [...formData.stops];
    newStops.splice(index, 1);
    setFormData({ ...formData, stops: newStops });
  };

  const handleStopChange = (index, value) => {
    const newStops = [...formData.stops];
    newStops[index] = value;
    setFormData({ ...formData, stops: newStops });
  };

  const handleSaveRoute = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const validStopNames = formData.stops.filter(s => typeof s === 'string' ? s.trim() !== '' : s.name?.trim() !== '');
      
      const baseLat = 17.3850;
      const baseLng = 78.4867;
      
      const generatedStops = validStopNames.map((stop, index) => {
        if (typeof stop === 'object' && stop.lat) return stop;
        
        const name = typeof stop === 'string' ? stop : stop.name;
        return {
          id: index + 1,
          name: name,
          lat: baseLat + (index * 0.015),
          lng: baseLng + (index * 0.015)
        };
      });

      const routeData = {
        routeName: formData.routeName,
        assignedBusId: formData.assignedBusId,
        estimatedDuration: formData.estimatedDuration,
        stops: generatedStops
      };

      if (editingId) {
        await updateDoc(doc(db, 'routes', editingId), routeData);
        setRoutes(routes.map(r => r.id === editingId ? { id: editingId, ...routeData } : r));
        if (selectedRoute?.id === editingId) {
          setSelectedRoute({ id: editingId, ...routeData });
        }
      } else {
        const docRef = await addDoc(collection(db, 'routes'), routeData);
        const createdRoute = { id: docRef.id, ...routeData };
        setRoutes([...routes, createdRoute]);
        setSelectedRoute(createdRoute);
      }
      
      closeModal();
    } catch (error) {
      console.error("Error saving route:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (route) => {
    setFormData({
      routeName: route.routeName || '',
      assignedBusId: route.assignedBusId || '',
      estimatedDuration: route.estimatedDuration || '45 mins',
      stops: route.stops?.length > 0 ? route.stops : ['']
    });
    setEditingId(route.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ routeName: '', assignedBusId: '', estimatedDuration: '45 mins', stops: [''] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Routes & Mapping</h1>
          <p className="text-gray-500 mt-1">Manage bus routes, stops, and visual map alignments</p>
        </div>
        <Button className="shrink-0" onClick={() => {
          setEditingId(null);
          setFormData({ routeName: '', assignedBusId: '', estimatedDuration: '45 mins', stops: [''] });
          setIsModalOpen(true);
        }}>
          <Plus className="w-5 h-5 mr-2" />
          Create New Route
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Routes List */}
        <Card className="lg:col-span-1 h-[600px] flex flex-col">
          <div className="p-4 border-b border-gray-100 shrink-0">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search routes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {loading ? (
              <div className="p-8 text-center text-gray-500 text-sm">Loading routes...</div>
            ) : filteredRoutes.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No routes found.
              </div>
            ) : (
              filteredRoutes.map((route) => (
                <div 
                  key={route.id}
                  onClick={() => setSelectedRoute(route)}
                  className={`p-4 rounded-xl cursor-pointer transition-all border ${
                    selectedRoute?.id === route.id 
                    ? 'bg-blue-50 border-blue-200 shadow-sm' 
                    : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className={`font-semibold ${selectedRoute?.id === route.id ? 'text-blue-700' : 'text-gray-900'}`}>
                        {route.routeName}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">{route.stops?.length || 0} Stops • {route.estimatedDuration || 'N/A'}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 ${selectedRoute?.id === route.id ? 'text-blue-500' : 'text-gray-300'}`} />
                  </div>
                  
                  {selectedRoute?.id === route.id && (
                    <div className="mt-4 pt-4 border-t border-blue-100 flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs bg-white"
                        onClick={(e) => { e.stopPropagation(); handleEditClick(route); }}
                      >
                        <Edit2 className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => { e.stopPropagation(); handleDelete(route.id); }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Right Column: Map Viewer */}
        <Card className="lg:col-span-2 h-[600px] flex flex-col overflow-hidden relative">
          {selectedRoute ? (
            <>
              <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-md border border-gray-100 max-w-[300px]">
                <h3 className="font-bold text-gray-900">{selectedRoute.routeName}</h3>
                <p className="text-xs text-gray-500 mb-2">Assigned Bus: {selectedRoute.assignedBusId || 'None'}</p>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {selectedRoute.stops?.map((stop, i) => (
                    <div key={i} className="flex items-center text-xs">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mr-2 shrink-0 font-medium">
                        {i + 1}
                      </div>
                      <span className="truncate" title={stop.name}>{stop.name}</span>
                    </div>
                  ))}
                  {(!selectedRoute.stops || selectedRoute.stops.length === 0) && (
                    <p className="text-xs text-gray-400 italic">No stops defined for this route.</p>
                  )}
                </div>
              </div>
              <div className="flex-1 w-full relative z-0">
                <RouteMap stops={selectedRoute.stops || []} className="w-full h-full absolute inset-0" />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
              <MapIcon className="w-16 h-16 mb-4 text-gray-300" />
              <p>Select a route to view its path on the map</p>
            </div>
          )}
        </Card>
      </div>

      {/* Add Route Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Route' : 'Create New Route'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveRoute} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Route Name</label>
                <input 
                  required
                  type="text"
                  value={formData.routeName}
                  onChange={(e) => setFormData({...formData, routeName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  placeholder="e.g. Route 10A - City Center"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Bus</label>
                <select
                  value={formData.assignedBusId}
                  onChange={(e) => setFormData({...formData, assignedBusId: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 appearance-none"
                >
                  <option value="">-- Unassigned --</option>
                  {busesList.map(bus => (
                    <option key={bus.id} value={bus.busNumber}>
                      {bus.busNumber} (Driver: {bus.driverName || 'Unknown'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Duration</label>
                <input 
                  required
                  type="text"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({...formData, estimatedDuration: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  placeholder="e.g. 45 mins"
                />
              </div>
              
              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Route Stops</label>
                  <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={handleAddStop}>
                    <Plus className="w-3 h-3 mr-1" /> Add Stop
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-[30vh] overflow-y-auto custom-scrollbar pr-2">
                  {formData.stops.map((stop, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 text-xs font-bold">
                        {index + 1}
                      </div>
                      <input 
                        required
                        type="text"
                        value={typeof stop === 'string' ? stop : stop.name}
                        onChange={(e) => handleStopChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
                        placeholder="e.g. City Center Hub"
                      />
                      {formData.stops.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => handleRemoveStop(index)}
                          className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Map coordinates will be automatically generated for visualization.</p>
              </div>

              <div className="pt-4 flex space-x-3">
                <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : (editingId ? 'Update Route' : 'Save Route')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
