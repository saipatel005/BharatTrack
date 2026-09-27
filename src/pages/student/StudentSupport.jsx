import { useState, useEffect } from 'react';
import { PhoneCall, MessageSquare, LifeBuoy, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

export const StudentSupport = () => {
  const { userData } = useAuth();
  const [supportContacts, setSupportContacts] = useState({
    adminPhone: ''
  });

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const docRef = doc(db, 'settings', 'supportContacts');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSupportContacts(docSnap.data());
        }
      } catch (err) {
        console.error("Error fetching support contacts:", err);
      }
    };
    fetchContacts();
  }, []);

  const [reportCategory, setReportCategory] = useState('Bus is Delayed/No Show');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportMessage, setReportMessage] = useState(null);

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportDescription.trim()) return;
    
    setIsSubmitting(true);
    setReportMessage(null);
    try {
      await addDoc(collection(db, 'reports'), {
        category: reportCategory,
        description: reportDescription,
        reportedBy: userData?.uid || userData?.id || 'unknown',
        reporterName: userData?.name || 'Student',
        role: 'student',
        status: 'Open',
        timestamp: serverTimestamp()
      });
      setReportMessage({ type: 'success', text: 'Report submitted successfully. We will look into it.' });
      setReportDescription('');
      setReportCategory('Bus is Delayed/No Show');
    } catch (err) {
      console.error("Error submitting report:", err);
      setReportMessage({ type: 'error', text: 'Failed to submit report. Please try again later.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-500 mt-1">Contact management or report issues</p>
      </div>

      <div className="grid md:grid-cols-1 gap-6">
        <Card className="border-blue-100 bg-blue-50/50">
          <CardContent className="p-6 text-center flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center text-left mb-4 sm:mb-0">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4 shrink-0">
                <LifeBuoy className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Admin Assistance</h3>
                <p className="text-sm text-gray-600">Contact the administration office for urgent queries regarding buses or your route.</p>
              </div>
            </div>
            <Button 
              className="w-full sm:w-auto shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => supportContacts.adminPhone ? window.location.href = `tel:${supportContacts.adminPhone}` : alert('Admin contact not configured.')}
            >
              <PhoneCall className="w-5 h-5 mr-2" />
              Call Admin Office
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <MessageSquare className="w-6 h-6 text-gray-400" />
            <h3 className="text-lg font-bold text-gray-900">Report an Issue</h3>
          </div>

          <form onSubmit={handleReportSubmit} className="space-y-4">
            {reportMessage && (
              <div className={`p-4 rounded-lg flex items-center space-x-2 text-sm ${reportMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {reportMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                <span>{reportMessage.text}</span>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Category</label>
              <select 
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Bus is Delayed/No Show">Bus is Delayed/No Show</option>
                <option value="Safety Concern">Safety Concern</option>
                <option value="App Issue / Bug">App Issue / Bug</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                rows={4}
                required
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Describe the issue in detail..."
              />
            </div>
            <div className="pt-2">
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto flex items-center justify-center">
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
