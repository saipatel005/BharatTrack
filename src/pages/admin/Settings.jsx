import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Phone, Save, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';

export const Settings = () => {
  const [formData, setFormData] = useState({
    emergencyPhone: '',
    adminPhone: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'supportContacts');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFormData(docSnap.data());
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await setDoc(doc(db, 'settings', 'supportContacts'), formData, { merge: true });
      setMessage({ type: 'success', text: 'Support contacts updated successfully.' });
    } catch (err) {
      console.error("Error saving settings:", err);
      setMessage({ type: 'error', text: 'Failed to update support contacts.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-500 mt-1">Configure global application settings</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Phone className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900">Support Contacts</h2>
          </div>
          
          <p className="text-sm text-gray-500 mb-6">
            These contact numbers will be displayed to drivers in the Driver App for emergency and administrative support.
          </p>

          {message && (
            <div className={`p-4 mb-6 rounded-lg flex items-center space-x-2 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              <AlertCircle className="w-5 h-5" />
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Support Phone</label>
              <input 
                type="tel"
                value={formData.emergencyPhone}
                onChange={(e) => setFormData({...formData, emergencyPhone: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                placeholder="e.g. 911 or +1234567890"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Office Phone</label>
              <input 
                type="tel"
                value={formData.adminPhone}
                onChange={(e) => setFormData({...formData, adminPhone: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                placeholder="e.g. +1987654321"
                required
              />
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={saving} className="w-full sm:w-auto flex items-center justify-center">
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
