
import React, { useState, useEffect } from 'react';
import type { RecentSale } from '../types';
import { MoreVerticalIcon } from './icons';

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbySPriD5FNopJ4n9oGxFpght_1XuUlJYMIc6zDBh5amt1PQArahi1fegu1TQ08SqzB0UA/exec";

const StatusBadge = ({ status }: { status: RecentSale['status'] }) => {
    const statusClasses = {
        Paid: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
        Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
        Unpaid: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusClasses[status]}`}>{status}</span>;
}

const RecentSalesCard: React.FC = () => {
    const [sales, setSales] = useState<RecentSale[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const mockRecentSales: RecentSale[] = [
          { id: 'INV-1234', customer: 'Liam Johnson', avatar: 'https://i.pravatar.cc/150?u=liam', amount: 2500000, status: 'Paid', date: 'Jul 25, 2024' },
          { id: 'INV-1235', customer: 'Olivia Smith', avatar: 'https://i.pravatar.cc/150?u=olivia', amount: 1500000, status: 'Pending', date: 'Jul 24, 2024' },
          { id: 'INV-1236', customer: 'Noah Williams', avatar: 'https://i.pravatar.cc/150?u=noah', amount: 3500000, status: 'Unpaid', date: 'Jul 23, 2024' },
          { id: 'INV-1237', customer: 'Emma Brown', avatar: 'https://i.pravatar.cc/150?u=emma', amount: 4500000, status: 'Paid', date: 'Jul 22, 2024' },
        ];
        setSales(mockRecentSales);
        setLoading(false);
        setError(null);
    }, []);

    const renderSkeleton = () => (
        [...Array(4)].map((_, i) => (
            <tr key={i}>
                <td className="p-3"><div className="h-5 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-24"></div></td>
                <td className="p-3">
                    <div className="flex items-center">
                        <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-32"></div>
                    </div>
                </td>
                <td className="p-3"><div className="h-5 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20"></div></td>
                <td className="p-3"><div className="h-5 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-16"></div></td>
                <td className="p-3"><div className="h-6 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse w-20"></div></td>
            </tr>
        ))
    );

    const renderContent = () => {
        if (loading) return renderSkeleton();
        if (error) return (
            <tr><td colSpan={5} className="text-center p-6 text-red-500">{error}</td></tr>
        );
        if (sales.length === 0) return (
            <tr><td colSpan={5} className="text-center p-6 text-gray-500 dark:text-gray-400">No recent sales found.</td></tr>
        );

        return sales.map(sale => (
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
