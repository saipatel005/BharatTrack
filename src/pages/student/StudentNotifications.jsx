import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, CheckCircle2, AlertCircle, Clock, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';

export const StudentNotifications = () => {
  const { userData } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData) return;
    
    // We fetch reports submitted by this student to show as notifications
    const userId = userData.uid || userData.id;
    const q = query(
      collection(db, 'reports'),
      where('reportedBy', '==', userId),
      where('role', '==', 'student')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort descending by timestamp in memory to avoid needing a composite index
      fetched.sort((a, b) => {
         const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
         const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
         return timeB - timeA;
      });
      
      setNotifications(fetched);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching notifications:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Loading notifications...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-500 mt-1">Updates on your support requests and issues</p>
      </div>

      {notifications.length === 0 ? (
        <Card className="border-dashed border-2 bg-gray-50/50">
          <CardContent className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No Notifications Yet</h3>
            <p className="text-gray-500 mt-1">When you report an issue, updates will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map(notification => (
            <Card key={notification.id} className={`overflow-hidden transition-all hover:shadow-md ${notification.status === 'Resolved' ? 'bg-white' : 'bg-blue-50/30'}`}>
              <CardContent className="p-0">
                <div className="flex p-5">
                  <div className="mr-4 mt-1 shrink-0">
                    {notification.status === 'Resolved' ? (
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-gray-900">
                        {notification.status === 'Resolved' 
                          ? `Issue Resolved: ${notification.category}`
                          : `Request Received: ${notification.category}`}
                      </h4>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                        {notification.timestamp?.toDate ? notification.timestamp.toDate().toLocaleDateString() : 'Just now'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {notification.status === 'Resolved' 
                        ? 'The administration has marked your issue as resolved. Thank you for your feedback!'
                        : 'Your request is currently being reviewed by the administration.'}
                    </p>
                    
                    <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-500 italic flex items-start border border-gray-100">
                      <MessageSquare className="w-4 h-4 mr-2 mt-0.5 shrink-0 text-gray-400" />
                      "{notification.description}"
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
