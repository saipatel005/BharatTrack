import { Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';

export const DriverTrips = () => {
  const dummyTrips = [
    { id: 'TRIP-1201', date: 'Oct 24, 2026', time: '08:00 AM', status: 'Completed', duration: '1h 15m' },
    { id: 'TRIP-1200', date: 'Oct 23, 2026', time: '04:30 PM', status: 'Completed', duration: '1h 10m' },
    { id: 'TRIP-1199', date: 'Oct 23, 2026', time: '08:05 AM', status: 'Completed', duration: '1h 25m' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
          <p className="text-gray-500 mt-1">Review your past completed trips</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Trips (This Month)</p>
              <h3 className="text-2xl font-bold text-blue-900 mt-1">42</h3>
            </div>
            <Clock className="w-8 h-8 text-blue-300" />
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">On-Time Performance</p>
              <h3 className="text-2xl font-bold text-green-900 mt-1">94%</h3>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-300" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {dummyTrips.map(trip => (
              <div key={trip.id} className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{trip.id}</h4>
                    <p className="text-sm text-gray-500 mt-1">{trip.date} • {trip.time}</p>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 flex flex-col sm:items-end w-full sm:w-auto">
                  <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    {trip.status}
                  </span>
                  <p className="text-sm font-medium text-gray-500 mt-2">Duration: {trip.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
