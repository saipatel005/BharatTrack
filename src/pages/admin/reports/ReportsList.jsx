import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { MessageSquare, AlertTriangle, CheckCircle2, Search, Filter } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../components/ui/Table';

export const ReportsList = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); // 'All', 'Open', 'Resolved'

  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReports = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReports(fetchedReports);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching reports:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusToggle = async (reportId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'Open' ? 'Resolved' : 'Open';
      await updateDoc(doc(db, 'reports', reportId), {
        status: newStatus
      });
    } catch (error) {
      console.error("Error updating report status:", error);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.reporterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'All' ? true : report.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Issue Reports</h1>
          <p className="text-gray-500 mt-1">View and manage issues reported by drivers and students</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg font-bold">
            {reports.filter(r => r.status === 'Open').length} Open Issues
          </div>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 appearance-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>
        
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading reports...</div>
          ) : filteredReports.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No reports found</h3>
              <p className="mt-1 text-gray-500">
                {searchTerm || filterStatus !== 'All' ? "No reports match your filters." : "You're all caught up! No issues reported."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {report.timestamp?.toDate ? report.timestamp.toDate().toLocaleDateString() : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {report.timestamp?.toDate ? report.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">{report.reporterName || 'Unknown'}</div>
                        <div className="text-xs text-gray-500 capitalize">{report.role || 'User'}</div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {report.category || 'General'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900 max-w-xs sm:max-w-md truncate" title={report.description}>
                          {report.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        {report.status === 'Resolved' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Resolved
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            <AlertTriangle className="w-3 h-3 mr-1" /> Open
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => handleStatusToggle(report.id, report.status)}
                          className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                            report.status === 'Open' 
                              ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                              : 'text-orange-600 bg-orange-50 hover:bg-orange-100'
                          }`}
                        >
                          {report.status === 'Open' ? 'Mark Resolved' : 'Reopen'}
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
