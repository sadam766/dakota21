import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxfE7lZgkXkmhY47B8Q-Vnzcu7dnqeSBm991sdm6kbtu7h9pB5ZLCg-vFOZu7NfD6OvzA/exec";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-semibold text-blue-600 dark:text-blue-400">Complete: {payload[0].value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</p>
        <p className="font-semibold text-orange-500 dark:text-orange-400">Pending: {payload[1].value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</p>
      </div>
    );
  }
  return null;
};


const SalesAnalyticsCard: React.FC = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mockSalesAnalyticsData = [
      { name: 'Jan', Complete: 40000000, Pending: 24000000 },
      { name: 'Feb', Complete: 30000000, Pending: 13980000 },
      { name: 'Mar', Complete: 20000000, Pending: 98000000 },
      { name: 'Apr', Complete: 27800000, Pending: 39080000 },
      { name: 'May', Complete: 18900000, Pending: 48000000 },
      { name: 'Jun', Complete: 23900000, Pending: 38000000 },
      { name: 'Jul', Complete: 34900000, Pending: 43000000 },
    ];
    setData(mockSalesAnalyticsData as any);
    setLoading(false);
    setError(null);
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Sales Analytics</h3>
        <div className="flex items-center space-x-4">
            <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Complete</span>
            </div>
            <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-orange-400 mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
            </div>
            <select className="border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none">
                <option>Weekly</option>
                <option>Monthly</option>
                <option>Yearly</option>
            </select>
        </div>
      </div>
      <div style={{ width: '100%', height: 300 }}>
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">Loading Chart...</div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-500">{error}</div>
        ) : (
          <ResponsiveContainer>
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200 dark:stroke-slate-700" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} className="dark:fill-gray-400" />
              <YAxis axisLine={false} tickLine={false} className="dark:fill-gray-400" tickFormatter={(value) => `${Number(value) / 1000000}jt`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="Complete" stroke="#3B82F6" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="Pending" stroke="#F97316" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default SalesAnalyticsCard;