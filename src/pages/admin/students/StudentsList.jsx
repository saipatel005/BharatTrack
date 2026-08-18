import { useState, useEffect, useRef } from 'react';
import { collection, query, getDocs, deleteDoc, doc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { Plus, Search, Edit2, Trash2, Users, X, Download, Upload } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../components/ui/Table';

export const StudentsList = () => {
  const [students, setStudents] = useState([]);
  const [busesList, setBusesList] = useState([]);
  const [driversList, setDriversList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    password: '',
    department: 'CSE',
    year: '1',
    busId: '',
    stopId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  const fetchStudents = async () => {
    try {
      const q = query(collection(db, 'students'));
      const querySnapshot = await getDocs(q);
      const fetchedStudentsRaw = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const busesQ = query(collection(db, 'buses'));
      const busesSnap = await getDocs(busesQ);
      const fetchedBusesRaw = busesSnap.docs.map(b => ({ id: b.id, ...b.data() }));

      const driversQ = query(collection(db, 'drivers'));
      const driversSnap = await getDocs(driversQ);
      const fetchedDrivers = driversSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDriversList(fetchedDrivers);

      // Dynamically resolve driver names and sort the buses list
      const fetchedBuses = fetchedBusesRaw.map(bus => {
        const claimingDriver = fetchedDrivers.find(d => d.assignedBusId === bus.busNumber);
        return {
          ...bus,
          driverName: claimingDriver?.name || bus.driverName || ''
        };
      }).sort((a, b) => (a.busNumber || "").localeCompare(b.busNumber || "", undefined, { numeric: true }));
      setBusesList(fetchedBuses);

      const fetchedStudents = fetchedStudentsRaw.map(student => {
        const assignedBus = fetchedBuses.find(b => b.busNumber === student.busId);
        return {
          ...student,
          driverName: assignedBus?.driverName || ''
        };
      });

      // Sort students naturally by roll number
      const sortedStudents = fetchedStudents.sort((a, b) => 
        (a.rollNumber || "").localeCompare(b.rollNumber || "", undefined, { numeric: true })
      );

      setStudents(sortedStudents);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        await deleteDoc(doc(db, 'students', id));
        setStudents(students.filter(s => s.id !== id));
      } catch (error) {
        console.error("Error deleting student:", error);
      }
    }
  };

  const filteredStudents = students.filter(student => 
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'students', editingId), formData);
      } else {
        await addDoc(collection(db, 'students'), formData);
      }
      closeModal();
      fetchStudents(); // Refresh the list
    } catch (error) {
      console.error("Error saving student:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (student) => {
    setFormData({
      name: student.name || '',
      rollNumber: student.rollNumber || '',
      password: student.password || '',
      department: student.department || 'CSE',
      year: student.year || '1',
      busId: student.busId || '',
      stopId: student.stopId || ''
    });
    setEditingId(student.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', rollNumber: '', password: '', department: 'CSE', year: '1', busId: '', stopId: '' });
  };

  const handleDownloadTemplate = () => {
    const templateContent = "Name,RollNumber,Password,Department,Year,AssignedBus,PickupStop\nAlice Smith,21XJ1A0501,pass123,CSE,1,10A,City Center Hub\nBob Jones,21XJ1A0502,pass456,ECE,2,,";
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'students_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n');
        const validRows = lines.slice(1).filter(line => line.trim().length > 0);
        
        const uploadPromises = validRows.map(line => {
          // Handling basic comma separation
          const values = line.split(',').map(v => v.trim());
          
          const studentData = {
            name: values[0] || '',
            rollNumber: values[1] || '',
            password: values[2] || '',
            department: values[3] || 'CSE',
            year: values[4] || '1',
            busId: values[5] || '',
            stopId: values[6] || ''
          };
          
          if (!studentData.name || !studentData.rollNumber) return Promise.resolve(); // Skip invalid

          return addDoc(collection(db, 'students'), studentData);
        });

        await Promise.all(uploadPromises);
        alert(`Successfully imported ${validRows.length} students!`);
        fetchStudents(); // Refresh the list
      } catch (error) {
        console.error("Error importing CSV:", error);
        alert("There was an error importing the CSV. Please check the format.");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 mt-1">Manage student bus allocations</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <Button variant="outline" onClick={handleDownloadTemplate} className="hidden sm:flex">
            <Download className="w-4 h-4 mr-2" />
            Template
          </Button>
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isImporting ? 'Importing...' : 'Import CSV'}
          </Button>
          <Button className="shrink-0" onClick={() => {
            setEditingId(null);
            setFormData({ name: '', rollNumber: '', password: '', department: 'CSE', year: '1', busId: '', stopId: '' });
            setIsModalOpen(true);
          }}>
            <Plus className="w-5 h-5 mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-100 flex items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
        </div>
        
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading students...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No students found</h3>
              <p className="mt-1 text-gray-500">
                {searchTerm ? "No students match your search criteria." : "Get started by adding a student."}
              </p>
              {!searchTerm && (
                <Button className="mt-6">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Student
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Details</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Assigned Bus</TableHead>
                  <TableHead>Pickup Stop</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-3 text-blue-600 font-bold">
                          {student.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.name}</p>
                          <p className="text-sm text-gray-500">{student.rollNumber}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-gray-900">{student.department}</p>
                      <p className="text-xs text-gray-500">Year {student.year}</p>
                    </TableCell>
                    <TableCell>
                      {student.busId ? (
                        <div>
                          <p className="text-gray-900 font-medium">Bus {student.busId}</p>
                          <p className="text-xs text-gray-500">Driver: {student.driverName || 'Unassigned'}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {student.stopId ? (
                        <span className="text-gray-900">{student.stopId}</span>
                      ) : (
                        <span className="text-gray-400 italic">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleEditClick(student)}
                          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Edit Student"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(student.id)}
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

      {/* Add Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Student' : 'Add New Student'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveStudent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  placeholder="e.g. Alice Smith"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                <input 
                  required
                  type="text"
                  value={formData.rollNumber}
                  onChange={(e) => setFormData({...formData, rollNumber: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  placeholder="e.g. 21XJ1A0501"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                  required
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  placeholder="e.g. password123"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select 
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  >
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <select 
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Bus (Optional)</label>
                <select
                  value={formData.busId}
                  onChange={(e) => setFormData({...formData, busId: e.target.value})}
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

              <div className="pt-4 flex space-x-3">
                <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : (editingId ? 'Update Student' : 'Save Student')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
