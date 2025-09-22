import React, { useState, useEffect } from 'react';
import type { ActivityType } from '../types';
import { CalendarIcon, OrderIcon, InvoiceIcon, ProductIcon } from './icons';

type FetchedActivity = {
    icon: string;
    text: string;
    time: string;
}

const ICONS: { [key: string]: React.ReactNode } = {
  calendar: <CalendarIcon className="w-5 h-5 text-purple-600" />,
  order: <OrderIcon className="w-5 h-5 text-blue-600" />,
  invoice: <InvoiceIcon className="w-5 h-5 text-green-600" />,
  product: <ProductIcon className="w-5 h-5 text-yellow-600" />,
  invoice_red: <InvoiceIcon className="w-5 h-5 text-red-600" />,
};

const RecentActivitiesCard: React.FC = () => {
  const [activities, setActivities] = useState<FetchedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mockRecentActivities: FetchedActivity[] = [
        { icon: 'order', text: 'New order #8745 has been placed.', time: '5m ago' },
        { icon: 'invoice', text: 'Invoice #INV-2024-001 has been paid.', time: '1h ago' },
        { icon: 'product', text: 'Product "Kabel Fiber Optik" is low on stock.', time: '3h ago' },
        { icon: 'calendar', text: 'Meeting with PT Sejahtera Abadi scheduled.', time: '1d ago' },
        { icon: 'invoice_red', text: 'Invoice #INV-2024-002 is overdue.', time: '2d ago' },
    ];
    setActivities(mockRecentActivities);
    setLoading(false);
    setError(null);
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Recent Activities</h3>
        <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Clear all</button>
      </div>
      {loading ? (
        <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-2">
                    <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full h-9 w-9 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded-md animate-pulse w-full"></div>
                </div>
            ))}
        </div>
      ) : error ? (
        <div className="text-red-500 py-4 text-center">{error}</div>
      ) : (
        <ul>
          {activities.map((activity, index) => (
            <li key={index} className="flex items-center space-x-4 py-3 border-b border-gray-100 dark:border-slate-700 last:border-b-0">
              <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full">{ICONS[activity.icon]}</div>
              <p className="flex-grow text-gray-700 dark:text-gray-200">{activity.text}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">{activity.time}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentActivitiesCard;