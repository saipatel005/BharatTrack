import { useState, useEffect } from 'react';
import { collection, query, getDocs, deleteDoc, doc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { Plus, Search, Edit2, Trash2, Map as MapIcon, ChevronRight, X, Minus, GripVertical, ArrowLeft, ExternalLink, MapPin } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { RouteMap } from '../../../components/ui/RouteMap';

export const RoutesList = () => {
  const [routes, setRoutes] = useState([]);
  const [busesList, setBusesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // View mode: 'list' or 'edit'
  const [viewMode, setViewMode] = useState('list');
  const [editingId, setEditingId] = useState(null);
  
  const defaultFormData = {
    routeName: '',
    routeNumber: '',
    source: '',
    destination: '',
    description: '',
    assignedBusId: '',
    stops: []
  };
  const [formData, setFormData] = useState(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPickingFromMap, setIsPickingFromMap] = useState(false);

  const fetchRoutes = async () => {
    try {
      const q = query(collection(db, 'routes'));
      const querySnapshot = await getDocs(q);
      const fetchedRoutes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRoutes(fetchedRoutes);

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

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this route?")) {
      try {
        await deleteDoc(doc(db, 'routes', id));
        setRoutes(routes.filter(r => r.id !== id));
      } catch (error) {
        console.error("Error deleting route:", error);
      }
    }
  };

  const filteredRoutes = routes.filter(route => 
    route.routeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.routeNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStop = () => {
    const newStop = {
      id: Date.now(), // temporary unique id
      name: '',
      lat: 17.3850,
      lng: 78.4867
    };
    setFormData({ ...formData, stops: [...formData.stops, newStop] });
  };

  const handleRemoveStop = (index) => {
    const newStops = [...formData.stops];
    newStops.splice(index, 1);
    setFormData({ ...formData, stops: newStops });
  };

  const handleStopChange = (index, field, value) => {
    const newStops = [...formData.stops];
    newStops[index] = { ...newStops[index], [field]: value };
    setFormData({ ...formData, stops: newStops });
  };

  const handleMapClick = (latlng) => {
    if (isPickingFromMap) {
      const newStop = {
        id: Date.now(),
        name: `New Stop (${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)})`,
        lat: latlng.lat,
        lng: latlng.lng
      };
      setFormData({ ...formData, stops: [...formData.stops, newStop] });
    }
  };

  const handleSaveRoute = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Clean up stops (ensure numbers)
      const cleanedStops = formData.stops.map((s, i) => ({
        id: i + 1,
        name: s.name || `Stop ${i + 1}`,
        lat: parseFloat(s.lat) || 0,
        lng: parseFloat(s.lng) || 0
      }));

      const routeData = {
        routeName: formData.routeName,
        routeNumber: formData.routeNumber || '',
        source: formData.source || '',
        destination: formData.destination || '',
        description: formData.description || '',
        assignedBusId: formData.assignedBusId,
        stops: cleanedStops
      };

      if (editingId) {
        await updateDoc(doc(db, 'routes', editingId), routeData);
        setRoutes(routes.map(r => r.id === editingId ? { id: editingId, ...routeData } : r));
      } else {
        const docRef = await addDoc(collection(db, 'routes'), routeData);
        const createdRoute = { id: docRef.id, ...routeData };
        setRoutes([...routes, createdRoute]);
      }
      
      setViewMode('list');
    } catch (error) {
      console.error("Error saving route:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateMode = () => {
    setEditingId(null);
    setFormData(defaultFormData);
    setIsPickingFromMap(false);
    setViewMode('edit');
  };

  const openEditMode = (route) => {
    setEditingId(route.id);
    
    // Convert old string stops to objects if necessary
    const normalizedStops = (route.stops || []).map((s, i) => {
      if (typeof s === 'string') {
        return { id: i + 1, name: s, lat: 17.3850 + (i * 0.015), lng: 78.4867 + (i * 0.015) };
      }
      return s;
    });
    
    setFormData({
      routeName: route.routeName || '',
      routeNumber: route.routeNumber || '',
      source: route.source || '',
      destination: route.destination || '',
      description: route.description || '',
      assignedBusId: route.assignedBusId || '',
      stops: normalizedStops
    });
    setIsPickingFromMap(false);
    setViewMode('edit');
  };

  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Routes Management</h1>
            <p className="text-gray-500 mt-1">Manage bus routes and stops</p>
          </div>
          <Button className="shrink-0" onClick={openCreateMode}>
            <Plus className="w-5 h-5 mr-2" />
            Create New Route
          </Button>
        </div>

        <Card>
          <div className="p-4 border-b border-gray-100 flex items-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search routes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
            </div>
          </div>
          <div className="p-0">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading routes...</div>
            ) : filteredRoutes.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                No routes found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {filteredRoutes.map((route) => (
                  <div 
                    key={route.id}
                    className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-gray-900 text-lg">{route.routeName}</h3>
                          {route.routeNumber && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                              {route.routeNumber}
                            </span>
                          )}
                        </div>
                        {route.assignedBusId && (
                          <p className="text-xs text-blue-600 font-medium mt-1">Bus: {route.assignedBusId}</p>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => openEditMode(route)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded bg-gray-50 hover:bg-blue-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(route.id, e)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded bg-gray-50 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-gray-50 space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 text-green-500" />
                        <span className="truncate">{route.source || 'No Source'}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 text-red-500" />
                        <span className="truncate">{route.destination || 'No Destination'}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        {route.stops?.length || 0} Stops configured
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Edit/Create View
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <MapIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Create / Manage Route</h1>
            <p className="text-sm text-gray-500">Add route details and bus stops in order</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setViewMode('list')} className="shrink-0 bg-blue-50 text-blue-700 hover:bg-blue-100 border-none">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Routes
        </Button>
      </div>

      <form onSubmit={handleSaveRoute} className="space-y-6">
        
        {/* Route Details Section */}
        <Card className="border-blue-100 shadow-sm overflow-hidden">
          <div className="bg-blue-50/50 px-6 py-3 border-b border-blue-100">
            <h2 className="text-sm font-bold text-blue-800 uppercase tracking-wider">Route Details</h2>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Route Name <span className="text-red-500">*</span></label>
                <input required type="text" value={formData.routeName} onChange={e => setFormData({...formData, routeName: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Route R101" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Route Number <span className="text-red-500">*</span></label>
                <input required type="text" value={formData.routeNumber} onChange={e => setFormData({...formData, routeNumber: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="R101" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Source (Start) <span className="text-red-500">*</span></label>
                <input required type="text" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="College Campus" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Destination (End) <span className="text-red-500">*</span></label>
                <input required type="text" value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ibrahimpatnam" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3 space-y-1">
                <label className="text-xs font-medium text-gray-700">Description (Optional)</label>
                <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Via LB Nagar, Hayathnagar" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Assigned Bus</label>
                <select value={formData.assignedBusId} onChange={e => setFormData({...formData, assignedBusId: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  <option value="">-- Unassigned --</option>
                  {busesList.map(bus => <option key={bus.id} value={bus.busNumber}>{bus.busNumber}</option>)}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bus Stops Section */}
        <Card className="border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Bus Stops (In Order)</h2>
            <div className="flex space-x-2">
              <button type="button" onClick={handleAddStop} className="flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded shadow-sm transition-colors">
                <Plus className="w-4 h-4 mr-1" /> Add Stop
              </button>
              <button type="button" onClick={() => setIsPickingFromMap(!isPickingFromMap)} className={`flex items-center px-3 py-1.5 text-white text-sm font-medium rounded shadow-sm transition-colors ${isPickingFromMap ? 'bg-indigo-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                <MapPin className="w-4 h-4 mr-1" /> {isPickingFromMap ? 'Picking (Click map)...' : 'Pick from Map'}
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-white border-b border-gray-200 text-xs text-gray-600">
                  <th className="py-3 px-4 font-semibold w-12 text-center">#</th>
                  <th className="py-3 px-4 font-semibold w-12 text-center"></th>
                  <th className="py-3 px-4 font-semibold">Stop Name <span className="text-red-500">*</span></th>
                  <th className="py-3 px-4 font-semibold w-40">Latitude <span className="text-red-500">*</span></th>
                  <th className="py-3 px-4 font-semibold w-40">Longitude <span className="text-red-500">*</span></th>
                  <th className="py-3 px-4 font-semibold w-24 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {formData.stops.map((stop, index) => (
                  <tr key={index} className="hover:bg-gray-50/50 group">
                    <td className="py-2 px-4 text-center text-sm font-medium text-gray-900">{index + 1}</td>
                    <td className="py-2 px-4 text-center text-gray-400">
                      <GripVertical className="w-4 h-4 mx-auto" />
                    </td>
                    <td className="py-2 px-4">
                      <input required type="text" value={stop.name} onChange={e => handleStopChange(index, 'name', e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Stop name" />
                    </td>
                    <td className="py-2 px-4">
                      <input required type="number" step="any" value={stop.lat} onChange={e => handleStopChange(index, 'lat', e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="17.xxx" />
                    </td>
                    <td className="py-2 px-4">
                      <input required type="number" step="any" value={stop.lng} onChange={e => handleStopChange(index, 'lng', e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="78.xxx" />
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex justify-center space-x-2">
                        <button type="button" onClick={() => handleRemoveStop(index)} className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors shadow-sm">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {formData.stops.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-500 text-sm">
                      No stops added yet. Click "Add Stop" or "Pick from Map" to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Route Preview Map */}
        <Card className="border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Route Preview (Stops on Map)</h2>
            <button type="button" className="flex items-center px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-blue-600 text-sm font-medium rounded shadow-sm transition-colors">
              <ExternalLink className="w-4 h-4 mr-1" /> View Full Map
            </button>
          </div>
          <div className={`p-1 bg-white relative ${isPickingFromMap ? 'ring-4 ring-indigo-500/30' : ''}`}>
            {isPickingFromMap && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg font-medium text-sm animate-pulse flex items-center pointer-events-none">
                <MapPin className="w-4 h-4 mr-2" /> Click anywhere on the map to add a stop
              </div>
            )}
            <div className="h-[400px] w-full border border-gray-100 rounded-lg overflow-hidden">
              {/* Ensure stops are valid numbers before passing to RouteMap */}
              <RouteMap 
                stops={formData.stops.filter(s => s.lat && s.lng).map(s => ({ ...s, lat: parseFloat(s.lat), lng: parseFloat(s.lng) }))} 
                onMapClick={handleMapClick}
                className="w-full h-full z-0" 
              />
            </div>
          </div>
        </Card>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 pb-8">
          <Button type="button" variant="outline" onClick={() => setViewMode('list')} className="w-32">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-40 bg-blue-600 hover:bg-blue-700">
            {isSubmitting ? 'Saving...' : 'Save Route'}
          </Button>
        </div>
      </form>
    </div>
  );
};
