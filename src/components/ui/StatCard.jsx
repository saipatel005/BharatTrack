import { Card, CardContent } from "./Card";

export const StatCard = ({ title, value, icon: Icon, trend, trendValue, colorClass = "text-blue-600", bgClass = "bg-blue-50" }) => {
  return (
    <Card className="transform hover:-translate-y-1 transition-transform duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
          </div>
          <div className={`p-4 rounded-2xl ${bgClass}`}>
            <Icon className={`w-8 h-8 ${colorClass}`} />
          </div>
        </div>
        
        {trend && (
          <div className="mt-4 flex items-center text-sm">
            <span className={`font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? '+' : '-'}{trendValue}
            </span>
            <span className="text-gray-400 ml-2">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
