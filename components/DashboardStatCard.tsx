
import React from 'react';
import { TrendingUpIcon, TrendingDownIcon } from './icons';

interface DashboardStatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: React.ReactNode;
  iconBg: string;
}

const DashboardStatCard: React.FC<DashboardStatCardProps> = ({ title, value, change, changeType, icon, iconBg }) => {
  const isIncrease = changeType === 'increase';
  const trendColor = isIncrease ? 'text-green-600' : 'text-red-600';
  const TrendIcon = isIncrease ? TrendingUpIcon : TrendingDownIcon;

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-200/80 dark:border-slate-700">
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <div className={`p-2 rounded-lg ${iconBg}`}>
          {icon}
        </div>
      </div>
      <div className="mt-2">
        <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{value}</h3>
        <div className="flex items-center text-sm mt-1">
          <span className={`flex items-center font-semibold ${trendColor}`}>
            <TrendIcon className="w-4 h-4 mr-1" />
            {change}
          </span>
          <span className="text-gray-500 dark:text-gray-400 ml-1">vs last month</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardStatCard;