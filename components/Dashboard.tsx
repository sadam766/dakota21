

import React, { useMemo } from 'react';
import DashboardStatCard from './DashboardStatCard';
import SalesOverviewChart from './SalesOverviewChart';
import RecentSalesCard from './RecentSalesCard';
import TopProductsCard from './TopProductsCard';
import { DollarSignIcon, UserIcon, PackageIcon, ZapIcon } from './icons';
import type { PaymentOverviewInvoice, SalesOrderType, ProductType, ConsumerType } from '../types';

const Dashboard: React.FC<{ 
  invoices: PaymentOverviewInvoice[], 
  salesOrders: SalesOrderType[],
  products: ProductType[],
  consumers: ConsumerType[]
}> = ({ invoices, salesOrders, products, consumers }) => {

    const statCardsData = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        
        const isValidDate = (d: any) => d && !isNaN(new Date(d).getTime());

        // --- Filter data by time periods ---
        const invoicesThisMonth = invoices.filter(inv => {
            if (!isValidDate(inv.date)) return false;
            const d = new Date(inv.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
        const invoicesLastMonth = invoices.filter(inv => {
            if (!isValidDate(inv.date)) return false;
            const d = new Date(inv.date);
            return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
        });
        const paidInvoicesThisMonth = invoicesThisMonth.filter(inv => inv.status === 'Paid');
        const paidInvoicesLastMonth = invoicesLastMonth.filter(inv => inv.status === 'Paid');

        // --- Total Revenue ---
        const totalRevenue = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + (inv.amount || 0), 0);
        const revenueThisMonth = paidInvoicesThisMonth.reduce((sum, inv) => sum + (inv.amount || 0), 0);
        const revenueLastMonth = paidInvoicesLastMonth.reduce((sum, inv) => sum + (inv.amount || 0), 0);
        const revenueTrend = revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 : revenueThisMonth > 0 ? 100 : 0;

        // --- Total Customers ---
        const totalCustomers = consumers.length;
        const customersThisMonth = new Set(invoicesThisMonth.map(inv => inv.client)).size;
        const customersLastMonth = new Set(invoicesLastMonth.map(inv => inv.client)).size;
        const customersTrend = customersLastMonth > 0 ? ((customersThisMonth - customersLastMonth) / customersLastMonth) * 100 : customersThisMonth > 0 ? 100 : 0;
        
        // --- Total Products ---
        const totalProducts = products.length;
        // Trend for total products is not meaningful without creation dates, so we'll show a neutral trend.
        const productTrend = 0; 
    
        // --- Conversion Rate ---
        const totalPaidInvoices = invoices.filter(inv => inv.status === 'Paid').length;
        const conversionRate = invoices.length > 0 ? (totalPaidInvoices / invoices.length) * 100 : 0;
        
        const crThisMonth = invoicesThisMonth.length > 0 ? (paidInvoicesThisMonth.length / invoicesThisMonth.length) * 100 : 0;
        const crLastMonth = invoicesLastMonth.length > 0 ? (paidInvoicesLastMonth.length / invoicesLastMonth.length) * 100 : 0;
        const crTrend = crThisMonth - crLastMonth; // Absolute percentage point difference

        const formatTrend = (trend: number) => {
            const sign = trend > 0 ? '+' : '';
            return `${sign}${trend.toFixed(1)}%`;
        }

        return [
          { 
            title: 'Total Revenue', 
            value: `Rp ${totalRevenue.toLocaleString('id-ID')}`, 
            change: formatTrend(revenueTrend), 
            changeType: revenueTrend >= 0 ? 'increase' : 'decrease',
            icon: <DollarSignIcon className="w-6 h-6 text-indigo-500" />,
            iconBg: 'bg-indigo-100 dark:bg-indigo-900/50'
          },
          { 
            title: 'Total Customers', 
            value: totalCustomers.toLocaleString('id-ID'), 
            change: formatTrend(customersTrend),
            changeType: customersTrend >= 0 ? 'increase' : 'decrease',
            icon: <UserIcon className="w-6 h-6 text-green-500" />,
            iconBg: 'bg-green-100 dark:bg-green-900/50'
          },
          { 
            title: 'Total Products', 
            value: totalProducts.toLocaleString('id-ID'), 
            change: formatTrend(productTrend), 
            changeType: 'increase',
            icon: <PackageIcon className="w-6 h-6 text-orange-500" />,
            iconBg: 'bg-orange-100 dark:bg-orange-900/50'
          },
          { 
            title: 'Conversion Rate', 
            value: `${conversionRate.toFixed(1)}%`, 
            change: formatTrend(crTrend), 
            changeType: crTrend >= 0 ? 'increase' : 'decrease',
            icon: <ZapIcon className="w-6 h-6 text-red-500" />,
            iconBg: 'bg-red-100 dark:bg-red-900/50'
          },
        ];
      }, [invoices, products, consumers]);

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
                    changeType={stat.changeType as 'increase' | 'decrease'}
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
                <TopProductsCard salesOrders={salesOrders} />
              </div>
              <div className="lg:col-span-5">
                <RecentSalesCard invoices={invoices} />
              </div>
            </div>
        </div>
    );
};

export default Dashboard;