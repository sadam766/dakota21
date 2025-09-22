import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

const CustomLegend = (props: any) => {
  const { payload } = props;
  return (
    <ul className="flex justify-center space-x-4 mt-4">
      {payload.map((entry: any, index: number) => (
        <li key={`item-${index}`} className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">{entry.payload.name}</span>
        </li>
      ))}
    </ul>
  );
};

const EarningsByItemCard: React.FC = () => {
  const [data, setData] = useState<{name: string, value: number, color: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mockEarningsData = [
        { name: 'Electronics', value: 40000000, color: '#3B82F6' },
        { name: 'Furniture', value: 30000000, color: '#F97316' },
        { name: 'Apparel', value: 30000000, color: '#10B981' },
        { name: 'Other', value: 20000000, color: '#6B7280' },
    ];
    setData(mockEarningsData);
    setLoading(false);
    setError(null);
  }, []);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm text-center">
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Earnings By Item</h3>
      <div style={{ width: '100%', height: 200 }} className="relative">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">Loading...</div>
        ) : error ? (
           <div className="flex items-center justify-center h-full text-red-500">{error}</div>
        ) : (
          <>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-3xl font-bold text-gray-800 dark:text-gray-100">{total.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span>
                 <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EarningsByItemCard;