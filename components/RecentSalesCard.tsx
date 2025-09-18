

import React, { useMemo } from 'react';
import type { RecentSale, PaymentOverviewInvoice } from '../types';

const StatusBadge = ({ status }: { status: RecentSale['status'] }) => {
    const statusClasses = {
        Paid: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
        Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
        Unpaid: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusClasses[status]}`}>{status}</span>;
}

interface RecentSalesCardProps {
  invoices: PaymentOverviewInvoice[];
}

const RecentSalesCard: React.FC<RecentSalesCardProps> = ({ invoices }) => {

    const recentSales = useMemo(() => {
        if (!invoices) {
            return [];
        }

        const mapStatus = (status: PaymentOverviewInvoice['status']): RecentSale['status'] => {
            switch (status) {
                case 'Paid':
                    return 'Paid';
                case 'Pending':
                case 'Draft':
                    return 'Pending';
                case 'Unpaid':
                case 'Overdue':
                    return 'Unpaid';
                default:
                    return 'Pending';
            }
        };

        const formatDate = (dateString: string) => {
            if (!dateString) return 'No Date';
            try {
                const date = new Date(dateString);
                if(isNaN(date.getTime())) return dateString;
                return new Intl.DateTimeFormat('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                }).format(date);
            } catch (e) {
                return dateString;
            }
        };

        return invoices
            .filter(invoice => invoice.date)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 4)
            .map((invoice): RecentSale => ({
                id: invoice.number,
                customer: invoice.client,
                avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(invoice.client)}`,
                amount: invoice.amount,
                status: mapStatus(invoice.status),
                date: formatDate(invoice.date),
            }));

    }, [invoices]);

    const renderContent = () => {
        if (recentSales.length === 0) return (
            <tr><td colSpan={5} className="text-center p-6 text-gray-500 dark:text-gray-400">No recent sales found.</td></tr>
        );

        return recentSales.map(sale => (
            <tr key={sale.id} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 last:border-0">
                <td className="p-3 font-medium text-gray-700 dark:text-gray-300">{sale.id}</td>
                <td className="p-3">
                    <div className="flex items-center">
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{sale.customer}</span>
                    </div>
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-400">{sale.date}</td>
                <td className="p-3 font-semibold text-gray-800 dark:text-gray-200">{sale.amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</td>
                <td className="p-3"><StatusBadge status={sale.status} /></td>
            </tr>
        ));
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200/80 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Recent Sales</h3>
                <button className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm hover:underline">
                    View All
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="text-gray-500 dark:text-gray-400 bg-gray-50/70 dark:bg-slate-700/50">
                            <th className="p-3 font-medium">Invoice ID</th>
                            <th className="p-3 font-medium">Customer</th>
                            <th className="p-3 font-medium">Date</th>
                            <th className="p-3 font-medium">Amount</th>
                            <th className="p-3 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {renderContent()}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RecentSalesCard;