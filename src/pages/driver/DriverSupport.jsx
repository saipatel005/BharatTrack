import { PhoneCall, AlertTriangle, MessageSquare, LifeBuoy } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const DriverSupport = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-500 mt-1">Get assistance or report issues</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-red-100 bg-red-50/50">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Emergency Breakdown</h3>
            <p className="text-sm text-gray-600 mb-6">Report immediate vehicle failure or accidents to the transport department.</p>
            <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
              <PhoneCall className="w-5 h-5 mr-2" />
              Call Emergency Support
            </Button>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-blue-50/50">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LifeBuoy className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Admin Assistance</h3>
            <p className="text-sm text-gray-600 mb-6">Contact the administration office for route changes or student issues.</p>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
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
            <h3 className="text-lg font-bold text-gray-900">Report a Non-Urgent Issue</h3>
          </div>

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Category</label>
              <select className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Bus Maintenance Needed</option>
                <option>Route Feedback</option>
                <option>App Issue / Bug</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                rows={4}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Describe the issue in detail..."
              />
            </div>
            <div className="pt-2">
              <Button type="button" className="w-full sm:w-auto">
                Submit Report
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
