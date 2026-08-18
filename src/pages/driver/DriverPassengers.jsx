import { useState, useEffect } from 'react';
import { Users, Phone, MapPin, Search } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

export const DriverPassengers = () => {
  const { userData } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPassengers = async () => {
      let activeBusId = userData?.assignedBusId;
      
      try {
        if (!activeBusId && userData?.name) {
          const busesQ = query(collection(db, 'buses'), where('driverName', '==', userData.name));
          const busesSnap = await getDocs(busesQ);
          if (!busesSnap.empty) {
            activeBusId = busesSnap.docs[0].data().busNumber;
          }
        }

        if (!activeBusId) {
          setLoading(false);
          return;
        }
        
        const q = query(collection(db, 'students'), where('busId', '==', activeBusId));
        const querySnapshot = await getDocs(q);
        const fetchedStudents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setStudents(fetchedStudents);
      } catch (error) {
        console.error("Error fetching passengers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPassengers();
  }, [userData]);

  const filteredStudents = students.filter(student => 
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.stopId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Passengers</h1>
          <p className="text-gray-500 mt-1">Students assigned to this bus</p>
        </div>
        <div className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg font-bold">
          {students.length} Students
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search students by name or stop..." 
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
        />
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center p-8 text-gray-500">Loading passengers...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-xl text-gray-500 border border-gray-100">
            No passengers assigned to your bus yet.
          </div>
        ) : (
          filteredStudents.map(student => (
            <Card key={student.id}>
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 font-bold flex items-center justify-center text-lg border-2 border-purple-100 uppercase">
                    {student.name?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{student.name}</h4>
                    <p className="text-sm text-gray-500 font-mono mt-0.5">{student.rollNumber}</p>
                  </div>
                </div>
                
                <div className="mt-4 sm:mt-0 flex flex-col sm:items-end space-y-2 w-full sm:w-auto">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-1.5 text-gray-400" />
                    {student.stopId || 'Pending Stop'}
                  </div>
                  <button className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors">
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
