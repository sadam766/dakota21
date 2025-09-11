
import React from 'react';
import type { StatCardType } from '../types';

const StatCard: React.FC<StatCardType> = ({ title, value, trend, icon }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm flex justify-between items-center">
      <div>
        <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                {icon}
            </div>
            <p className="text-gray-500 dark:text-gray-400">{title}</p>
        </div>
        <p className="text-2xl font-bold mt-2 text-gray-800 dark:text-gray-100">{value}</p>
      </div>
      <div>{trend}</div>
    </div>
  );
};

export default StatCard;
