

import React from 'react';
import DashboardStatCard from './DashboardStatCard';
import SalesOverviewChart from './SalesOverviewChart';
import RecentSalesCard from './RecentSalesCard';
import TopProductsCard from './TopProductsCard';
import { DollarSignIcon, UserIcon, PackageIcon, ZapIcon } from './icons';
import type { PaymentOverviewInvoice } from '../types';

const statCardsData = [
  { 
    title: 'Total Revenue', 
    value: 'Rp 6.076.365.000', 
    change: '+4.5%', 
    changeType: 'increase' as 'increase' | 'decrease',
    icon: <DollarSignIcon className="w-6 h-6 text-indigo-500" />,
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/50'
  },
  { 
    title: 'Total Customers', 
    value: '10,293', 
    change: '+12.1%', 
    changeType: 'increase' as 'increase' | 'decrease',
    icon: <UserIcon className="w-6 h-6 text-green-500" />,
    iconBg: 'bg-green-100 dark:bg-green-900/50'
  },
  { 
    title: 'Total Products', 
    value: '4,593', 
    change: '-1.8%', 
    changeType: 'decrease' as 'increase' | 'decrease',
    icon: <PackageIcon className="w-6 h-6 text-orange-500" />,
    iconBg: 'bg-orange-100 dark:bg-orange-900/50'
  },
  { 
    title: 'Conversion Rate', 
    value: '5.4%', 
    change: '+2.3%', 
    changeType: 'increase' as 'increase' | 'decrease',
    icon: <ZapIcon className="w-6 h-6 text-red-500" />,
    iconBg: 'bg-red-100 dark:bg-red-900/50'
  },
];


const Dashboard: React.FC<{ invoices: PaymentOverviewInvoice[] }> = ({ invoices }) => {
    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50/50 dark:bg-slate-900/50 min-h-full">
             <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Here’s a snapshot of your business performance.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
                {statCardsData.map(stat => (
                  <DashboardStatCard 
                    key={stat.title}
                    title={stat.title}
                    value={stat.value}
                    change={stat.change}
                    changeType={stat.changeType}
                    icon={stat.icon}
                    iconBg={stat.iconBg}
                  />
                ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                <SalesOverviewChart invoices={invoices} />
              </div>
              <div className="lg:col-span-2">
                <TopProductsCard />
              </div>
              <div className="lg:col-span-5">
                <RecentSalesCard />
              </div>
            </div>
        </div>
    );
};

export default Dashboard;